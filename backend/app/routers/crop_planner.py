from datetime import date, timedelta
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.data.crop_suitability import suggest_crops
from app.models.crop import CropCycle, CropCycleStatus, Season
from app.models.crop_plan import CropPlan, CropPlanStatus
from app.models.farm import Farm
from app.models.user import User
from app.schemas.common import Envelope
from app.schemas.crop import CropCycleOut
from app.schemas.crop_plan import CropPlanConvertRequest, CropPlanOut, CropPlanSaveRequest
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


@router.post("/plans", response_model=Envelope[CropPlanOut])
def save_crop_plan(
    payload: CropPlanSaveRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    farm = get_owned_farm(db, payload.farm_id, user.id)
    plan = CropPlan(
        user_id=user.id,
        farm_id=farm.id,
        crop_name=payload.crop_name,
        variety=payload.variety,
        season=payload.season.lower(),
        year=payload.year,
        reason=payload.reason,
        soil_context=payload.soil_context or farm.soil_type,
        irrigation_context=payload.irrigation_context or farm.irrigation_type.value,
        estimated_duration_days=payload.estimated_duration_days,
        suggested_sowing_window=payload.suggested_sowing_window,
        suggested_harvest_window=payload.suggested_harvest_window,
        plan_details=payload.plan_details,
        status=CropPlanStatus.SAVED,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    res = CropPlanOut.model_validate(plan)
    res.farm_name = farm.name
    return Envelope(message="Crop plan saved successfully.", data=res)


@router.get("/plans", response_model=Envelope[list[CropPlanOut]])
def list_saved_plans(
    farm_id: Optional[UUID] = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    query = db.query(CropPlan, Farm.name.label("farm_name")).join(Farm, CropPlan.farm_id == Farm.id).filter(
        CropPlan.user_id == user.id, CropPlan.status != CropPlanStatus.ARCHIVED
    )
    if farm_id:
        query = query.filter(CropPlan.farm_id == farm_id)

    rows = query.order_by(CropPlan.created_at.desc()).all()
    results = []
    for plan, farm_name in rows:
        out = CropPlanOut.model_validate(plan)
        out.farm_name = farm_name
        results.append(out)
    return Envelope(data=results)


@router.delete("/plans/{plan_id}", response_model=Envelope[None])
def delete_plan(plan_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plan = db.query(CropPlan).filter(CropPlan.id == plan_id, CropPlan.user_id == user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Crop plan not found.")

    db.delete(plan)
    db.commit()
    return Envelope(message="Crop plan deleted.")


@router.post("/plans/{plan_id}/convert", response_model=Envelope[CropCycleOut])
def convert_plan_to_active_crop(
    plan_id: UUID,
    payload: Optional[CropPlanConvertRequest] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = db.query(CropPlan).filter(CropPlan.id == plan_id, CropPlan.user_id == user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Crop plan not found.")

    # Idempotency check: prevent duplicate CropCycle creation on repeated clicks
    if plan.crop_cycle_id:
        existing_crop = db.query(CropCycle).filter(CropCycle.id == plan.crop_cycle_id).first()
        if existing_crop:
            return Envelope(
                message="Plan already converted to an active crop cycle.",
                data=CropCycleOut.model_validate(existing_crop),
            )

    farm = get_owned_farm(db, plan.farm_id, user.id)

    sowing_date = (payload and payload.sowing_date) or date.today()
    duration = plan.estimated_duration_days or 120
    expected_harvest = sowing_date + timedelta(days=duration)

    try:
        season_enum = Season(plan.season.lower())
    except ValueError:
        season_enum = Season.KHARIF

    crop_cycle = CropCycle(
        farm_id=farm.id,
        crop_name=plan.crop_name,
        variety=plan.variety,
        season=season_enum,
        year=plan.year or sowing_date.year,
        area=farm.area,
        sowing_date=sowing_date,
        expected_harvest_date=expected_harvest,
        status=CropCycleStatus.ACTIVE,
    )
    db.add(crop_cycle)
    db.flush()

    plan.status = CropPlanStatus.CONVERTED
    plan.crop_cycle_id = crop_cycle.id

    db.commit()
    db.refresh(crop_cycle)

    return Envelope(
        message=f"Crop plan converted! '{crop_cycle.crop_name}' is now an active crop cycle on {farm.name}.",
        data=CropCycleOut.model_validate(crop_cycle),
    )
