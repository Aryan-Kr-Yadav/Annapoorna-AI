from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.data.soil_reference_ranges import (
    rate_nitrogen,
    rate_organic_carbon,
    rate_ph,
    rate_phosphorus,
    rate_potassium,
)
from app.models.crop import CropCycle, CropCycleStatus
from app.models.soil import SoilTest
from app.models.user import User
from app.schemas.common import Envelope
from app.schemas.soil import SoilAssessmentOut, SoilParameterAssessment, SoilTestCreate, SoilTestOut
from app.services.ownership import get_owned_crop_cycle, get_owned_farm

router = APIRouter(tags=["soil"])


def _assess(test: SoilTest) -> SoilAssessmentOut:
    assessments = [
        SoilParameterAssessment(parameter="pH", value=test.ph, rating=rate_ph(test.ph)),
        SoilParameterAssessment(parameter="Nitrogen", value=test.nitrogen, rating=rate_nitrogen(test.nitrogen)),
        SoilParameterAssessment(
            parameter="Phosphorus", value=test.phosphorus, rating=rate_phosphorus(test.phosphorus)
        ),
        SoilParameterAssessment(
            parameter="Potassium", value=test.potassium, rating=rate_potassium(test.potassium)
        ),
        SoilParameterAssessment(
            parameter="Organic Carbon", value=test.organic_carbon, rating=rate_organic_carbon(test.organic_carbon)
        ),
    ]
    return SoilAssessmentOut(test=SoilTestOut.model_validate(test), assessments=assessments)


@router.post("/crops/{crop_id}/soil-tests", response_model=Envelope[SoilAssessmentOut])
def create_soil_test(
    crop_id: UUID, payload: SoilTestCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    crop = get_owned_crop_cycle(db, crop_id, user.id)
    test = SoilTest(crop_cycle_id=crop.id, **payload.model_dump())
    db.add(test)
    db.commit()
    db.refresh(test)
    return Envelope(message="Soil test recorded.", data=_assess(test))


@router.get("/crops/{crop_id}/soil-tests", response_model=Envelope[list[SoilAssessmentOut]])
def list_soil_tests(crop_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    crop = get_owned_crop_cycle(db, crop_id, user.id)
    tests = (
        db.query(SoilTest)
        .filter(SoilTest.crop_cycle_id == crop.id)
        .order_by(SoilTest.test_date.desc())
        .all()
    )
    return Envelope(data=[_assess(t) for t in tests])


@router.get("/farms/{farm_id}/soil-tests", response_model=Envelope[list[SoilAssessmentOut]])
def list_farm_soil_tests(farm_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    farm = get_owned_farm(db, farm_id, user.id)
    tests = (
        db.query(SoilTest)
        .join(CropCycle, SoilTest.crop_cycle_id == CropCycle.id)
        .filter(CropCycle.farm_id == farm.id)
        .order_by(SoilTest.test_date.desc())
        .all()
    )
    return Envelope(data=[_assess(t) for t in tests])


@router.post("/farms/{farm_id}/soil-tests", response_model=Envelope[SoilAssessmentOut])
def create_farm_soil_test(
    farm_id: UUID, payload: SoilTestCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    from datetime import date
    farm = get_owned_farm(db, farm_id, user.id)
    crop = (
        db.query(CropCycle)
        .filter(CropCycle.farm_id == farm.id, CropCycle.status == CropCycleStatus.ACTIVE)
        .first()
    )
    if not crop:
        crop = db.query(CropCycle).filter(CropCycle.farm_id == farm.id).first()
    if not crop:
        # Create an initial crop cycle for general field tracking
        from app.models.crop import Season
        crop = CropCycle(
            farm_id=farm.id,
            crop_name="General Farm Field",
            season=Season.KHARIF,
            year=date.today().year,
            sowing_date=date.today(),
            status=CropCycleStatus.ACTIVE,
        )
        db.add(crop)
        db.commit()
        db.refresh(crop)

    test = SoilTest(crop_cycle_id=crop.id, **payload.model_dump())
    db.add(test)
    db.commit()
    db.refresh(test)
    return Envelope(message="Farm soil test recorded.", data=_assess(test))


@router.delete("/soil-tests/{test_id}", response_model=Envelope[None])
def delete_soil_test(test_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    test = db.query(SoilTest).filter(SoilTest.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Soil test not found.")
    get_owned_crop_cycle(db, test.crop_cycle_id, user.id)
    db.delete(test)
    db.commit()
    return Envelope(message="Soil test deleted.")
