import logging
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config.settings import settings
from backend.utils.logger import setup_logger

# Set up logger
logger = setup_logger("SHEMS")

# Import routers
from backend.routes.auth import router as auth_router
from backend.routes.dashboard import router as dashboard_router
from backend.routes.rooms import router as rooms_router
from backend.routes.alerts import router as alerts_router
from backend.routes.equipment import router as equipment_router
from backend.routes.settings import router as settings_router
from backend.routes.prediction import router as prediction_router
from backend.routes.energy import router as energy_router
from backend.routes.recommendation import router as recommendation_router
from backend.routes.maintenance import router as maintenance_router

# Initialize FastAPI App
app = FastAPI(
    title=settings.APP_NAME,
    description="Enterprise-grade Smart Hospital Energy Management System (BEMS) Backend Engine.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Apply CORS middleware rules
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(rooms_router)
app.include_router(alerts_router)
app.include_router(equipment_router)
app.include_router(settings_router)
app.include_router(prediction_router)
app.include_router(energy_router)
app.include_router(recommendation_router)
app.include_router(maintenance_router)

# Health check endpoint
@app.get("/api/ping", tags=["System"])
async def ping_system():
    logger.info("Handshake ping received.")
    return {
        "status": "online",
        "mode": "production" if settings.FIREBASE_CREDENTIALS_PATH else "sandbox",
        "service": "SHEMS FastAPI Service"
    }

# Compatibility routes
@app.get("/api/analytics/ai", tags=["AI Engine"])
async def get_ai_analytics_compat():
    from backend.routes.prediction import get_prediction_insights
    return await get_prediction_insights()

@app.post("/api/reports/generate", tags=["Energy telemetry"])
async def generate_report_compat(payload: dict = {}):
    from backend.routes.energy import generate_report
    return await generate_report(payload)

@app.on_event("startup")
async def on_startup():
    logger.info("=" * 60)
    logger.info(f" Starting {settings.APP_NAME} on port {settings.PORT} ")
    logger.info("=" * 60)

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=settings.PORT, reload=settings.DEBUG)
