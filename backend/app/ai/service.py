"""
Central AI Service and Model Router for Annapoorna AI.

Routes requests according to capability:
- Text-only & agronomic reasoning -> openai/gpt-oss-120b (Primary Reasoning Model)
- Multimodal & visual plant inspections -> qwen/qwen3.8-27b (Vision Model)
- Text fallback -> openai/gpt-oss-20b (Logged internal fallback)

Never sends image data URLs or multimodal payloads to GPT-OSS 120B.
"""
import json
import logging
import re
from typing import Any, Optional, Type, TypeVar
from pydantic import BaseModel, ValidationError
import httpx

from app.core.config import get_settings

logger = logging.getLogger("annapoorna.ai_service")
settings = get_settings()

T = TypeVar("T", bound=BaseModel)


class AIConfigError(Exception):
    """Raised when AI configuration is missing or invalid."""
    pass


class AIResponseError(Exception):
    """Raised when the AI provider returns an error."""
    def __init__(
        self,
        message: str,
        status_code: Optional[int] = None,
        user_safe_message: Optional[str] = None,
        error_type: Optional[str] = None,
    ):
        super().__init__(message)
        self.status_code = status_code
        self.user_safe_message = user_safe_message
        self.error_type = error_type


def classify_ai_error(status_code: int, err_detail: str) -> tuple[str, str]:
    """
    Returns (user_safe_message, error_category).
    Never exposes internal API keys, tracebacks, or raw JSON to users.
    Categorizes errors into standard user-friendly types without blaming the user.
    """
    detail_lower = err_detail.lower()

    if status_code == 429 or "rate limit" in detail_lower or "tokens" in detail_lower:
        return (
            "AI usage limit reached temporarily. Please try again shortly.",
            "rate_limit"
        )
    if status_code == 400:
        if "must be a string" in detail_lower or "image" in detail_lower or "media" in detail_lower or "pixel" in detail_lower:
            return (
                "Unable to analyze this image. Please upload a clear photo in JPG, PNG, or WebP format.",
                "image_error"
            )
        return (
            "Something in the request could not be processed. Please try again.",
            "invalid_request"
        )
    if status_code == 401 or "api key" in detail_lower or "unauthorized" in detail_lower:
        return (
            "AI service authentication error. Please contact the administrator.",
            "auth_error"
        )
    if status_code == 403 or "permission" in detail_lower:
        return (
            "Configured AI model requires permissions not available on this API key.",
            "permission_error"
        )
    if status_code == 404 or ("model" in detail_lower and "not exist" in detail_lower):
        return (
            "The requested AI model is currently unavailable on the provider.",
            "model_unavailable"
        )
    if status_code == 413 or "too large" in detail_lower or "payload" in detail_lower:
        return (
            "Input is too large for AI processing. Please upload a smaller photo or shorten the text.",
            "payload_too_large"
        )
    if status_code >= 500:
        return (
            "Something went wrong while processing your request. Please try again shortly.",
            "server_error"
        )
    return (
        "Something went wrong while processing your request. Please try again in a moment.",
        "server_error"
    )


def message_has_image(messages: list[dict[str, Any]]) -> bool:
    """Checks whether any message in the request contains an image payload."""
    for m in messages:
        c = m.get("content")
        if isinstance(c, list):
            for part in c:
                if isinstance(part, dict) and part.get("type") == "image_url":
                    return True
    return False


