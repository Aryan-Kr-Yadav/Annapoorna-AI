"""
WeatherService abstraction powered by the Open-Meteo API.
The frontend NEVER calls a weather provider directly — only this service does,
and only the backend calls this service.

Open-Meteo provides free, high-accuracy forecast and agricultural weather data
(soil moisture, soil temperature, precipitation, wind speed, WMO weather codes)
without requiring any API key.
"""
import logging
from datetime import datetime, timezone
from typing import Any, Optional

import httpx

logger = logging.getLogger(__name__)

WMO_CODE_MAP: dict[int, str] = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


def _wmo_description(code: Optional[int]) -> str:
    if code is None:
        return "Clear"
    return WMO_CODE_MAP.get(code, "Partly cloudy")


def compute_weather_intelligence(data: dict) -> dict:
    if not data or not data.get("available"):
        return {}

    current = data.get("current", {})
    daily = data.get("daily_forecast", [])
    today = daily[0] if len(daily) > 0 else {}
    tomorrow = daily[1] if len(daily) > 1 else {}

    temp = current.get("temperature_c") or 25
    humidity = current.get("humidity_percent") or 50
    wind = current.get("wind_speed_kmh") or 10
    pop_tomorrow = tomorrow.get("rain_probability_percent", 0)

    # 1. Farming Condition Score (Numeric 0-100 Composite & Qualitative Classification)
    # Deductions based on chemical drift (wind), precipitation risk (pop_tomorrow), and heat/cold/evapotranspiration stress (temp, humidity)
    penalties = 0.0
    reasons = []
    if wind and wind > 12:
        drift_penalty = min(25.0, (wind - 12) * 1.5)
        penalties += drift_penalty
        if wind >= 20:
            reasons.append(f"strong winds ({wind:.0f} km/h)")
    if pop_tomorrow and pop_tomorrow > 20:
        rain_penalty = min(25.0, (pop_tomorrow - 20) * 0.4)
        penalties += rain_penalty
        if pop_tomorrow >= 40:
            reasons.append(f"rain probability ({pop_tomorrow}%)")
    if temp:
        if temp > 30:
            temp_penalty = min(25.0, (temp - 30) * 2.0)
            penalties += temp_penalty
            if temp >= 35:
                reasons.append(f"high temperature ({temp:.0f}°C)")
        elif temp < 16:
            cold_penalty = min(20.0, (16 - temp) * 2.0)
            penalties += cold_penalty
            if temp <= 10:
                reasons.append(f"cold temperature ({temp:.0f}°C)")
    if humidity:
        if humidity > 70:
            hum_penalty = min(15.0, (humidity - 70) * 0.4)
            penalties += hum_penalty
            if humidity >= 80:
                reasons.append(f"high humidity ({humidity}%)")
        elif humidity < 30:
            penalties += min(10.0, (30 - humidity) * 0.3)

    numeric_score = max(15, min(98, round(100.0 - penalties)))

    # Classification conforming to standardized scale:
    # 0-39: Poor, 40-59: Fair, 60-74: Moderate, 75-89: Good, 90-100: Excellent
    if numeric_score <= 39:
        score_label = "Poor"
        score_status = "CAUTION"
        score_desc = f"Challenging farming conditions today due to {', '.join(reasons) if reasons else 'severe weather factors'}."
    elif numeric_score <= 59:
        score_label = "Fair"
        score_status = "CAUTION"
        score_desc = f"Caution advised today due to {', '.join(reasons) if reasons else 'unfavorable micro-climate'}."
    elif numeric_score <= 74:
        score_label = "Moderate"
        score_status = "MODERATE"
        score_desc = f"Moderate farming conditions today ({', '.join(reasons) if reasons else 'mild weather changes'})."
    elif numeric_score <= 89:
        score_label = "Good"
        score_status = "GOOD"
        score_desc = "Favorable farming conditions today with manageable temperature and wind."
    else:
        score_label = "Excellent"
        score_status = "GOOD"
        score_desc = "Optimal agronomic conditions today for spraying, irrigation, and field work."

    # 2. Rain & Irrigation Advisory
    if pop_tomorrow >= 60:
        rain_advisory = f"High probability of rain tomorrow ({pop_tomorrow}% chance). Consider postponing irrigation to prevent waterlogging and conserve water."
    elif pop_tomorrow >= 35:
        rain_advisory = f"Moderate rain chance tomorrow ({pop_tomorrow}%). Monitor soil moisture before scheduling irrigation."
    else:
        rain_advisory = "Dry weather expected over the next 24-48 hours. Proceed with normal irrigation schedule if soil moisture is low."

    # 3. Disease Risk Weather Signal
    if humidity and humidity >= 80 and temp and 20 <= temp <= 32:
        disease_risk = "HIGH"
        disease_desc = f"High humidity ({humidity}%) combined with warm temperature ({temp:.0f}°C) creates favorable conditions for fungal and bacterial pathogens."
    elif humidity and humidity >= 65:
        disease_risk = "MODERATE"
        disease_desc = f"Moderate humidity ({humidity}%). Regularly inspect crop foliage for early signs of infection."
    else:
        disease_risk = "LOW"
        disease_desc = "Low humidity and dry air minimize foliar disease transmission risk today."

    # 4. Spraying Conditions
    if wind and wind >= 22:
        spray_cond = "AVOID"
        spray_desc = f"Avoid foliar spraying today — wind speed is {wind:.0f} km/h, which will cause spray drift."
    elif pop_tomorrow >= 60:
        spray_cond = "AVOID"
        spray_desc = "Avoid spraying this afternoon — rain is expected tomorrow which will wash away applied chemicals."
    elif wind and wind >= 15:
        spray_cond = "CAUTION"
        spray_desc = f"Caution while spraying — moderate wind ({wind:.0f} km/h). Spray early morning when wind is lowest."
    else:
        spray_cond = "GOOD"
        spray_desc = "Good spraying conditions — low wind speeds and minimal rain risk."

    # 5. Stress Warnings
    stress_warning = None
    if temp and temp >= 36:
        stress_warning = f"Heat Stress Alert: Current temperature of {temp:.0f}°C causes rapid evapotranspiration and crop heat stress."
    elif temp and temp <= 10:
        stress_warning = f"Cold Stress Alert: Low temperature of {temp:.0f}°C may slow crop metabolic growth."

    # 6. Best Farming Window
    best_window = "6:00 AM – 10:00 AM (Optimal temperature & lower wind speed)"

    # 7. Timeline
    timeline = [
        {"day": "Today", "summary": f"{current.get('condition', 'Clear')}, {temp:.0f}°C", "action": "Favorable for routine farm tasks."},
        {"day": "Tomorrow", "summary": f"{tomorrow.get('condition', 'Clear')}, Rain chance: {pop_tomorrow}%", "action": "Review irrigation plan before rain." if pop_tomorrow >= 40 else "Normal field operations."},
    ]

    return {
        "farming_condition_score": numeric_score,
        "farming_condition_label": score_label,
        "farming_condition_rating": score_status,
        "score_description": score_desc,
        "rain_advisory": rain_advisory,
        "disease_risk": disease_risk,
        "disease_description": disease_desc,
        "spraying_condition": spray_cond,
        "spraying_description": spray_desc,
        "stress_warning": stress_warning,
        "best_farming_window": best_window,
        "timeline": timeline,
    }


