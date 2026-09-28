from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.crop import CropCycleStatus
from app.models.harvest import Harvest
from app.models.user import User
from app.schemas.common import Envelope
from app.schemas.harvest import HarvestCreate, HarvestOut, SeasonReportOut
from app.services.analytics_service import season_report
from app.services.ownership import get_owned_crop_cycle

router = APIRouter(tags=["harvests"])


@router.post("/crops/{crop_id}/harvests", response_model=Envelope[HarvestOut])
def create_harvest(
    crop_id: UUID, payload: HarvestCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    crop = get_owned_crop_cycle(db, crop_id, user.id)
    data = payload.model_dump()
    revenue = None
    if data.get("selling_price_per_unit") is not None:
        revenue = float(data["selling_price_per_unit"]) * float(data["yield_quantity"])

    harvest = Harvest(crop_cycle_id=crop.id, revenue=revenue, **data)
    db.add(harvest)

    # Marking the crop cycle harvested is a meaningful lifecycle event —
    # do it here rather than requiring a separate manual PUT.
    crop.status = CropCycleStatus.HARVESTED
    crop.actual_harvest_date = payload.harvest_date

    db.commit()
    db.refresh(harvest)
    return Envelope(message="Harvest recorded.", data=HarvestOut.model_validate(harvest))


@router.get("/crops/{crop_id}/harvests", response_model=Envelope[list[HarvestOut]])
def list_harvests(crop_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    crop = get_owned_crop_cycle(db, crop_id, user.id)
    harvests = (
        db.query(Harvest)
        .filter(Harvest.crop_cycle_id == crop.id)
        .order_by(Harvest.harvest_date.desc())
        .all()
    )
    return Envelope(data=[HarvestOut.model_validate(h) for h in harvests])


@router.get("/crops/{crop_id}/season-report", response_model=Envelope[SeasonReportOut])
def get_season_report(crop_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    crop = get_owned_crop_cycle(db, crop_id, user.id)
    report = season_report(db, crop)
    return Envelope(data=report)
