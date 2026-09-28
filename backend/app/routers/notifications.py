from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.notification import Notification
from app.models.user import User
from app.schemas.common import Envelope
from app.schemas.notification import NotificationOut

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=Envelope[list[NotificationOut]])
def list_notifications(
    unread_only: bool = False, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    query = db.query(Notification).filter(Notification.user_id == user.id)
    if unread_only:
        query = query.filter(Notification.read.is_(False))
    notifications = query.order_by(Notification.created_at.desc()).limit(50).all()
    return Envelope(data=[NotificationOut.model_validate(n) for n in notifications])


@router.patch("/{notification_id}/read", response_model=Envelope[NotificationOut])
def mark_read(notification_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == user.id)
        .first()
    )
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found.")
    notification.read = True
    db.commit()
    db.refresh(notification)
    return Envelope(data=NotificationOut.model_validate(notification))
