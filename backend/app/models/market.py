import uuid
from datetime import datetime, timezone, date
from sqlalchemy import Column, String, Float, DateTime, Date, ForeignKey, Enum as SAEnum, JSON, Text
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
import enum


class ReportType(str, enum.Enum):
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"
    crop_health = "crop_health"
    disease = "disease"
    water_usage = "water_usage"
    harvest = "harvest"
    profit = "profit"
    market = "market"
    yield_report = "yield_report"


class ReportFormat(str, enum.Enum):
    pdf = "pdf"
    excel = "excel"
    csv = "csv"


class MarketPrice(Base):
    __tablename__ = "market_prices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    crop_type_id = Column(UUID(as_uuid=True), ForeignKey("crop_types.id"), nullable=False, index=True)
    market_name = Column(String(255), nullable=False)
    state = Column(String(100), nullable=True)
    price_per_quintal = Column(Float, nullable=False)
    msp = Column(Float, nullable=True)
    price_date = Column(Date, nullable=False, index=True)
    source = Column(String(50), default="enam")


class HarvestPrediction(Base):
    __tablename__ = "harvest_predictions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    crop_cycle_id = Column(UUID(as_uuid=True), ForeignKey("crop_cycles.id"), nullable=False, index=True)
    readiness_pct = Column(Float, nullable=False)
    recommended_date = Column(Date, nullable=True)
    harvest_window_start = Column(Date, nullable=True)
    harvest_window_end = Column(Date, nullable=True)
    expected_yield_quintals = Column(Float, nullable=True)
    confidence = Column(Float, nullable=False)
    factors = Column(JSON, default=dict)
    predicted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class ProfitPrediction(Base):
    __tablename__ = "profit_predictions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    crop_cycle_id = Column(UUID(as_uuid=True), ForeignKey("crop_cycles.id"), nullable=False, index=True)
    expected_yield_quintals = Column(Float, nullable=False)
    current_market_value = Column(Float, nullable=False)
    future_market_value = Column(Float, nullable=True)
    harvest_cost = Column(Float, default=0.0)
    storage_cost = Column(Float, default=0.0)
    transport_cost = Column(Float, default=0.0)
    net_profit = Column(Float, nullable=False)
    scenarios = Column(JSON, default=dict)
    best_scenario = Column(String(50), nullable=True)
    predicted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    report_type = Column(SAEnum(ReportType), nullable=False)
    period = Column(String(20), nullable=True)
    file_url = Column(String(500), nullable=True)
    format = Column(SAEnum(ReportFormat), default=ReportFormat.pdf)
    summary = Column(JSON, default=dict)
    generated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
