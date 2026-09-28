"""
Configurable, verified reference ranges for interpreting soil test
values. Groq is never allowed to invent these thresholds — this table
is the single source of truth, and Groq's only job with soil data is to
explain an already-computed rating in plain language.

Ranges are commonly-cited general agronomic guidelines for Indian soils
and are intentionally conservative/general; a real deployment should let
an agronomist tune these per-region via this same table.
"""

PH_RANGES = [
    (0, 5.5, "Acidic (Low)"),
    (5.5, 7.5, "Normal"),
    (7.5, 14, "Alkaline (High)"),
]

# kg/ha guideline bands, commonly used for general assessment
NITROGEN_RANGES = [(0, 280, "Low"), (280, 560, "Normal"), (560, 10000, "High")]
PHOSPHORUS_RANGES = [(0, 10, "Low"), (10, 25, "Normal"), (25, 10000, "High")]
POTASSIUM_RANGES = [(0, 110, "Low"), (110, 280, "Normal"), (280, 10000, "High")]
ORGANIC_CARBON_RANGES = [(0, 0.5, "Low"), (0.5, 0.75, "Normal"), (0.75, 100, "High")]


def _rate(value: float | None, ranges: list[tuple[float, float, str]]) -> str:
    if value is None:
        return "Unknown"
    for low, high, label in ranges:
        if low <= value < high:
            return label
    return "Unknown"


def rate_ph(value: float | None) -> str:
    return _rate(value, PH_RANGES)


def rate_nitrogen(value: float | None) -> str:
    return _rate(value, NITROGEN_RANGES)


def rate_phosphorus(value: float | None) -> str:
    return _rate(value, PHOSPHORUS_RANGES)


def rate_potassium(value: float | None) -> str:
    return _rate(value, POTASSIUM_RANGES)


def rate_organic_carbon(value: float | None) -> str:
    return _rate(value, ORGANIC_CARBON_RANGES)
