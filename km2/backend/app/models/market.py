from datetime import date, datetime
from typing import Optional

from sqlalchemy import Date, DateTime, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPKMixin


class CachedMarketPrice(Base, UUIDPKMixin, TimestampMixin):
    """
    Cached snapshot of mandi/market prices from an upstream provider
    (e.g. Agmarknet / data.gov.in). We cache rather than call the
    upstream provider on every request, and we always show the
    `fetched_at` timestamp to the user — never claim this is live.
    """

    __tablename__ = "cached_market_prices"

    crop: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    state: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    district: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    market_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    price_date: Mapped[date] = mapped_column(Date, nullable=False)
    min_price: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    max_price: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    modal_price: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    unit: Mapped[str] = mapped_column(String(30), default="per quintal")
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
