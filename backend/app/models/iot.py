import uuid
from datetime import datetime, timezone, date
from sqlalchemy import Column, String, Float, DateTime, Date, ForeignKey, Enum as SAEnum, JSON, Boolean, Text, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
import enum


class IrrigationAction(str, enum.Enum):
    start = "start"
    stop = "stop"
    delay = "delay"
    increase = "increase"
    reduce = "reduce"


class IrrigationStatus(str, enum.Enum):
    scheduled = "scheduled"
    running = "running"
    completed = "completed"
    cancelled = "cancelled"


class AlertType(str, enum.Enum):
    low_moisture = "low_moisture"
    water_required = "water_required"
    rain_expected = "rain_expected"
    delay_irrigation = "delay_irrigation"
    overwatering = "overwatering"
    tank_low = "tank_low"
    pump_failure = "pump_failure"
    irrigation_complete = "irrigation_complete"
    emergency_water = "emergency_water"
    disease_detected = "disease_detected"
    pest_risk = "pest_risk"
    harvest_ready = "harvest_ready"
    weather_alert = "weather_alert"
    market_alert = "market_alert"


class AlertSeverity(str, enum.Enum):
    info = "info"
    warning = "warning"
    critical = "critical"


class SensorType(str, enum.Enum):
    soil_moisture = "soil_moisture"
    temperature = "temperature"
    humidity = "humidity"
    rain = "rain"
    npk = "npk"
    ph = "ph"
    ec = "ec"
    gps = "gps"
    water_flow = "water_flow"
    water_level = "water_level"
    weather_station = "weather_station"


class WaterPrediction(Base):
    __tablename__ = "water_predictions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    crop_cycle_id = Column(UUID(as_uuid=True), ForeignKey("crop_cycles.id"), nullable=False, index=True)
    daily_requirement_liters = Column(Float, nullable=False)
    per_acre_liters = Column(Float, nullable=False)
    per_plant_liters = Column(Float, nullable=True)
    water_saving_pct = Column(Float, default=0.0)
    next_irrigation = Column(DateTime(timezone=True), nullable=True)
    remaining_moisture = Column(Float, nullable=True)
    evapotranspiration_mm = Column(Float, nullable=True)
    factors = Column(JSON, default=dict)
    predicted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class IrrigationEvent(Base):
    __tablename__ = "irrigation_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    field_id = Column(UUID(as_uuid=True), ForeignKey("fields.id"), nullable=False, index=True)
    action = Column(SAEnum(IrrigationAction), nullable=False)
    water_amount_liters = Column(Float, default=0.0)
    efficiency_pct = Column(Float, nullable=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    executed_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(SAEnum(IrrigationStatus), default=IrrigationStatus.scheduled)
    reason = Column(Text, nullable=True)


class IoTDevice(Base):
    __tablename__ = "iot_devices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    field_id = Column(UUID(as_uuid=True), ForeignKey("fields.id"), nullable=False, index=True)
    device_id = Column(String(100), unique=True, nullable=False)
    sensor_type = Column(SAEnum(SensorType), nullable=False)
    mqtt_topic = Column(String(200), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    status = Column(String(20), default="active")
    last_reading_at = Column(DateTime(timezone=True), nullable=True)

    field = relationship("Field", back_populates="devices")


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    device_id = Column(UUID(as_uuid=True), ForeignKey("iot_devices.id"), nullable=False, index=True)
    field_id = Column(UUID(as_uuid=True), ForeignKey("fields.id"), nullable=False, index=True)
    sensor_type = Column(SAEnum(SensorType), nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)
    recorded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    field_id = Column(UUID(as_uuid=True), ForeignKey("fields.id"), nullable=True)
    alert_type = Column(SAEnum(AlertType), nullable=False)
    severity = Column(SAEnum(AlertSeverity), default=AlertSeverity.info)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    channels = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
