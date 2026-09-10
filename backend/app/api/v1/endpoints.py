from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.agriculture import CropHealthRecord, DiseaseDetection, PestPrediction, SoilAnalysis
from app.models.iot import WaterPrediction, Alert, AlertType, AlertSeverity
from app.models.market import HarvestPrediction, ProfitPrediction
from app.schemas import *
from app.models.farm import Farm, Field, CropCycle, CropType, CropCycleStatus
from app.ml.inference import (
    disease_model, crop_health_model, water_model, pest_model,
    harvest_model, market_model, soil_model, assistant_engine,
)
from app.services.public_apis import fetch_live_weather, fetch_live_soil, geocode_location

router = APIRouter(prefix="/farms", tags=["Farms"])
fields_router = APIRouter(prefix="/fields", tags=["Fields"])
health_router = APIRouter(prefix="/crop-health", tags=["Crop Health"])
disease_router = APIRouter(prefix="/disease", tags=["Disease Detection"])
pest_router = APIRouter(prefix="/pest", tags=["Pest Prediction"])
soil_router = APIRouter(prefix="/soil", tags=["Soil Analysis"])
water_router = APIRouter(prefix="/water", tags=["Water Management"])
irrigation_router = APIRouter(prefix="/irrigation", tags=["Irrigation"])
alert_router = APIRouter(prefix="/alerts", tags=["Alerts"])
weather_router = APIRouter(prefix="/weather", tags=["Weather"])
fertilizer_router = APIRouter(prefix="/fertilizer", tags=["Fertilizer"])
harvest_router = APIRouter(prefix="/harvest", tags=["Harvest"])
market_router = APIRouter(prefix="/market", tags=["Market Intelligence"])
profit_router = APIRouter(prefix="/profit", tags=["Profit Prediction"])
assistant_router = APIRouter(prefix="/assistant", tags=["AI Assistant"])
sensor_router = APIRouter(prefix="/sensors", tags=["IoT Sensors"])
report_router = APIRouter(prefix="/reports", tags=["Reports"])


# ─── Farm Management ───────────────────────────────────────────

@router.get("/", response_model=list[FarmResponse])
async def list_farms(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Farm).where(Farm.user_id == current_user.id))
    return result.scalars().all()


