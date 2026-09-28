from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.farm import AreaUnit, IrrigationType
from app.schemas.common import IDTimestamped


class FarmCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    state: str
    district: str
    village_or_city: Optional[str] = None
    area: float = Field(gt=0)
    area_unit: AreaUnit = AreaUnit.ACRE
    soil_type: Optional[str] = None
    irrigation_type: IrrigationType = IrrigationType.RAINFED
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class FarmUpdate(BaseModel):
    name: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    village_or_city: Optional[str] = None
    area: Optional[float] = None
    area_unit: Optional[AreaUnit] = None
    soil_type: Optional[str] = None
    irrigation_type: Optional[IrrigationType] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_archived: Optional[bool] = None


class FarmOut(IDTimestamped):
    user_id: UUID
    name: str
    state: str
    district: str
    village_or_city: Optional[str]
    area: float
    area_unit: AreaUnit
    soil_type: Optional[str]
    irrigation_type: IrrigationType
    latitude: Optional[float]
    longitude: Optional[float]
    is_archived: bool
