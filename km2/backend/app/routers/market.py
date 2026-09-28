from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.common import Envelope
from app.schemas.market import MarketTrendOut
from app.services.market_service import get_cached_prices

router = APIRouter(prefix="/market", tags=["market"])


@router.get("/prices", response_model=Envelope[MarketTrendOut])
def get_market_prices(
    crop: str,
    state: str,
    district: str | None = None,
    days: int = 30,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = get_cached_prices(db, crop, state, district, days)
    return Envelope(
        data=MarketTrendOut(
            crop=crop,
            state=state,
            points=result["points"],
            data_available=result["data_available"],
            message=result["message"],
        )
    )
