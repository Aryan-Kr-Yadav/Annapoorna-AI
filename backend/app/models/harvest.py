from datetime import date
from typing import Optional
from uuid import UUID

from sqlalchemy import Date, Numeric, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPKMixin


class Harvest(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "harvests"

    crop_cycle_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("crop_cycles.id", ondelete="CASCADE"), index=True
    )

    harvest_date: Mapped[date] = mapped_column(Date, nullable=False)
    yield_quantity: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    yield_unit: Mapped[str] = mapped_column(String(20), default="quintal")  # quintal/kg/tonne
    selling_price_per_unit: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    revenue: Mapped[Optional[float]] = mapped_column(Numeric(14, 2), nullable=True)  # computed & stored on save

    crop_cycle: Mapped["CropCycle"] = relationship(back_populates="harvests")
