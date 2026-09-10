import uuid
from datetime import datetime, timezone, date
from sqlalchemy import Column, String, Float, DateTime, Date, ForeignKey, Enum as SAEnum, JSON, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class FieldStatus(str, enum.Enum):
    active = "active"
    fallow = "fallow"
    harvested = "harvested"


class GrowthStage(str, enum.Enum):
    planned = "planned"
    sown = "sown"
    germination = "germination"
    vegetative = "vegetative"
    flowering = "flowering"
    fruiting = "fruiting"
    maturity = "maturity"
    harvested = "harvested"


class CropCycleStatus(str, enum.Enum):
    active = "active"
    completed = "completed"
    failed = "failed"


class Farm(Base):
    __tablename__ = "farms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    total_area_acres = Column(Float, nullable=False)
    boundary_geojson = Column(JSON, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    fields = relationship("Field", back_populates="farm", cascade="all, delete-orphan")


class Field(Base):
    __tablename__ = "fields"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    area_acres = Column(Float, nullable=False)
    boundary_geojson = Column(JSON, nullable=True)
    soil_type = Column(String(100), default="loam")
    status = Column(SAEnum(FieldStatus), default=FieldStatus.active)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    farm = relationship("Farm", back_populates="fields")
    crop_cycles = relationship("CropCycle", back_populates="field", cascade="all, delete-orphan")
    devices = relationship("IoTDevice", back_populates="field", cascade="all, delete-orphan")


class CropType(Base):
    __tablename__ = "crop_types"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    scientific_name = Column(String(200), nullable=True)
    growth_duration_days = Column(Float, default=120)
    water_coefficients = Column(JSON, default=dict)
    npk_requirements = Column(JSON, default=dict)
    common_diseases = Column(JSON, default=list)
    common_pests = Column(JSON, default=list)


class CropCycle(Base):
    __tablename__ = "crop_cycles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    field_id = Column(UUID(as_uuid=True), ForeignKey("fields.id"), nullable=False, index=True)
    crop_type_id = Column(UUID(as_uuid=True), ForeignKey("crop_types.id"), nullable=False)
    sowing_date = Column(Date, nullable=False)
    expected_harvest = Column(Date, nullable=True)
    growth_stage = Column(SAEnum(GrowthStage), default=GrowthStage.sown)
    health_score = Column(Float, default=100.0)
    status = Column(SAEnum(CropCycleStatus), default=CropCycleStatus.active)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    field = relationship("Field", back_populates="crop_cycles")
    crop_type = relationship("CropType")
