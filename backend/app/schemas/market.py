from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class MarketPriceOut(BaseModel):
    crop: str
    state: str
    district: Optional[str]
    market_name: Optional[str]
    price_date: date
    min_price: Optional[float]
    max_price: Optional[float]
    modal_price: Optional[float]
    unit: str
    fetched_at: datetime


class MarketTrendOut(BaseModel):
    crop: str
    state: str
    points: list[MarketPriceOut]
    data_available: bool
    message: Optional[str] = None
