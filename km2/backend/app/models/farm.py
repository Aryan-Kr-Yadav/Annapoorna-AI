import enum
from typing import List, Optional
from uuid import UUID

from sqlalchemy import Enum, Float, ForeignKey, String, Boolean
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPKMixin


class AreaUnit(str, enum.Enum):
    ACRE = "acre"
    HECTARE = "hectare"
    BIGHA = "bigha"


class IrrigationType(str, enum.Enum):
    RAINFED = "rainfed"
    CANAL = "canal"
    BOREWELL = "borewell"
    DRIP = "drip"
    SPRINKLER = "sprinkler"
    OTHER = "other"


class Farm(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "farms"

    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    district: Mapped[str] = mapped_column(String(100), nullable=False)
    village_or_city: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)

    area: Mapped[float] = mapped_column(Float, nullable=False)
    area_unit: Mapped[AreaUnit] = mapped_column(Enum(AreaUnit, name="area_unit_enum"), default=AreaUnit.ACRE)

    soil_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    irrigation_type: Mapped[IrrigationType] = mapped_column(
        Enum(IrrigationType, name="irrigation_type_enum"), default=IrrigationType.RAINFED
    )

    # Optional — the spec explicitly says GPS should never be required.
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")

    user: Mapped["User"] = relationship(back_populates="farms")
    crop_cycles: Mapped[List["CropCycle"]] = relationship(
        back_populates="farm", cascade="all, delete-orphan"
    )
