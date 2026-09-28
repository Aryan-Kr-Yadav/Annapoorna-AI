from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.crop import CropCycle
from app.models.farm import Farm
from app.models.user import User
from app.schemas.common import Envelope
from app.services.analytics_service import compare_crop_cycles, season_report
from app.services.ownership import get_owned_farm

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/farms/{farm_id}/seasons", response_model=Envelope[list[dict]])
def compare_seasons(
    farm_id: UUID,
    crop_name: str | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Season-over-season comparison for a farm, optionally filtered to one crop (e.g. Wheat 2026 vs Wheat 2027)."""
    farm = get_owned_farm(db, farm_id, user.id)
    query = db.query(CropCycle).filter(CropCycle.farm_id == farm.id)
    if crop_name:
        query = query.filter(CropCycle.crop_name.ilike(crop_name))
    crop_cycles = query.order_by(CropCycle.sowing_date.asc()).all()
    return Envelope(data=compare_crop_cycles(db, crop_cycles))
