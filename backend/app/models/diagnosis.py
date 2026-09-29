import enum
from typing import Optional
from uuid import UUID

from sqlalchemy import Enum, Float, ForeignKey, String, Text, JSON
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPKMixin


class Severity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    UNKNOWN = "unknown"


class Diagnosis(Base, UUIDPKMixin, TimestampMixin):
    """A single Crop Doctor inspection: an image and/or symptoms, and
    whatever the AI could determine about them — honestly, including
    when confidence isn't actually available."""

    __tablename__ = "diagnoses"

    crop_cycle_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("crop_cycles.id", ondelete="CASCADE"), index=True
    )

    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    symptoms_reported: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    possible_condition: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    # NULL means "confidence unavailable" — never fabricate a number here.
    confidence_percentage: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    severity: Mapped[Severity] = mapped_column(Enum(Severity, name="severity_enum"), default=Severity.UNKNOWN)

    recommendation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_follow_up: Mapped[bool] = mapped_column(default=False, server_default="false")
    analysis_details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    crop_cycle: Mapped["CropCycle"] = relationship(back_populates="diagnoses")
