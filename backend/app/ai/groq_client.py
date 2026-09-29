"""
Client around Groq's high-speed OpenAI-compatible completions API.
API keys are read from backend environment variables only —
this module is never imported by, or exposed to, any frontend code.
"""
from typing import Any, Optional

import httpx

from app.core.config import get_settings

settings = get_settings()


class GroqConfigError(Exception):
    pass


class GroqResponseError(Exception):
    pass


def _resolve_ai_config() -> tuple[str, str, str, str]:
    """
    Resolves (api_key, api_base, chat_model, vision_model) for Groq API.
    """
    key = settings.GROQ_API_KEY
    if not key:
        raise GroqConfigError(
            "GROQ_API_KEY is not set. Add GROQ_API_KEY to the backend .env file."
        )

    base = settings.GROQ_API_BASE or "https://api.groq.com/openai/v1"
    chat_model = settings.GROQ_CHAT_MODEL or "qwen/qwen3.8-27b"
    vision_model = settings.GROQ_VISION_MODEL or "qwen/qwen3.8-27b"

    return key, base.rstrip("/"), chat_model, vision_model


async def chat_completion(
    messages: list[dict],
    tools: Optional[list[dict]] = None,
    model: Optional[str] = None,
    temperature: float = 0.4,
) -> dict[str, Any]:
    """
    Calls the Groq chat completions endpoint. Returns the raw first-choice
    message dict (may include `tool_calls`).
    """
    api_key, api_base, default_chat_model, _ = _resolve_ai_config()

    payload: dict[str, Any] = {
        "model": model or default_chat_model,
        "messages": messages,
        "temperature": temperature,
    }
    if tools:
        payload["tools"] = tools
        payload["tool_choice"] = "auto"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "User-Agent": "Annapoorna-AI/2.0",
    }

    try:
        async with httpx.AsyncClient(timeout=45) as client:
            resp = await client.post(
                f"{api_base}/chat/completions",
                headers=headers,
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPStatusError as exc:
        err_detail = ""
        try:
            err_json = exc.response.json()
            err_detail = err_json.get("error", {}).get("message") or str(err_json)
        except Exception:
            err_detail = exc.response.text[:250]
        raise GroqResponseError(f"Groq API returned error {exc.response.status_code}: {err_detail}") from exc
    except httpx.RequestError as exc:
        raise GroqResponseError(f"Could not reach the Groq API: {exc}") from exc

    choices = data.get("choices") or []
    if not choices:
        raise GroqResponseError("Groq returned no response choices.")

    return choices[0]["message"]


async def vision_completion(prompt: str, image_url: str, model: Optional[str] = None) -> str:
    """Image + text understanding call (e.g. Crop Doctor). Returns plain text content."""
    api_key, api_base, _, default_vision_model = _resolve_ai_config()

    messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": image_url}},
            ],
        }
    ]

    headers = {
        "Authorization": f"Bearer {api_key}",
        "User-Agent": "Annapoorna-AI/2.0",
    }

    try:
        async with httpx.AsyncClient(timeout=45) as client:
            resp = await client.post(
                f"{api_base}/chat/completions",
                headers=headers,
                json={"model": model or default_vision_model, "messages": messages, "temperature": 0.3},
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPStatusError as exc:
        err_detail = ""
        try:
            err_json = exc.response.json()
            err_detail = err_json.get("error", {}).get("message") or str(err_json)
        except Exception:
            err_detail = exc.response.text[:250]
        raise GroqResponseError(f"Groq vision API returned error {exc.response.status_code}: {err_detail}") from exc
    except httpx.RequestError as exc:
        raise GroqResponseError(f"Could not reach the Groq API: {exc}") from exc

    choices = data.get("choices") or []
    if not choices:
        raise GroqResponseError("Groq returned no response choices.")
    return choices[0]["message"].get("content", "")


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
