from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.models.diagnosis import Severity
from app.schemas.common import IDTimestamped


class DiagnosisCreate(BaseModel):
    symptoms_reported: Optional[str] = None
    # image comes via multipart upload, not this body


class DiagnosisOut(IDTimestamped):
    crop_cycle_id: UUID
    image_url: Optional[str]
    symptoms_reported: Optional[str]
    possible_condition: Optional[str]
    confidence_percentage: Optional[float]
    severity: Severity
    recommendation: Optional[str]
    is_follow_up: bool
