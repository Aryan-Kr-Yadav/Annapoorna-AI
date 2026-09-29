"""
All arithmetic — expense totals, profit, ROI, cost-per-yield-unit,
season comparisons — happens here in plain Python/SQL. Per the project
rule, Groq is never asked to do arithmetic; it may only explain numbers
this module has already computed.
"""
from collections import defaultdict
from typing import Optional
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.crop import CropCycle
from app.models.diagnosis import Diagnosis
from app.models.expense import Expense
from app.models.harvest import Harvest
from app.models.irrigation import IrrigationLog
from app.models.sale import CropSale


def expense_summary(db: Session, crop_cycle_id: UUID) -> dict:
    rows = db.query(Expense.category, func.sum(Expense.amount)).filter(
        Expense.crop_cycle_id == crop_cycle_id
    ).group_by(Expense.category).all()

    breakdown = {category.value: float(total) for category, total in rows}
    total = sum(breakdown.values())
    return {"total": total, "by_category": breakdown}


def profit_summary(db: Session, crop_cycle_id: UUID) -> dict:
    total_expenses = expense_summary(db, crop_cycle_id)["total"]
    harvests = db.query(Harvest).filter(Harvest.crop_cycle_id == crop_cycle_id).all()
    sales = db.query(CropSale).filter(CropSale.crop_cycle_id == crop_cycle_id).all()

    total_sales_revenue = sum(float(s.total_sale_value) for s in sales)
    total_harvest_revenue = sum(float(h.revenue) for h in harvests if h.revenue is not None)

    total_revenue = total_sales_revenue if sales else (total_harvest_revenue if harvests else None)
    total_yield = sum(float(h.yield_quantity) for h in harvests)

    profit = total_revenue - total_expenses if total_revenue is not None else None
    roi = None
    cost_per_unit = None
    if total_expenses > 0:
        if profit is not None:
            roi = round((profit / total_expenses) * 100, 2)
        if total_yield > 0:
            cost_per_unit = round(total_expenses / total_yield, 2)

    return {
        "total_expenses": total_expenses,
        "total_revenue": total_revenue,
        "total_yield": total_yield if harvests else None,
        "profit": profit,
        "roi_percentage": roi,
        "cost_per_unit_yield": cost_per_unit,
    }


def season_report(db: Session, crop_cycle: CropCycle) -> dict:
    expenses = expense_summary(db, crop_cycle.id)
    profit = profit_summary(db, crop_cycle.id)
    irrigation_count = db.query(func.count(IrrigationLog.id)).filter(
        IrrigationLog.crop_cycle_id == crop_cycle.id
    ).scalar()
    health_events = db.query(func.count(Diagnosis.id)).filter(
        Diagnosis.crop_cycle_id == crop_cycle.id
    ).scalar()

    duration_days = None
    end_date = crop_cycle.actual_harvest_date or crop_cycle.expected_harvest_date
    if end_date:
        duration_days = (end_date - crop_cycle.sowing_date).days

    return {
        "crop_cycle": {
            "id": str(crop_cycle.id),
            "crop_name": crop_cycle.crop_name,
            "season": crop_cycle.season.value,
            "year": crop_cycle.year,
            "sowing_date": crop_cycle.sowing_date.isoformat(),
            "status": crop_cycle.status.value,
        },
        "duration_days": duration_days,
        "total_expenses": expenses["total"],
        "expense_breakdown": expenses["by_category"],
        "total_irrigation_events": irrigation_count or 0,
        "health_events": health_events or 0,
        "yield_quantity": profit["total_yield"],
        "revenue": profit["total_revenue"],
        "profit": profit["profit"],
        "roi_percentage": profit["roi_percentage"],
        "cost_per_unit_yield": profit["cost_per_unit_yield"],
    }


def compare_crop_cycles(db: Session, crop_cycles: list[CropCycle]) -> list[dict]:
    return [season_report(db, cc) for cc in crop_cycles]
