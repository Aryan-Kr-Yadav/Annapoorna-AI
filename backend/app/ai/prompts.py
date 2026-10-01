"""
Modular System Prompts and Language Detection for Annapoorna AI.
Designed for high-performance reasoning with GPT-OSS 120B.
"""
import re
from datetime import datetime
from typing import Optional


SYSTEM_PROMPT = """[ROLE]
You are Annapoorna AI, an intelligent, context-aware farm companion and agronomic reasoning assistant embedded in the Annapoorna AI platform. You help Indian farmers manage crops, lifecycle stages, tasks, irrigation, soil health, crop protection, expenses, government schemes, and market intelligence.

[GROUNDING & SOURCE OF TRUTH]
- The backend database and tools are the absolute sources of truth.
- NEVER invent or hallucinate live farm records, weather forecasts, market mandi prices, government scheme eligibility/benefits, or financial summaries.
- When live data or farm-specific records are required, invoke the appropriate tool (e.g. get_weather_advisory, get_irrigation_history, get_expense_summary).
- Never claim a tool call happened behind the scenes or narrate the mechanics of tool execution. Seamlessly synthesize the findings in your answer.

[FARM & CROP CONTEXT]
- When an active farm or crop is selected, ground your advice in that specific crop, growth stage, soil type, and climate.
- When no farm is selected, operate in General Knowledge mode and answer farming science, concepts, or general agricultural queries directly and thoroughly.
- For system/date questions, use the real-world current system date provided in the context block.

[SAFETY & AGRONOMIC RESPONSIBILITY]
- NEVER invent specific chemical milliliter or gram dosages for pesticides or fungicides. Recommend approved active ingredient classes or cultural practices and advise the farmer to follow the product label or consult local Krishi Vigyan Kendra (KVK) / agricultural extension officers.
- Never invent disease confidence percentages. If no calibrated score is present, state that confidence is unavailable.
- Always highlight when severe symptoms warrant immediate in-person inspection by an agronomist.

[RESPONSE STYLE & STRUCTURE]
- Communicate in a warm, respectful, practical, and farmer-friendly manner.
- Focus on what the farmer can do TODAY.
- Structure responses cleanly using bullet points or brief sections (Recommendation, Why, Action Steps, What to Watch For) when helpful.
- Avoid unnecessary academic filler or lengthy essays for routine questions.
"""


def get_language_directive(preference: str, user_text: str) -> str:
    """
    Builds the explicit language directive based on user preference or automatic detection.
    Supports: 'auto', 'en', 'hi', 'hinglish'.
    """
    pref = (preference or "auto").lower()

    if pref in ["en", "english"]:
        return "\n[LANGUAGE DIRECTIVE: Respond strictly in clear English.]"
    if pref in ["hi", "hindi"]:
        return "\n[LANGUAGE DIRECTIVE: Respond strictly in Hindi using Devanagari script (देवनागरी लिपि).]"
    if pref in ["hinglish", "latin_hindi"]:
        return "\n[LANGUAGE DIRECTIVE: Respond naturally in conversational Hinglish using Latin alphabet (e.g., 'Aapko kal gehun me paani dena chahiye kyunki...'). Do NOT use Devanagari script.]"

    # AUTO mode: Detect from latest user query
    detected = detect_message_style(user_text)
    if detected == "Hindi (Devanagari script)":
        return "\n[LANGUAGE DIRECTIVE: The user wrote in Hindi (Devanagari). Respond strictly in clear Hindi using Devanagari script.]"
    if detected == "Hinglish (Latin script)":
        return "\n[LANGUAGE DIRECTIVE: The user wrote in Hinglish. Respond naturally in conversational Hinglish using Latin alphabet. Do NOT use Devanagari script.]"
    return "\n[LANGUAGE DIRECTIVE: The user wrote in English. Respond in clear, accessible English.]"


def get_style_directive(style_preference: str) -> str:
    """Configures response verbosity and formatting style."""
    style = (style_preference or "balanced").lower()
    if style == "concise":
        return "\n[VERBOSITY: Concise. Keep response brief, direct, and actionable with minimal preamble. Focus on 2-3 immediate steps.]"
    if style == "detailed":
        return "\n[VERBOSITY: Detailed. Provide thorough, step-by-step agronomic explanation, underlying biological reasons, and long-term preventive guidance.]"
    return "\n[VERBOSITY: Balanced. Provide clear, direct recommendations with practical rationale.]"


def detect_message_style(text: str) -> str:
    """
    Detects language and script style of user message:
    - 'Hindi (Devanagari script)'
    - 'Hinglish (Latin script)'
    - 'English'
    """
    if not text:
        return "English"

    devanagari_count = len(re.findall(r"[\u0900-\u097f]", text))
    total_chars = len(text.strip())
    if devanagari_count > 0 and (devanagari_count / total_chars) > 0.15:
        return "Hindi (Devanagari script)"

    hinglish_keywords = {
        "kya", "kaise", "kab", "kyu", "kyun", "kaha", "kahan", "kaun", "kitna", "kitni",
        "paani", "pani", "dene", "dena", "chahiye", "hai", "hain", "karo", "karna",
        "mera", "meri", "mere", "khet", "fasal", "gehun", "dhan", "chawal", "khad",
        "raha", "rahi", "ho", "gaya", "gayi", "batao", "baare", "baat", "chahiye",
        "kuch", "bohat", "bahut", "achha", "aaj", "kal", "parso", "se", "ko", "ne",
        "par", "pe", "mein", "me", "ke", "ki", "ka", "aur", "ya", "nahi", "nahin",
        "bhi", "bhai", "namaste", "namaskar", "kheti", "beej", "rog", "keeda"
    }

    words = re.findall(r"\b[a-zA-Z]+\b", text.lower())
    if words:
        hinglish_match_count = sum(1 for w in words if w in hinglish_keywords)
        if (hinglish_match_count / len(words)) >= 0.15 or (len(words) <= 6 and hinglish_match_count >= 1):
            return "Hinglish (Latin script)"

    return "English"


def build_context_block(context: dict, current_dt: Optional[datetime] = None) -> str:
    """Renders current system date/time and active farm/crop ground truth."""
    current_dt = current_dt or datetime.now()
    date_str = current_dt.strftime("%A, %B %d, %Y")
    iso_date = current_dt.strftime("%Y-%m-%d")

    lines = [
        f"[CURRENT DATE & TIME]: {date_str} (ISO: {iso_date})",
        "[ACTIVE FARM GROUND TRUTH (Do not contradict)]:"
    ]
    for key, value in context.items():
        if value is None:
            continue
        lines.append(f"- {key}: {value}")
    return "\n".join(lines)
