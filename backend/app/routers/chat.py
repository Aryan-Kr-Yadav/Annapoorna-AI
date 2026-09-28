"""
Chat router. This is the natural-language control layer: it builds
farm/crop context, retrieves RAG knowledge, exposes Groq a fixed set of
ownership-checked tools, and executes at most a few tool-call rounds
before returning a final answer. Chat history sent to Groq is always a
bounded recent window plus a rolling summary, never the entire session.
"""
import json
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from app.ai import tools as ai_tools
from app.ai.context_builder import build_farm_crop_context
from app.ai.groq_client import GroqConfigError, GroqResponseError, chat_completion
from app.ai.prompts import SYSTEM_PROMPT, build_context_block
from app.ai.rag import retrieve_relevant_chunks
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.chat import ChatMessage, ChatRole, ChatSession
from app.models.user import User
from app.schemas.chat import (
    ChatMessageCreate,
    ChatMessageOut,
    ChatReplyOut,
    ChatSessionCreate,
    ChatSessionOut,
    ChatSessionUpdate,
)
from app.schemas.common import Envelope

router = APIRouter(prefix="/chat", tags=["chat"])

RECENT_MESSAGE_WINDOW = 12  # last N messages sent verbatim; older ones are summarized
MAX_TOOL_ROUNDS = 4


def _get_owned_session(db: Session, session_id: UUID, user_id: UUID) -> ChatSession:
    session = (
        db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == user_id).first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found.")
    return session


@router.post("/sessions", response_model=Envelope[ChatSessionOut])
def create_session(
    payload: ChatSessionCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    session = ChatSession(user_id=user.id, **payload.model_dump())
    db.add(session)
    db.commit()
    db.refresh(session)
    return Envelope(message="Conversation started.", data=ChatSessionOut.model_validate(session))


@router.get("/sessions", response_model=Envelope[list[ChatSessionOut]])
def list_sessions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = (
        db.query(ChatSession).filter(ChatSession.user_id == user.id).order_by(ChatSession.updated_at.desc()).all()
    )
    return Envelope(data=[ChatSessionOut.model_validate(s) for s in sessions])


@router.put("/sessions/{session_id}", response_model=Envelope[ChatSessionOut])
def rename_session(
    session_id: UUID, payload: ChatSessionUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    session = _get_owned_session(db, session_id, user.id)
    if payload.title:
        session.title = payload.title
    db.commit()
    db.refresh(session)
    return Envelope(data=ChatSessionOut.model_validate(session))


@router.delete("/sessions/{session_id}", response_model=Envelope[None])
def delete_session(session_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = _get_owned_session(db, session_id, user.id)
    db.delete(session)
    db.commit()
    return Envelope(message="Conversation deleted.")


@router.get("/sessions/{session_id}/messages", response_model=Envelope[list[ChatMessageOut]])
def list_messages(session_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = _get_owned_session(db, session_id, user.id)
    return Envelope(data=[ChatMessageOut.model_validate(m) for m in session.messages])


@router.post("/sessions/{session_id}/messages", response_model=Envelope[ChatReplyOut])
async def send_message(
    session_id: UUID,
    payload: ChatMessageCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = _get_owned_session(db, session_id, user.id)

    user_message = ChatMessage(
        session_id=session.id, role=ChatRole.USER, content=payload.content, image_url=payload.image_url
    )
    db.add(user_message)
    db.commit()

    # --- Build bounded context ---
    farm_context = build_farm_crop_context(db, user, session.farm_id, session.crop_cycle_id)
    rag_chunks = await retrieve_relevant_chunks(db, payload.content)

    system_content = SYSTEM_PROMPT + "\n\n" + build_context_block(farm_context)
    if session.summary:
        system_content += f"\n\nSummary of earlier conversation: {session.summary}"
    if rag_chunks:
        sources_block = "\n".join(f"- {c['content']} (source: {c['source_title']})" for c in rag_chunks)
        system_content += f"\n\nRelevant knowledge base excerpts:\n{sources_block}"

    recent_messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id, ChatMessage.role.in_([ChatRole.USER, ChatRole.ASSISTANT]))
        .order_by(ChatMessage.created_at.desc())
        .limit(RECENT_MESSAGE_WINDOW)
        .all()
    )
    recent_messages.reverse()

    messages = [{"role": "system", "content": system_content}]
    for m in recent_messages:
        if m.image_url:
            messages.append(
                {
                    "role": m.role.value,
                    "content": [
                        {"type": "text", "text": m.content},
                        {"type": "image_url", "image_url": {"url": m.image_url}},
                    ],
                }
            )
        else:
            messages.append({"role": m.role.value, "content": m.content})

    tools_used: list[str] = []
    final_text = None

    try:
        for _ in range(MAX_TOOL_ROUNDS):
            assistant_msg = await chat_completion(messages, tools=ai_tools.TOOL_DEFINITIONS)

            if assistant_msg.get("tool_calls"):
                messages.append(assistant_msg)
                for call in assistant_msg["tool_calls"]:
                    fn_name = call["function"]["name"]
                    try:
                        args = json.loads(call["function"]["arguments"] or "{}")
                    except json.JSONDecodeError:
                        args = {}
                    tools_used.append(fn_name)
                    try:
                        result = await ai_tools.execute_tool(db, user, fn_name, args)
                    except HTTPException as exc:
                        result = {"error": exc.detail}
                    except Exception as exc:
                        logger.warning("Tool %s execution failed: %s", fn_name, exc, exc_info=True)
                        result = {"error": f"Failed to execute {fn_name}: {str(exc)}"}
                    messages.append(
                        {"role": "tool", "tool_call_id": call["id"], "content": json.dumps(result, default=str)}
                    )
                continue

            final_text = assistant_msg.get("content", "")
            break
    except GroqConfigError as exc:
        logger.error("GroqConfigError in chat session %s: %s", session.id, exc)
        final_text = f"KrishiMitra AI isn't fully configured yet: {exc}"
    except GroqResponseError as exc:
        logger.error("GroqResponseError in chat session %s: %s", session.id, exc)
        final_text = (
            "KrishiMitra AI is temporarily unavailable. Please try again in a moment — "
            "your message has been saved."
        )
    except Exception as exc:
        logger.error("Unexpected error in chat session %s: %s", session.id, exc, exc_info=True)
        final_text = "I encountered an unexpected issue while processing your request. Please try again in a moment."

    if final_text is None:
        final_text = "I wasn't able to finish that request. Could you try rephrasing it?"

    assistant_message = ChatMessage(session_id=session.id, role=ChatRole.ASSISTANT, content=final_text)
    db.add(assistant_message)

    if session.title == "New conversation":
        session.title = payload.content[:60]

    db.commit()
    db.refresh(assistant_message)

    sources = [{"title": c["source_title"], "url": c["source_url"]} for c in rag_chunks]

    return Envelope(
        data=ChatReplyOut(
            message=ChatMessageOut.model_validate(assistant_message), tools_used=tools_used, sources=sources
        )
    )