class WeatherService:
    BASE_URL = "https://api.open-meteo.com/v1/forecast"
    GEO_URL = "https://geocoding-api.open-meteo.com/v1/search"

    async def get_weather(
        self,
        latitude: float,
        longitude: float
    ) -> dict[str, Any]:

        params = {
            "latitude": latitude,
            "longitude": longitude,

            # Current farm weather
            "current": ",".join([
                "temperature_2m",
                "relative_humidity_2m",
                "precipitation",
                "rain",
                "weather_code",
                "wind_speed_10m"
            ]),

            # Hourly data useful for farm decisions
            "hourly": ",".join([
                "temperature_2m",
                "relative_humidity_2m",
                "precipitation_probability",
                "precipitation",
                "rain",
                "wind_speed_10m",
                "soil_temperature_0cm",
                "soil_moisture_0_to_1cm"
            ]),

            # Daily forecast
            "daily": ",".join([
                "weather_code",
                "temperature_2m_max",
                "temperature_2m_min",
                "precipitation_sum",
                "precipitation_probability_max",
                "wind_speed_10m_max"
            ]),

            "timezone": "auto",
            "forecast_days": 7
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    self.BASE_URL,
                    params=params
                )

                response.raise_for_status()
                data = response.json()

        except httpx.TimeoutException:
            raise RuntimeError("Weather service timed out")

        except httpx.HTTPStatusError as exc:
            raise RuntimeError(
                f"Weather provider returned HTTP {exc.response.status_code}"
            )

        except httpx.RequestError as exc:
            raise RuntimeError(f"Unable to reach weather service: {exc}")

        return self._normalize(data)

    def _normalize(self, data: dict) -> dict:
        current = data.get("current", {})
        hourly = data.get("hourly", {})
        daily = data.get("daily", {})

        current_code = current.get("weather_code")
        current_condition = _wmo_description(current_code)

        daily_times = daily.get("time", [])
        daily_max_temp = daily.get("temperature_2m_max", [])
        daily_min_temp = daily.get("temperature_2m_min", [])
        daily_pop = daily.get("precipitation_probability_max", [])
        daily_codes = daily.get("weather_code", [])

        # Build daily_forecast array for frontend UI compatibility
        daily_forecast = []
        for i, dt in enumerate(daily_times):
            code = daily_codes[i] if i < len(daily_codes) else None
            daily_forecast.append({
                "date": dt,
                "temp_min_c": daily_min_temp[i] if i < len(daily_min_temp) else None,
                "temp_max_c": daily_max_temp[i] if i < len(daily_max_temp) else None,
                "rain_probability_percent": daily_pop[i] if i < len(daily_pop) else 0,
                "weather_code": code,
                "condition": _wmo_description(code),
            })

        wind_kmh = current.get("wind_speed_10m")
        wind_ms = round(wind_kmh / 3.6, 1) if wind_kmh is not None else None

        result = {
            "available": True,
            "fetched_at": datetime.now(timezone.utc).isoformat(),
            "location": {
                "latitude": data.get("latitude"),
                "longitude": data.get("longitude"),
                "timezone": data.get("timezone")
            },

            "current": {
                "temperature_c": current.get("temperature_2m"),
                "humidity_percent": current.get("relative_humidity_2m"),
                "precipitation_mm": current.get("precipitation"),
                "rain_mm": current.get("rain"),
                "wind_speed_kmh": wind_kmh,
                "wind_speed_ms": wind_ms,
                "weather_code": current_code,
                "condition": current_condition,
            },

            "hourly": {
                "time": hourly.get("time", []),
                "temperature_c": hourly.get("temperature_2m", []),
                "humidity_percent": hourly.get("relative_humidity_2m", []),
                "rain_probability_percent": hourly.get("precipitation_probability", []),
                "precipitation_mm": hourly.get("precipitation", []),
                "rain_mm": hourly.get("rain", []),
                "wind_speed_kmh": hourly.get("wind_speed_10m", []),
                "soil_temperature_c": hourly.get("soil_temperature_0cm", []),
                "soil_moisture": hourly.get("soil_moisture_0_to_1cm", [])
            },

            "daily": {
                "time": daily_times,
                "max_temperature_c": daily_max_temp,
                "min_temperature_c": daily_min_temp,
                "precipitation_mm": daily.get("precipitation_sum", []),
                "rain_probability_percent": daily_pop,
                "max_wind_speed_kmh": daily.get("wind_speed_10m_max", []),
                "weather_code": daily_codes,
            },

            "daily_forecast": daily_forecast,
        }

        result["weather_intelligence"] = compute_weather_intelligence(result)
        return result

    async def geocode(self, district: str, state: str) -> Optional[tuple[float, float]]:
        """Geocodes a district and state to (latitude, longitude) using Open-Meteo Geocoding API."""
        name = district or state
        if not name:
            return None
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(
                    self.GEO_URL,
                    params={"name": name, "count": 1, "language": "en", "format": "json"}
                )
                res.raise_for_status()
                data = res.json()
                results = data.get("results")
                if results and len(results) > 0:
                    return float(results[0]["latitude"]), float(results[0]["longitude"])
        except Exception as e:
            logger.warning("Geocoding failed for %s, %s: %s", district, state, e)
        return None


