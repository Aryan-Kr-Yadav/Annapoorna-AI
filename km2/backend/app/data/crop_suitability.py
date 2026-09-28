"""
Simple, deterministic agronomic compatibility rules for the Smart Crop
Planner. Deliberately NOT AI-generated and NOT scored with invented
percentages — just season/soil/water-requirement compatibility facts
that should be reviewed and expanded by an agronomist before production
use. Groq is never used to generate or adjust this table.
"""

CROP_SUITABILITY = [
    {"crop": "wheat", "seasons": ["rabi"], "water_requirement": "medium", "suitable_soils": ["loamy", "clayey", "alluvial"]},
    {"crop": "rice", "seasons": ["kharif"], "water_requirement": "high", "suitable_soils": ["clayey", "alluvial"]},
    {"crop": "maize", "seasons": ["kharif", "rabi"], "water_requirement": "medium", "suitable_soils": ["loamy", "sandy loam", "alluvial"]},
    {"crop": "cotton", "seasons": ["kharif"], "water_requirement": "medium", "suitable_soils": ["black", "loamy"]},
    {"crop": "sugarcane", "seasons": ["kharif", "zaid"], "water_requirement": "high", "suitable_soils": ["loamy", "alluvial", "clayey"]},
    {"crop": "potato", "seasons": ["rabi"], "water_requirement": "medium", "suitable_soils": ["loamy", "sandy loam"]},
    {"crop": "tomato", "seasons": ["rabi", "zaid"], "water_requirement": "medium", "suitable_soils": ["loamy", "sandy loam"]},
    {"crop": "mustard", "seasons": ["rabi"], "water_requirement": "low", "suitable_soils": ["loamy", "sandy loam", "alluvial"]},
    {"crop": "groundnut", "seasons": ["kharif", "zaid"], "water_requirement": "low", "suitable_soils": ["sandy loam", "black"]},
    {"crop": "chickpea (chana)", "seasons": ["rabi"], "water_requirement": "low", "suitable_soils": ["loamy", "black", "clayey"]},
]

IRRIGATION_MIN_WATER_CAPACITY = {
    "rainfed": "low",
    "canal": "medium",
    "borewell": "medium",
    "drip": "high",
    "sprinkler": "high",
}

_WATER_RANK = {"low": 0, "medium": 1, "high": 2}


def suggest_crops(season: str, soil_type: str | None, irrigation_type: str) -> list[dict]:
    irrigation_capacity = IRRIGATION_MIN_WATER_CAPACITY.get(irrigation_type, "low")
    results = []
    for entry in CROP_SUITABILITY:
        if season not in entry["seasons"]:
            continue
        water_ok = _WATER_RANK[entry["water_requirement"]] <= _WATER_RANK[irrigation_capacity] or irrigation_type != "rainfed"
        soil_match = not soil_type or soil_type.strip().lower() in [s.lower() for s in entry["suitable_soils"]]
        reasoning_parts = [f"Compatible with {season} season"]
        if soil_match and soil_type:
            reasoning_parts.append(f"suits {soil_type} soil")
        reasoning_parts.append(f"{entry['water_requirement']} water requirement")
        results.append(
            {
                "crop": entry["crop"],
                "water_requirement_category": entry["water_requirement"],
                "season_compatible": True,
                "soil_compatible": soil_match if soil_type else None,
                "reasoning": ", ".join(reasoning_parts) + ".",
            }
        )
    return results
