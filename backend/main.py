"""
Entrypoint shim for ASGI servers and deployment environments defaulting to `main:app`.
Re-exports the FastAPI instance from `app.main`.
"""
from app.main import app

__all__ = ["app"]