weather_service = WeatherService()

_WEATHER_CACHE: dict[str, tuple[float, dict]] = {}
_GEO_CACHE: dict[str, tuple[float, tuple[float, float]]] = {}
WEATHER_CACHE_TTL = 900  # 15 minutes
GEO_CACHE_TTL = 86400    # 24 hours


async def get_current_and_forecast(
    latitude: Optional[float],
    longitude: Optional[float],
    district: str,
    state: str
) -> dict:
    import time

    if latitude is None or longitude is None:
        cache_key = f"{(district or '').strip().lower()}:{(state or '').strip().lower()}"
        if cache_key and cache_key in _GEO_CACHE:
            cached_time, cached_coords = _GEO_CACHE[cache_key]
            if time.time() - cached_time < GEO_CACHE_TTL:
                latitude, longitude = cached_coords

        if latitude is None or longitude is None:
            coords = await weather_service.geocode(district, state)
            if coords:
                latitude, longitude = coords
                if cache_key:
                    _GEO_CACHE[cache_key] = (time.time(), coords)
            else:
                return {
                    "available": False,
                    "message": f"Weather information is temporarily unavailable for {district or state or 'this location'}.",
                }

    coord_key = f"{round(latitude, 2)}:{round(longitude, 2)}"
    now = time.time()
    if coord_key in _WEATHER_CACHE:
        cached_time, cached_data = _WEATHER_CACHE[coord_key]
        if now - cached_time < WEATHER_CACHE_TTL:
            return cached_data

    try:
        data = await weather_service.get_weather(latitude, longitude)
        if data and data.get("available"):
            _WEATHER_CACHE[coord_key] = (now, data)
        return data
    except Exception as e:
        logger.error("Failed to fetch weather from Open-Meteo: %s", e)
        if coord_key in _WEATHER_CACHE:
            return _WEATHER_CACHE[coord_key][1]
        return {
            "available": False,
            "message": "Weather information is temporarily unavailable. Please try again shortly.",
        }
