from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.models.task import TaskPriority, TaskStatus, TaskType
from app.schemas.common import IDTimestamped


class CropTaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    task_type: TaskType
    scheduled_date: date
    priority: TaskPriority = TaskPriority.MEDIUM


class CropTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    task_type: Optional[TaskType] = None
    scheduled_date: Optional[date] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None


class CropTaskOut(IDTimestamped):
    crop_cycle_id: UUID
    title: str
    description: Optional[str]
    task_type: TaskType
    scheduled_date: date
    status: TaskStatus
    completed_at: Optional[datetime]
    priority: TaskPriority
    auto_generated: bool
