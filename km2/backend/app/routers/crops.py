from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.crop import CropCycle
from app.models.user import User
from app.schemas.common import Envelope
from app.schemas.crop import CropCycleCreate, CropCycleOut, CropCycleUpdate, LifecycleOut
from app.services.lifecycle_engine import calculate_lifecycle
from app.services.ownership import get_owned_crop_cycle, get_owned_farm

router = APIRouter(tags=["crops"])


@router.post("/farms/{farm_id}/crops", response_model=Envelope[CropCycleOut])
def create_crop_cycle(
    farm_id: UUID, payload: CropCycleCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    farm = get_owned_farm(db, farm_id, user.id)
    crop = CropCycle(farm_id=farm.id, **payload.model_dump())
    db.add(crop)
    db.commit()
    db.refresh(crop)
    return Envelope(message="Crop cycle created.", data=CropCycleOut.model_validate(crop))


@router.get("/farms/{farm_id}/crops", response_model=Envelope[list[CropCycleOut]])
def list_crops_for_farm(farm_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    farm = get_owned_farm(db, farm_id, user.id)
    crops = (
        db.query(CropCycle)
        .filter(CropCycle.farm_id == farm.id)
        .order_by(CropCycle.sowing_date.desc())
        .all()
    )
    return Envelope(data=[CropCycleOut.model_validate(c) for c in crops])


@router.get("/crops/{crop_id}", response_model=Envelope[CropCycleOut])
def get_crop_cycle(crop_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    crop = get_owned_crop_cycle(db, crop_id, user.id)
    return Envelope(data=CropCycleOut.model_validate(crop))


@router.put("/crops/{crop_id}", response_model=Envelope[CropCycleOut])
def update_crop_cycle(
    crop_id: UUID, payload: CropCycleUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    crop = get_owned_crop_cycle(db, crop_id, user.id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(crop, field, value)
    db.commit()
    db.refresh(crop)
    return Envelope(message="Crop cycle updated.", data=CropCycleOut.model_validate(crop))


@router.get("/crops/{crop_id}/lifecycle", response_model=Envelope[LifecycleOut])
def get_crop_lifecycle(crop_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    crop = get_owned_crop_cycle(db, crop_id, user.id)
    lifecycle = calculate_lifecycle(crop.crop_name, crop.sowing_date)
    return Envelope(data=lifecycle)