class AIService:
    """
    Central AI Model Router and Service.
    Controls access to Groq models:
    - Primary Text: openai/gpt-oss-120b
    - Fallback Text: openai/gpt-oss-20b
    - Vision: qwen/qwen3.8-27b
    """

    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None

    def _get_config(self) -> tuple[str, str, str, str, str]:
        key = settings.GROQ_API_KEY
        if not key:
            raise AIConfigError("GROQ_API_KEY is not configured in backend environment.")
        base = (settings.GROQ_API_BASE or "https://api.groq.com/openai/v1").rstrip("/")
        text_model = settings.text_model
        vision_model = settings.vision_model
        fallback_model = settings.GROQ_FALLBACK_TEXT_MODEL or "openai/gpt-oss-20b"
        return key, base, text_model, vision_model, fallback_model

    def select_model(self, has_image: bool = False, is_fallback: bool = False) -> str:
        """
        Backend model router:
        - Request has image -> GROQ_VISION_MODEL (qwen/qwen3.8-27b)
        - Fallback needed -> GROQ_FALLBACK_TEXT_MODEL (openai/gpt-oss-20b)
        - Otherwise -> GROQ_TEXT_MODEL (openai/gpt-oss-120b)
        """
        if has_image:
            return settings.vision_model
        if is_fallback:
            return settings.GROQ_FALLBACK_TEXT_MODEL or "openai/gpt-oss-20b"
        return settings.text_model

    async def _post_chat_completion(
        self,
        payload: dict[str, Any],
        timeout: float = 50.0,
    ) -> dict[str, Any]:
        api_key, api_base, text_model, _, fallback_model = self._get_config()
        headers = {
            "Authorization": f"Bearer {api_key}",
            "User-Agent": "Annapoorna-AI/2.0",
            "Content-Type": "application/json",
        }

        async def _call(target_payload: dict[str, Any]) -> dict[str, Any]:
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(
                    f"{api_base}/chat/completions",
                    headers=headers,
                    json=target_payload,
                )
                resp.raise_for_status()
                return resp.json()

        try:
            return await _call(payload)
        except httpx.HTTPStatusError as exc:
            err_detail = ""
            try:
                err_json = exc.response.json()
                err_detail = err_json.get("error", {}).get("message") or str(err_json)
            except Exception:
                err_detail = exc.response.text[:300]

            status = exc.response.status_code
            safe_msg, cat = classify_ai_error(status, err_detail)

            # Check if text model fallback is viable on 404, 429, 5xx, or model error
            current_model = payload.get("model", "")
            is_text_request = current_model == text_model and not message_has_image(payload.get("messages", []))
            if is_text_request and fallback_model and fallback_model != current_model and status in (404, 429, 500, 502, 503, 504):
                logger.warning(
                    "Primary text model %s failed with status %d (%s). Attempting seamless fallback to %s",
                    current_model, status, err_detail, fallback_model
                )
                fallback_payload = dict(payload)
                fallback_payload["model"] = fallback_model
                try:
                    return await _call(fallback_payload)
                except Exception as fallback_exc:
                    logger.error("Fallback model %s also failed: %s", fallback_model, fallback_exc)

            logger.error("Groq HTTP %d error [%s]: %s", status, cat, err_detail)
            raise AIResponseError(
                f"Groq API error {status}: {err_detail}",
                status_code=status,
                user_safe_message=safe_msg,
                error_type=cat,
            ) from exc
        except httpx.RequestError as exc:
            logger.error("Groq network request error: %s", exc)
            raise AIResponseError(
                f"Could not connect to Groq API: {exc}",
                user_safe_message="Could not connect to the AI service. Please check network connectivity and try again.",
                error_type="network_error",
            ) from exc

    async def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        messages: Optional[list[dict]] = None,
        reasoning_effort: str = "medium",
        temperature: float = 0.4,
    ) -> str:
        """
        Generates text using the primary text model (openai/gpt-oss-120b).
        """
        model = self.select_model(has_image=False)
        formatted_messages = []
        if system_prompt:
            formatted_messages.append({"role": "system", "content": system_prompt})
        if messages:
            formatted_messages.extend(messages)
        if prompt:
            formatted_messages.append({"role": "user", "content": prompt})

        payload: dict[str, Any] = {
            "model": model,
            "messages": formatted_messages,
            "temperature": temperature,
        }
        if "gpt-oss" in model:
            payload["reasoning_effort"] = reasoning_effort

        data = await self._post_chat_completion(payload)
        choices = data.get("choices") or []
        if not choices:
            raise AIResponseError("AI returned an empty response.", user_safe_message="AI returned an empty response.")
        return choices[0]["message"].get("content", "").strip()

    async def generate_with_tools(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]],
        model_override: Optional[str] = None,
        reasoning_effort: str = "medium",
        temperature: float = 0.3,
    ) -> dict[str, Any]:
        """
        Executes a chat turn with tool-calling support.
        Routes multimodal messages to vision model, text-only to openai/gpt-oss-120b.
        """
        has_img = message_has_image(messages)
        model = model_override or self.select_model(has_image=has_img)

        payload: dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
        }
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"

        if "gpt-oss" in model and not has_img:
            payload["reasoning_effort"] = reasoning_effort

        data = await self._post_chat_completion(payload)
        choices = data.get("choices") or []
        if not choices:
            raise AIResponseError("AI returned an empty choice set.", user_safe_message="AI returned an empty response.")
        return choices[0]["message"]

    async def generate_structured(
        self,
        schema: Type[T],
        prompt: str,
        system_prompt: Optional[str] = None,
        messages: Optional[list[dict]] = None,
        reasoning_effort: str = "medium",
        temperature: float = 0.2,
    ) -> T:
        """
        Uses openai/gpt-oss-120b with JSON mode to produce structured outputs,
        validated with the given Pydantic schema.
        """
        model = self.select_model(has_image=False)
        schema_props = json.dumps(schema.model_json_schema(), indent=2)
        json_instruction = (
            f"You MUST respond strictly with a valid JSON object matching this JSON Schema specification:\n{schema_props}"
        )
        prompt = f"{prompt or ''}\n\n{json_instruction}".strip()

        formatted_messages = []
        if system_prompt:
            formatted_messages.append({"role": "system", "content": system_prompt})
        if messages:
            formatted_messages.extend(messages)
        if prompt:
            formatted_messages.append({"role": "user", "content": prompt})

        payload: dict[str, Any] = {
            "model": model,
            "messages": formatted_messages,
            "temperature": temperature,
            "response_format": {"type": "json_object"},
        }
        if "gpt-oss" in model:
            payload["reasoning_effort"] = reasoning_effort

        data = await self._post_chat_completion(payload)
        choices = data.get("choices") or []
        if not choices:
            raise AIResponseError("AI returned an empty response.", user_safe_message="AI returned an empty response.")

        raw_content = choices[0]["message"].get("content", "").strip()
        cleaned = re.sub(r"^```json\s*|```\s*$", "", raw_content.strip())
        json_match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if json_match:
            cleaned = json_match.group(0)

        try:
            parsed = json.loads(cleaned)
            return schema.model_validate(parsed)
        except (json.JSONDecodeError, ValidationError) as exc:
            logger.warning("Failed to validate structured output against %s: %s\nRaw output: %s", schema.__name__, exc, raw_content[:400])
            raise AIResponseError(
                f"Model response did not conform to schema {schema.__name__}: {exc}",
                user_safe_message="AI returned an unparseable response structure. Please retry."
            ) from exc

    async def analyze_image(
        self,
        prompt: str,
        image_url: str,
        temperature: float = 0.2,
    ) -> str:
        """
        Multimodal visual analysis using qwen/qwen3.8-27b.
        Never calls GPT-OSS 120B with image inputs.
        """
        model = self.select_model(has_image=True)
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": image_url}},
                ],
            }
        ]
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
        }
        data = await self._post_chat_completion(payload)
        choices = data.get("choices") or []
        if not choices:
            raise AIResponseError("Vision model returned an empty response.")
        return choices[0]["message"].get("content", "").strip()

    async def analyze_image_structured(
        self,
        schema: Type[T],
        prompt: str,
        image_url: str,
        temperature: float = 0.2,
    ) -> T:
        """
        Visual analysis returning validated Pydantic schema using qwen/qwen3.8-27b.
        """
        model = self.select_model(has_image=True)
        schema_props = json.dumps(schema.model_json_schema(), indent=2)
        json_instruction = (
            f"\n\nYou MUST respond ONLY with a single valid JSON object matching this JSON Schema specification:\n{schema_props}\n"
            "Do not include markdown ticks, extra commentary, or conversational text."
        )
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt + json_instruction},
                    {"type": "image_url", "image_url": {"url": image_url}},
                ],
            }
        ]
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "response_format": {"type": "json_object"},
        }
        data = await self._post_chat_completion(payload)
        choices = data.get("choices") or []
        if not choices:
            raise AIResponseError("Vision model returned an empty response.")

        raw_content = choices[0]["message"].get("content", "").strip()
        cleaned = re.sub(r"^```json\s*|```\s*$", "", raw_content.strip())
        json_match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if json_match:
            cleaned = json_match.group(0)

        try:
            parsed = json.loads(cleaned)
            return schema.model_validate(parsed)
        except (json.JSONDecodeError, ValidationError) as exc:
            logger.warning("Failed to validate vision output against %s: %s", schema.__name__, exc)
            raise AIResponseError(
                f"Vision output did not conform to schema {schema.__name__}: {exc}",
                user_safe_message="Visual analysis structure could not be parsed."
            ) from exc

    def health_check(self) -> dict[str, Any]:
        """Returns the active AI configuration and model routing status."""
        configured = bool(settings.GROQ_API_KEY)
        return {
            "status": "ok" if configured else "unconfigured",
            "provider": "groq",
            "configured": configured,
            "primary_text_model": settings.text_model,
            "vision_model": settings.vision_model,
            "fallback_text_model": settings.GROQ_FALLBACK_TEXT_MODEL,
        }


# Global singleton instance
ai_service = AIService()
