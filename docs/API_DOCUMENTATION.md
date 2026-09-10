# API Documentation – AgriMind AI

**Base URL:** `http://localhost:8000/api/v1`  
**Authentication:** Bearer JWT Token  
**OpenAPI Spec:** `http://localhost:8000/docs`

---

## Authentication

### POST /auth/register
Register a new farmer account.

**Request Body:**
```json
{
  "email": "farmer@example.com",
  "phone": "+919876543210",
  "password": "SecurePass@123",
  "full_name": "Rajesh Kumar",
  "language": "hi"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "email": "farmer@example.com",
  "full_name": "Rajesh Kumar",
  "role": "farmer",
  "language": "hi"
}
```

### POST /auth/login
**Request Body:**
```json
{
  "email": "farmer@example.com",
  "password": "SecurePass@123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 86400
}
```

---

## Farms & Fields

### GET /farms
List all farms for authenticated user.

### POST /farms
```json
{
  "name": "Green Valley Farm",
  "total_area_acres": 12.5,
  "latitude": 28.6139,
  "longitude": 77.2090,
  "state": "Punjab",
  "district": "Ludhiana",
  "boundary_geojson": { "type": "Polygon", "coordinates": [...] }
}
```

### POST /farms/{farm_id}/fields
```json
{
  "name": "Field A - Rice",
  "area_acres": 4.2,
  "soil_type": "clay_loam",
  "boundary_geojson": { "type": "Polygon", "coordinates": [...] }
}
```

---

## Module 1: Crop Health

### POST /crop-health/analyze
Upload image for crop health analysis.

**Form Data:** `file` (image), `field_id` (uuid), `image_type` (rgb|multispectral|drone|satellite)

**Response:**
```json
{
  "health_score": 78.5,
  "ndvi": 0.72,
  "status": "healthy",
  "detections": {
    "healthy": 85.2,
    "weak": 8.1,
    "water_stress": 4.3,
    "nutrient_deficiency": 2.4
  },
  "growth_stage": "vegetative",
  "recommendations": ["Monitor water stress areas in northwest corner"]
}
```

### GET /crop-health/{field_id}/history
Returns health score timeline.

---

## Module 2: Disease Detection

### POST /disease/detect
**Form Data:** `file` (leaf image), `crop_cycle_id` (uuid)

**Response:**
```json
{
  "disease_name": "Leaf Blight",
  "severity": "moderate",
  "confidence": 0.89,
  "affected_area_pct": 23.5,
  "treatment": {
    "medicine": "Mancozeb 75% WP",
    "dosage": "2.5 g/L of water",
    "application": "Foliar spray at 10-day intervals",
    "prevention": ["Use resistant varieties", "Ensure proper drainage"]
  }
}
```

### GET /disease/history/{crop_cycle_id}
---

## Module 3: Pest Prediction

### GET /pest/predict/{crop_cycle_id}

**Response:**
```json
{
  "risk_level": "high",
  "pest_name": "Brown Planthopper",
  "predicted_outbreak_date": "2026-07-25",
  "confidence": 0.82,
  "factors": {
    "temperature": 32.5,
    "humidity": 78,
    "rainfall_7d": 45.2
  },
  "preventive_actions": [
    "Apply neem oil spray",
    "Install pheromone traps",
    "Monitor field daily"
  ]
}
```

---

## Module 4: Soil Analysis

### POST /soil/analyze
```json
{
  "crop_cycle_id": "uuid",
  "moisture": 28.5,
  "ph": 6.8,
  "nitrogen": 45.2,
  "phosphorus": 22.1,
  "potassium": 180.5,
  "organic_carbon": 0.85,
  "ec": 0.42,
  "temperature": 26.3
}
```

**Response:**
```json
{
  "health_score": 72.0,
  "status": "moderate",
  "deficiencies": ["nitrogen"],
  "recommendations": {
    "fertilizer": "Urea 50 kg/acre",
    "organic": "Vermicompost 2 tonnes/acre",
    "improvement": ["Green manuring", "Crop rotation with legumes"]
  }
}
```

---

## Module 5: Water Requirement

### GET /water/predict/{field_id}

**Response:**
```json
{
  "daily_requirement_liters": 4500,
  "per_acre_liters": 4500,
  "per_plant_liters": 2.3,
  "water_saving_pct": 18.5,
  "next_irrigation": "2026-07-19T06:00:00",
  "remaining_moisture_pct": 28.5,
  "evapotranspiration_mm": 5.2,
  "factors": {
    "crop": "Rice",
    "growth_stage": "mid_season",
    "soil_moisture": 28.5,
    "temperature": 34.2,
    "humidity": 65,
    "rainfall_forecast_24h": 0
  }
}
```

---

## Module 6: Irrigation

### GET /irrigation/recommend/{field_id}

