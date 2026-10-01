from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.task import CropTask, TaskStatus
from app.models.user import User
from app.schemas.common import Envelope
from app.schemas.task import CropTaskCreate, CropTaskOut, CropTaskUpdate
from app.services.ownership import get_owned_crop_cycle

router = APIRouter(tags=["tasks"])


@router.post("/crops/{crop_id}/tasks", response_model=Envelope[CropTaskOut])
def create_task(
    crop_id: UUID, payload: CropTaskCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    crop = get_owned_crop_cycle(db, crop_id, user.id)
    task = CropTask(crop_cycle_id=crop.id, **payload.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return Envelope(message="Task created.", data=CropTaskOut.model_validate(task))


@router.get("/crops/{crop_id}/tasks", response_model=Envelope[list[CropTaskOut]])
def list_tasks(
    crop_id: UUID,
    status: Optional[TaskStatus] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    crop = get_owned_crop_cycle(db, crop_id, user.id)
    query = db.query(CropTask).filter(CropTask.crop_cycle_id == crop.id)
    if status:
        query = query.filter(CropTask.status == status)
    if from_date:
        query = query.filter(CropTask.scheduled_date >= from_date)
    if to_date:
        query = query.filter(CropTask.scheduled_date <= to_date)
    tasks = query.order_by(CropTask.scheduled_date.asc()).all()
    return Envelope(data=[CropTaskOut.model_validate(t) for t in tasks])


@router.get("/farms/{farm_id}/tasks", response_model=Envelope[list[CropTaskOut]])
def list_farm_tasks(
    farm_id: UUID,
    status: Optional[TaskStatus] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.models.crop import CropCycle
    from app.services.ownership import get_owned_farm

    farm = get_owned_farm(db, farm_id, user.id)
    query = (
        db.query(CropTask)
        .join(CropCycle, CropTask.crop_cycle_id == CropCycle.id)
        .filter(CropCycle.farm_id == farm.id)
    )
    if status:
        query = query.filter(CropTask.status == status)
    tasks = query.order_by(CropTask.scheduled_date.asc()).all()
    return Envelope(data=[CropTaskOut.model_validate(t) for t in tasks])


@router.put("/tasks/{task_id}", response_model=Envelope[CropTaskOut])
def update_task(
    task_id: UUID, payload: CropTaskUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    from datetime import datetime, timezone

    task = (
        db.query(CropTask)
        .join(CropTask.crop_cycle)
        .filter(CropTask.id == task_id)
        .first()
    )
    if not task:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Task not found.")
    # ownership check via the parent crop cycle
    get_owned_crop_cycle(db, task.crop_cycle_id, user.id)

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(task, field, value)
    if updates.get("status") == TaskStatus.COMPLETED:
        task.completed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(task)
    return Envelope(message="Task updated.", data=CropTaskOut.model_validate(task))


@router.delete("/tasks/{task_id}", response_model=Envelope[None])
def delete_task(task_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from fastapi import HTTPException

    task = db.query(CropTask).filter(CropTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    get_owned_crop_cycle(db, task.crop_cycle_id, user.id)
    db.delete(task)
    db.commit()
    return Envelope(message="Task deleted.")
