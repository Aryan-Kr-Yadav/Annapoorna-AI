"""
Deterministic, extensible crop-stage definitions.

Groq is NEVER used to calculate a crop stage — this static table (plus
simple day-arithmetic in services/lifecycle_engine.py) is the entire
source of truth. Durations are typical/approximate ranges for Indian
growing conditions and are always presented to the user as estimates.

To add a new crop: add a new key with an ordered list of
(stage_name, typical_duration_days) tuples. Nothing else needs to change.
"""

CROP_LIFECYCLES: dict[str, list[tuple[str, int]]] = {
    "wheat": [
        ("Germination", 10),
        ("Seedling", 15),
        ("Tillering", 25),
        ("Stem Elongation", 25),
        ("Flowering", 15),
        ("Grain Filling", 30),
        ("Maturity", 15),
    ],
    "rice": [
        ("Germination", 10),
        ("Seedling", 20),
        ("Tillering", 25),
        ("Panicle Initiation", 20),
        ("Flowering", 15),
        ("Grain Filling", 25),
        ("Maturity", 15),
    ],
    "cotton": [
        ("Germination", 12),
        ("Seedling", 20),
        ("Vegetative Growth", 30),
        ("Squaring", 20),
        ("Flowering", 25),
        ("Boll Development", 35),
        ("Maturity", 20),
    ],
    "maize": [
        ("Germination", 7),
        ("Seedling", 15),
        ("Vegetative Growth", 30),
        ("Tasseling & Silking", 12),
        ("Grain Filling", 25),
        ("Maturity", 15),
    ],
    "potato": [
        ("Sprouting", 10),
        ("Vegetative Growth", 20),
        ("Tuber Initiation", 15),
        ("Tuber Bulking", 35),
        ("Maturity", 15),
    ],
    "sugarcane": [
        ("Germination", 30),
        ("Tillering", 60),
        ("Grand Growth", 150),
        ("Maturity", 90),
    ],
    "tomato": [
        ("Germination", 8),
        ("Seedling", 20),
        ("Vegetative Growth", 25),
        ("Flowering", 15),
        ("Fruit Development", 25),
        ("Maturity", 15),
    ],
}


def get_lifecycle_for_crop(crop_name: str) -> list[tuple[str, int]] | None:
    """Case-insensitive lookup; returns None for crops without a defined lifecycle."""
    return CROP_LIFECYCLES.get(crop_name.strip().lower())
