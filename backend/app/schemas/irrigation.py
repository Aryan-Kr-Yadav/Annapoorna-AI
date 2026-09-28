from datetime import date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.models.irrigation import IrrigationMethod
from app.schemas.common import IDTimestamped


class IrrigationLogCreate(BaseModel):
    date: date
    method: IrrigationMethod
    water_amount_liters: Optional[float] = None
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None


class IrrigationLogOut(IDTimestamped):
    crop_cycle_id: UUID
    date: date
    method: IrrigationMethod
    water_amount_liters: Optional[float]
    duration_minutes: Optional[int]
    notes: Optional[str]
