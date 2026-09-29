from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.common import Envelope
from app.schemas.user import UserOut, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=Envelope[UserOut])
def get_me(user: User = Depends(get_current_user)):
    return Envelope(data=UserOut.model_validate(user))


@router.put("/me", response_model=Envelope[UserOut])
def update_me(payload: UserUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.preferred_language is not None:
        user.preferred_language = payload.preferred_language
    if payload.default_farm_id is not None:
        from app.models.farm import Farm
        from fastapi import HTTPException
        if payload.default_farm_id:
            farm = db.query(Farm).filter(Farm.id == payload.default_farm_id, Farm.user_id == user.id).first()
            if not farm:
                raise HTTPException(status_code=400, detail="Specified default farm not found or not owned by you.")
            user.default_farm_id = payload.default_farm_id
        else:
            user.default_farm_id = None
    if payload.preferences is not None:
        current_prefs = dict(user.preferences or {})
        current_prefs.update(payload.preferences)
        user.preferences = current_prefs
        # Keep preferred_language in sync if ui_language provided
        if "ui_language" in payload.preferences:
            user.preferred_language = payload.preferences["ui_language"]
    db.commit()
    db.refresh(user)
    return Envelope(message="Profile updated.", data=UserOut.model_validate(user))
