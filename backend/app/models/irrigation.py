import enum
from datetime import date
from typing import Optional
from uuid import UUID

from sqlalchemy import Date, Enum, Float, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPKMixin


class IrrigationMethod(str, enum.Enum):
    FLOOD = "flood"
    DRIP = "drip"
    SPRINKLER = "sprinkler"
    CANAL = "canal"
    OTHER = "other"


class IrrigationLog(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "irrigation_logs"

    crop_cycle_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("crop_cycles.id", ondelete="CASCADE"), index=True
    )

    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    method: Mapped[IrrigationMethod] = mapped_column(Enum(IrrigationMethod, name="irrigation_method_enum"))
    water_amount_liters: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    crop_cycle: Mapped["CropCycle"] = relationship(back_populates="irrigation_logs")
