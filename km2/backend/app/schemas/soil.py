from datetime import date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.schemas.common import IDTimestamped


class SoilTestCreate(BaseModel):
    test_date: date
    ph: Optional[float] = None
    nitrogen: Optional[float] = None
    phosphorus: Optional[float] = None
    potassium: Optional[float] = None
    organic_carbon: Optional[float] = None
    notes: Optional[str] = None


class SoilTestOut(IDTimestamped):
    crop_cycle_id: UUID
    test_date: date
    ph: Optional[float]
    nitrogen: Optional[float]
    phosphorus: Optional[float]
    potassium: Optional[float]
    organic_carbon: Optional[float]
    notes: Optional[str]


class SoilParameterAssessment(BaseModel):
    parameter: str
    value: Optional[float]
    rating: str  # Low / Normal / High / Unknown
    reference_range: Optional[str] = None


class SoilAssessmentOut(BaseModel):
    test: SoilTestOut
    assessments: list[SoilParameterAssessment]
