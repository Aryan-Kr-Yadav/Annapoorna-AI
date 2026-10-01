"""
Centralized application settings, loaded from environment variables.
Never hardcode secrets here — everything comes from the environment
(.env locally, real env vars in Render/Railway/Vercel).
"""
from functools import lru_cache
from typing import List, Optional

# pyrefly: ignore [missing-import]
from pydantic import Field
# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- App ---
    ENVIRONMENT: str = Field(default="development")
    API_V1_PREFIX: str = "/api/v1"
    FRONTEND_URL: str = "http://localhost:3000"

    # --- Database ---
    DATABASE_URL: str = Field(
        default="postgresql+psycopg://postgres:postgres@localhost:5432/annapoorna"
    )
    DATABASE_URL_UNPOOLED: Optional[str] = None

    # --- Auth (Neon Auth / Managed Better Auth) ---
    # JWKS URL published by Neon Auth, used to verify RS256 JWTs.
    NEON_AUTH_JWKS_URL: str = Field(
        default="",
        description="JWKS endpoint for Neon Auth JWT verification",
    )
    # When true, auth is bypassed and a fixed dev user is used.
    # NEVER set true in production.
    DEV_AUTH_BYPASS: bool = False

    # --- AI (Groq / OpenAI-compatible) ---
    GROQ_API_KEY: Optional[str] = None
    GROQ_API_BASE: str = "https://api.groq.com/openai/v1"
    GROQ_CHAT_MODEL: str = "openai/gpt-oss-120b"
    GROQ_TEXT_MODEL: Optional[str] = None
    GROQ_VISION_MODEL: str = "qwen/qwen3.8-27b"
    GROQ_FALLBACK_TEXT_MODEL: str = "openai/gpt-oss-20b"

    @property
    def text_model(self) -> str:
        return self.GROQ_TEXT_MODEL or self.GROQ_CHAT_MODEL or "openai/gpt-oss-120b"

    @property
    def vision_model(self) -> str:
        return self.GROQ_VISION_MODEL or "qwen/qwen3.8-27b"

    # --- Weather ---
    WEATHER_API_KEY: Optional[str] = None
    WEATHER_PROVIDER: str = "openweathermap"  # swap-able abstraction

    # --- Market data ---
    MARKET_DATA_API_KEY: Optional[str] = None
    MARKET_DATA_BASE_URL: Optional[str] = None

    # --- Image storage ---
    STORAGE_PROVIDER: str = "cloudinary"  # or "s3"
    CLOUDINARY_URL: Optional[str] = None
    S3_BUCKET: Optional[str] = None
    S3_REGION: Optional[str] = None
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None

    # --- Rate limiting ---
    RATE_LIMIT_PER_MINUTE: int = 60
    AI_RATE_LIMIT_PER_MINUTE: int = 15

    @property
    def cors_origins(self) -> List[str]:
        origins = [o.strip() for o in self.FRONTEND_URL.split(',') if o.strip()]
        for fb in ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8000', 'http://127.0.0.1:8000']:
            if fb not in origins:
                origins.append(fb)
        return origins


@lru_cache
def get_settings() -> Settings:
    return Settings()
