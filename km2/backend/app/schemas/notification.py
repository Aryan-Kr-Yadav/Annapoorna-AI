from uuid import UUID
from typing import Optional

from pydantic import BaseModel

from app.models.notification import NotificationPriority, NotificationType
from app.schemas.common import IDTimestamped


class NotificationOut(IDTimestamped):
    user_id: UUID
    farm_id: Optional[UUID]
    crop_cycle_id: Optional[UUID]
    type: NotificationType
    title: str
    message: str
    priority: NotificationPriority
    read: bool
