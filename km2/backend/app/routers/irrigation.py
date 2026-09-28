from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.irrigation import IrrigationLog
from app.models.user import User
from app.schemas.common import Envelope
from app.schemas.irrigation import IrrigationLogCreate, IrrigationLogOut
from app.services.advisory_service import next_irrigation_estimate
from app.services.ownership import get_owned_crop_cycle

router = APIRouter(tags=["irrigation"])


@router.post("/crops/{crop_id}/irrigation", response_model=Envelope[IrrigationLogOut])
def log_irrigation(
    crop_id: UUID, payload: IrrigationLogCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    crop = get_owned_crop_cycle(db, crop_id, user.id)
    log = IrrigationLog(crop_cycle_id=crop.id, **payload.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return Envelope(message="Irrigation logged.", data=IrrigationLogOut.model_validate(log))


@router.get("/crops/{crop_id}/irrigation", response_model=Envelope[list[IrrigationLogOut]])
def list_irrigation(crop_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    crop = get_owned_crop_cycle(db, crop_id, user.id)
    logs = (
        db.query(IrrigationLog)
        .filter(IrrigationLog.crop_cycle_id == crop.id)
        .order_by(IrrigationLog.date.desc())
        .all()
    )
    return Envelope(data=[IrrigationLogOut.model_validate(l) for l in logs])


@router.get("/crops/{crop_id}/irrigation/next", response_model=Envelope[dict])
def get_next_irrigation(crop_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    crop = get_owned_crop_cycle(db, crop_id, user.id)
    last = (
        db.query(IrrigationLog)
        .filter(IrrigationLog.crop_cycle_id == crop.id)
        .order_by(IrrigationLog.date.desc())
        .first()
    )
    result = next_irrigation_estimate(last.date if last else None)
    return Envelope(data=result)
