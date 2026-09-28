import enum
from typing import Optional
from uuid import UUID

from sqlalchemy import Boolean, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPKMixin


class NotificationType(str, enum.Enum):
    WEATHER = "weather"
    LIFECYCLE = "lifecycle"
    TASK = "task"
    IRRIGATION = "irrigation"
    HEALTH = "health"
    SCHEME = "scheme"
    MARKET = "market"


class NotificationPriority(str, enum.Enum):
    INFO = "info"
    IMPORTANT = "important"
    WARNING = "warning"


class Notification(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "notifications"

    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    farm_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), nullable=True
    )
    crop_cycle_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("crop_cycles.id", ondelete="CASCADE"), nullable=True
    )

    type: Mapped[NotificationType] = mapped_column(Enum(NotificationType, name="notification_type_enum"))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[NotificationPriority] = mapped_column(
        Enum(NotificationPriority, name="notification_priority_enum"), default=NotificationPriority.INFO
    )
    read: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")

    user: Mapped["User"] = relationship(back_populates="notifications")
