import enum
from datetime import date
from typing import Optional
from uuid import UUID

from sqlalchemy import Date, Enum, Numeric, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPKMixin


class ExpenseCategory(str, enum.Enum):
    SEEDS = "seeds"
    FERTILIZER = "fertilizer"
    PESTICIDES = "pesticides"
    LABOUR = "labour"
    IRRIGATION = "irrigation"
    MACHINERY = "machinery"
    TRANSPORT = "transport"
    OTHER = "other"


class Expense(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "expenses"

    crop_cycle_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("crop_cycles.id", ondelete="CASCADE"), index=True
    )

    category: Mapped[ExpenseCategory] = mapped_column(Enum(ExpenseCategory, name="expense_category_enum"))
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    crop_cycle: Mapped["CropCycle"] = relationship(back_populates="expenses")
