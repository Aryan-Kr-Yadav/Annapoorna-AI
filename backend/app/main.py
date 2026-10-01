import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.routers import (
    analytics,
    auth,
    chat,
    crop_planner,
    crops,
    dashboard,
    expenses,
    farms,
    harvests,
    health,
    irrigation,
    market,
    notifications,
    schemes,
    soil,
    tasks,
    uploads,
    users,
    weather,
)

settings = get_settings()
logger = logging.getLogger("annapoorna")
logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="Annapoorna AI 2.0",
    description="Intelligent Farm Management & Decision-Support Platform API",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # Never leak stack traces to the client.
    logger.exception("Unhandled error on %s %s", request.method, request.url)
    return JSONResponse(status_code=500, content={"success": False, "message": "Something went wrong. Please try again."})


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"success": False, "message": exc.detail})


@app.get("/")
def root():
    return {"name": "Annapoorna AI 2.0 API", "status": "running", "docs": "/docs"}


@app.get("/health")
@app.get("/health-check")
@app.get(f"{settings.API_V1_PREFIX}/health-check")
@app.get(f"{settings.API_V1_PREFIX}/health")
def health_check():
    return {
        "status": "ok",
        "ai_provider": "groq",
        "ai_configured": bool(settings.GROQ_API_KEY),
        "ai_model": settings.text_model,
        "primary_text_model": settings.text_model,
        "vision_model": settings.vision_model,
        "fallback_text_model": settings.GROQ_FALLBACK_TEXT_MODEL,
        "auth_configured": bool(settings.NEON_AUTH_JWKS_URL),
        "database": "configured",
    }


API = settings.API_V1_PREFIX
app.include_router(auth.router, prefix=API)
app.include_router(users.router, prefix=API)
app.include_router(farms.router, prefix=API)
app.include_router(crops.router, prefix=API)
app.include_router(tasks.router, prefix=API)
app.include_router(weather.router, prefix=API)
app.include_router(irrigation.router, prefix=API)
app.include_router(soil.router, prefix=API)
app.include_router(health.router, prefix=API)
app.include_router(chat.router, prefix=API)
app.include_router(schemes.router, prefix=API)
app.include_router(market.router, prefix=API)
app.include_router(expenses.router, prefix=API)
app.include_router(harvests.router, prefix=API)
app.include_router(analytics.router, prefix=API)
app.include_router(notifications.router, prefix=API)
app.include_router(dashboard.router, prefix=API)
app.include_router(uploads.router, prefix=API)
app.include_router(crop_planner.router, prefix=API)
