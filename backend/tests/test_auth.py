import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User

@pytest.mark.asyncio
async def test_register_user(client: AsyncClient, db: AsyncSession):
    payload = {
        "email": "newfarmer@agrimind.ai",
        "phone": "+919999999999",
        "password": "SecretPassword123",
        "full_name": "Test Farmer",
        "language": "en"
      }
    
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == payload["email"]
    assert "id" in data
    assert data["role"] == "farmer"

    # Verify duplicate registry fails
    response_dup = await client.post("/api/v1/auth/register", json=payload)
    assert response_dup.status_code == 400

@pytest.mark.asyncio
async def test_login_user(client: AsyncClient, db: AsyncSession):
    # Register first
    reg_payload = {
        "email": "loginfarmer@agrimind.ai",
        "password": "SecretPassword123",
        "full_name": "Login Farmer",
        "language": "en"
    }
    await client.post("/api/v1/auth/register", json=reg_payload)

    # Login
    login_payload = {
        "email": "loginfarmer@agrimind.ai",
        "password": "SecretPassword123"
    }
    response = await client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

    # Profile retrieval /me
    token = data["access_token"]
    profile_response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert profile_response.status_code == 200
    profile_data = profile_response.json()
    assert profile_data["email"] == reg_payload["email"]
