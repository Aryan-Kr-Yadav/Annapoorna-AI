from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.expense import Expense
from app.models.user import User
from app.schemas.common import Envelope
from app.schemas.expense import ExpenseCreate, ExpenseOut, ExpenseUpdate
from app.services.ownership import get_owned_crop_cycle

router = APIRouter(tags=["expenses"])


@router.post("/crops/{crop_id}/expenses", response_model=Envelope[ExpenseOut])
def create_expense(
    crop_id: UUID, payload: ExpenseCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    crop = get_owned_crop_cycle(db, crop_id, user.id)
    expense = Expense(crop_cycle_id=crop.id, **payload.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return Envelope(message="Expense added.", data=ExpenseOut.model_validate(expense))


@router.get("/crops/{crop_id}/expenses", response_model=Envelope[list[ExpenseOut]])
def list_expenses(
    crop_id: UUID,
    category: str | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    crop = get_owned_crop_cycle(db, crop_id, user.id)
    query = db.query(Expense).filter(Expense.crop_cycle_id == crop.id)
    if category:
        query = query.filter(Expense.category == category)
    expenses = query.order_by(Expense.date.desc()).all()
    return Envelope(data=[ExpenseOut.model_validate(e) for e in expenses])


@router.put("/expenses/{expense_id}", response_model=Envelope[ExpenseOut])
@router.patch("/expenses/{expense_id}", response_model=Envelope[ExpenseOut])
def update_expense(
    expense_id: UUID, payload: ExpenseUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found.")
    get_owned_crop_cycle(db, expense.crop_cycle_id, user.id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(expense, field, value)
    db.commit()
    db.refresh(expense)
    return Envelope(message="Expense updated.", data=ExpenseOut.model_validate(expense))


@router.delete("/expenses/{expense_id}", response_model=Envelope[None])
def delete_expense(expense_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found.")
    get_owned_crop_cycle(db, expense.crop_cycle_id, user.id)
    db.delete(expense)
    db.commit()
    return Envelope(message="Expense deleted.")
