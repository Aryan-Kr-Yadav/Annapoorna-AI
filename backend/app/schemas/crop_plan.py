from datetime import date
from typing import Optional, Any
from uuid import UUID

from pydantic import BaseModel

from app.schemas.common import IDTimestamped


class CropPlanSaveRequest(BaseModel):
    farm_id: UUID
    crop_name: str
    variety: Optional[str] = None
    season: str
    year: int
    reason: Optional[str] = None
    soil_context: Optional[str] = None
    irrigation_context: Optional[str] = None
    estimated_duration_days: Optional[int] = None
    suggested_sowing_window: Optional[str] = None
    suggested_harvest_window: Optional[str] = None
    plan_details: Optional[dict[str, Any]] = None


class CropPlanConvertRequest(BaseModel):
    sowing_date: Optional[date] = None


class CropPlanOut(IDTimestamped):
    user_id: UUID
    farm_id: UUID
    crop_cycle_id: Optional[UUID] = None
    crop_name: str
    variety: Optional[str] = None
    season: str
    year: int
    reason: Optional[str] = None
    soil_context: Optional[str] = None
    irrigation_context: Optional[str] = None
    estimated_duration_days: Optional[int] = None
    suggested_sowing_window: Optional[str] = None
    suggested_harvest_window: Optional[str] = None
    plan_details: Optional[dict[str, Any]] = None
    status: str
    farm_name: Optional[str] = None
