from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.notification import Notification, NotificationPriority, NotificationType


def create_notification(
    db: Session,
    user_id: UUID,
    type: NotificationType,
    title: str,
    message: str,
    priority: NotificationPriority = NotificationPriority.INFO,
    farm_id: Optional[UUID] = None,
    crop_cycle_id: Optional[UUID] = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        farm_id=farm_id,
        crop_cycle_id=crop_cycle_id,
        type=type,
        title=title,
        message=message,
        priority=priority,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification
