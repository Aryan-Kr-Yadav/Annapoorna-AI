from uuid import UUID

from fastapi import APIRouter, Depends
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
from app.models.soil import SoilTest
from app.models.user import User
from app.schemas.common import Envelope
from app.schemas.soil import SoilAssessmentOut, SoilParameterAssessment, SoilTestCreate, SoilTestOut
from app.services.ownership import get_owned_crop_cycle

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