@router.post("/", response_model=FarmResponse, status_code=201)
async def create_farm(data: FarmCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    farm = Farm(user_id=current_user.id, **data.model_dump())
    db.add(farm)
    await db.flush()
    return farm


@router.post("/{farm_id}/fields", response_model=FieldResponse, status_code=201)
async def create_field(farm_id: UUID, data: FieldCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    farm = await db.get(Farm, farm_id)
    if not farm or farm.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Farm not found")
    field = Field(farm_id=farm_id, **data.model_dump())
    db.add(field)
    await db.flush()
    return field


@router.get("/{farm_id}/fields", response_model=list[FieldResponse])
async def list_fields(farm_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    farm = await db.get(Farm, farm_id)
    if not farm or farm.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Farm not found")
    result = await db.execute(select(Field).where(Field.farm_id == farm_id))
    return result.scalars().all()


@router.get("/{farm_id}", response_model=FarmResponse)
async def get_farm(farm_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    farm = await db.get(Farm, farm_id)
    if not farm or farm.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Farm not found")
    return farm


@fields_router.get("/{field_id}", response_model=FieldResponse)
async def get_field(field_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Field).join(Farm).where(
            Field.id == field_id,
            Farm.user_id == current_user.id
        )
    )
    field = result.scalar_one_or_none()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    return field


@router.get("/fields/{field_id}/active-cycle")
async def get_active_cycle(field_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CropCycle).join(Field).join(Farm).where(
            Field.id == field_id,
            Farm.user_id == current_user.id,
            CropCycle.status == CropCycleStatus.active
        )
    )
    cycle = result.scalar_one_or_none()
    if not cycle:
        # Fallback to any recent cycle if no active is explicitly marked
        result_any = await db.execute(
            select(CropCycle).join(Field).join(Farm).where(
                Field.id == field_id,
                Farm.user_id == current_user.id
            ).order_by(CropCycle.sowing_date.desc()).limit(1)
        )
        cycle = result_any.scalar_one_or_none()
        if not cycle:
            raise HTTPException(status_code=404, detail="Active crop cycle not found for this field")
            
    # Load crop type info
    crop_type = await db.get(CropType, cycle.crop_type_id)
    
    return {
        "id": str(cycle.id),
        "field_id": str(cycle.field_id),
        "crop_type_id": str(cycle.crop_type_id),
        "crop_name": crop_type.name if crop_type else "Unknown",
        "sowing_date": cycle.sowing_date.isoformat(),
        "expected_harvest": cycle.expected_harvest.isoformat() if cycle.expected_harvest else None,
        "growth_stage": cycle.growth_stage.value,
        "health_score": cycle.health_score,
        "status": cycle.status.value,
    }


# ─── Module 1: Crop Health ─────────────────────────────────────

@health_router.post("/analyze", response_model=CropHealthResult)
async def analyze_crop_health(
    file: UploadFile = File(...),
    field_id: UUID = Form(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    image_bytes = await file.read()
    result = crop_health_model.analyze(image_bytes)

    # Find active crop cycle
    cycles = await db.execute(
        select(CropCycle).join(Field).where(Field.id == field_id, CropCycle.status == "active")
    )
    cycle = cycles.scalar_one_or_none()

    if cycle:
        record = CropHealthRecord(
            crop_cycle_id=cycle.id,
            health_score=result["health_score"],
            ndvi=result["ndvi"],
            detections=result["detections"],
            growth_stage=result["growth_stage"],
        )
        cycle.health_score = result["health_score"]
        db.add(record)

    return CropHealthResult(
        health_score=result["health_score"],
        ndvi=result["ndvi"],
        status=result["status"],
        detections=result["detections"],
        growth_stage=result["growth_stage"],
        recommendations=result["recommendations"],
    )


# ─── Module 2: Disease Detection ───────────────────────────────

@disease_router.post("/detect", response_model=DiseaseResult)
async def detect_disease(
    file: UploadFile = File(...),
    crop_cycle_id: UUID = Form(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    image_bytes = await file.read()
    result = disease_model.predict(image_bytes)

    detection = DiseaseDetection(
        crop_cycle_id=crop_cycle_id,
        disease_name=result["disease_name"],
        severity=result["severity"],
        confidence=result["confidence"],
        affected_area_pct=result.get("affected_area_pct", 0),
        treatment=result.get("treatment", {}),
    )
    db.add(detection)

    if result["severity"] in ("moderate", "severe"):
        alert = Alert(
            user_id=current_user.id,
            alert_type=AlertType.disease_detected,
            severity=AlertSeverity.critical if result["severity"] == "severe" else AlertSeverity.warning,
            title=f"Disease Detected: {result['disease_name']}",
            message=f"{result['severity'].title()} severity detected with {result['confidence']*100:.0f}% confidence",
            channels=["push", "sms"],
        )
        db.add(alert)

    return DiseaseResult(
        disease_name=result["disease_name"],
        severity=result["severity"],
        confidence=result["confidence"],
        affected_area_pct=result.get("affected_area_pct", 0),
        treatment=result.get("treatment", {}),
    )


# ─── Module 3: Pest Prediction ─────────────────────────────────

@pest_router.get("/predict/{crop_cycle_id}", response_model=PestPredictionResult)
async def predict_pest(crop_cycle_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    cycle = await db.get(CropCycle, crop_cycle_id)
    if not cycle:
        raise HTTPException(status_code=404, detail="Crop cycle not found")

    crop_type = await db.get(CropType, cycle.crop_type_id)
    result = pest_model.predict(crop_type.name if crop_type else "rice", 32.0, 75.0, 35.0)

    prediction = PestPrediction(
        crop_cycle_id=crop_cycle_id,
        risk_level=result["risk_level"],
        pest_name=result["pest_name"],
        predicted_outbreak=result.get("predicted_outbreak_date"),
        confidence=result["confidence"],
        factors=result["factors"],
        preventive_actions=result["preventive_actions"],
    )
    db.add(prediction)

    return PestPredictionResult(**result)


# ─── Module 4: Soil Analysis ───────────────────────────────────

@soil_router.post("/analyze", response_model=SoilAnalysisResult)
async def analyze_soil(data: SoilAnalysisInput, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = soil_model.analyze(data.model_dump(exclude={"crop_cycle_id"}))

    analysis = SoilAnalysis(
        crop_cycle_id=data.crop_cycle_id,
        health_score=result["health_score"],
        moisture=data.moisture,
        ph=data.ph,
        nitrogen=data.nitrogen,
        phosphorus=data.phosphorus,
        potassium=data.potassium,
        organic_carbon=data.organic_carbon,
        ec=data.ec,
        temperature=data.temperature,
        recommendations=result["recommendations"],
    )
    db.add(analysis)
    return SoilAnalysisResult(**result)


# ─── Module 5: Water Prediction ────────────────────────────────

@water_router.get("/predict/{field_id}", response_model=WaterPredictionResult)
async def predict_water(field_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    field = await db.get(Field, field_id)
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    cycles = await db.execute(select(CropCycle).where(CropCycle.field_id == field_id, CropCycle.status == "active"))
    cycle = cycles.scalar_one_or_none()
    crop_type = await db.get(CropType, cycle.crop_type_id) if cycle else None

    result = water_model.predict(
        crop_type=crop_type.name if crop_type else "rice",
        growth_stage=cycle.growth_stage.value if cycle else "vegetative",
        area_acres=field.area_acres,
        soil_moisture=28.5,
        temperature=34.0,
        humidity=65.0,
        rainfall_forecast=0.0,
    )

    if cycle:
        prediction = WaterPrediction(
            crop_cycle_id=cycle.id,
            daily_requirement_liters=result["daily_requirement_liters"],
            per_acre_liters=result["per_acre_liters"],
            per_plant_liters=result.get("per_plant_liters"),
            water_saving_pct=result["water_saving_pct"],
            next_irrigation=result.get("next_irrigation"),
            remaining_moisture=result.get("remaining_moisture_pct"),
            evapotranspiration_mm=result.get("evapotranspiration_mm"),
            factors=result["factors"],
        )
        db.add(prediction)

    return WaterPredictionResult(
        daily_requirement_liters=result["daily_requirement_liters"],
        per_acre_liters=result["per_acre_liters"],
        per_plant_liters=result.get("per_plant_liters"),
        water_saving_pct=result["water_saving_pct"],
        next_irrigation=result.get("next_irrigation"),
        remaining_moisture_pct=result.get("remaining_moisture_pct"),
        evapotranspiration_mm=result.get("evapotranspiration_mm"),
        factors=result["factors"],
    )


# ─── Module 6: Irrigation ──────────────────────────────────────

@irrigation_router.get("/recommend/{field_id}", response_model=IrrigationRecommendation)
async def recommend_irrigation(field_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    field = await db.get(Field, field_id)
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    soil_moisture = 28.5
    if soil_moisture < 30:
        action = "start"
        amount = 4200
        reason = "Soil moisture below threshold (30%), no rain forecast for 24h"
    elif soil_moisture > 45:
        action = "stop"
        amount = 0
        reason = "Soil moisture adequate, overwatering risk detected"
    else:
        action = "delay"
        amount = 0
        reason = "Rain expected in next 12 hours, delay irrigation to save water"

    return IrrigationRecommendation(
        action=action,
        water_amount_liters=amount,
        duration_minutes=45 if action == "start" else None,
        efficiency_pct=87.5,
        schedule=[{"time": "06:00", "action": action, "amount_liters": amount}] if action == "start" else [],
        reason=reason,
    )


# ─── Module 7: Alerts ──────────────────────────────────────────

@alert_router.get("/", response_model=list[AlertResponse])
async def list_alerts(
    unread_only: bool = False,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Alert).where(Alert.user_id == current_user.id)
    if unread_only:
        query = query.where(Alert.is_read == False)
    query = query.order_by(Alert.created_at.desc()).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@alert_router.patch("/{alert_id}/read")
async def mark_alert_read(alert_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    alert = await db.get(Alert, alert_id)
    if not alert or alert.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = True
    return {"status": "read"}


# ─── Module 8: Weather ───────────────────────────────────────────

@weather_router.get("/forecast/{field_id}")
async def get_weather_forecast(field_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from datetime import date, timedelta
    import random

    field = await db.get(Field, field_id)
    farm = await db.get(Farm, field.farm_id) if field else None

    # Determine latitude & longitude (from farm, or geocode state/district, or fallback to default)
    lat, lon = 28.6139, 77.2090  # Default: New Delhi / North India agri belt
    location_name = "Default Region"

    if farm:
        if farm.latitude and farm.longitude:
            lat, lon = farm.latitude, farm.longitude
            location_name = farm.name
        elif farm.district or farm.state:
            query = f"{farm.district or ''}, {farm.state or ''}, India"
            coords = geocode_location(query)
            if coords:
                lat, lon = coords["latitude"], coords["longitude"]
                location_name = f"{farm.district or ''}, {farm.state or ''}"

    # Fetch live weather forecast from Open-Meteo public API
    live_forecast = fetch_live_weather(latitude=lat, longitude=lon)

    if live_forecast:
        alerts = []
        for day in live_forecast[:3]:
            if day.get("rainfall_mm", 0) > 10.0:
                alerts.append(f"Heavy rain expected on {day['date']} ({day['rainfall_mm']}mm). Plan irrigation accordingly.")
            if day.get("temperature_max", 0) > 38.0:
                alerts.append(f"High temperature alert on {day['date']} ({day['temperature_max']}°C). Ensure adequate crop hydration.")

        return {
            "field_id": str(field_id),
            "location": location_name,
            "coordinates": {"latitude": lat, "longitude": lon},
            "source": "Open-Meteo (Public API - Live)",
            "forecast": live_forecast,
            "alerts": alerts,
        }

    # Fallback to simulated forecast if network is unreachable
    forecast = []
    for i in range(7):
        d = date.today() + timedelta(days=i)
        forecast.append({
            "date": d.isoformat(),
            "temperature_min": round(random.uniform(22, 28), 1),
            "temperature_max": round(random.uniform(32, 38), 1),
            "humidity": round(random.uniform(55, 85), 0),
            "rainfall_mm": round(random.uniform(0, 15), 1),
            "wind_speed": round(random.uniform(5, 20), 1),
            "uv_index": round(random.uniform(3, 10), 1),
            "cloud_cover": round(random.uniform(10, 80), 0),
            "description": random.choice(["Clear", "Partly Cloudy", "Cloudy", "Light Rain", "Thunderstorm"]),
            "source": "Simulated (Offline Fallback)",
        })
    return {"field_id": str(field_id), "forecast": forecast, "alerts": []}


@weather_router.get("/soil-conditions/{field_id}")
async def get_field_soil_conditions(field_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    field = await db.get(Field, field_id)
    farm = await db.get(Farm, field.farm_id) if field else None

    lat, lon = 28.6139, 77.2090
    if farm and farm.latitude and farm.longitude:
        lat, lon = farm.latitude, farm.longitude
    elif farm and (farm.district or farm.state):
        coords = geocode_location(f"{farm.district or ''}, {farm.state or ''}, India")
        if coords:
            lat, lon = coords["latitude"], coords["longitude"]

    soil_data = fetch_live_soil(latitude=lat, longitude=lon)
    if soil_data:
        return {"field_id": str(field_id), "soil_conditions": soil_data}

    return {
        "field_id": str(field_id),
        "soil_conditions": {
            "soil_temperature_surface_c": 27.5,
            "soil_temperature_root_c": 25.0,
            "soil_moisture_surface_pct": 28.0,
            "soil_moisture_deep_pct": 32.0,
            "source": "Simulated (Offline Fallback)",
        }
    }


# ─── Module 9: Fertilizer ────────────────────────────────────────

@fertilizer_router.get("/recommend/{crop_cycle_id}", response_model=FertilizerRecommendation)
async def recommend_fertilizer(crop_cycle_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    cycle = await db.get(CropCycle, crop_cycle_id)
    crop_type = await db.get(CropType, cycle.crop_type_id) if cycle else None
    npk = crop_type.npk_requirements if crop_type and crop_type.npk_requirements else {"N": 120, "P": 60, "K": 40}

    return FertilizerRecommendation(
        npk_requirement=npk,
        micronutrients=["Zinc", "Boron"],
        organic_alternatives=["Vermicompost 2 tonnes/acre", "Neem cake 100 kg/acre"],
        application={
            "timing": "Split application at tillering and panicle initiation",
            "quantity_per_acre": {"Urea": "130 kg", "DAP": "130 kg", "MOP": "67 kg"},
        },
    )


# ─── Module 10: Harvest Prediction ───────────────────────────────

@harvest_router.get("/predict/{crop_cycle_id}", response_model=HarvestPredictionResult)
async def predict_harvest(crop_cycle_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    cycle = await db.get(CropCycle, crop_cycle_id)
    if not cycle:
        raise HTTPException(status_code=404, detail="Crop cycle not found")

    crop_type = await db.get(CropType, cycle.crop_type_id)
    result = harvest_model.predict(
        crop_type.name if crop_type else "rice",
        cycle.sowing_date,
        int(crop_type.growth_duration_days) if crop_type else 120,
        cycle.health_score,
    )

    prediction = HarvestPrediction(
        crop_cycle_id=crop_cycle_id,
        readiness_pct=result["readiness_pct"],
        recommended_date=result["recommended_date"],
        harvest_window_start=result["harvest_window"]["start"],
        harvest_window_end=result["harvest_window"]["end"],
        expected_yield_quintals=result["expected_yield_quintals"],
        confidence=result["confidence"],
        factors=result["factors"],
    )
    db.add(prediction)

    return HarvestPredictionResult(
        readiness_pct=result["readiness_pct"],
        recommended_date=result["recommended_date"],
        harvest_window=result["harvest_window"],
        expected_yield_quintals=result["expected_yield_quintals"],
        confidence=result["confidence"],
        factors=result["factors"],
    )


# ─── Module 12-14: Market Intelligence ─────────────────────────

@market_router.get("/prices/{crop_type_id}")
async def get_market_prices(crop_type_id: UUID, state: str = "Punjab", current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    crop_type = await db.get(CropType, crop_type_id)
    prices = market_model.get_prices(crop_type.name if crop_type else "rice", state)
    return {"prices": prices}


@market_router.get("/sell-recommendation/{crop_cycle_id}", response_model=SellRecommendation)
async def sell_recommendation(crop_cycle_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    cycle = await db.get(CropCycle, crop_cycle_id)
    crop_type = await db.get(CropType, cycle.crop_type_id) if cycle else None
    field = await db.get(Field, cycle.field_id) if cycle else None

    result = market_model.recommend_sell(
        crop_type.name if crop_type else "rice",
        42.5,
        field.area_acres if field else 4.0,
    )
    return SellRecommendation(**result)


# ─── Module 15: Profit Prediction ────────────────────────────────

@profit_router.get("/predict/{crop_cycle_id}", response_model=ProfitPredictionResult)
async def predict_profit(crop_cycle_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    cycle = await db.get(CropCycle, crop_cycle_id)
    crop_type = await db.get(CropType, cycle.crop_type_id) if cycle else None
    sell_rec = market_model.recommend_sell(crop_type.name if crop_type else "rice", 42.5, 4.0)

    current_value = sell_rec["current_price"] * 42.5
    future_value = sell_rec["predicted_price_next_week"] * 42.5
    costs = {"harvest": 8500, "storage": 3200, "transport": 4500, "total": 16200}

    scenarios = {
        "sell_today": {"net_profit": round(current_value - costs["total"], 0)},
        "sell_next_week": {"net_profit": round(future_value - costs["total"], 0)},
        "store_1_month": {"net_profit": round(future_value * 1.05 - costs["total"] - costs["storage"] * 2, 0)},
    }
    best = max(scenarios, key=lambda k: scenarios[k]["net_profit"])

    return ProfitPredictionResult(
        expected_yield_quintals=42.5,
        current_market_value=round(current_value, 0),
        future_market_value=round(future_value, 0),
        costs=costs,
        scenarios=scenarios,
        best_scenario=best,
    )


# ─── Module 16: AI Assistant ─────────────────────────────────────

@assistant_router.post("/query", response_model=AssistantResponse)
async def ask_assistant(data: AssistantQuery, current_user: User = Depends(get_current_user)):
    result = assistant_engine.process_query(data.query)
    return AssistantResponse(**result)


# ─── IoT Sensors ─────────────────────────────────────────────────

@sensor_router.post("/reading")
async def ingest_sensor_reading(data: SensorReadingInput, db: AsyncSession = Depends(get_db)):
    from app.models.iot import SensorReading, SensorType, IoTDevice

    device_result = await db.execute(select(IoTDevice).where(IoTDevice.device_id == data.device_id))
    device = device_result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not registered")

    reading = SensorReading(
        device_id=device.id,
        field_id=device.field_id,
        sensor_type=SensorType(data.sensor_type),
        value=data.value,
        unit=data.unit,
    )
    db.add(reading)

    # Auto-alert for critical soil moisture
    if data.sensor_type == "soil_moisture" and data.value < 15:
        field = await db.get(Field, device.field_id)
        farm = await db.get(Farm, field.farm_id) if field else None
        if farm:
            alert = Alert(
                user_id=farm.user_id,
                field_id=device.field_id,
                alert_type=AlertType.low_moisture,
                severity=AlertSeverity.critical,
                title="Critical: Low Soil Moisture",
                message=f"Soil moisture at {data.value}% - immediate irrigation required",
                channels=["push", "sms"],
            )
            db.add(alert)

    return {"status": "recorded", "value": data.value}


@sensor_router.get("/{field_id}/latest")
async def get_latest_readings(field_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.models.iot import SensorReading
    result = await db.execute(
        select(SensorReading).where(SensorReading.field_id == field_id)
        .order_by(SensorReading.recorded_at.desc()).limit(20)
    )
    readings = result.scalars().all()
    return [{"sensor_type": r.sensor_type.value, "value": r.value, "unit": r.unit, "recorded_at": r.recorded_at.isoformat()} for r in readings]


# ─── Reports ─────────────────────────────────────────────────────

@report_router.post("/generate")
async def generate_report(data: ReportRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.models.market import Report, ReportType, ReportFormat
    report = Report(
        user_id=current_user.id,
        report_type=ReportType(data.report_type),
        period=data.period,
        format=ReportFormat(data.format),
        summary={"status": "generated", "type": data.report_type, "period": data.period},
    )
    db.add(report)
    await db.flush()
    return {"report_id": str(report.id), "status": "generated", "format": data.format}


# ─── Crop Types ──────────────────────────────────────────────────

@router.get("/crop-types")
async def list_crop_types(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CropType))
    types = result.scalars().all()
    if not types:
        # Seed default crop types
        defaults = [
            CropType(name="Rice", scientific_name="Oryza sativa", growth_duration_days=120,
                     water_coefficients={"initial": 1.05, "mid_season": 1.20},
                     npk_requirements={"N": 120, "P": 60, "K": 40}),
            CropType(name="Wheat", scientific_name="Triticum aestivum", growth_duration_days=120,
                     water_coefficients={"initial": 0.70, "mid_season": 1.15},
                     npk_requirements={"N": 120, "P": 60, "K": 40}),
            CropType(name="Cotton", scientific_name="Gossypium", growth_duration_days=180,
                     water_coefficients={"initial": 0.40, "mid_season": 1.15},
                     npk_requirements={"N": 100, "P": 50, "K": 50}),
            CropType(name="Tomato", scientific_name="Solanum lycopersicum", growth_duration_days=90,
                     water_coefficients={"initial": 0.60, "mid_season": 1.15},
                     npk_requirements={"N": 100, "P": 50, "K": 60}),
        ]
        for ct in defaults:
            db.add(ct)
        await db.flush()
        result = await db.execute(select(CropType))
        types = result.scalars().all()

    return [{"id": str(t.id), "name": t.name, "scientific_name": t.scientific_name,
             "growth_duration_days": t.growth_duration_days} for t in types]
