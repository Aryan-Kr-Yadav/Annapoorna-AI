from datetime import datetime
from typing import Generic, Optional, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class IDTimestamped(ORMBase):
    id: UUID
    created_at: datetime
    updated_at: datetime


class Envelope(BaseModel, Generic[T]):
    success: bool = True
    message: str = ""
    data: Optional[T] = None
