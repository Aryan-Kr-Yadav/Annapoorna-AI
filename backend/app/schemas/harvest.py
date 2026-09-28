from datetime import date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import IDTimestamped


class HarvestCreate(BaseModel):
    harvest_date: date
    yield_quantity: float = Field(gt=0)
    yield_unit: str = "quintal"
    selling_price_per_unit: Optional[float] = None


class HarvestOut(IDTimestamped):
    crop_cycle_id: UUID
    harvest_date: date
    yield_quantity: float
    yield_unit: str
    selling_price_per_unit: Optional[float]
    revenue: Optional[float]


class SeasonReportOut(BaseModel):
    crop_cycle: dict
    duration_days: Optional[int]
    total_expenses: float
    expense_breakdown: dict
    total_irrigation_events: int
    health_events: int
    yield_quantity: Optional[float]
    revenue: Optional[float]
    profit: Optional[float]
    roi_percentage: Optional[float]
    cost_per_unit_yield: Optional[float]
