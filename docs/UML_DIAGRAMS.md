# UML Diagrams – AgriMind AI

## 1. Use Case Diagram

```mermaid
graph TB
    Farmer((Farmer))
    Admin((Admin))
    Agronomist((Agronomist))
    IoTDevice((IoT Device))

    subgraph Authentication
        UC1[Register / Login]
        UC2[Manage Profile]
    end

    subgraph Farm Management
        UC3[Create Farm & Fields]
        UC4[View GIS Map]
        UC5[Manage Crop Cycles]
    end

    subgraph Monitoring
        UC6[Monitor Crop Health]
        UC7[Scan for Diseases]
        UC8[View Pest Risk]
        UC9[Analyze Soil Health]
    end

    subgraph Water Management
        UC10[Calculate Water Requirement]
        UC11[Get Irrigation Schedule]
        UC12[Receive Water Alerts]
    end

    subgraph Intelligence
        UC13[View Weather Forecast]
        UC14[Get Fertilizer Recommendations]
        UC15[Predict Harvest Date]
        UC16[Analyze Market Prices]
        UC17[Predict Profit]
    end

    subgraph Assistant
        UC18[Ask AI Assistant]
        UC19[Voice Query]
    end

    subgraph Reports
        UC20[Generate Reports]
        UC21[Export PDF/Excel]
    end

    subgraph AdminOps
        UC22[Manage Users]
        UC23[Manage ML Models]
        UC24[System Monitoring]
    end

    Farmer --> UC1 & UC2 & UC3 & UC4 & UC5
    Farmer --> UC6 & UC7 & UC8 & UC9
    Farmer --> UC10 & UC11 & UC12
    Farmer --> UC13 & UC14 & UC15 & UC16 & UC17
    Farmer --> UC18 & UC19 & UC20 & UC21

    Admin --> UC22 & UC23 & UC24
    Agronomist --> UC6 & UC7 & UC8 & UC9 & UC14
    IoTDevice --> UC12
```

---

## 2. Class Diagram

```mermaid
classDiagram
    class User {
        +UUID id
        +String email
        +String phone
        +String fullName
        +Role role
        +String language
        +login()
        +updateProfile()
    }

    class Farm {
        +UUID id
        +String name
        +Float totalAreaAcres
        +GeoJSON boundary
        +Float latitude
        +Float longitude
        +addField()
        +getOverview()
    }

    class Field {
        +UUID id
        +String name
        +Float areaAcres
        +String soilType
        +FieldStatus status
        +getSensors()
        +getActiveCropCycle()
    }

    class CropCycle {
        +UUID id
        +Date sowingDate
        +GrowthStage stage
        +Float healthScore
        +getHealthHistory()
        +getWaterRequirement()
        +getHarvestPrediction()
    }

    class CropHealthService {
        +analyzeImage(image) CropHealthResult
        +computeNDVI(satelliteData) Float
        +calculateHealthScore(data) Float
    }

    class DiseaseDetectionService {
        +detectDisease(image) DiseaseResult
        +getTreatment(diseaseName) Treatment
        +classifySeverity(detections) Severity
    }

    class WaterPredictionService {
        +calculateET(crop, weather) Float
        +predictRequirement(cycle) WaterPrediction
        +recommendIrrigation(cycle) IrrigationAction
    }

    class MarketIntelligenceService {
        +fetchPrices(crop, region) List~Price~
        +predictPrice(crop, horizon) PriceForecast
        +recommendSellTiming(cycle) SellRecommendation
        +compareMarkets(crop, location) List~MarketComparison~
    }

    class AIAssistantService {
        +processQuery(text, userId) AssistantResponse
        +processVoice(audio, language) AssistantResponse
        +routeIntent(intent) ServiceResponse
    }

    class AlertService {
        +createAlert(type, user, field) Alert
        +sendNotification(alert, channels) void
        +checkThresholds(sensorData) List~Alert~
    }

    class IoTService {
        +ingestReading(deviceId, value) void
        +registerDevice(field, type) IoTDevice
        +getLatestReadings(fieldId) List~Reading~
    }

    User "1" --> "*" Farm
    Farm "1" --> "*" Field
    Field "1" --> "*" CropCycle
    Field "1" --> "*" IoTDevice
    CropCycle --> CropHealthService
    CropCycle --> DiseaseDetectionService
    CropCycle --> WaterPredictionService
    CropCycle --> MarketIntelligenceService
    User --> AlertService
    User --> AIAssistantService
    Field --> IoTService
```

