from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.models.chat import ChatRole
from app.schemas.common import IDTimestamped


class ChatSessionCreate(BaseModel):
    farm_id: Optional[UUID] = None
    crop_cycle_id: Optional[UUID] = None
    title: Optional[str] = "New conversation"


class ChatSessionUpdate(BaseModel):
    title: Optional[str] = None
    farm_id: Optional[UUID] = None
    crop_cycle_id: Optional[UUID] = None


class ChatSessionOut(IDTimestamped):
    user_id: UUID
    farm_id: Optional[UUID]
    crop_cycle_id: Optional[UUID]
    title: str


class ChatMessageCreate(BaseModel):
    content: str
    image_url: Optional[str] = None


class ChatMessageOut(IDTimestamped):
    session_id: UUID
    role: ChatRole
    content: str
    image_url: Optional[str]


class ChatReplyOut(BaseModel):
    message: ChatMessageOut
    tools_used: list[str] = []
    sources: list[dict] = []
