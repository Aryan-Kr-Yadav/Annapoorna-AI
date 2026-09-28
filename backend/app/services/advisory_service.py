"""
FarmAdvisoryService: deterministic rule-based alerts combining weather,
crop stage, soil and irrigation history.

Pipeline:
Open-Meteo Weather (Temperature, Humidity, Rain Probability, Precipitation, Wind)
  ↓
KrishiMitra Rules Engine
  ↓
Structured Alerts & Advisory:
- "Irrigation is scheduled tomorrow, but rain is likely. Consider delaying it."
- High wind spray drift warning
- Heat stress & evapotranspiration alerts
- Fungal disease risks from high humidity
"""
from datetime import date, timedelta
from typing import Optional


def build_irrigation_alert(
    rain_probability_tomorrow: Optional[float],
    last_irrigation_date: Optional[date],
    typical_irrigation_interval_days: int = 7,
    today: Optional[date] = None,
) -> Optional[dict]:
    today = today or date.today()

    days_since_irrigation = (today - last_irrigation_date).days if last_irrigation_date else None
    irrigation_approaching = (
        days_since_irrigation is not None
        and days_since_irrigation >= typical_irrigation_interval_days - 2
    )

    if rain_probability_tomorrow is not None and rain_probability_tomorrow >= 60 and irrigation_approaching:
        return {
            "type": "irrigation",
            "priority": "important",
            "title": "Rain expected before your next irrigation",
            "message": (
                f"Irrigation is scheduled tomorrow, but rain is likely ({rain_probability_tomorrow:.0f}% chance). "
                "Rain is expected — consider delaying it to conserve water and prevent waterlogging."
            ),
        }

    if irrigation_approaching and days_since_irrigation is not None and days_since_irrigation >= typical_irrigation_interval_days:
        return {
            "type": "irrigation",
            "priority": "warning",
            "title": "Irrigation may be due",
            "message": (
                f"It has been {days_since_irrigation} days since the last logged irrigation, "
                f"which is at or beyond the typical {typical_irrigation_interval_days}-day interval."
            ),
        }

    return None


def generate_farm_weather_alerts(
    weather: dict,
    last_irrigation_date: Optional[date] = None,
    typical_irrigation_interval_days: int = 7,
    has_scheduled_irrigation_tomorrow: bool = False,
    today: Optional[date] = None,
) -> list[dict]:
    """
    Evaluates weather parameters from Open-Meteo against deterministic
    KrishiMitra agronomic rules to generate practical farm alerts.
    """
    alerts = []
    if not weather or not weather.get("available"):
        return alerts

    current = weather.get("current", {})
    daily_forecast = weather.get("daily_forecast", [])
    tomorrow = daily_forecast[1] if len(daily_forecast) > 1 else None

    # Rule 1: Irrigation vs Rain Alert (KrishiMitra rule: delay irrigation if rain likely)
    tomorrow_pop = tomorrow.get("rain_probability_percent") if tomorrow else None
    alert = build_irrigation_alert(
        rain_probability_tomorrow=tomorrow_pop,
        last_irrigation_date=last_irrigation_date,
        typical_irrigation_interval_days=typical_irrigation_interval_days,
        today=today,
    )
    if alert:
        alerts.append(alert)
    elif has_scheduled_irrigation_tomorrow and tomorrow_pop is not None and tomorrow_pop >= 50:
        alerts.append({
            "type": "irrigation",
            "priority": "important",
            "title": "Delay Irrigation — Rain Expected",
            "message": (
                f"Irrigation is scheduled tomorrow, but rain is likely ({tomorrow_pop}% chance). "
                "Rain is expected — consider delaying it."
            ),
        })

    # Rule 2: Wind Speed & Spraying Window
    wind_kmh = current.get("wind_speed_kmh")
    if wind_kmh is not None and wind_kmh >= 25:
        alerts.append({
            "type": "spray",
            "priority": "warning",
            "title": "High Wind Alert — Avoid Spraying",
            "message": f"Wind speeds are currently {wind_kmh:.0f} km/h. Avoid foliar fertilizer and pesticide spraying to prevent spray drift.",
        })

    # Rule 3: Heavy Precipitation Warning
    if tomorrow and tomorrow.get("rain_probability_percent", 0) >= 80:
        alerts.append({
            "type": "weather",
            "priority": "important",
            "title": "Heavy Rain Forecasted",
            "message": "Heavy rain is forecasted for tomorrow. Ensure field drainage channels are clear to prevent waterlogging.",
        })

    # Rule 4: High Temperature / Heat Stress
    temp = current.get("temperature_c")
    if temp is not None and temp >= 38:
        alerts.append({
            "type": "heat",
            "priority": "warning",
            "title": "Extreme Heat Alert",
            "message": f"Temperatures are around {temp:.0f}°C with high evapotranspiration. Ensure adequate soil moisture.",
        })

    # Rule 5: High Humidity Fungal Risk
    humidity = current.get("humidity_percent")
    if humidity is not None and humidity >= 85 and temp is not None and 20 <= temp <= 32:
        alerts.append({
            "type": "disease",
            "priority": "advisory",
            "title": "High Humidity Disease Risk",
            "message": f"Relative humidity is {humidity}% with warm conditions. Monitor crop foliage for signs of fungal or bacterial infection.",
        })

    return alerts


def next_irrigation_estimate(
    last_irrigation_date: Optional[date],
    typical_irrigation_interval_days: int = 7,
    today: Optional[date] = None,
) -> dict:
    today = today or date.today()
    if not last_irrigation_date:
        return {"days_until_next": None, "note": "No irrigation has been logged yet for this crop cycle."}

    next_date = last_irrigation_date + timedelta(days=typical_irrigation_interval_days)
    days_until = (next_date - today).days
    return {
        "estimated_next_date": next_date.isoformat(),
        "days_until_next": days_until,
        "note": "Estimate based on a typical irrigation interval, not a measurement of actual soil moisture.",
    }
