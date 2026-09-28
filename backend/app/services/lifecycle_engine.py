"""
Deterministic crop-lifecycle calculation. NO AI is used here — see the
project rule that Groq is never used for arithmetic or stage
calculation. This is pure, testable Python.
"""
from datetime import date
from typing import Optional

from app.data.crop_lifecycles import get_lifecycle_for_crop
from app.schemas.crop import LifecycleOut, LifecycleStage


def calculate_lifecycle(crop_name: str, sowing_date: date, today: Optional[date] = None) -> LifecycleOut:
    today = today or date.today()
    day_number = (today - sowing_date).days

    stage_durations = get_lifecycle_for_crop(crop_name)
    if not stage_durations:
        return LifecycleOut(
            crop_name=crop_name,
            day_number=max(day_number, 0),
            current_stage=None,
            next_stage=None,
            total_estimated_duration_days=None,
            stages=[],
            progress_percentage=None,
            note=(
                f"No lifecycle data is defined yet for '{crop_name}'. "
                "Day count is shown, but stage estimates are unavailable."
            ),
        )

    stages: list[LifecycleStage] = []
    cursor = 0
    current_stage = None
    next_stage = None
    for i, (name, duration) in enumerate(stage_durations):
        start_day = cursor
        end_day = cursor + duration
        stages.append(LifecycleStage(name=name, start_day=start_day, end_day=end_day, is_estimate=True))
        if start_day <= day_number < end_day:
            current_stage = name
            next_stage = stage_durations[i + 1][0] if i + 1 < len(stage_durations) else "Harvest"
        cursor = end_day

    total_duration = cursor
    if day_number >= total_duration:
        current_stage = "Harvest / Post-Maturity"
        next_stage = None
    elif day_number < 0:
        current_stage = "Not yet sown"
        next_stage = stage_durations[0][0]

    progress_percentage = None
    if total_duration > 0:
        progress_percentage = round(min(max(day_number / total_duration, 0), 1) * 100, 1)

    return LifecycleOut(
        crop_name=crop_name,
        day_number=day_number,
        current_stage=current_stage,
        next_stage=next_stage,
        total_estimated_duration_days=total_duration,
        stages=stages,
        progress_percentage=progress_percentage,
        note="Stage boundaries are estimates based on typical growth durations, not a measurement of this specific crop.",
    )
