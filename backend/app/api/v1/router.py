from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.endpoints import (
    router as farms_router,
    fields_router,
    health_router, disease_router, pest_router, soil_router,
    water_router, irrigation_router, alert_router, weather_router,
    fertilizer_router, harvest_router, market_router, profit_router,
    assistant_router, sensor_router, report_router,
)

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(farms_router)
api_router.include_router(fields_router)
api_router.include_router(health_router)
api_router.include_router(disease_router)
api_router.include_router(pest_router)
api_router.include_router(soil_router)
api_router.include_router(water_router)
api_router.include_router(irrigation_router)
api_router.include_router(alert_router)
api_router.include_router(weather_router)
api_router.include_router(fertilizer_router)
api_router.include_router(harvest_router)
api_router.include_router(market_router)
api_router.include_router(profit_router)
api_router.include_router(assistant_router)
api_router.include_router(sensor_router)
api_router.include_router(report_router)
