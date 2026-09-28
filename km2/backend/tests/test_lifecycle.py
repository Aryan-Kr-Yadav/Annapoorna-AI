from datetime import date, timedelta

from app.services.lifecycle_engine import calculate_lifecycle


def test_wheat_day_zero_is_germination():
    today = date(2026, 1, 1)
    result = calculate_lifecycle("wheat", sowing_date=today, today=today)
    assert result.day_number == 0
    assert result.current_stage == "Germination"
    assert result.next_stage == "Seedling"


def test_wheat_progress_percentage_increases_over_time():
    sowing = date(2026, 1, 1)
    early = calculate_lifecycle("wheat", sowing, today=sowing + timedelta(days=5))
    later = calculate_lifecycle("wheat", sowing, today=sowing + timedelta(days=50))
    assert early.progress_percentage < later.progress_percentage


def test_unknown_crop_returns_no_stages_but_still_day_count():
    sowing = date(2026, 1, 1)
    result = calculate_lifecycle("dragonfruit", sowing, today=sowing + timedelta(days=10))
    assert result.day_number == 10
    assert result.current_stage is None
    assert result.stages == []
    assert "No lifecycle data" in result.note


def test_day_count_before_sowing_is_negative_and_flagged():
    sowing = date(2026, 6, 1)
    result = calculate_lifecycle("rice", sowing, today=sowing - timedelta(days=3))
    assert result.day_number == -3
    assert result.current_stage == "Not yet sown"


def test_past_full_duration_is_harvest_stage():
    sowing = date(2026, 1, 1)
    result = calculate_lifecycle("wheat", sowing, today=sowing + timedelta(days=200))
    assert result.current_stage == "Harvest / Post-Maturity"
    assert result.next_stage is None
    assert result.progress_percentage == 100
