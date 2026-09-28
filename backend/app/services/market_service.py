"""
MarketService abstraction: reliable market/mandi price data, normalized
and cached in `cached_market_prices`. Never fabricates prices, and
always surfaces the true `fetched_at` timestamp so the frontend can be
honest about how fresh the data is instead of implying it's live.

Default provider target: data.gov.in's Agmarknet mandi price API. Not
wired to a live key by default — MARKET_DATA_API_KEY must be set.
"""
from datetime import date, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.market import CachedMarketPrice

settings = get_settings()


def get_cached_prices(
    db: Session, crop: str, state: str, district: Optional[str] = None, days: int = 30
) -> dict:
    since = date.today() - timedelta(days=days)
    query = db.query(CachedMarketPrice).filter(
        CachedMarketPrice.crop.ilike(crop),
        CachedMarketPrice.state.ilike(state),
        CachedMarketPrice.price_date >= since,
    )
    if district:
        query = query.filter(CachedMarketPrice.district.ilike(district))

    rows = query.order_by(CachedMarketPrice.price_date.asc()).all()

    if not rows:
        return {
            "data_available": False,
            "message": (
                "No cached market price data is available yet for this crop/location. "
                "Configure MARKET_DATA_API_KEY and run the price-sync job to populate this."
            ),
            "points": [],
        }

    return {"data_available": True, "message": None, "points": rows}
