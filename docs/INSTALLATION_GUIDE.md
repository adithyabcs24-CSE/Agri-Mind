# Installation Guide - AgriMind AI

Follow this step-by-step guide to install and run the AgriMind AI Smart Agriculture Platform in your local development environment.

---

## 1. Prerequisites

Ensure you have the following installed:
- **Operating System:** Linux, macOS, or Windows 10/11
- **Python:** 3.11+
- **Node.js:** 20+ (with npm)
- **Flutter:** 3.19+ (for mobile app compilation)
- **Docker & Docker Compose:** Required to run PostgreSQL and Redis services quickly.

---

## 2. Docker Setup (Recommended)

The easiest way to boot the ecosystem is using Docker Compose:
1. Make sure Docker is running.
2. In the project root, run:
   ```bash
   docker compose up -d
   ```
3. This boots PostgreSQL + TimescaleDB, Redis, the FastAPI backend on `http://localhost:8000`, and the Next.js dashboard on `http://localhost:3000`.

---

## 3. Manual Local Installation

If you prefer to run services individually for active code debugging:

### 3.1 Database & Cache
Ensure PostgreSQL and Redis are running locally. Create a database named `agrimind_db` with username `agrimind` and password `agrimind123`.

### 3.2 FastAPI Backend Setup
1. Move to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment file template and modify parameters if necessary:
   ```bash
   cp .env.example .env
   ```
5. Run database migrations to construct tables:
   ```bash
   alembic upgrade head
   ```
6. Seed the database with demo farmer accounts, farms, and fields:
   ```bash
   python scripts/seed_data.py
   ```
7. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
The Swagger API documentation will be available at `http://localhost:8000/docs`.

### 3.3 Next.js Frontend Dashboard Setup
1. Move to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Copy the environment config:
   ```bash
   cp .env.example .env
   ```
4. Start the frontend Next.js dev server:
   ```bash
   npm run dev
   ```
Open `http://localhost:3000` to view the interactive web dashboard.

### 3.4 Flutter Mobile App Setup
1. Move to the mobile folder:
   ```bash
   cd mobile
   ```
2. Retrieve packages:
   ```bash
   flutter pub get
   ```
3. Check code formatting and static analysis:
   ```bash
   flutter analyze
   ```
4. Run the application on an emulator or connected device:
   ```bash
   flutter run
   ```
