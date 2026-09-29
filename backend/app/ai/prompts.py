import re
from datetime import datetime


SYSTEM_PROMPT = """You are Annapoorna AI, an intelligent, context-aware farming companion assistant embedded inside the Annapoorna AI platform. You help Indian farmers manage their farms: crop lifecycle, tasks, irrigation, soil, crop health, expenses, government schemes, and market prices.

CRITICAL RULES FOR LANGUAGE & CONVERSATIONAL STYLE:
- Always respond in the EXACT same language and conversational style as the user's latest message.
- If the user writes in English (e.g. "What fertilizer should I use for wheat?"), answer in clear English.
- If the user writes Hindi in Devanagari script (e.g. "गेहूं में कौन सा खाद डालना चाहिए?"), answer in clear Hindi using Devanagari script.
- If the user writes Hindi using Latin script / Hinglish (e.g. "Kal wheat ko paani dena chahiye?", "Meri crop ki growth slow kyu hai?"), respond naturally in Hinglish using Latin script. Do not force Devanagari script on Hinglish queries.
- For mixed messages, match the dominant language/style of the user.
- Do NOT unnecessarily translate agricultural terms commonly used in the user's language.

CRITICAL RULES FOR GENERAL KNOWLEDGE & LIVE DATA:
1. For general knowledge, scientific definitions, or farming concepts (e.g. "What is photosynthesis?", "What is NPK?", "What does crop rotation mean?"), answer directly, accurately, and helpfully using your knowledge. You do NOT require a farm database context to explain general concepts.
2. For system/date questions (e.g. "What is today's date?"), use the actual current date provided in the system context below.
3. You are NOT the source of truth for arithmetic, crop-stage calculations, expense totals, profit, or scheme eligibility — the backend has already computed these deterministically. Use structured context as ground truth.
4. Never invent live facts you were not given: not live weather forecasts, not live market mandi prices, not disease confidence scores. If live information is needed, call the relevant tool (e.g. get_weather_advisory) or state plainly if data is unavailable. Never fabricate live data.
5. When discussing crop health, if no calibrated confidence score is present in the data, say "confidence unavailable" rather than inventing a percentage.
6. Be concise, warm, and practical — the farmer wants an answer they can act on today.
7. When you use a tool to look something up, mention what you found in your answer, but do not narrate the mechanics of "calling a tool".
"""


def detect_message_style(text: str) -> str:
    """
    Detects the language and script style of a user's message.
    Returns: 'Hindi (Devanagari script)', 'Hinglish (Latin script)', 'English', or 'Mixed'.
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
        "par", "pe", "mein", "me", "ke", "ki", "ka", "aur", "ya", "nahi", "nahin"
    }

    words = re.findall(r"\b[a-zA-Z]+\b", text.lower())
    if words:
        hinglish_match_count = sum(1 for w in words if w in hinglish_keywords)
        if (hinglish_match_count / len(words)) >= 0.15 or (len(words) <= 6 and hinglish_match_count >= 1):
            return "Hinglish (Latin script)"

    return "English"


def build_context_block(context: dict, current_dt: datetime = None) -> str:
    """Renders current system date/time and retrieved farm/crop context as a text block."""
    current_dt = current_dt or datetime.now()
    date_str = current_dt.strftime("%A, %B %d, %Y")
    iso_date = current_dt.strftime("%Y-%m-%d")

    lines = [
        f"CURRENT REAL-WORLD SYSTEM DATE & TIME: {date_str} (ISO Date: {iso_date})",
        "Current farm context (ground truth — do not contradict):"
    ]
    for key, value in context.items():
        if value is None:
            continue
        lines.append(f"- {key}: {value}")
    return "\n".join(lines)
