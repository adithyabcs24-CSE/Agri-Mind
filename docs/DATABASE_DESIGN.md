# Database Design – AgriMind AI

## 1. Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ FARMS : owns
    USERS ||--o{ ALERTS : receives
    USERS ||--o{ REPORTS : generates
    
    FARMS ||--|{ FIELDS : contains
    FIELDS ||--o{ CROP_CYCLES : has
    FIELDS ||--o{ SENSOR_READINGS : monitored_by
    FIELDS ||--o{ IRRIGATION_EVENTS : irrigated
    
    CROP_CYCLES ||--o{ CROP_HEALTH_RECORDS : tracked
    CROP_CYCLES ||--o{ DISEASE_DETECTIONS : diagnosed
    CROP_CYCLES ||--o{ PEST_PREDICTIONS : predicted
    CROP_CYCLES ||--o{ SOIL_ANALYSES : analyzed
    CROP_CYCLES ||--o{ WATER_PREDICTIONS : calculated
    CROP_CYCLES ||--o{ FERTILIZER_RECS : recommended
    CROP_CYCLES ||--o{ HARVEST_PREDICTIONS : forecasted
    
    FIELDS ||--o{ IOT_DEVICES : equipped_with
    
    CROP_CYCLES }o--|| CROP_TYPES : type
    MARKET_PRICES }o--|| CROP_TYPES : for
    
    USERS {
        uuid id PK
        string email UK
        string phone UK
        string password_hash
        string full_name
        enum role
        string language
        jsonb preferences
        timestamp created_at
    }
    
    FARMS {
        uuid id PK
        uuid user_id FK
        string name
        float total_area_acres
        jsonb boundary_geojson
        float latitude
        float longitude
        string state
        string district
    }
    
    FIELDS {
        uuid id PK
        uuid farm_id FK
        string name
        float area_acres
        jsonb boundary_geojson
        string soil_type
        enum status
    }
    
    CROP_CYCLES {
        uuid id PK
        uuid field_id FK
        uuid crop_type_id FK
        date sowing_date
        date expected_harvest
        enum growth_stage
        float health_score
        enum status
    }
    
    CROP_TYPES {
        uuid id PK
        string name
        string scientific_name
        int growth_duration_days
        jsonb water_coefficients
        jsonb npk_requirements
    }
    
    CROP_HEALTH_RECORDS {
        uuid id PK
        uuid crop_cycle_id FK
        float health_score
        float ndvi
        string image_url
        jsonb detections
        timestamp recorded_at
    }
    
    DISEASE_DETECTIONS {
        uuid id PK
        uuid crop_cycle_id FK
        string disease_name
        enum severity
        float confidence
        float affected_area_pct
        string image_url
        jsonb treatment
        timestamp detected_at
    }
    
    PEST_PREDICTIONS {
        uuid id PK
        uuid crop_cycle_id FK
        enum risk_level
        string pest_name
        date predicted_outbreak
        float confidence
        jsonb preventive_actions
        timestamp predicted_at
    }
    
    SOIL_ANALYSES {
        uuid id PK
        uuid crop_cycle_id FK
        float moisture
        float ph
        float nitrogen
        float phosphorus
        float potassium
        float organic_carbon
        float ec
        float temperature
        float whc
        float health_score
        jsonb recommendations
        timestamp analyzed_at
    }
    
    WATER_PREDICTIONS {
        uuid id PK
        uuid crop_cycle_id FK
        float daily_requirement_liters
        float per_acre_liters
        float per_plant_liters
        float water_saving_pct
        timestamp next_irrigation
        float remaining_moisture
        timestamp predicted_at
    }
    
    IRRIGATION_EVENTS {
        uuid id PK
        uuid field_id FK
        enum action
        float water_amount_liters
        float efficiency_pct
        timestamp scheduled_at
        timestamp executed_at
        enum status
    }
    
    IOT_DEVICES {
        uuid id PK
        uuid field_id FK
        string device_id UK
        enum sensor_type
        string mqtt_topic
        float lat
        float lng
        enum status
        timestamp last_reading
    }
    
    SENSOR_READINGS {
        uuid id PK
        uuid device_id FK
        uuid field_id FK
        enum sensor_type
        float value
        string unit
        timestamp recorded_at
    }
    
    ALERTS {
        uuid id PK
        uuid user_id FK
        uuid field_id FK
        enum alert_type
        enum severity
        string title
        string message
        boolean is_read
        jsonb channels
        timestamp created_at
    }
    
    MARKET_PRICES {
        uuid id PK
        uuid crop_type_id FK
        string market_name
        string state
        float price_per_quintal
        float msp
        date price_date
        string source
    }
    
    HARVEST_PREDICTIONS {
        uuid id PK
        uuid crop_cycle_id FK
        float readiness_pct
        date recommended_date
        float expected_yield_quintals
        float confidence
        timestamp predicted_at
    }
    
    PROFIT_PREDICTIONS {
        uuid id PK
        uuid crop_cycle_id FK
        float expected_yield
        float current_market_value
        float future_market_value
        float total_costs
        float net_profit
        jsonb scenarios
        timestamp predicted_at
    }
    
    REPORTS {
        uuid id PK
        uuid user_id FK
        enum report_type
        enum period
        string file_url
        jsonb summary
        timestamp generated_at
    }
```

---

## 2. Database Schema (PostgreSQL)

See `backend/alembic/versions/` for migration files and `backend/app/models/` for SQLAlchemy ORM definitions.

### Key Indexes

```sql
CREATE INDEX idx_sensor_readings_time ON sensor_readings (field_id, recorded_at DESC);
CREATE INDEX idx_alerts_user_unread ON alerts (user_id, is_read, created_at DESC);
CREATE INDEX idx_crop_cycles_field ON crop_cycles (field_id, status);
CREATE INDEX idx_market_prices_crop_date ON market_prices (crop_type_id, price_date DESC);
CREATE INDEX idx_disease_detections_cycle ON disease_detections (crop_cycle_id, detected_at DESC);
```

### PostGIS Extension

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Spatial index on farm boundaries
CREATE INDEX idx_farms_boundary ON farms USING GIST (ST_GeomFromGeoJSON(boundary_geojson));
```

---

## 3. Data Dictionary

### Users Table
| Column | Type | Description |
|--------|------|-------------|
| role | ENUM | farmer, agronomist, admin |
| language | VARCHAR(10) | Preferred UI language (en, hi, ta, te, kn, mr) |
| preferences | JSONB | Notification settings, units, theme |

### Crop Types – Water Coefficients (JSONB)
```json
{
  "initial": 0.3,
  "development": 0.7,
  "mid_season": 1.15,
  "late_season": 0.8,
  "kc_values": [0.4, 0.7, 1.05, 0.85]
}
```

### Disease Detection – Treatment (JSONB)
```json
{
  "medicine": "Mancozeb 75% WP",
  "dosage": "2.5 g/L",
  "application": "Foliar spray every 10 days",
  "prevention": ["Crop rotation", "Resistant varieties", "Proper spacing"]
}
```

---

## 4. TimescaleDB (Sensor Time-Series)

```sql
-- Hypertable for high-frequency sensor data
SELECT create_hypertable('sensor_readings', 'recorded_at');

-- Continuous aggregate for hourly averages
CREATE MATERIALIZED VIEW sensor_hourly_avg
WITH (timescaledb.continuous) AS
SELECT field_id, sensor_type,
       time_bucket('1 hour', recorded_at) AS bucket,
       AVG(value) AS avg_value,
       MIN(value) AS min_value,
       MAX(value) AS max_value
FROM sensor_readings
GROUP BY field_id, sensor_type, bucket;
```

---

## 5. Redis Cache Keys

| Key Pattern | TTL | Purpose |
|-------------|-----|---------|
| `weather:{lat}:{lng}` | 1 hour | Cached weather forecast |
| `market:{crop}:{state}` | 30 min | Market prices |
| `session:{user_id}` | 24 hours | User session data |
| `ratelimit:{user_id}` | 1 min | API rate limiting |
| `health:{field_id}` | 15 min | Latest crop health score |
