from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    APP_NAME: str = "AgriMind AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    DATABASE_URL: str = "postgresql+asyncpg://agrimind:agrimind123@localhost:5432/agrimind_db"
    DATABASE_URL_SYNC: str = "postgresql://agrimind:agrimind123@localhost:5432/agrimind_db"

    REDIS_URL: str = "redis://localhost:6379/0"

    SECRET_KEY: str = "change-this-secret-key-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8080"]

    # Public APIs (from public-apis repo — keyless & free)
    WEATHER_PROVIDER: str = "open-meteo"
    MAPS_PROVIDER: str = "openstreetmap"
    OPENMETEO_API_URL: str = "https://api.open-meteo.com/v1/forecast"
    PHOTON_GEOCODING_URL: str = "https://photon.komoot.io/api"

    # Optional Commercial APIs
    OPENWEATHERMAP_API_KEY: str = ""
    GOOGLE_MAPS_API_KEY: str = ""
    DATA_GOV_IN_API_KEY: str = ""
    ENAM_API_URL: str = "https://enam.gov.in/api"

    STORAGE_TYPE: str = "local"
    STORAGE_PATH: str = "./uploads"
    S3_BUCKET: str = "agrimind-storage"
    S3_ENDPOINT: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"

    FCM_SERVER_KEY: str = ""
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    # OTP.dev SMS Service
    OTP_DEV_API_KEY: str = "243b42daf378e40425a9adc7e12a6551"
    OTP_DEV_SENDER: str = "23e1e5b9-629e-47a3-9479-83058ff99238"
    OTP_DEV_TEMPLATE: str = "d6f760c7-6c69-4de2-a977-fc0ceb6f175f"
    OTP_DEV_CHANNEL: str = "sms"
    DEFAULT_PHONE: str = "919110625567"

    ML_MODELS_PATH: str = "../ml/models"
    DISEASE_MODEL_PATH: str = "../ml/models/disease_yolov8.pt"
    CROP_HEALTH_MODEL_PATH: str = "../ml/models/crop_health_cnn.h5"

    MQTT_BROKER: str = "localhost"
    MQTT_PORT: int = 1883
    MQTT_USERNAME: str = ""
    MQTT_PASSWORD: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if isinstance(self.CORS_ORIGINS, str):
            self.CORS_ORIGINS = json.loads(self.CORS_ORIGINS)


settings = Settings()
