import asyncio
import base64
from io import BytesIO
from PIL import Image
import pytest
from app.core.database import SessionLocal
from app.models.user import User
from app.models.chat import ChatSession
from app.routers.chat import send_message
from app.schemas.chat import ChatMessageCreate
from app.ai.service import ai_service

def create_test_image_data_url(color="green", size=(64, 64)):
    img = Image.new("RGB", size, color=color)
    buf = BytesIO()
    img.save(buf, format="JPEG")
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"

@pytest.mark.asyncio
async def test_text_chat_flow():
    db = SessionLocal()
    try:
        user = db.query(User).first()
        assert user is not None, "A user should exist in DB"
        
        session = ChatSession(user_id=user.id, title="Test Chat Text")
        db.add(session)
        db.commit()
        db.refresh(session)

        # 1. Pure text message
        payload = ChatMessageCreate(content="What is photosynthesis in 2 sentences?")
        res = await send_message(session.id, payload, user, db)
        assert res.data.message.content is not None
        assert "malformed" not in res.data.message.content.lower()
        print("\n[PASS] Text Chat Response:", res.data.message.content[:100])
    finally:
        db.close()

@pytest.mark.asyncio
async def test_image_chat_flow():
    db = SessionLocal()
    try:
        user = db.query(User).first()
        assert user is not None
        
        session = ChatSession(user_id=user.id, title="Test Chat Image")
        db.add(session)
        db.commit()
        db.refresh(session)

        data_url = create_test_image_data_url()

        # 2. Image + question message
        payload = ChatMessageCreate(
            content="What is visible on this crop leaf?",
            image_url=data_url
        )
        res = await send_message(session.id, payload, user, db)
        assert res.data.message.content is not None
        assert len(res.data.message.content) > 20
        assert "malformed" not in res.data.message.content.lower()
        assert "could not extract" not in res.data.message.content.lower()
        print("\n[PASS] Image + Text Response:", res.data.message.content[:120])

        # 3. Image ONLY message (no text typed by farmer)
        payload_img_only = ChatMessageCreate(
            content="",
            image_url=data_url
        )
        res2 = await send_message(session.id, payload_img_only, user, db)
        assert res2.data.message.content is not None
        assert len(res2.data.message.content) > 20
        assert "malformed" not in res2.data.message.content.lower()
        print("\n[PASS] Image Only Response:", res2.data.message.content[:120])
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_text_chat_flow())
    asyncio.run(test_image_chat_flow())
