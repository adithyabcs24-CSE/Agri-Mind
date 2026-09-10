import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum as SAEnum, JSON, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
import enum


class Severity(str, enum.Enum):
    healthy = "healthy"
    early = "early"
    moderate = "moderate"
    severe = "severe"


class RiskLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class CropHealthRecord(Base):
    __tablename__ = "crop_health_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    crop_cycle_id = Column(UUID(as_uuid=True), ForeignKey("crop_cycles.id"), nullable=False, index=True)
    health_score = Column(Float, nullable=False)
    ndvi = Column(Float, nullable=True)
    image_url = Column(String(500), nullable=True)
    detections = Column(JSON, default=dict)
    growth_stage = Column(String(50), nullable=True)
    recorded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class DiseaseDetection(Base):
    __tablename__ = "disease_detections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    crop_cycle_id = Column(UUID(as_uuid=True), ForeignKey("crop_cycles.id"), nullable=False, index=True)
    disease_name = Column(String(200), nullable=False)
    severity = Column(SAEnum(Severity), nullable=False)
    confidence = Column(Float, nullable=False)
    affected_area_pct = Column(Float, default=0.0)
    image_url = Column(String(500), nullable=True)
    treatment = Column(JSON, default=dict)
    detected_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class PestPrediction(Base):
    __tablename__ = "pest_predictions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    crop_cycle_id = Column(UUID(as_uuid=True), ForeignKey("crop_cycles.id"), nullable=False, index=True)
    risk_level = Column(SAEnum(RiskLevel), nullable=False)
    pest_name = Column(String(200), nullable=False)
    predicted_outbreak = Column(DateTime(timezone=True), nullable=True)
    confidence = Column(Float, nullable=False)
    factors = Column(JSON, default=dict)
    preventive_actions = Column(JSON, default=list)
    predicted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class SoilAnalysis(Base):
    __tablename__ = "soil_analyses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    crop_cycle_id = Column(UUID(as_uuid=True), ForeignKey("crop_cycles.id"), nullable=False, index=True)
    moisture = Column(Float, nullable=True)
    ph = Column(Float, nullable=True)
    nitrogen = Column(Float, nullable=True)
    phosphorus = Column(Float, nullable=True)
    potassium = Column(Float, nullable=True)
    organic_carbon = Column(Float, nullable=True)
    ec = Column(Float, nullable=True)
    temperature = Column(Float, nullable=True)
    whc = Column(Float, nullable=True)
    health_score = Column(Float, nullable=False)
    recommendations = Column(JSON, default=dict)
    analyzed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
