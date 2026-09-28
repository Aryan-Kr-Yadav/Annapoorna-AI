from datetime import date, timedelta

from app.services.advisory_service import build_irrigation_alert, next_irrigation_estimate


def test_no_alert_when_no_irrigation_history():
    alert = build_irrigation_alert(rain_probability_tomorrow=80, last_irrigation_date=None)
    assert alert is None


def test_alert_when_rain_expected_and_irrigation_approaching():
    today = date(2026, 6, 15)
    last_irrigation = today - timedelta(days=6)  # 6 days into a 7-day typical interval
    alert = build_irrigation_alert(
        rain_probability_tomorrow=75, last_irrigation_date=last_irrigation, today=today
    )
    assert alert is not None
    assert alert["type"] == "irrigation"
    assert "Rain is expected" in alert["message"]


def test_no_alert_when_rain_unlikely():
    today = date(2026, 6, 15)
    last_irrigation = today - timedelta(days=6)
    alert = build_irrigation_alert(rain_probability_tomorrow=10, last_irrigation_date=last_irrigation, today=today)
    # Not high rain probability, and not yet at/over the full interval — no alert.
    assert alert is None


def test_next_irrigation_estimate_with_no_history():
    result = next_irrigation_estimate(last_irrigation_date=None)
    assert result["days_until_next"] is None


def test_next_irrigation_estimate_computes_future_date():
    today = date(2026, 6, 15)
    last = today - timedelta(days=3)
    result = next_irrigation_estimate(last_irrigation_date=last, typical_irrigation_interval_days=7, today=today)
    assert result["days_until_next"] == 4
