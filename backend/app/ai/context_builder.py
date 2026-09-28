"""
Builds the minimal, relevant farm/crop context to prepend to a chat
turn. Deliberately does NOT dump every table for the user — only the
active farm/crop's headline facts, so token usage stays bounded and
Groq isn't drowned in irrelevant data.
"""
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.crop import CropCycle
from app.models.farm import Farm
from app.models.user import User
from app.services.lifecycle_engine import calculate_lifecycle


def build_farm_crop_context(db: Session, user: User, farm_id: Optional[UUID], crop_cycle_id: Optional[UUID]) -> dict:
    context: dict = {"farmer_preferred_language": user.preferred_language}

    farm = None
    if farm_id:
        farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == user.id).first()
    if farm:
        context["farm_name"] = farm.name
        context["farm_location"] = f"{farm.district}, {farm.state}"
        context["farm_area"] = f"{farm.area} {farm.area_unit.value}"
        context["soil_type"] = farm.soil_type
        context["irrigation_type"] = farm.irrigation_type.value

    crop = None
    if crop_cycle_id:
        crop = (
            db.query(CropCycle)
            .join(Farm, CropCycle.farm_id == Farm.id)
            .filter(CropCycle.id == crop_cycle_id, Farm.user_id == user.id)
            .first()
        )
    if crop:
        lifecycle = calculate_lifecycle(crop.crop_name, crop.sowing_date)
        context["active_crop"] = f"{crop.crop_name} ({crop.variety or 'variety not specified'})"
        context["season"] = f"{crop.season.value} {crop.year}"
        context["day_after_sowing"] = lifecycle.day_number
        context["current_growth_stage"] = lifecycle.current_stage

    return context