**Response:**
```json
{
  "action": "start",
  "water_amount_liters": 4200,
  "duration_minutes": 45,
  "efficiency_pct": 87.5,
  "schedule": [
    { "time": "06:00", "action": "start", "amount_liters": 4200 },
    { "time": "06:45", "action": "stop", "amount_liters": 0 }
  ],
  "reason": "Soil moisture below threshold, no rain forecast"
}
```

---

## Module 7: Alerts

### GET /alerts
Query params: `unread_only=true`, `type=water`, `limit=20`

### PATCH /alerts/{alert_id}/read

---

## Module 8: Weather

### GET /weather/forecast/{field_id}
Returns 7-day forecast with agricultural impact analysis.

### GET /weather/alerts/{field_id}
Returns active weather alerts (storm, heatwave, cold wave).

---

## Module 9: Fertilizer

### GET /fertilizer/recommend/{crop_cycle_id}

**Response:**
```json
{
  "npk_requirement": { "N": 120, "P": 60, "K": 40 },
  "micronutrients": ["Zinc", "Boron"],
  "organic_alternatives": ["Vermicompost 2t/acre", "Neem cake 100kg/acre"],
  "application": {
    "timing": "Split application at tillering and panicle initiation",
    "quantity_per_acre": { "Urea": "130 kg", "DAP": "130 kg", "MOP": "67 kg" }
  }
}
```

---

## Module 10-11: Harvest

### GET /harvest/predict/{crop_cycle_id}

**Response:**
```json
{
  "readiness_pct": 78.5,
  "recommended_date": "2026-10-15",
  "harvest_window": { "start": "2026-10-10", "end": "2026-10-25" },
  "expected_yield_quintals": 42.5,
  "confidence": 0.85,
  "factors": { "crop_age_days": 115, "moisture_content": 22, "weather_suitable": true }
}
```

---

## Module 12-14: Market Intelligence

### GET /market/prices/{crop_type_id}
### GET /market/predict/{crop_type_id}?horizon=week
### GET /market/sell-recommendation/{crop_cycle_id}

**Response:**
```json
{
  "recommendation": "wait",
  "current_price": 2450,
  "predicted_price_next_week": 2680,
  "expected_additional_profit": 11500,
  "reasoning": "Festival demand expected to increase prices by 9%",
  "markets": [
    {
      "name": "Ludhiana APMC",
      "price": 2450,
      "distance_km": 12,
      "transport_cost": 800,
      "net_profit": 102700
    }
  ]
}
```

---

## Module 15: Profit Prediction

### GET /profit/predict/{crop_cycle_id}

**Response:**
```json
{
  "expected_yield_quintals": 42.5,
  "current_market_value": 104125,
  "future_market_value_1month": 113900,
  "costs": {
    "harvest": 8500,
    "storage": 3200,
    "transport": 4500,
    "total": 16200
  },
  "scenarios": {
    "sell_today": { "net_profit": 87925 },
    "sell_next_week": { "net_profit": 95200 },
    "store_1_month": { "net_profit": 94300 }
  },
  "best_scenario": "sell_next_week"
}
```

---

## Module 16: AI Assistant

### POST /assistant/query
```json
{
  "query": "Should I irrigate my rice field today?",
  "field_id": "uuid",
  "language": "en"
}
```

**Response:**
```json
{
  "answer": "Based on current soil moisture (28%) and no rainfall forecast, I recommend irrigating 4,200 liters per acre tomorrow morning at 6 AM. This will save 18% water compared to your usual schedule.",
  "confidence": 0.91,
  "sources": ["water_prediction", "weather_forecast", "soil_analysis"],
  "actions": [{ "type": "irrigation", "action": "schedule", "time": "2026-07-19T06:00:00" }]
}
```

---

## IoT Sensors

### POST /sensors/reading
```json
{
  "device_id": "SM-001-LUD",
  "sensor_type": "soil_moisture",
  "value": 28.5,
  "unit": "%",
  "timestamp": "2026-07-18T15:30:00Z"
}
```

### GET /sensors/{field_id}/latest
### GET /sensors/{field_id}/history?sensor_type=soil_moisture&hours=24

---

## Reports

### POST /reports/generate
```json
{
  "report_type": "water_usage",
  "period": "weekly",
  "field_id": "uuid",
  "format": "pdf"
}
```

---

## WebSocket

**Endpoint:** `ws://localhost:8000/ws/{user_id}?token={jwt}`

**Events:**
```json
{ "type": "sensor_update", "field_id": "uuid", "data": { "soil_moisture": 28.5 } }
{ "type": "alert", "alert": { "title": "Low Soil Moisture", "severity": "high" } }
{ "type": "irrigation_status", "field_id": "uuid", "status": "completed" }
```

---

## Error Responses

| Code | Description |
|------|-------------|
| 400 | Bad Request – Invalid input |
| 401 | Unauthorized – Invalid/expired token |
| 403 | Forbidden – Insufficient permissions |
| 404 | Not Found |
| 422 | Validation Error |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |

```json
{
  "detail": "Error message",
  "error_code": "CROP_CYCLE_NOT_FOUND",
  "timestamp": "2026-07-18T15:30:00Z"
}
```
