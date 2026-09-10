# Testing Strategy - AgriMind AI

This document establishes the testing guidelines, test environments, and automation workflows for the AgriMind AI Smart Agriculture Platform.

---

## 1. Backend Testing Strategy (FastAPI)

The backend code uses a PostgreSQL database, a Redis cache, and several machine learning models. We enforce testing boundaries to ensure that each component functions correctly in isolation.

### 1.1 Unit & Integration Testing
- **Framework:** `pytest` with `pytest-asyncio` for testing async routes.
- **Database Isolation:** Tests utilize a transaction-based database session. An async database transaction is initialized in `conftest.py` before each test and is rolled back upon completion. This keeps the database state completely clean and prevents tests from leaking state to other tests.
- **Dependency Overrides:** The database dependency (`get_db`) is overridden in test suites, feeding the rolled-back async test session to the endpoints.
- **Coverage Target:** Minimum 80% code coverage.

Run backend tests using:
```bash
cd backend
pytest tests/ -v --cov=app --cov-report=term-missing
```

### 1.2 Performance & Load Testing
- **Framework:** Locust.
- **Simulation:** Simulate up to 10,000 concurrent farmer sessions posting sensor telemetry and querying the AI assistant.
- **Response Targets:**
  - Standard API routes: `< 200ms` (p95)
  - Image analysis inference: `< 5s` (p95)

---

## 2. Frontend Testing Strategy (Next.js)

The web dashboard is tested across component rendering, state management, and end-to-end user flows.

### 2.1 Component & Unit Testing
- **Framework:** Jest & React Testing Library.
- **Testing Areas:** Renders charts, handles state (Zustand), updates theme, and validates forms.
- **API Mocking:** Network calls are mocked using Mock Service Worker (MSW) or Jest fetch mocks.

Run frontend unit tests using:
```bash
cd frontend
npm run test
```

### 2.2 End-to-End (E2E) Testing
- **Framework:** Playwright or Cypress.
- E2E tests verify the complete user journey: logging in, drawing field boundaries, uploading leaf scans, and chatting with the assistant.

Run E2E tests using:
```bash
cd frontend
npm run test:e2e
```

---

## 3. Mobile Testing Strategy (Flutter)

The Flutter mobile application supports vital features like regional voice inputs and offline data synchronization.

### 3.1 Unit & Widget Testing
- **Framework:** Flutter Test.
- **Testing Areas:** Validates JSON serialization, language providers, theme provider changes, and widget UI renders.

Run mobile widget tests using:
```bash
cd mobile
flutter test
```

### 3.2 Integration & Driver Testing
- **Framework:** Flutter Driver.
- Runs UI automated tests on emulator/simulator profiles to ensure buttons, cameras, and sliders interact accurately.

---

## 4. Continuous Integration (CI)

Our GitHub Actions pipeline (`.github/workflows/ci.yml`) runs on any branch pushes or pull requests to main, executing:
1. Flake8 syntax checks for Python.
2. ESLint for frontend files.
3. Flutter analyze checks for mobile.
4. Backend test suites with coverage logs.
5. Standalone build validation.
