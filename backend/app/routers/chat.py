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
from app.ai.service import ai_service, AIConfigError, AIResponseError
from app.ai.prompts import SYSTEM_PROMPT, build_context_block, detect_message_style
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
    from app.models.farm import Farm
    from app.models.crop import CropCycle

    farm_id = payload.farm_id
    crop_cycle_id = payload.crop_cycle_id

    if farm_id:
        farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == user.id).first()
        if not farm:
            raise HTTPException(status_code=400, detail="Farm not found or not owned by you.")
        if crop_cycle_id:
            crop = db.query(CropCycle).filter(CropCycle.id == crop_cycle_id, CropCycle.farm_id == farm.id).first()
            if not crop:
                raise HTTPException(status_code=400, detail="Crop cycle not found on specified farm.")

    session = ChatSession(
        user_id=user.id,
        farm_id=farm_id,
        crop_cycle_id=crop_cycle_id,
        title=payload.title or "New conversation",
    )
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
def update_session(
    session_id: UUID, payload: ChatSessionUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    from app.models.farm import Farm
    from app.models.crop import CropCycle

    session = _get_owned_session(db, session_id, user.id)
    if payload.title is not None:
        session.title = payload.title
    if payload.farm_id is not None:
        if payload.farm_id:
            farm = db.query(Farm).filter(Farm.id == payload.farm_id, Farm.user_id == user.id).first()
            if not farm:
                raise HTTPException(status_code=400, detail="Farm not found or not owned by you.")
            session.farm_id = payload.farm_id
        else:
            session.farm_id = None
            session.crop_cycle_id = None

    if payload.crop_cycle_id is not None:
        if payload.crop_cycle_id and session.farm_id:
            crop = db.query(CropCycle).filter(CropCycle.id == payload.crop_cycle_id, CropCycle.farm_id == session.farm_id).first()
            if not crop:
                raise HTTPException(status_code=400, detail="Crop cycle not found on this farm.")
            session.crop_cycle_id = payload.crop_cycle_id
        else:
            session.crop_cycle_id = None

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

    # 1. Normalize user content
    raw_content = (payload.content or "").strip()
    if not raw_content and payload.image_url:
        user_display_content = "Analyze this crop image and describe visible agricultural observations."
    else:
        user_display_content = raw_content or "Hello"

    user_message = ChatMessage(
        session_id=session.id, role=ChatRole.USER, content=user_display_content, image_url=payload.image_url
    )
    db.add(user_message)
    db.commit()

    # --- Build bounded context with intelligent query routing ---
    farm_context = build_farm_crop_context(db, user, session.farm_id, session.crop_cycle_id, query_text=user_display_content)
    rag_chunks = await retrieve_relevant_chunks(db, user_display_content)

    # Language and style directives
    user_prefs = user.preferences or {}
    assistant_lang = user_prefs.get("assistant_language", "auto")
    assistant_style = user_prefs.get("assistant_style", "balanced")

    from app.ai.prompts import get_language_directive, get_style_directive, VISION_INSPECTION_PROMPT
    style_directive = get_language_directive(assistant_lang, user_display_content) + get_style_directive(assistant_style)

    tools_used: list[str] = []
    final_text = None

    # ========================================================
    # CASE 1: IMAGE CHAT REQUEST (Direct to Vision Model)
    # ========================================================
    if payload.image_url:
        crop_hint = farm_context.get("active_crop", "") if farm_context else ""
        stage_hint = farm_context.get("current_stage", "") if farm_context else ""
        farm_name = farm_context.get("farm_name", "") if farm_context else ""

        context_parts = []
        if farm_name:
            context_parts.append(f"Farm: {farm_name}")
        if crop_hint:
            context_parts.append(f"Crop: {crop_hint}")
        if stage_hint:
            context_parts.append(f"Growth Stage: {stage_hint}")
        farm_summary = " | ".join(context_parts) if context_parts else "General Indian Agriculture"

        vision_prompt = (
            f"{VISION_INSPECTION_PROMPT}\n\n"
            f"[CONTEXT: {farm_summary}]\n"
            f"[FARMER QUERY: {user_display_content}]\n"
            f"{style_directive}"
        )

        try:
            logger.info("Routing multimodal message directly to Vision Model (%s)", ai_service.select_model(has_image=True))
            final_text = await ai_service.analyze_image(
                prompt=vision_prompt,
                image_url=payload.image_url,
            )
        except AIResponseError as exc:
            logger.error("Vision model response error in session %s: %s", session.id, exc)
            final_text = exc.user_safe_message or "Unable to analyze this image. Please ensure photo is clear and in JPG, PNG, or WebP format."
        except Exception as exc:
            logger.error("Unexpected error in vision analysis for session %s: %s", session.id, exc, exc_info=True)
            final_text = "Unable to analyze this image at this time. Please try again shortly."

    # ========================================================
    # CASE 2: TEXT-ONLY REQUEST (Direct to GPT-OSS 120B with tools)
    # ========================================================
    else:
        if session.farm_id and farm_context:
            context_block = build_context_block(farm_context)
        else:
            context_block = "[CONTEXT MODE: General Knowledge & Farming Science. Answering conceptual question directly.]"

        system_content = SYSTEM_PROMPT + style_directive + "\n\n" + context_block
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

        # Build pure text conversation history for GPT-OSS 120B (GPT-OSS does not accept image_url blocks)
        for m in recent_messages:
            content_text = m.content or ""
            if m.image_url:
                content_text = f"[Attached crop photo]: {content_text}".strip()
            messages.append({"role": m.role.value, "content": content_text})

        try:
            for _ in range(MAX_TOOL_ROUNDS):
                assistant_msg = await ai_service.generate_with_tools(
                    messages,
                    tools=ai_tools.TOOL_DEFINITIONS,
                    reasoning_effort="medium",
                )

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
        except AIConfigError as exc:
            logger.error("AIConfigError in chat session %s: %s", session.id, exc)
            final_text = "AI service configuration is incomplete. Please contact your system administrator."
        except AIResponseError as exc:
            logger.error("AIResponseError in chat session %s: %s", session.id, exc)
            final_text = exc.user_safe_message or (
                "Annapoorna AI is temporarily busy. Please try again in a moment — "
                "your message has been saved."
            )
        except Exception as exc:
            logger.error("Unexpected error in chat session %s: %s", session.id, exc, exc_info=True)
            final_text = "Something went wrong while processing your request. Please try again in a moment."

    if final_text is None:
        final_text = "I wasn't able to complete that request. Please try asking again."

    assistant_message = ChatMessage(session_id=session.id, role=ChatRole.ASSISTANT, content=final_text)
    db.add(assistant_message)

    if session.title == "New conversation":
        session.title = user_display_content[:60]

    db.commit()
    db.refresh(assistant_message)

    sources = [{"title": c["source_title"], "url": c["source_url"]} for c in rag_chunks]

    return Envelope(
        data=ChatReplyOut(
            message=ChatMessageOut.model_validate(assistant_message), tools_used=tools_used, sources=sources
        )
    )
