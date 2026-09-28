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

        return {
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


async def get_current_and_forecast(
    latitude: Optional[float],
    longitude: Optional[float],
    district: str,
    state: str
) -> dict:
    if latitude is None or longitude is None:
        coords = await weather_service.geocode(district, state)
        if coords:
            latitude, longitude = coords
        else:
            return {
                "available": False,
                "message": f"Weather information is temporarily unavailable for {district or state or 'this location'}.",
            }

    try:
        return await weather_service.get_weather(latitude, longitude)
    except Exception as e:
        logger.error("Failed to fetch weather from Open-Meteo: %s", e)
        return {
            "available": False,
            "message": "Weather information is temporarily unavailable. Please try again shortly.",
        }
