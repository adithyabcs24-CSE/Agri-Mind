from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from uuid import UUID


# Auth Schemas
class UserRegister(BaseModel):
    email: EmailStr
    phone: Optional[str] = None
    password: str = Field(min_length=8)
    full_name: str
    language: str = "en"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    language: str
    phone: Optional[str] = None

    class Config:
        from_attributes = True


# Farm Schemas
class FarmCreate(BaseModel):
    name: str
    total_area_acres: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    state: Optional[str] = None
    district: Optional[str] = None
    boundary_geojson: Optional[Dict] = None


class FieldCreate(BaseModel):
    name: str
    area_acres: float
    soil_type: str = "loam"
    boundary_geojson: Optional[Dict] = None


class CropCycleCreate(BaseModel):
    crop_type_id: UUID
    sowing_date: date
    expected_harvest: Optional[date] = None


class FarmResponse(BaseModel):
    id: UUID
    name: str
    total_area_acres: float
    latitude: Optional[float]
    longitude: Optional[float]
    state: Optional[str]
    district: Optional[str]

    class Config:
        from_attributes = True


class FieldResponse(BaseModel):
    id: UUID
    name: str
    area_acres: float
    soil_type: str
    status: str

    class Config:
        from_attributes = True


# Crop Health Schemas
class CropHealthResult(BaseModel):
    health_score: float
    ndvi: Optional[float]
    status: str
    detections: Dict[str, float]
    growth_stage: str
    recommendations: List[str]


# Disease Schemas
class DiseaseResult(BaseModel):
    disease_name: str
    severity: str
    confidence: float
    affected_area_pct: float
    treatment: Dict[str, Any]


# Pest Schemas
class PestPredictionResult(BaseModel):
    risk_level: str
    pest_name: str
    predicted_outbreak_date: Optional[date]
    confidence: float
    factors: Dict[str, Any]
    preventive_actions: List[str]


# Soil Schemas
class SoilAnalysisInput(BaseModel):
    crop_cycle_id: UUID
    moisture: Optional[float] = None
    ph: Optional[float] = None
    nitrogen: Optional[float] = None
    phosphorus: Optional[float] = None
    potassium: Optional[float] = None
    organic_carbon: Optional[float] = None
    ec: Optional[float] = None
    temperature: Optional[float] = None


class SoilAnalysisResult(BaseModel):
    health_score: float
    status: str
    deficiencies: List[str]
    recommendations: Dict[str, Any]


# Water Schemas
class WaterPredictionResult(BaseModel):
    daily_requirement_liters: float
    per_acre_liters: float
    per_plant_liters: Optional[float]
    water_saving_pct: float
    next_irrigation: Optional[datetime]
    remaining_moisture_pct: Optional[float]
    evapotranspiration_mm: Optional[float]
    factors: Dict[str, Any]


class IrrigationRecommendation(BaseModel):
    action: str
    water_amount_liters: float
    duration_minutes: Optional[int]
    efficiency_pct: float
    schedule: List[Dict[str, Any]]
    reason: str


# Weather Schemas
class WeatherForecast(BaseModel):
    date: date
    temperature_min: float
    temperature_max: float
    humidity: float
    rainfall_mm: float
    wind_speed: float
    uv_index: float
    cloud_cover: float
    description: str


# Fertilizer Schemas
class FertilizerRecommendation(BaseModel):
    npk_requirement: Dict[str, float]
    micronutrients: List[str]
    organic_alternatives: List[str]
    application: Dict[str, Any]


# Harvest Schemas
class HarvestPredictionResult(BaseModel):
    readiness_pct: float
    recommended_date: Optional[date]
    harvest_window: Dict[str, Optional[date]]
    expected_yield_quintals: float
    confidence: float
    factors: Dict[str, Any]


# Market Schemas
class MarketPriceResponse(BaseModel):
    market_name: str
    price_per_quintal: float
    msp: Optional[float]
    price_date: date
    state: Optional[str]


class SellRecommendation(BaseModel):
    recommendation: str
    current_price: float
    predicted_price: float
    expected_additional_profit: float
    reasoning: str
    markets: List[Dict[str, Any]]


# Profit Schemas
class ProfitPredictionResult(BaseModel):
    expected_yield_quintals: float
    current_market_value: float
    future_market_value: Optional[float]
    costs: Dict[str, float]
    scenarios: Dict[str, Dict[str, float]]
    best_scenario: str


# AI Assistant Schemas
class AssistantQuery(BaseModel):
    query: str
    field_id: Optional[UUID] = None
    language: str = "en"


class AssistantResponse(BaseModel):
    answer: str
    confidence: float
    sources: List[str]
    actions: List[Dict[str, Any]]


# IoT Schemas
class SensorReadingInput(BaseModel):
    device_id: str
    sensor_type: str
    value: float
    unit: str
    timestamp: Optional[datetime] = None


class AlertResponse(BaseModel):
    id: UUID
    alert_type: str
    severity: str
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Report Schemas
class ReportRequest(BaseModel):
    report_type: str
    period: str = "weekly"
    field_id: Optional[UUID] = None
    format: str = "pdf"
