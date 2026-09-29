import enum
from datetime import date
from typing import Optional
from uuid import UUID

from sqlalchemy import Date, Enum, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPKMixin


class CropPlanStatus(str, enum.Enum):
    DRAFT = "draft"
    SAVED = "saved"
    CONVERTED = "converted"
    ARCHIVED = "archived"


class CropPlan(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "crop_plans"

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    farm_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), index=True
    )
    crop_cycle_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("crop_cycles.id", ondelete="SET NULL"), nullable=True
    )

    crop_name: Mapped[str] = mapped_column(String(100), nullable=False)
    variety: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    season: Mapped[str] = mapped_column(String(20), nullable=False)  # kharif/rabi/zaid
    year: Mapped[int] = mapped_column(Integer, nullable=False)

    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    soil_context: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    irrigation_context: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    estimated_duration_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    suggested_sowing_window: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    suggested_harvest_window: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    plan_details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    status: Mapped[CropPlanStatus] = mapped_column(
        Enum(CropPlanStatus, name="crop_plan_status_enum", values_callable=lambda x: [e.value for e in x]), default=CropPlanStatus.SAVED
    )

    user: Mapped["User"] = relationship()
    farm: Mapped["Farm"] = relationship()
    crop_cycle: Mapped[Optional["CropCycle"]] = relationship()
