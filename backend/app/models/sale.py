from datetime import date
from typing import Optional
from uuid import UUID

from sqlalchemy import Date, Numeric, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPKMixin


class CropSale(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "crop_sales"

    crop_cycle_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("crop_cycles.id", ondelete="CASCADE"), index=True
    )

    sale_date: Mapped[date] = mapped_column(Date, nullable=False)
    quantity_sold: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    quantity_unit: Mapped[str] = mapped_column(String(20), default="quintal")
    price_per_unit: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    total_sale_value: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)

    buyer_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    crop_cycle: Mapped["CropCycle"] = relationship(back_populates="sales")
