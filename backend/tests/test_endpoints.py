import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, UserRole
from app.models.farm import Farm, Field, CropType, CropCycle, GrowthStage, CropCycleStatus
from app.core.security import get_password_hash
from datetime import date, timedelta
import io

@pytest.fixture
async def seeded_data(db: AsyncSession):
    user = User(
        email="testowner@agrimind.ai",
        password_hash=get_password_hash("Password123"),
        full_name="Owner Farmer",
        role=UserRole.farmer,
    )
    db.add(user)
    await db.flush()

    crop_type = CropType(
        name="Rice",
        scientific_name="Oryza sativa",
        growth_duration_days=120,
        water_coefficients={"initial": 1.05, "mid_season": 1.20},
        npk_requirements={"N": 120, "P": 60, "K": 40}
    )
    db.add(crop_type)
    await db.flush()

    farm = Farm(
        user_id=user.id,
        name="Test Farm",
        total_area_acres=10.0,
        latitude=30.9010,
        longitude=75.8573,
        state="Punjab",
        district="Ludhiana"
    )
    db.add(farm)
    await db.flush()

    field = Field(
        farm_id=farm.id,
        name="Test Field A",
        area_acres=4.0,
        soil_type="clay_loam"
    )
    db.add(field)
    await db.flush()

    cycle = CropCycle(
        field_id=field.id,
        crop_type_id=crop_type.id,
        sowing_date=date.today() - timedelta(days=60),
        expected_harvest=date.today() + timedelta(days=60),
        growth_stage=GrowthStage.vegetative,
        health_score=85.0,
        status=CropCycleStatus.active
    )
    db.add(cycle)
    await db.flush()

    from app.core.security import create_access_token
    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    
    return {
        "user": user,
        "crop_type": crop_type,
        "farm": farm,
        "field": field,
        "cycle": cycle,
        "token": token,
    }

@pytest.mark.asyncio
async def test_crop_health_analyze(client: AsyncClient, seeded_data: dict):
    headers = {"Authorization": f"Bearer {seeded_data['token']}"}
    files = {"file": ("test.jpg", io.BytesIO(b"fake image data"), "image/jpeg")}
    data = {"field_id": str(seeded_data["field"].id)}

    response = await client.post("/api/v1/crop-health/analyze", headers=headers, files=files, data=data)
    assert response.status_code == 200
    res_data = response.json()
    assert "health_score" in res_data
    assert "ndvi" in res_data
    assert res_data["status"] in ("healthy", "moderate", "poor")

@pytest.mark.asyncio
async def test_disease_detection(client: AsyncClient, seeded_data: dict):
    headers = {"Authorization": f"Bearer {seeded_data['token']}"}
    files = {"file": ("leaf.jpg", io.BytesIO(b"fake leaf data"), "image/jpeg")}
    data = {"crop_cycle_id": str(seeded_data["cycle"].id)}

    response = await client.post("/api/v1/disease/detect", headers=headers, files=files, data=data)
    assert response.status_code == 200
    res_data = response.json()
    assert "disease_name" in res_data
    assert "severity" in res_data
    assert "confidence" in res_data

@pytest.mark.asyncio
async def test_pest_prediction(client: AsyncClient, seeded_data: dict):
    headers = {"Authorization": f"Bearer {seeded_data['token']}"}
    cycle_id = str(seeded_data["cycle"].id)

    response = await client.get(f"/api/v1/pest/predict/{cycle_id}", headers=headers)
    assert response.status_code == 200
    res_data = response.json()
    assert "risk_level" in res_data
    assert "pest_name" in res_data
    assert "preventive_actions" in res_data

@pytest.mark.asyncio
async def test_soil_analysis(client: AsyncClient, seeded_data: dict):
    headers = {"Authorization": f"Bearer {seeded_data['token']}"}
    payload = {
        "crop_cycle_id": str(seeded_data["cycle"].id),
        "moisture": 28.5,
        "ph": 6.8,
        "nitrogen": 45.2,
        "phosphorus": 22.1,
        "potassium": 180.5,
        "organic_carbon": 0.85,
        "ec": 0.42,
        "temperature": 26.3
    }

    response = await client.post("/api/v1/soil/analyze", headers=headers, json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert "health_score" in res_data
    assert "status" in res_data
    assert "recommendations" in res_data

@pytest.mark.asyncio
async def test_water_requirement(client: AsyncClient, seeded_data: dict):
    headers = {"Authorization": f"Bearer {seeded_data['token']}"}
    field_id = str(seeded_data["field"].id)

    response = await client.get(f"/api/v1/water/predict/{field_id}", headers=headers)
    assert response.status_code == 200
    res_data = response.json()
    assert "daily_requirement_liters" in res_data
    assert "water_saving_pct" in res_data

@pytest.mark.asyncio
async def test_irrigation_recommendation(client: AsyncClient, seeded_data: dict):
    headers = {"Authorization": f"Bearer {seeded_data['token']}"}
    field_id = str(seeded_data["field"].id)

    response = await client.get(f"/api/v1/irrigation/recommend/{field_id}", headers=headers)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["action"] in ("start", "stop", "delay")
    assert "water_amount_liters" in res_data

@pytest.mark.asyncio
async def test_ai_assistant_query(client: AsyncClient, seeded_data: dict):
    headers = {"Authorization": f"Bearer {seeded_data['token']}"}
    payload = {
        "query": "Should I irrigate my rice field today?",
        "field_id": str(seeded_data["field"].id),
        "language": "en"
    }

    response = await client.post("/api/v1/assistant/query", headers=headers, json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert "answer" in res_data
    assert "confidence" in res_data
