"""
Centralized ownership-verification helpers. Every router and every AI
tool function MUST go through these instead of querying farms/crop
cycles directly by ID — this is the one place that decides whether a
given user is allowed to touch a given row, so it only has to be
correct once.
"""
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.crop import CropCycle
from app.models.farm import Farm


def get_owned_farm(db: Session, farm_id: UUID, user_id: UUID) -> Farm:
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == user_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found.")
    return farm


def get_owned_crop_cycle(db: Session, crop_cycle_id: UUID, user_id: UUID) -> CropCycle:
    crop_cycle = (
        db.query(CropCycle)
        .join(Farm, CropCycle.farm_id == Farm.id)
        .filter(CropCycle.id == crop_cycle_id, Farm.user_id == user_id)
        .first()
    )
    if not crop_cycle:
        raise HTTPException(status_code=404, detail="Crop cycle not found.")
    return crop_cycle
