"""
AgriMind AI - Machine Learning Training Pipeline
Trains all ML models for the Smart Agriculture Platform.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_absolute_error, classification_report
from sklearn.preprocessing import StandardScaler

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODELS_DIR, exist_ok=True)


def generate_synthetic_pest_data(n=5000):
    """Generate synthetic pest prediction training data."""
    np.random.seed(42)
    data = []
    for _ in range(n):
        temp = np.random.uniform(20, 40)
        humidity = np.random.uniform(40, 95)
        rainfall = np.random.uniform(0, 100)
        crop_type = np.random.choice([0, 1, 2, 3])  # rice, wheat, cotton, tomato

        risk = 0
        if 28 <= temp <= 35: risk += 1
        if humidity > 70: risk += 1
        if rainfall > 30: risk += 1
        label = 0 if risk <= 0 else (1 if risk <= 2 else 2)  # low, medium, high

        data.append([temp, humidity, rainfall, crop_type, label])

    df = pd.DataFrame(data, columns=["temperature", "humidity", "rainfall_7d", "crop_type", "risk_level"])
    return df


def generate_synthetic_water_data(n=5000):
    """Generate synthetic water requirement training data."""
    np.random.seed(42)
    data = []
    for _ in range(n):
        kc = np.random.uniform(0.4, 1.3)
        et0 = np.random.uniform(2, 8)
        area = np.random.uniform(1, 10)
        moisture = np.random.uniform(10, 50)
        temp = np.random.uniform(25, 40)
        rainfall = np.random.uniform(0, 20)

        et_crop = et0 * kc
        daily_liters = max(et_crop - rainfall * 0.8, 0) * area * 4047
        if moisture < 30:
            daily_liters *= 1.2

        data.append([kc, et0, area, moisture, temp, rainfall, daily_liters])

    df = pd.DataFrame(data, columns=["kc", "et0", "area_acres", "soil_moisture", "temperature", "rainfall", "daily_liters"])
    return df


def generate_synthetic_price_data(n=3000):
    """Generate synthetic market price prediction data."""
    np.random.seed(42)
    base_prices = {0: 2200, 1: 2275, 2: 6620, 3: 1800}
    data = []
    for _ in range(n):
        crop = np.random.choice([0, 1, 2, 3])
        month = np.random.randint(1, 13)
        demand = np.random.uniform(0.8, 1.3)
        supply = np.random.uniform(0.7, 1.2)
        festival = 1 if month in [10, 11, 3] else 0

        price = base_prices[crop] * demand / supply * (1.1 if festival else 1.0)
        price *= np.random.uniform(0.95, 1.05)
        data.append([crop, month, demand, supply, festival, price])

    df = pd.DataFrame(data, columns=["crop_type", "month", "demand_index", "supply_index", "festival", "price"])
    return df


def train_pest_model():
    print("Training Pest Prediction Model...")
    df = generate_synthetic_pest_data()
    X = df.drop("risk_level", axis=1)
    y = df["risk_level"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"  Pest Model Accuracy: {acc:.3f}")
    print(classification_report(y_test, y_pred, target_names=["low", "medium", "high"]))

    joblib.dump(model, os.path.join(MODELS_DIR, "pest_predictor.joblib"))
    return model


def train_water_model():
    print("Training Water Requirement Model...")
    df = generate_synthetic_water_data()
    X = df.drop("daily_liters", axis=1)
    y = df["daily_liters"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    model = GradientBoostingRegressor(n_estimators=100, max_depth=5, random_state=42)
    model.fit(X_train_scaled, y_train)
    y_pred = model.predict(X_test_scaled)
    mae = mean_absolute_error(y_test, y_pred)
    print(f"  Water Model MAE: {mae:.0f} liters")

    joblib.dump({"model": model, "scaler": scaler}, os.path.join(MODELS_DIR, "water_predictor.joblib"))
    return model


def train_price_model():
    print("Training Market Price Model...")
    df = generate_synthetic_price_data()
    X = df.drop("price", axis=1)
    y = df["price"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = GradientBoostingRegressor(n_estimators=100, max_depth=5, random_state=42)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    print(f"  Price Model MAE: ₹{mae:.0f}/quintal")

    joblib.dump(model, os.path.join(MODELS_DIR, "price_predictor.joblib"))
    return model


def train_harvest_model():
    print("Training Harvest Prediction Model...")
    np.random.seed(42)
    n = 3000
    data = []
    for _ in range(n):
        age = np.random.uniform(30, 150)
        duration = np.random.uniform(90, 180)
        health = np.random.uniform(50, 100)
        moisture = np.random.uniform(15, 30)
        readiness = min(age / duration * 100 * (health / 100), 100)
        data.append([age, duration, health, moisture, readiness])

    df = pd.DataFrame(data, columns=["crop_age", "growth_duration", "health_score", "moisture", "readiness_pct"])
    X = df.drop("readiness_pct", axis=1)
    y = df["readiness_pct"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = GradientBoostingRegressor(n_estimators=100, max_depth=4, random_state=42)
    model.fit(X_train, y_train)
    mae = mean_absolute_error(y_test, model.predict(X_test))
    print(f"  Harvest Model MAE: {mae:.1f}%")

    joblib.dump(model, os.path.join(MODELS_DIR, "harvest_predictor.joblib"))
    return model


def train_all():
    print("=" * 50)
    print("AgriMind AI - ML Training Pipeline")
    print("=" * 50)

    models = {
        "pest_predictor": train_pest_model(),
        "water_predictor": train_water_model(),
        "price_predictor": train_price_model(),
        "harvest_predictor": train_harvest_model(),
    }

    metadata = {
        "models": list(models.keys()),
        "framework": "scikit-learn",
        "version": "1.0.0",
        "trained_at": pd.Timestamp.now().isoformat(),
    }
    with open(os.path.join(MODELS_DIR, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    print("\n✅ All models trained and saved to ml/models/")
    print(f"   Models: {', '.join(models.keys())}")


if __name__ == "__main__":
    train_all()
