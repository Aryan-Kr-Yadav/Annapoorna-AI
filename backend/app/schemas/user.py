from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr

from app.schemas.common import IDTimestamped


class UserOut(IDTimestamped):
    email: str
    full_name: Optional[str]
    preferred_language: str
    default_farm_id: Optional[UUID] = None
    preferences: Optional[dict] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    preferred_language: Optional[str] = None
    default_farm_id: Optional[UUID] = None
    preferences: Optional[dict] = None
