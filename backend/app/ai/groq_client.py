"""
Client around Groq's high-speed OpenAI-compatible completions API.
Delegates to the centralized AIService router.
API keys are read from backend environment variables only —
this module is never imported by, or exposed to, any frontend code.
"""
from typing import Any, Optional
import httpx

from app.core.config import get_settings
from app.ai.service import (
    ai_service,
    AIConfigError,
    AIResponseError,
    classify_ai_error,
    message_has_image,
)

settings = get_settings()

# Backwards compatibility aliases
GroqConfigError = AIConfigError
GroqResponseError = AIResponseError
_has_image_content = message_has_image


def _classify_groq_error(status_code: int, err_detail: str) -> str:
    user_msg, _ = classify_ai_error(status_code, err_detail)
    return user_msg


def _resolve_ai_config() -> tuple[str, str, str, str]:
    """
    Resolves (api_key, api_base, chat_model, vision_model) for Groq API.
    """
    key = settings.GROQ_API_KEY
    if not key:
        raise GroqConfigError(
            "GROQ_API_KEY is not set. Add GROQ_API_KEY to the backend .env file."
        )
    base = (settings.GROQ_API_BASE or "https://api.groq.com/openai/v1").rstrip("/")
    chat_model = settings.text_model
    vision_model = settings.vision_model
    return key, base, chat_model, vision_model


async def chat_completion(
    messages: list[dict],
    tools: Optional[list[dict]] = None,
    model: Optional[str] = None,
    temperature: float = 0.4,
) -> dict[str, Any]:
    """
    Calls Groq with model routing via AIService:
    routes multimodal (image) messages to GROQ_VISION_MODEL (qwen/qwen3.8-27b),
    and text-only messages to GROQ_CHAT_MODEL (openai/gpt-oss-120b).
    """
    return await ai_service.generate_with_tools(
        messages=messages,
        tools=tools or [],
        model_override=model,
        temperature=temperature,
    )


async def vision_completion(prompt: str, image_url: str, model: Optional[str] = None) -> str:
    """Image + text understanding call (Crop Doctor / vision). Returns plain text content."""
    return await ai_service.analyze_image(
        prompt=prompt,
        image_url=image_url,
    )


async def create_embedding(text: str) -> Optional[list[float]]:
    """Used by rag.py to embed knowledge chunks and queries. Returns None if unavailable."""
    try:
        api_key, api_base, _, _ = _resolve_ai_config()
    except GroqConfigError:
        return None

    headers = {
        "Authorization": f"Bearer {api_key}",
        "User-Agent": "Annapoorna-AI/2.0",
    }
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                f"{api_base}/embeddings",
                headers=headers,
                json={"model": "text-embedding-3-small", "input": text},
            )
            resp.raise_for_status()
            data = resp.json()
            return data["data"][0]["embedding"]
    except Exception:
        return None
