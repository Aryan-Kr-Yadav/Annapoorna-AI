"""
Single aggregation endpoint the dashboard page calls once, rather than
the frontend firing off a dozen separate requests. Every value here is
computed from real data, and any external dependency (weather) that
fails degrades gracefully instead of breaking the whole response.
"""
from datetime import date, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.crop import CropCycle, CropCycleStatus
from app.models.crop_plan import CropPlan, CropPlanStatus
from app.models.farm import Farm
from app.models.harvest import Harvest
from app.models.irrigation import IrrigationLog
from app.models.sale import CropSale
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
from app.services.weather_service import compute_weather_intelligence, get_current_and_forecast

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/{farm_id}", response_model=Envelope[dict])
async def get_dashboard(
    farm_id: UUID,
    crop_cycle_id: UUID | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from typing import Optional
    from app.models.diagnosis import Diagnosis

    farm = get_owned_farm(db, farm_id, user.id)

    # All active crops for this farm
    active_crops_query = (
        db.query(CropCycle)
        .filter(CropCycle.farm_id == farm.id, CropCycle.status == CropCycleStatus.ACTIVE)
        .order_by(CropCycle.sowing_date.desc())
        .all()
    )

    # Determine which crop is selected
    active_crop = None
    if crop_cycle_id:
        active_crop = (
            db.query(CropCycle)
            .filter(CropCycle.id == crop_cycle_id, CropCycle.farm_id == farm.id)
            .first()
        )
    if not active_crop and active_crops_query:
        active_crop = active_crops_query[0]

    all_active_crops = []
    for c in active_crops_query:
        lc = calculate_lifecycle(c.crop_name, c.sowing_date)
        all_active_crops.append({
            "crop_cycle_id": str(c.id),
            "crop_name": c.crop_name,
            "season": f"{c.season.value} {c.year}",
            "day_number": lc.day_number,
            "current_stage": lc.current_stage,
            "progress_percentage": lc.progress_percentage,
            "is_selected": (str(c.id) == str(active_crop.id)) if active_crop else False,
        })

    weather = await get_current_and_forecast(farm.latitude, farm.longitude, farm.district, farm.state)
    weather_intel = compute_weather_intelligence(weather) if weather and weather.get("available") else None

    # Unsold harvests check across farm crops
    farm_crops = db.query(CropCycle).filter(CropCycle.farm_id == farm.id).all()
    unsold_harvests = []
    for c in farm_crops:
        harvests = db.query(Harvest).filter(Harvest.crop_cycle_id == c.id).all()
        sales = db.query(CropSale).filter(CropSale.crop_cycle_id == c.id).all()
        total_harvested = sum(float(h.yield_quantity) for h in harvests)
        total_sold = sum(float(s.quantity_sold) for s in sales)
        remaining = max(0.0, total_harvested - total_sold)
        if remaining > 0:
            unsold_harvests.append({
                "crop_cycle_id": str(c.id),
                "crop_name": c.crop_name,
                "remaining_quantity": round(remaining, 2),
                "unit": harvests[0].yield_unit if harvests else "units",
            })

    # Saved crop plans count
    saved_plans_count = db.query(CropPlan).filter(
        CropPlan.farm_id == farm.id,
        CropPlan.status == CropPlanStatus.SAVED
    ).count()

    result: dict = {
        "farm": {"id": str(farm.id), "name": farm.name},
        "weather": weather,
        "weather_intelligence": weather_intel,
        "active_crop": None,
        "all_active_crops": all_active_crops,
        "recent_inspections": [],
        "todays_tasks": [],
        "irrigation": None,
        "expenses": None,
        "alerts": [],
        "unsold_harvests": unsold_harvests,
        "saved_plans_count": saved_plans_count,
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
        result["todays_tasks"] = [
            {
                "id": str(t.id),
                "title": t.title,
                "task_type": t.task_type.value if hasattr(t.task_type, "value") else str(t.task_type),
                "is_completed": (t.status.value if hasattr(t.status, "value") else str(t.status)) == "completed",
            }
            for t in todays_tasks
        ]

        last_irrigation = (
            db.query(IrrigationLog)
            .filter(IrrigationLog.crop_cycle_id == active_crop.id)
            .order_by(IrrigationLog.date.desc())
            .first()
        )
        result["irrigation"] = next_irrigation_estimate(last_irrigation.date if last_irrigation else None)
        result["expenses"] = expense_summary(db, active_crop.id)

        # Recent crop inspections for active crop
        inspections = (
            db.query(Diagnosis)
            .filter(Diagnosis.crop_cycle_id == active_crop.id)
            .order_by(Diagnosis.created_at.desc())
            .limit(3)
            .all()
        )
        result["recent_inspections"] = [
            {
                "id": str(d.id),
                "date": d.created_at.date().isoformat(),
                "possible_condition": d.possible_condition or "Healthy / No issue observed",
                "severity": d.severity.value,
                "confidence": d.confidence_percentage,
            }
            for d in inspections
        ]

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


class DailyBriefingOutput(BaseModel):
    greeting: str = Field(description="Warm farmer greeting")
    headline: str = Field(description="One-sentence daily summary headline")
    action_items: list[str] = Field(default_factory=list, description="Immediate action items for today")
    weather_summary: str = Field(description="Practical weather summary")
    crop_advisory: str = Field(description="Stage-specific crop advisory")


@router.get("/{farm_id}/briefing", response_model=Envelope[dict])
async def get_daily_briefing(
    farm_id: UUID,
    crop_cycle_id: UUID | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.ai.service import ai_service
    from app.models.diagnosis import Diagnosis

    farm = get_owned_farm(db, farm_id, user.id)

    # Resolve active crop
    active_crop = None
    if crop_cycle_id:
        active_crop = (
            db.query(CropCycle)
            .filter(CropCycle.id == crop_cycle_id, CropCycle.farm_id == farm.id)
            .first()
        )
    if not active_crop:
        active_crop = (
            db.query(CropCycle)
            .filter(CropCycle.farm_id == farm.id, CropCycle.status == CropCycleStatus.ACTIVE)
            .order_by(CropCycle.sowing_date.desc())
            .first()
        )

    # 1. Deterministic inputs
    weather = await get_current_and_forecast(farm.latitude, farm.longitude, farm.district, farm.state)
    weather_desc = "Weather forecast unavailable"
    if weather and weather.get("available") and weather.get("current"):
        cur = weather["current"]
        weather_desc = f"{cur.get('temperature_c', '')}°C, {cur.get('weather_condition', 'Clear')}, Rain prob: {cur.get('rain_probability', 0)}%"

    tasks_today = []
    crop_info = "No active crop recorded"
    last_irr_desc = "None recorded"
    alerts_list = []

    if active_crop:
        lc = calculate_lifecycle(active_crop.crop_name, active_crop.sowing_date)
        crop_info = f"{active_crop.crop_name} (Stage: {lc.current_stage}, Day {lc.day_number})"

        pending_tasks = (
            db.query(CropTask)
            .filter(
                CropTask.crop_cycle_id == active_crop.id,
                CropTask.scheduled_date == date.today(),
                CropTask.status == TaskStatus.PENDING,
            )
            .all()
        )
        tasks_today = [t.title for t in pending_tasks]

        last_irr = (
            db.query(IrrigationLog)
            .filter(IrrigationLog.crop_cycle_id == active_crop.id)
            .order_by(IrrigationLog.date.desc())
            .first()
        )
        if last_irr:
            last_irr_desc = f"Last irrigated on {last_irr.date.isoformat()} via {last_irr.method.value}"

        if weather.get("available"):
            tomorrow_date = date.today() + timedelta(days=1)
            has_irr_tmrw = (
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
            alerts_list = [
                a.get("message", "")
                for a in generate_farm_weather_alerts(
                    weather=weather,
                    last_irrigation_date=last_irr.date if last_irr else None,
                    has_scheduled_irrigation_tomorrow=has_irr_tmrw,
                )
            ]

    user_name = user.full_name or "Farmer"
    lang = (user.preferences or {}).get("assistant_language", "auto")

    # 2. One structured call to GPT-OSS 120B to turn facts into warm, farmer-friendly wording
    prompt = (
        f"You are Annapoorna AI generating the Daily Farm Briefing.\n\n"
        f"FACTS:\n"
        f"- Farmer: {user_name}\n"
        f"- Farm: {farm.name} ({farm.district}, {farm.state})\n"
        f"- Active Crop: {crop_info}\n"
        f"- Weather Today: {weather_desc}\n"
        f"- Tasks Scheduled for Today: {', '.join(tasks_today) if tasks_today else 'No pending tasks scheduled'}\n"
        f"- Irrigation Status: {last_irr_desc}\n"
        f"- Advisory Alerts: {'; '.join(alerts_list) if alerts_list else 'None'}\n\n"
        f"Language requirement: Respond in {lang if lang != 'auto' else 'English'}.\n"
        f"Synthesize these facts into a concise, encouraging, and structured morning briefing. "
        f"Respond strictly in JSON matching the DailyBriefingOutput schema."
    )

    try:
        briefing = await ai_service.generate_structured(
            schema=DailyBriefingOutput,
            prompt=prompt,
            reasoning_effort="low",
        )
        return Envelope(data=briefing.model_dump())
    except Exception as exc:
        logger.warning("AI briefing generation failed, using deterministic fallback: %s", exc)
        fallback = DailyBriefingOutput(
            greeting=f"Good morning, {user_name}!",
            headline=f"Daily overview for {farm.name}.",
            action_items=tasks_today or ["Review farm and crop health status today."],
            weather_summary=weather_desc,
            crop_advisory=f"Keep monitoring {crop_info}." if active_crop else "Add a crop cycle to receive stage-specific advisories.",
        )
        return Envelope(data=fallback.model_dump())