---

## 3. Sequence Diagram – Disease Detection Flow

```mermaid
sequenceDiagram
    actor Farmer
    participant Mobile as Flutter App
    participant API as FastAPI Backend
    participant ML as YOLOv8 Model
    participant DB as PostgreSQL
    participant Alert as Alert Service

    Farmer->>Mobile: Capture leaf photo
    Mobile->>API: POST /api/v1/disease/detect (image)
    API->>API: Validate JWT & image
    API->>ML: Run inference
    ML-->>API: Detections + confidence
    API->>API: Classify severity
    API->>DB: Lookup treatment recommendations
    DB-->>API: Treatment data
    API->>DB: Save detection record
    API-->>Mobile: Disease result + treatment

    alt Severity >= Moderate
        API->>Alert: Create disease alert
        Alert->>Farmer: Push notification + SMS
    end

    Mobile-->>Farmer: Display results & recommendations
```

---

## 4. Sequence Diagram – Water Prediction Flow

```mermaid
sequenceDiagram
    actor Farmer
    participant Dashboard as Web Dashboard
    participant API as FastAPI Backend
    participant Weather as Weather Service
    participant ML as Water ML Model
    participant IoT as IoT Service
    participant DB as PostgreSQL

    Farmer->>Dashboard: View Water Dashboard
    Dashboard->>API: GET /api/v1/water/predict/{field_id}
    API->>IoT: Get latest soil moisture
    IoT->>DB: Query sensor readings
    DB-->>IoT: Moisture: 28%
    IoT-->>API: Sensor data
    API->>Weather: Get forecast (OpenWeatherMap)
    Weather-->>API: Temp, humidity, rainfall, ET
    API->>DB: Get crop cycle & coefficients
    DB-->>API: Crop: Rice, Stage: Mid-season
    API->>ML: Predict water requirement
    ML-->>API: 4500 L/acre, next irrigation: 6 AM
    API->>DB: Save prediction
    API-->>Dashboard: Water prediction result
    Dashboard-->>Farmer: Display requirements & schedule
```

---

## 5. Activity Diagram – Irrigation Decision

```mermaid
flowchart TD
    Start([Start Daily Check]) --> GetSensor[Fetch Soil Moisture from IoT]
    GetSensor --> GetWeather[Fetch Weather Forecast]
    GetWeather --> GetCrop[Get Crop Type & Growth Stage]
    GetCrop --> CalcET[Calculate Evapotranspiration]
    CalcET --> CalcReq[Calculate Water Requirement]
    CalcReq --> CheckMoisture{Soil Moisture < Threshold?}

    CheckMoisture -->|Yes| CheckRain{Rain Expected in 24h?}
    CheckMoisture -->|No| CheckOver{Overwatering Risk?}

    CheckRain -->|Yes| Delay[Recommend: Delay Irrigation]
    CheckRain -->|No| CheckTank{Water Tank Level OK?}

    CheckTank -->|Yes| Start[Recommend: Start Irrigation]
    CheckTank -->|No| TankAlert[Alert: Water Tank Low]

    CheckOver -->|Yes| Reduce[Recommend: Reduce Water]
    CheckOver -->|No| Stop[Recommend: Stop Irrigation]

    Start --> Notify[Send Notification to Farmer]
    Delay --> Notify
    Start --> Notify
    TankAlert --> Notify
    Reduce --> Notify
    Stop --> Notify

    Notify --> Log[Log Irrigation Event]
    Log --> EndNode([End])
```

---

