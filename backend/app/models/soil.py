from datetime import date
from typing import Optional
from uuid import UUID

from sqlalchemy import Date, Float, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPKMixin


class SoilTest(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "soil_tests"

    crop_cycle_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("crop_cycles.id", ondelete="CASCADE"), index=True
    )

    test_date: Mapped[date] = mapped_column(Date, nullable=False)
    ph: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    nitrogen: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # kg/ha, configurable unit
    phosphorus: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    potassium: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    organic_carbon: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # percent
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    crop_cycle: Mapped["CropCycle"] = relationship(back_populates="soil_tests")
