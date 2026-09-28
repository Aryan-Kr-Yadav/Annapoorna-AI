from datetime import date
from typing import Optional

from sqlalchemy import Date, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPKMixin


class Scheme(Base, UUIDPKMixin, TimestampMixin):
    """
    Verified Government Agricultural Scheme.
    Data must strictly originate from trusted official government sources
    (myScheme, Ministry of Agriculture & Farmers Welfare, official state portals).
    Groq is NEVER the source of truth for facts in this table.
    """
    __tablename__ = "schemes"

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    short_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    # scheme_type: central | state
    scheme_type: Mapped[str] = mapped_column(String(50), default="central", server_default="central", index=True)
    scope: Mapped[str] = mapped_column(String(20), default="national")  # backwards compatibility: national | state
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    target_beneficiaries: Mapped[list] = mapped_column(JSONB, default=list, server_default="[]")
    benefits: Mapped[list] = mapped_column(JSONB, default=list, server_default="[]")
    eligibility: Mapped[list] = mapped_column(JSONB, default=list, server_default="[]")
    required_documents: Mapped[list] = mapped_column(JSONB, default=list, server_default="[]")
    application_process: Mapped[list] = mapped_column(JSONB, default=list, server_default="[]")

    # Official verification and attribution
    official_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    source: Mapped[str] = mapped_column(String(255), default="Government of India", server_default="Government of India")
    source_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    ministry_or_department: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Lifecycle status: active | inactive | expired
    active_status: Mapped[str] = mapped_column(String(50), default="active", server_default="active", index=True)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    last_verified: Mapped[Optional[date]] = mapped_column(Date, nullable=True, index=True)

    # Deterministic matching metadata (null/empty when official source does not specify)
    applicable_crops: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)  # null/[] = all crops
    matching_criteria: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}")

    @property
    def documents_required(self) -> list:
        return self.required_documents

    @documents_required.setter
    def documents_required(self, value: list) -> None:
        self.required_documents = value