## 6. State Diagram – Crop Cycle Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Planned: Create crop cycle
    Planned --> Sown: Sowing completed
    Sown --> Germination: Seeds germinate
    Germination --> Vegetative: Active growth
    Vegetative --> Flowering: Flowering stage
    Flowering --> Fruiting: Fruit/grain development
    Fruiting --> Maturity: Crop matures
    Maturity --> ReadyToHarvest: Harvest readiness > 80%
    ReadyToHarvest --> Harvested: Harvest completed
    Harvested --> Sold: Market sale
    Sold --> [*]

    Vegetative --> Diseased: Disease detected
    Flowering --> Diseased: Disease detected
    Diseased --> Vegetative: Treatment applied
    Diseased --> Failed: Severe damage

    Vegetative --> PestAffected: High pest risk
    PestAffected --> Vegetative: Prevention applied

    ReadyToHarvest --> DelayedHarvest: Weather delay
    DelayedHarvest --> ReadyToHarvest: Conditions improve
    DelayedHarvest --> QualityLoss: Extended delay

    Failed --> [*]
    QualityLoss --> Harvested: Emergency harvest
```

---

## 7. Component Diagram

```mermaid
graph TB
    subgraph Presentation Layer
        WEB[Next.js Dashboard]
        MOB[Flutter Mobile App]
    end

    subgraph API Layer
        GATEWAY[FastAPI Gateway]
        AUTH_MW[Auth Middleware]
        WS_SERVER[WebSocket Server]
    end

    subgraph Service Layer
        SVC_AUTH[Auth Service]
        SVC_FARM[Farm Service]
        SVC_HEALTH[Crop Health Service]
        SVC_DISEASE[Disease Service]
        SVC_WATER[Water Service]
        SVC_MARKET[Market Service]
        SVC_ALERT[Alert Service]
        SVC_ASSIST[AI Assistant]
        SVC_REPORT[Report Service]
        SVC_IOT[IoT Service]
    end

    subgraph ML Layer
        ML_DISEASE[YOLOv8 Engine]
        ML_PREDICT[Scikit-learn Engine]
        ML_HEALTH[CNN Engine]
    end

    subgraph Data Layer
        DB[(PostgreSQL)]
        CACHE[(Redis)]
        STORAGE[(S3/MinIO)]
    end

    subgraph External
        EXT_WEATHER[OpenWeatherMap]
        EXT_MARKET[eNAM API]
        EXT_NOTIFY[FCM / Twilio]
    end

    WEB --> GATEWAY
    MOB --> GATEWAY
    GATEWAY --> AUTH_MW
    AUTH_MW --> Service Layer
    WS_SERVER --> SVC_ALERT
    SVC_HEALTH --> ML_DISEASE
    SVC_DISEASE --> ML_DISEASE
    SVC_WATER --> ML_PREDICT
    SVC_MARKET --> ML_PREDICT
    SVC_MARKET --> EXT_MARKET
    SVC_ALERT --> EXT_NOTIFY
    Service Layer --> Data Layer
    SVC_IOT --> WS_SERVER
```

---

## 8. Deployment Diagram

```mermaid
graph TB
    subgraph Client Devices
        BROWSER[Web Browser]
        PHONE[Mobile Phone]
        SENSOR[IoT Sensors]
    end

    subgraph Cloud Infrastructure
        CDN[CloudFront CDN]
        LB[Application Load Balancer]

        subgraph Container Cluster
            NGINX[Nginx Container]
            API1[API Container 1]
            API2[API Container 2]
            ML_POD[ML Inference Container]
            WORKER[Background Worker]
        end

        subgraph Managed Services
            RDS[(RDS PostgreSQL)]
            ELASTICACHE[(ElastiCache Redis)]
            S3[(S3 Bucket)]
        end
    end

    BROWSER --> CDN
    PHONE --> LB
    CDN --> LB
    LB --> NGINX
    NGINX --> API1 & API2
    API1 & API2 --> ML_POD
    API1 & API2 --> RDS
    API1 & API2 --> ELASTICACHE
    API1 & API2 --> S3
    WORKER --> RDS
    SENSOR -->|MQTT| API1
```
