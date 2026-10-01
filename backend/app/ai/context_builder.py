"""
Context Builder with intelligent query routing.
Selects and formats minimal, relevant farm/crop context so GPT-OSS 120B
is never overwhelmed with irrelevant tables for general knowledge questions.
"""
import re
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.crop import CropCycle
from app.models.farm import Farm
from app.models.user import User
from app.services.lifecycle_engine import calculate_lifecycle


# Patterns identifying purely general scientific, botanical, or definitional questions
GENERAL_KNOWLEDGE_PATTERNS = [
    r"^what is\s+(photosynthesis|npk|chlorophyll|transpiration|germination|crop rotation|drip irrigation|mulching|vermicompost|organic farming|aeroponics|hydroponics)",
    r"^explain\s+(photosynthesis|npk|nitrogen cycle|phosphorus|potassium|green revolution|soil ph|crop rotation)",
    r"^(define|meaning of)\s+",
    r"^(hi|hello|hey|good morning|good evening|namaste|pranam)\b",
    r"^(who are you|what can you do|what is annapoorna)\b",
]

# Words that indicate user is asking about their personal farm, crop, or live operations
PERSONAL_FARM_INDICATORS = {
    "my", "mine", "our", "i", "me",
    "mera", "meri", "mere", "humara", "humari", "mujhe", "maine",
    "farm", "khet", "field", "plot", "crop", "fasal",
    "irrigate", "irrigation", "paani", "pani",
    "expense", "spent", "kharch", "kharcha", "cost", "budget", "profit", "revenue", "kamai",
    "task", "tasks", "kaam", "schedule", "today", "tomorrow", "aaj", "kal", "parso",
    "spray", "disease", "pest", "keeda", "rog", "yellow", "spots", "leaf", "patti",
    "sow", "sowing", "harvest", "yield", "beej", "mandi", "bhav", "price", "rate",
    "scheme", "yojana", "subsidy", "pm kisan"
}


def is_general_knowledge_query(text: str) -> bool:
    """
    Returns True if the user question is a general concept, scientific query,
    or greeting that does not need personal farm context.
    """
    if not text:
        return True

    text_lower = text.strip().lower()

    # Check for direct general knowledge regexes
    for pattern in GENERAL_KNOWLEDGE_PATTERNS:
        if re.search(pattern, text_lower):
            # If it explicitly mentions "my farm" or "my crop", treat as farm question
            if not any(f" {w} " in f" {text_lower} " for w in ["my", "mera", "meri", "mere", "our"]):
                return True

    # Check words for personal farm indicators
    words = set(re.findall(r"\b[a-zA-Z\u0900-\u097f]+\b", text_lower))
    if not words.intersection(PERSONAL_FARM_INDICATORS):
        # Questions like "Why do leaves turn yellow?" or "How much water does wheat need?"
        if any(text_lower.startswith(q) for q in ["what is", "why do", "how does", "what does", "define"]):
            return True

    return False


def build_farm_crop_context(
    db: Session,
    user: User,
    farm_id: Optional[UUID],
    crop_cycle_id: Optional[UUID],
    query_text: Optional[str] = None,
) -> dict:
    """
    Builds the minimal, relevant farm/crop context to prepend to a chat turn.
    If the query is identified as general knowledge, returns an empty context
    so GPT-OSS 120B focuses solely on answering the concept without distraction.
    """
    if query_text and is_general_knowledge_query(query_text):
        return {}

    context: dict = {"farmer_preferred_language": user.preferred_language}

    farm = None
    if farm_id:
        farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == user.id).first()
    if farm:
        context["farm_name"] = farm.name
        context["farm_location"] = f"{farm.district}, {farm.state}"
        context["farm_area"] = f"{farm.area} {farm.area_unit.value}"
        context["soil_type"] = farm.soil_type
        context["irrigation_type"] = farm.irrigation_type.value

    crop = None
    if crop_cycle_id:
        crop = (
            db.query(CropCycle)
            .join(Farm, CropCycle.farm_id == Farm.id)
            .filter(CropCycle.id == crop_cycle_id, Farm.user_id == user.id)
            .first()
        )
    if crop:
        lifecycle = calculate_lifecycle(crop.crop_name, crop.sowing_date)
        context["active_crop"] = f"{crop.crop_name} ({crop.variety or 'variety not specified'})"
        context["season"] = f"{crop.season.value} {crop.year}"
        context["day_after_sowing"] = lifecycle.day_number
        context["current_growth_stage"] = lifecycle.current_stage

    return context
