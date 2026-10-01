from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.farm import Farm
from app.models.user import User
from app.schemas.common import Envelope
from app.schemas.farm import FarmCreate, FarmOut, FarmUpdate
from app.services.ownership import get_owned_farm

router = APIRouter(prefix="/farms", tags=["farms"])


@router.post("", response_model=Envelope[FarmOut])
def create_farm(payload: FarmCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    farm = Farm(user_id=user.id, **payload.model_dump())
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return Envelope(message="Farm created.", data=FarmOut.model_validate(farm))


@router.get("", response_model=Envelope[list[FarmOut]])
def list_farms(
    include_archived: bool = False, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    query = db.query(Farm).filter(Farm.user_id == user.id)
    if not include_archived:
        query = query.filter(Farm.is_archived.is_(False))
    farms = query.order_by(Farm.created_at.asc()).all()
    return Envelope(data=[FarmOut.model_validate(f) for f in farms])


@router.get("/{farm_id}", response_model=Envelope[FarmOut])
def get_farm(farm_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    farm = get_owned_farm(db, farm_id, user.id)
    return Envelope(data=FarmOut.model_validate(farm))


@router.put("/{farm_id}", response_model=Envelope[FarmOut])
@router.patch("/{farm_id}", response_model=Envelope[FarmOut])
def update_farm(
    farm_id: UUID, payload: FarmUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    farm = get_owned_farm(db, farm_id, user.id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(farm, field, value)
    db.commit()
    db.refresh(farm)
    return Envelope(message="Farm updated.", data=FarmOut.model_validate(farm))


@router.delete("/{farm_id}", response_model=Envelope[None])
def delete_farm(
    farm_id: UUID,
    hard_delete: bool = False,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Safely deletes or archives a farm and handles associated records."""
    farm = get_owned_farm(db, farm_id, user.id)
    if hard_delete:
        db.delete(farm)
    else:
        farm.is_archived = True
    db.commit()
    return Envelope(message="Farm deleted successfully.")
