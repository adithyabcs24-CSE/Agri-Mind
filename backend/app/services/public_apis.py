"""
Public APIs Integration Service for AgriMind Smart Agriculture
Selected from the https://github.com/public-apis/public-apis directory.

Features:
1. Open-Meteo Weather API (Auth: None, completely free & keyless)
   - 7-day weather forecasts, min/max temperatures, precipitation, wind speed, UV index
2. Open-Meteo Soil API (Auth: None, completely free & keyless)
   - Volumetric soil moisture and soil temperatures at multiple depths
3. OpenStreetMap / Photon Geocoding API (Auth: None, completely free & keyless)
   - Geocode farm/district/state names into latitude & longitude
"""

import json
import logging
import urllib.request
import urllib.parse
from datetime import date, timedelta
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

# WMO Weather interpretation codes (WW) to human readable descriptions
WMO_WEATHER_CODES = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


def geocode_location(query: str) -> Optional[Dict[str, float]]:
    """
    Geocode an address/district/state using OpenStreetMap Photon API (Keyless, from public-apis).
    Returns {"latitude": float, "longitude": float} or None.
    """
    try:
        encoded = urllib.parse.quote(query.strip())
        url = f"https://photon.komoot.io/api/?q={encoded}&limit=1"
        req = urllib.request.Request(url, headers={"User-Agent": "AgriMind-SmartAgri/1.0"})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            features = data.get("features", [])
            if features:
                coords = features[0]["geometry"]["coordinates"]
                return {"longitude": float(coords[0]), "latitude": float(coords[1])}
    except Exception as e:
        logger.warning(f"Geocoding failed for {query}: {e}")
    return None


def fetch_live_weather(latitude: float = 28.6139, longitude: float = 77.2090) -> Optional[List[Dict[str, Any]]]:
    """
    Fetches real 7-day weather forecast from Open-Meteo (Keyless, from public-apis).
    """
    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={latitude}&longitude={longitude}&"
            f"daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,uv_index_max&"
            f"hourly=relative_humidity_2m&"
            f"timezone=auto"
        )
        req = urllib.request.Request(url, headers={"User-Agent": "AgriMind-SmartAgri/1.0"})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            daily = data.get("daily", {})
            times = daily.get("time", [])
            t_max = daily.get("temperature_2m_max", [])
            t_min = daily.get("temperature_2m_min", [])
            precip = daily.get("precipitation_sum", [])
            wind = daily.get("wind_speed_10m_max", [])
            uv = daily.get("uv_index_max", [])
            codes = daily.get("weather_code", [])

            forecast = []
            for i in range(len(times)):
                w_code = codes[i] if i < len(codes) else 0
                desc = WMO_WEATHER_CODES.get(w_code, "Clear")
                forecast.append({
                    "date": times[i],
                    "temperature_min": round(t_min[i], 1) if i < len(t_min) and t_min[i] is not None else 22.0,
                    "temperature_max": round(t_max[i], 1) if i < len(t_max) and t_max[i] is not None else 32.0,
                    "humidity": 65,  # fallback average
                    "rainfall_mm": round(precip[i], 1) if i < len(precip) and precip[i] is not None else 0.0,
                    "wind_speed": round(wind[i], 1) if i < len(wind) and wind[i] is not None else 10.0,
                    "uv_index": round(uv[i], 1) if i < len(uv) and uv[i] is not None else 5.0,
                    "cloud_cover": 20 if "clear" in desc.lower() else 70,
                    "description": desc,
                    "source": "Open-Meteo (Live Public API)",
                })
            return forecast
    except Exception as e:
        logger.warning(f"Failed to fetch live weather from Open-Meteo: {e}")
        return None


def fetch_live_soil(latitude: float = 28.6139, longitude: float = 77.2090) -> Optional[Dict[str, Any]]:
    """
    Fetches live soil moisture and temperature from Open-Meteo Soil API (Keyless, from public-apis).
    """
    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={latitude}&longitude={longitude}&"
            f"hourly=soil_temperature_0cm,soil_temperature_6cm,soil_moisture_0_to_1cm,soil_moisture_1_to_3cm&"
            f"timezone=auto"
        )
        req = urllib.request.Request(url, headers={"User-Agent": "AgriMind-SmartAgri/1.0"})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            hourly = data.get("hourly", {})
            temp_0 = hourly.get("soil_temperature_0cm", [28.0])[0]
            temp_6 = hourly.get("soil_temperature_6cm", [26.0])[0]
            moist_0_1 = hourly.get("soil_moisture_0_to_1cm", [0.25])[0]
            moist_1_3 = hourly.get("soil_moisture_1_to_3cm", [0.28])[0]

            return {
                "soil_temperature_surface_c": temp_0,
                "soil_temperature_root_c": temp_6,
                "soil_moisture_surface_pct": round(moist_0_1 * 100, 1) if moist_0_1 is not None else 25.0,
                "soil_moisture_deep_pct": round(moist_1_3 * 100, 1) if moist_1_3 is not None else 28.0,
                "source": "Open-Meteo Soil API (Live Public API)",
            }
    except Exception as e:
        logger.warning(f"Failed to fetch live soil data: {e}")
        return None
