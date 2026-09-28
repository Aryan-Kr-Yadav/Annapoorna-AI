from datetime import date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.crop import CropCycleStatus, Season
from app.schemas.common import IDTimestamped


class CropCycleCreate(BaseModel):
    crop_name: str
    variety: Optional[str] = None
    season: Season
    year: int = Field(ge=2000, le=2100)
    area: Optional[float] = Field(default=None, gt=0)
    sowing_date: date
    expected_harvest_date: Optional[date] = None


class CropCycleUpdate(BaseModel):
    crop_name: Optional[str] = None
    variety: Optional[str] = None
    season: Optional[Season] = None
    year: Optional[int] = None
    area: Optional[float] = None
    sowing_date: Optional[date] = None
    expected_harvest_date: Optional[date] = None
    actual_harvest_date: Optional[date] = None
    status: Optional[CropCycleStatus] = None


class CropCycleOut(IDTimestamped):
    farm_id: UUID
    crop_name: str
    variety: Optional[str]
    season: Season
    year: int
    area: Optional[float]
    sowing_date: date
    expected_harvest_date: Optional[date]
    actual_harvest_date: Optional[date]
    status: CropCycleStatus


class LifecycleStage(BaseModel):
    name: str
    start_day: int
    end_day: int
    is_estimate: bool = True


class LifecycleOut(BaseModel):
    crop_name: str
    day_number: int
    current_stage: Optional[str]
    next_stage: Optional[str]
    total_estimated_duration_days: Optional[int]
    stages: list[LifecycleStage]
    progress_percentage: Optional[float]
    note: Optional[str] = None
