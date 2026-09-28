from typing import Optional

from pydantic import BaseModel, EmailStr

from app.schemas.common import IDTimestamped


class UserOut(IDTimestamped):
    email: str
    full_name: Optional[str]
    preferred_language: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    preferred_language: Optional[str] = None
