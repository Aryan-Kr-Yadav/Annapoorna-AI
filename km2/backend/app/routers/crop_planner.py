from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.data.crop_suitability import suggest_crops
from app.models.user import User
from app.schemas.common import Envelope
from app.services.ownership import get_owned_farm

router = APIRouter(prefix="/crop-planner", tags=["crop-planner"])


class CropSuggestionRequest(BaseModel):
    farm_id: UUID
    season: str  # kharif | rabi | zaid


@router.post("/suggest", response_model=Envelope[list[dict]])
def suggest(payload: CropSuggestionRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    farm = get_owned_farm(db, payload.farm_id, user.id)
    suggestions = suggest_crops(payload.season, farm.soil_type, farm.irrigation_type.value)
    return Envelope(data=suggestions)
