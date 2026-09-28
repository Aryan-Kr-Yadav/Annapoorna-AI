from datetime import date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.expense import ExpenseCategory
from app.schemas.common import IDTimestamped


class ExpenseCreate(BaseModel):
    category: ExpenseCategory
    amount: float = Field(gt=0)
    date: date
    notes: Optional[str] = None


class ExpenseUpdate(BaseModel):
    category: Optional[ExpenseCategory] = None
    amount: Optional[float] = None
    date: Optional[date] = None
    notes: Optional[str] = None


class ExpenseOut(IDTimestamped):
    crop_cycle_id: UUID
    category: ExpenseCategory
    amount: float
    date: date
    notes: Optional[str]
