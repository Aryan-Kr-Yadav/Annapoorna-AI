from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.crop import CropCycleStatus
from app.models.harvest import Harvest
from app.models.sale import CropSale
from app.models.user import User
from app.schemas.common import Envelope
from app.schemas.harvest import HarvestCreate, HarvestOut, SeasonReportOut
from app.schemas.sale import CropSaleCreate, CropSaleOut, CropSaleSummaryOut
from app.services.analytics_service import season_report
from app.services.ownership import get_owned_crop_cycle

router = APIRouter(tags=["harvests"])


@router.post("/crops/{crop_id}/harvests", response_model=Envelope[HarvestOut])
def create_harvest(
    crop_id: UUID, payload: HarvestCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    crop = get_owned_crop_cycle(db, crop_id, user.id)
    data = payload.model_dump()
    revenue = None
    if data.get("selling_price_per_unit") is not None:
        revenue = float(data["selling_price_per_unit"]) * float(data["yield_quantity"])

    harvest = Harvest(crop_cycle_id=crop.id, revenue=revenue, **data)
    db.add(harvest)

    # Marking the crop cycle harvested is a meaningful lifecycle event
    crop.status = CropCycleStatus.HARVESTED
    crop.actual_harvest_date = payload.harvest_date

    db.commit()
    db.refresh(harvest)
    return Envelope(message="Harvest recorded.", data=HarvestOut.model_validate(harvest))


@router.get("/crops/{crop_id}/harvests", response_model=Envelope[list[HarvestOut]])
def list_harvests(crop_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    crop = get_owned_crop_cycle(db, crop_id, user.id)
    harvests = (
        db.query(Harvest)
        .filter(Harvest.crop_cycle_id == crop.id)
        .order_by(Harvest.harvest_date.desc())
        .all()
    )
    return Envelope(data=[HarvestOut.model_validate(h) for h in harvests])


@router.post("/crops/{crop_id}/sales", response_model=Envelope[CropSaleOut])
def record_crop_sale(
    crop_id: UUID,
    payload: CropSaleCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    crop = get_owned_crop_cycle(db, crop_id, user.id)

    # Calculate harvested quantity vs already sold quantity
    harvests = db.query(Harvest).filter(Harvest.crop_cycle_id == crop.id).all()
    existing_sales = db.query(CropSale).filter(CropSale.crop_cycle_id == crop.id).all()

    total_harvested = sum(float(h.yield_quantity) for h in harvests)
    already_sold = sum(float(s.quantity_sold) for s in existing_sales)
    remaining = max(0.0, total_harvested - already_sold)

    if total_harvested > 0 and payload.quantity_sold > (remaining + 0.01):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot sell {payload.quantity_sold} {payload.quantity_unit}. Maximum available remaining harvested produce is {remaining:.2f} {payload.quantity_unit}."
        )

    total_sale_value = round(float(payload.quantity_sold) * float(payload.price_per_unit), 2)

    sale = CropSale(
        crop_cycle_id=crop.id,
        sale_date=payload.sale_date,
        quantity_sold=payload.quantity_sold,
        quantity_unit=payload.quantity_unit,
        price_per_unit=payload.price_per_unit,
        total_sale_value=total_sale_value,
        buyer_name=payload.buyer_name,
        notes=payload.notes,
    )
    db.add(sale)

    # Update crop status: if all harvested produce is sold, mark SOLD; else remain HARVESTED
    if total_harvested > 0 and (remaining - float(payload.quantity_sold)) <= 0.01:
        crop.status = CropCycleStatus.SOLD
    else:
        crop.status = CropCycleStatus.HARVESTED

    db.commit()
    db.refresh(sale)

    return Envelope(message="Crop sale recorded successfully.", data=CropSaleOut.model_validate(sale))


@router.get("/crops/{crop_id}/sales", response_model=Envelope[CropSaleSummaryOut])
def get_crop_sales_summary(
    crop_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    crop = get_owned_crop_cycle(db, crop_id, user.id)
    harvests = db.query(Harvest).filter(Harvest.crop_cycle_id == crop.id).all()
    sales = db.query(CropSale).filter(CropSale.crop_cycle_id == crop.id).order_by(CropSale.sale_date.desc()).all()

    total_harvested = sum(float(h.yield_quantity) for h in harvests)
    total_sold = sum(float(s.quantity_sold) for s in sales)
    unit = sales[0].quantity_unit if sales else (harvests[0].yield_unit if harvests else "quintal")
    total_revenue = sum(float(s.total_sale_value) for s in sales)
    remaining = max(0.0, total_harvested - total_sold)

    summary = CropSaleSummaryOut(
        total_harvested_quantity=total_harvested,
        total_quantity_sold=total_sold,
        remaining_quantity=remaining,
        quantity_unit=unit,
        total_revenue=total_revenue,
        sales=[CropSaleOut.model_validate(s) for s in sales],
    )
    return Envelope(data=summary)


@router.delete("/crops/{crop_id}/harvests/{harvest_id}", response_model=Envelope[None])
def delete_harvest(
    crop_id: UUID, harvest_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    crop = get_owned_crop_cycle(db, crop_id, user.id)
    harvest = db.query(Harvest).filter(Harvest.id == harvest_id, Harvest.crop_cycle_id == crop.id).first()
    if not harvest:
        raise HTTPException(status_code=404, detail="Harvest record not found.")
    db.delete(harvest)
    remaining_harvests = db.query(Harvest).filter(Harvest.crop_cycle_id == crop.id, Harvest.id != harvest_id).count()
    if remaining_harvests == 0:
        crop.status = CropCycleStatus.ACTIVE
        crop.actual_harvest_date = None
    db.commit()
    return Envelope(message="Harvest record deleted.")


@router.delete("/crops/{crop_id}/sales/{sale_id}", response_model=Envelope[None])
def delete_crop_sale(
    crop_id: UUID, sale_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    crop = get_owned_crop_cycle(db, crop_id, user.id)
    sale = db.query(CropSale).filter(CropSale.id == sale_id, CropSale.crop_cycle_id == crop.id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Crop sale record not found.")
    db.delete(sale)
    remaining_harvests = db.query(Harvest).filter(Harvest.crop_cycle_id == crop.id).count()
    if remaining_harvests > 0:
        crop.status = CropCycleStatus.HARVESTED
    db.commit()
    return Envelope(message="Crop sale record deleted.")


@router.get("/crops/{crop_id}/season-report", response_model=Envelope[SeasonReportOut])
def get_season_report(crop_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    crop = get_owned_crop_cycle(db, crop_id, user.id)
    report = season_report(db, crop)
    return Envelope(data=report)
