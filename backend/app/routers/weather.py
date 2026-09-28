from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.common import Envelope
from app.services.ownership import get_owned_farm
from app.services.weather_service import get_current_and_forecast, weather_service

router = APIRouter(tags=["weather"])


@router.get("/weather")
async def get_weather(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
):
    """Direct coordinates weather lookup using Open-Meteo."""
    try:
        return await weather_service.get_weather(latitude, longitude)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.get("/farms/{farm_id}/weather", response_model=Envelope[dict])
async def get_farm_weather(
    farm_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Farm-specific weather lookup using farm GPS or geocoding."""
    farm = get_owned_farm(db, farm_id, user.id)
    result = await get_current_and_forecast(farm.latitude, farm.longitude, farm.district, farm.state)
    return Envelope(data=result)
