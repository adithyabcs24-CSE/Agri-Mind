# 🌾 AgriMind AI – Smart Agriculture Platform

**AI-Powered Digital Farming Assistant for Smart India Hackathon (SIH)**

AgriMind AI is a production-ready, cloud-native platform that supports farmers throughout the complete agricultural lifecycle—from crop planning and sowing to harvesting, market intelligence, and profit maximization.

---

## 🎯 Vision

Reduce farmers' burden through real-time AI recommendations, predictive analytics, and intelligent decision support across crop health, water management, disease detection, pest prediction, harvest timing, and market selling strategies.

---

## ✨ Core Features

| Module | Capability |
|--------|------------|
| **Crop Health** | NDVI analysis, multispectral imaging, health score (0–100) |
| **Disease Detection** | YOLOv8 CV model, severity classification, treatment recommendations |
| **Pest Prediction** | ML-based risk scoring with weather & historical data |
| **Soil Analysis** | NPK, pH, moisture, organic carbon, health score |
| **Water Prediction** | ET-based precise water requirement per acre/plant |
| **Smart Irrigation** | Start/stop/delay recommendations, efficiency tracking |
| **Water Alerts** | SMS, email, push notifications for critical events |
| **Weather Intelligence** | OpenWeatherMap integration, storm/heatwave alerts |
| **Fertilizer** | NPK recommendations with application timing |
| **Harvest Prediction** | Maturity %, harvest window, yield estimation |
| **Market Intelligence** | eNAM/APMC price tracking, sell/store recommendations |
| **Profit Prediction** | Net profit comparison across sell/store scenarios |
| **AI Assistant** | Multilingual voice & chat decision support |
| **IoT Integration** | Real-time sensor ingestion via MQTT/WebSocket |
| **GIS Mapping** | Interactive farm map with Leaflet |

---

## 🏗️ Architecture

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Next.js    │  │   Flutter   │  │  IoT Devices│
│  Dashboard  │  │  Mobile App │  │  (MQTT)     │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        │ HTTPS / WSS
              ┌─────────▼─────────┐
              │   API Gateway     │
              │   (FastAPI)       │
              └─────────┬─────────┘
       ┌────────────────┼────────────────┐
       │                │                │
┌──────▼──────┐ ┌───────▼───────┐ ┌──────▼──────┐
│ Auth Service│ │  ML Service   │ │ IoT Service │
└─────────────┘ └───────────────┘ └─────────────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
              ┌─────────▼─────────┐
              │   PostgreSQL      │
              │   Redis           │
              │   S3 / MinIO      │
              └───────────────────┘
```

---

## 📁 Project Structure

```
smart-agriculture/
├── docs/                    # SRS, architecture, UML diagrams
├── backend/                 # FastAPI microservices
│   ├── app/
│   │   ├── api/v1/          # REST API routes (16 modules)
│   │   ├── core/            # Config, security, database
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic
│   │   └── ml/              # ML inference services
│   └── alembic/             # Database migrations
├── frontend/                # Next.js 14 dashboard
├── mobile/                  # Flutter farmer app
├── ml/                      # Training pipelines & models
├── docker/                  # Docker Compose configs
├── .github/workflows/       # CI/CD pipelines
└── scripts/                 # Setup & deployment scripts
```

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+
- Python 3.11+
- Flutter 3.x (for mobile)

### 1. Clone & Configure

```bash
git clone <repo-url>
cd smart-agriculture
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Start with Docker (Recommended)

```bash
docker compose up -d
```

Services:
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Dashboard**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### 3. Manual Setup

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Mobile:**
```bash
cd mobile
flutter pub get
flutter run
```

### 4. Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Farmer | farmer@agrimind.ai | Farmer@123 |
| Admin | admin@agrimind.ai | Admin@123 |

---

## 🔌 API Overview

Base URL: `http://localhost:8000/api/v1`

| Endpoint Group | Prefix |
|----------------|--------|
| Authentication | `/auth` |
| Farms & Fields | `/farms` |
| Crop Health | `/crop-health` |
| Disease Detection | `/disease` |
| Pest Prediction | `/pest` |
| Soil Analysis | `/soil` |
| Water Management | `/water` |
| Irrigation | `/irrigation` |
| Alerts | `/alerts` |
| Weather | `/weather` |
| Fertilizer | `/fertilizer` |
| Harvest | `/harvest` |
| Market | `/market` |
| Profit | `/profit` |
| AI Assistant | `/assistant` |
| IoT Sensors | `/sensors` |
| Reports | `/reports` |

Full API documentation: [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)

---

## 🤖 AI Models

| Model | Framework | Purpose |
|-------|-----------|---------|
| `disease_yolov8` | PyTorch/YOLOv8 | Leaf disease detection |
| `crop_health_cnn` | TensorFlow | Crop health classification |
| `pest_predictor` | Scikit-learn | Pest outbreak risk |
| `water_requirement` | Scikit-learn | ET-based water prediction |
| `harvest_predictor` | Scikit-learn | Harvest readiness |
| `price_predictor` | Scikit-learn | Market price forecasting |
| `yield_predictor` | Scikit-learn | Yield estimation |
| `recommendation_engine` | Scikit-learn | Sell/store recommendations |

Train models:
```bash
cd ml
pip install -r requirements.txt
python train_all.py
```

---

## 📱 Mobile App

Flutter app with:
- Dashboard & crop health overview
- Disease scanner (camera + AI)
- Water calculator & alerts
- Market prices & sell recommendations
- Voice assistant (Hindi, Tamil, Telugu, Kannada, English)
- Offline mode for rural connectivity

---

## 🧪 Testing

```bash
# Backend tests
cd backend && pytest tests/ -v --cov=app

# Frontend tests
cd frontend && npm test

# E2E tests
cd frontend && npm run test:e2e
```

---

## 📦 Deployment

See [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) for AWS/Azure deployment.

```bash
# Production build
docker compose -f docker/docker-compose.prod.yml up -d
```

---

## 📚 Documentation

| Document | Path |
|----------|------|
| Software Requirements (SRS) | [docs/SRS.md](docs/SRS.md) |
| System Architecture | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Database Design | [docs/DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md) |
| API Documentation | [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) |
| Installation Guide | [docs/INSTALLATION_GUIDE.md](docs/INSTALLATION_GUIDE.md) |
| User Manual | [docs/USER_MANUAL.md](docs/USER_MANUAL.md) |
| Admin Manual | [docs/ADMIN_MANUAL.md](docs/ADMIN_MANUAL.md) |
| Testing Strategy | [docs/TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md) |

---

## 🛡️ Security

- JWT authentication with refresh tokens
- Role-based access control (Farmer, Admin, Agronomist)
- Rate limiting & CORS protection
- Input validation via Pydantic
- Encrypted sensor data transmission
- HTTPS/TLS in production

---

## 📄 License

MIT License – Smart India Hackathon 2026

---

## 👥 Team

Built for **Smart India Hackathon (SIH)** – AI-Powered Smart Agriculture Platform
