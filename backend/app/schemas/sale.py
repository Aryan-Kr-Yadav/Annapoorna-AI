from datetime import date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import IDTimestamped


class CropSaleCreate(BaseModel):
    sale_date: date
    quantity_sold: float = Field(gt=0)
    quantity_unit: str = "quintal"
    price_per_unit: float = Field(gt=0)
    buyer_name: Optional[str] = None
    notes: Optional[str] = None


class CropSaleOut(IDTimestamped):
    crop_cycle_id: UUID
    sale_date: date
    quantity_sold: float
    quantity_unit: str
    price_per_unit: float
    total_sale_value: float
    buyer_name: Optional[str] = None
    notes: Optional[str] = None


class CropSaleSummaryOut(BaseModel):
    total_harvested_quantity: float
    total_quantity_sold: float
    remaining_quantity: float
    quantity_unit: str
    total_revenue: float
    sales: list[CropSaleOut]
