"""
Single aggregation endpoint the dashboard page calls once, rather than
the frontend firing off a dozen separate requests. Every value here is
computed from real data, and any external dependency (weather) that
fails degrades gracefully instead of breaking the whole response.
"""
from datetime import date, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.crop import CropCycle, CropCycleStatus
from app.models.farm import Farm
from app.models.irrigation import IrrigationLog
from app.models.task import CropTask, TaskStatus, TaskType
from app.models.user import User
from app.schemas.common import Envelope
from app.services.advisory_service import (
    build_irrigation_alert,
    generate_farm_weather_alerts,
    next_irrigation_estimate,
)
from app.services.analytics_service import expense_summary
from app.services.lifecycle_engine import calculate_lifecycle
from app.services.ownership import get_owned_farm
from app.services.weather_service import get_current_and_forecast

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/{farm_id}", response_model=Envelope[dict])
async def get_dashboard(farm_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    farm = get_owned_farm(db, farm_id, user.id)

    active_crop = (
        db.query(CropCycle)
        .filter(CropCycle.farm_id == farm.id, CropCycle.status == CropCycleStatus.ACTIVE)
        .order_by(CropCycle.sowing_date.desc())
        .first()
    )

    weather = await get_current_and_forecast(farm.latitude, farm.longitude, farm.district, farm.state)

    result: dict = {
        "farm": {"id": str(farm.id), "name": farm.name},
        "weather": weather,
        "active_crop": None,
        "todays_tasks": [],
        "irrigation": None,
        "expenses": None,
        "alerts": [],
    }

    if active_crop:
        lifecycle = calculate_lifecycle(active_crop.crop_name, active_crop.sowing_date)
        result["active_crop"] = {
            "crop_cycle_id": str(active_crop.id),
            "crop_name": active_crop.crop_name,
            "season": f"{active_crop.season.value} {active_crop.year}",
            "day_number": lifecycle.day_number,
            "current_stage": lifecycle.current_stage,
            "progress_percentage": lifecycle.progress_percentage,
        }

        todays_tasks = (
            db.query(CropTask)
            .filter(
                CropTask.crop_cycle_id == active_crop.id,
                CropTask.scheduled_date == date.today(),
                CropTask.status == TaskStatus.PENDING,
            )
            .all()
        )
        result["todays_tasks"] = [{"id": str(t.id), "title": t.title, "task_type": t.task_type.value} for t in todays_tasks]

        last_irrigation = (
            db.query(IrrigationLog)
            .filter(IrrigationLog.crop_cycle_id == active_crop.id)
            .order_by(IrrigationLog.date.desc())
            .first()
        )
        result["irrigation"] = next_irrigation_estimate(last_irrigation.date if last_irrigation else None)
        result["expenses"] = expense_summary(db, active_crop.id)

        if weather.get("available"):
            tomorrow_date = date.today() + timedelta(days=1)
            has_irrigation_tomorrow = (
                db.query(CropTask)
                .filter(
                    CropTask.crop_cycle_id == active_crop.id,
                    CropTask.scheduled_date == tomorrow_date,
                    CropTask.task_type == TaskType.IRRIGATION,
                    CropTask.status == TaskStatus.PENDING,
                )
                .first()
                is not None
            )

            alerts = generate_farm_weather_alerts(
                weather=weather,
                last_irrigation_date=last_irrigation.date if last_irrigation else None,
                has_scheduled_irrigation_tomorrow=has_irrigation_tomorrow,
            )
            result["alerts"].extend(alerts)

    return Envelope(data=result)
