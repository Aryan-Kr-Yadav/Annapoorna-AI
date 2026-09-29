from typing import List, Optional

from sqlalchemy import String, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from uuid import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPKMixin


class User(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "users"

    # Links to neon_auth."user".id — the UUID assigned by Neon Auth
    neon_auth_id: Mapped[Optional[str]] = mapped_column(String(255), unique=True, index=True, nullable=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    preferred_language: Mapped[str] = mapped_column(String(10), default="en", server_default="en")
    default_farm_id: Mapped[Optional[UUID]] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("farms.id", ondelete="SET NULL"), nullable=True)
    preferences: Mapped[Optional[dict]] = mapped_column(JSON, default=dict, server_default="{}")

    farms: Mapped[List["Farm"]] = relationship(back_populates="user", cascade="all, delete-orphan", foreign_keys="[Farm.user_id]")
    notifications: Mapped[List["Notification"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    chat_sessions: Mapped[List["ChatSession"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
