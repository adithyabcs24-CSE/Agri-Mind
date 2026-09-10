"""Seed demo data for AgriMind AI."""

import asyncio
from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.farm import Farm, Field, CropType, CropCycle, GrowthStage
from datetime import date, timedelta


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Check if already seeded
        from sqlalchemy import select
        existing = await db.execute(select(User).where(User.email == "farmer@agrimind.ai"))
        if existing.scalar_one_or_none():
            print("Database already seeded.")
            return

        # Create users
        farmer = User(
            email="farmer@agrimind.ai",
            phone="+919876543210",
            password_hash=get_password_hash("Farmer@123"),
            full_name="Rajesh Kumar",
            role=UserRole.farmer,
            language="hi",
        )
        admin = User(
            email="admin@agrimind.ai",
            password_hash=get_password_hash("Admin@123"),
            full_name="System Admin",
            role=UserRole.admin,
        )
        db.add_all([farmer, admin])
        await db.flush()

        # Crop types
        crops = [
            CropType(name="Rice", scientific_name="Oryza sativa", growth_duration_days=120,
                     water_coefficients={"initial": 1.05, "mid_season": 1.20},
                     npk_requirements={"N": 120, "P": 60, "K": 40},
                     common_diseases=["Leaf Blight", "Bacterial Wilt"], common_pests=["Brown Planthopper"]),
            CropType(name="Wheat", scientific_name="Triticum aestivum", growth_duration_days=120,
                     water_coefficients={"initial": 0.70, "mid_season": 1.15},
                     npk_requirements={"N": 120, "P": 60, "K": 40}),
            CropType(name="Cotton", scientific_name="Gossypium", growth_duration_days=180,
                     water_coefficients={"initial": 0.40, "mid_season": 1.15},
                     npk_requirements={"N": 100, "P": 50, "K": 50}),
        ]
        db.add_all(crops)
        await db.flush()

        # Farm & Field
        farm = Farm(
            user_id=farmer.id, name="Green Valley Farm", total_area_acres=12.5,
            latitude=30.9010, longitude=75.8573, state="Punjab", district="Ludhiana",
        )
        db.add(farm)
        await db.flush()

        field = Field(farm_id=farm.id, name="Field A - Rice", area_acres=4.2, soil_type="clay_loam")
        db.add(field)
        await db.flush()

        cycle = CropCycle(
            field_id=field.id, crop_type_id=crops[0].id,
            sowing_date=date.today() - timedelta(days=60),
            expected_harvest=date.today() + timedelta(days=60),
            growth_stage=GrowthStage.vegetative,
            health_score=82.5,
        )
        db.add(cycle)
        await db.commit()
        print("✅ Demo data seeded successfully!")
        print("   Farmer: farmer@agrimind.ai / Farmer@123")
        print("   Admin:  admin@agrimind.ai / Admin@123")


if __name__ == "__main__":
    asyncio.run(seed())
