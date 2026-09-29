import enum
from datetime import date
from typing import List, Optional
from uuid import UUID

from sqlalchemy import Date, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPKMixin


class Season(str, enum.Enum):
    KHARIF = "kharif"
    RABI = "rabi"
    ZAID = "zaid"
    PERENNIAL = "perennial"


class CropCycleStatus(str, enum.Enum):
    PLANNED = "planned"
    ACTIVE = "active"
    HARVESTED = "harvested"
    SOLD = "sold"
    ARCHIVED = "archived"


class CropCycle(Base, UUIDPKMixin, TimestampMixin):
    """
    A single crop, grown on a single farm, during a single season/year.
    This is the central "unit of time" the whole platform hangs off of —
    tasks, irrigation, soil tests, diagnoses, expenses and harvests all
    belong to one crop_cycle, which is what makes season-over-season
    history and analytics possible.
    """

    __tablename__ = "crop_cycles"

    farm_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), index=True)

    crop_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    variety: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    season: Mapped[Season] = mapped_column(Enum(Season, name="season_enum"), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)

    area: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    sowing_date: Mapped[date] = mapped_column(Date, nullable=False)
    expected_harvest_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    actual_harvest_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    status: Mapped[CropCycleStatus] = mapped_column(
        Enum(CropCycleStatus, name="crop_cycle_status_enum"), default=CropCycleStatus.ACTIVE
    )

    farm: Mapped["Farm"] = relationship(back_populates="crop_cycles")
    tasks: Mapped[List["CropTask"]] = relationship(back_populates="crop_cycle", cascade="all, delete-orphan")
    soil_tests: Mapped[List["SoilTest"]] = relationship(back_populates="crop_cycle", cascade="all, delete-orphan")
    irrigation_logs: Mapped[List["IrrigationLog"]] = relationship(
        back_populates="crop_cycle", cascade="all, delete-orphan"
    )
    diagnoses: Mapped[List["Diagnosis"]] = relationship(back_populates="crop_cycle", cascade="all, delete-orphan")
    expenses: Mapped[List["Expense"]] = relationship(back_populates="crop_cycle", cascade="all, delete-orphan")
    harvests: Mapped[List["Harvest"]] = relationship(back_populates="crop_cycle", cascade="all, delete-orphan")
    sales: Mapped[List["CropSale"]] = relationship(back_populates="crop_cycle", cascade="all, delete-orphan")
