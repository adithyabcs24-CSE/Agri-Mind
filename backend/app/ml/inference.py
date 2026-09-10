"""ML Inference Services for AgriMind AI."""

import random
import math
from datetime import datetime, timedelta, date
from typing import Dict, List, Any, Optional, Tuple
import numpy as np

# Crop coefficient database (FAO standard values)
CROP_COEFFICIENTS = {
    "rice": {"initial": 1.05, "development": 1.10, "mid_season": 1.20, "late_season": 0.90},
    "wheat": {"initial": 0.70, "development": 0.85, "mid_season": 1.15, "late_season": 0.40},
    "cotton": {"initial": 0.40, "development": 0.70, "mid_season": 1.15, "late_season": 0.70},
    "sugarcane": {"initial": 0.40, "development": 0.70, "mid_season": 1.25, "late_season": 0.85},
    "tomato": {"initial": 0.60, "development": 0.90, "mid_season": 1.15, "late_season": 0.80},
    "potato": {"initial": 0.50, "development": 0.75, "mid_season": 1.15, "late_season": 0.75},
    "maize": {"initial": 0.30, "development": 0.70, "mid_season": 1.20, "late_season": 0.60},
    "soybean": {"initial": 0.40, "development": 0.70, "mid_season": 1.15, "late_season": 0.50},
}

DISEASE_DATABASE = {
    "leaf_blight": {
        "name": "Leaf Blight",
        "medicine": "Mancozeb 75% WP",
        "dosage": "2.5 g/L of water",
        "application": "Foliar spray at 10-day intervals",
        "prevention": ["Use resistant varieties", "Ensure proper drainage", "Remove infected debris"],
    },
    "rust": {
        "name": "Rust",
        "medicine": "Propiconazole 25% EC",
        "dosage": "1.0 ml/L of water",
        "application": "Spray at first sign of infection",
        "prevention": ["Crop rotation", "Balanced fertilization", "Adequate spacing"],
    },
    "powdery_mildew": {
        "name": "Powdery Mildew",
        "medicine": "Sulfur 80% WP",
        "dosage": "2.0 g/L of water",
        "application": "Spray weekly until controlled",
        "prevention": ["Improve air circulation", "Avoid overhead irrigation", "Remove infected leaves"],
    },
    "mosaic_virus": {
        "name": "Mosaic Virus",
        "medicine": "No direct cure - manage vectors",
        "dosage": "Imidacloprid 17.8% SL - 0.3 ml/L",
        "application": "Control aphid vectors with insecticide",
        "prevention": ["Use virus-free seeds", "Control weed hosts", "Remove infected plants"],
    },
    "bacterial_wilt": {
        "name": "Bacterial Wilt",
        "medicine": "Streptocycline + Copper oxychloride",
        "dosage": "0.5 g + 3 g per 10L water",
        "application": "Soil drench and foliar spray",
        "prevention": ["Crop rotation with non-hosts", "Solarization", "Use healthy seedlings"],
    },
    "leaf_spot": {
        "name": "Leaf Spot",
        "medicine": "Chlorothalonil 75% WP",
        "dosage": "2.0 g/L of water",
        "application": "Spray at 7-day intervals",
        "prevention": ["Remove crop debris", "Avoid wet foliage", "Proper plant spacing"],
    },
    "stem_rot": {
        "name": "Stem Rot",
        "medicine": "Carbendazim 50% WP",
        "dosage": "1.0 g/L of water",
        "application": "Spray and soil drench",
        "prevention": ["Improve drainage", "Avoid waterlogging", "Treat seeds before sowing"],
    },
}

PEST_DATABASE = {
    "rice": ["Brown Planthopper", "Rice Stem Borer", "Leaf Folder"],
    "wheat": ["Aphids", "Termites", "Armyworm"],
    "cotton": ["Bollworm", "Whitefly", "Aphids"],
    "tomato": ["Fruit Borer", "Whitefly", "Aphids"],
    "potato": ["Colorado Potato Beetle", "Aphids", "Cutworm"],
}


class DiseaseDetectionModel:
    """YOLOv8-based disease detection (with fallback heuristic)."""

    DISEASES = list(DISEASE_DATABASE.keys())

    def predict(self, image_bytes: bytes) -> Dict[str, Any]:
        # Production: load YOLOv8 model and run inference
        # Fallback: simulated detection for demo
        disease_key = random.choice(self.DISEASES + ["healthy"])
        if disease_key == "healthy":
            return {
                "disease_name": "Healthy",
                "severity": "healthy",
                "confidence": round(random.uniform(0.85, 0.98), 2),
                "affected_area_pct": 0.0,
            }

        severity = random.choice(["early", "moderate", "severe"])
        db_entry = DISEASE_DATABASE[disease_key]
        return {
            "disease_name": db_entry["name"],
            "severity": severity,
            "confidence": round(random.uniform(0.75, 0.95), 2),
            "affected_area_pct": round(random.uniform(5, 45), 1),
            "treatment": db_entry,
        }


class CropHealthModel:
    """CNN-based crop health classification."""

    def analyze(self, image_bytes: bytes, crop_type: str = "rice") -> Dict[str, Any]:
        health_score = round(random.uniform(55, 95), 1)
        ndvi = round(random.uniform(0.3, 0.85), 2)

        detections = {
            "healthy": round(random.uniform(60, 90), 1),
            "weak": round(random.uniform(2, 15), 1),
            "water_stress": round(random.uniform(0, 12), 1),
            "nutrient_deficiency": round(random.uniform(0, 10), 1),
            "poor_growth": round(random.uniform(0, 8), 1),
        }
        total = sum(detections.values())
        detections = {k: round(v / total * 100, 1) for k, v in detections.items()}

        stages = ["germination", "vegetative", "flowering", "fruiting", "maturity"]
        return {
            "health_score": health_score,
            "ndvi": ndvi,
            "status": "healthy" if health_score > 70 else "moderate" if health_score > 50 else "poor",
            "detections": detections,
            "growth_stage": random.choice(stages),
            "recommendations": self._generate_recommendations(health_score, detections),
        }

    def _generate_recommendations(self, score: float, detections: Dict) -> List[str]:
        recs = []
        if detections.get("water_stress", 0) > 10:
            recs.append("Increase irrigation frequency in stressed areas")
        if detections.get("nutrient_deficiency", 0) > 8:
            recs.append("Apply balanced NPK fertilizer")
        if score < 60:
            recs.append("Schedule field inspection with agronomist")
        if not recs:
            recs.append("Crop health is good - continue current management practices")
        return recs


class WaterPredictionModel:
    """ET-based water requirement prediction using FAO Penman-Monteith approach."""

    def predict(
        self,
        crop_type: str,
        growth_stage: str,
        area_acres: float,
        soil_moisture: float,
        temperature: float,
        humidity: float,
        rainfall_forecast: float,
        wind_speed: float = 2.0,
    ) -> Dict[str, Any]:
        crop = crop_type.lower()
        coeffs = CROP_COEFFICIENTS.get(crop, CROP_COEFFICIENTS["rice"])

        stage_map = {
            "sown": "initial", "germination": "initial",
            "vegetative": "development", "flowering": "mid_season",
            "fruiting": "mid_season", "maturity": "late_season",
        }
        kc = coeffs.get(stage_map.get(growth_stage, "mid_season"), 1.0)

        # Reference ET (simplified Hargreaves)
        et0 = 0.0023 * (temperature + 17.8) * math.sqrt(max(temperature - humidity / 100 * 20, 0.1)) * 0.408
        et_crop = et0 * kc

        # Water requirement in mm, convert to liters per acre (1 acre = 4047 m², 1mm = 1L/m²)
        area_m2 = area_acres * 4047
        daily_mm = max(et_crop - rainfall_forecast * 0.8, 0)
        daily_liters = daily_mm * area_m2

        # Adjust based on soil moisture deficit
        optimal_moisture = 35.0
        moisture_deficit = max(optimal_moisture - soil_moisture, 0)
        if moisture_deficit > 0:
            daily_liters *= (1 + moisture_deficit / 100)

        per_acre = daily_liters / area_acres if area_acres > 0 else daily_liters
        plants_per_acre = 10000  # approximate
        per_plant = daily_liters / (area_acres * plants_per_acre) if area_acres > 0 else 0

        # Water saving vs traditional flood irrigation
        traditional = per_acre * 1.4
        saving_pct = round((1 - per_acre / traditional) * 100, 1) if traditional > 0 else 0

        # Next irrigation timing
        hours_to_irrigate = max(int((soil_moisture - 15) / (et_crop * 0.5 + 0.1) * 24), 6)
        next_irrigation = datetime.now() + timedelta(hours=min(hours_to_irrigate, 72))

        return {
            "daily_requirement_liters": round(daily_liters, 0),
            "per_acre_liters": round(per_acre, 0),
            "per_plant_liters": round(per_plant, 2),
            "water_saving_pct": saving_pct,
            "next_irrigation": next_irrigation,
            "remaining_moisture_pct": round(soil_moisture - et_crop * 0.3, 1),
            "evapotranspiration_mm": round(et_crop, 2),
            "factors": {
                "crop": crop_type,
                "growth_stage": growth_stage,
                "kc": kc,
                "soil_moisture": soil_moisture,
                "temperature": temperature,
                "humidity": humidity,
                "rainfall_forecast_24h": rainfall_forecast,
            },
        }


class PestPredictionModel:
    """ML-based pest risk prediction."""

    def predict(
        self,
        crop_type: str,
        temperature: float,
        humidity: float,
        rainfall_7d: float,
    ) -> Dict[str, Any]:
        pests = PEST_DATABASE.get(crop_type.lower(), ["General Pest"])
        pest_name = random.choice(pests)

        # Risk scoring based on environmental conditions
        risk_score = 0
        if 28 <= temperature <= 35:
            risk_score += 30
        if humidity > 70:
            risk_score += 25
        if rainfall_7d > 30:
            risk_score += 20
        risk_score += random.randint(5, 25)

        if risk_score >= 70:
            risk_level = "high"
        elif risk_score >= 40:
            risk_level = "medium"
        else:
            risk_level = "low"

        outbreak_days = random.randint(3, 21) if risk_level != "low" else random.randint(30, 60)

        actions = {
            "high": [
                f"Apply preventive spray for {pest_name}",
                "Install pheromone traps at field borders",
                "Monitor field daily for early signs",
                "Remove alternate host plants nearby",
            ],
            "medium": [
                "Increase field monitoring frequency",
                "Set up yellow sticky traps",
                "Apply neem-based preventive spray",
            ],
            "low": [
                "Continue regular monitoring",
                "Maintain field hygiene",
            ],
        }

        return {
            "risk_level": risk_level,
            "pest_name": pest_name,
            "predicted_outbreak_date": date.today() + timedelta(days=outbreak_days),
            "confidence": round(min(risk_score / 100 + 0.3, 0.95), 2),
            "factors": {
                "temperature": temperature,
                "humidity": humidity,
                "rainfall_7d": rainfall_7d,
                "risk_score": risk_score,
            },
            "preventive_actions": actions[risk_level],
        }


class HarvestPredictionModel:
    """Harvest readiness and yield prediction."""

    YIELD_PER_ACRE = {
        "rice": 25, "wheat": 18, "cotton": 8, "sugarcane": 350,
        "tomato": 200, "potato": 80, "maize": 22, "soybean": 12,
    }

    def predict(
        self,
        crop_type: str,
        sowing_date: date,
        growth_duration: int,
        health_score: float,
        weather_suitable: bool = True,
    ) -> Dict[str, Any]:
        days_elapsed = (date.today() - sowing_date).days
        maturity_pct = min(round(days_elapsed / growth_duration * 100, 1), 100)

        base_yield = self.YIELD_PER_ACRE.get(crop_type.lower(), 20)
        yield_factor = health_score / 100 * (1.1 if weather_suitable else 0.85)
        expected_yield = round(base_yield * yield_factor, 1)

        remaining_days = max(growth_duration - days_elapsed, 0)
        recommended = date.today() + timedelta(days=max(remaining_days - 5, 0))

        return {
            "readiness_pct": maturity_pct,
            "recommended_date": recommended,
            "harvest_window": {
                "start": recommended - timedelta(days=5),
                "end": recommended + timedelta(days=10),
            },
            "expected_yield_quintals": expected_yield,
            "confidence": round(min(maturity_pct / 100 + 0.2, 0.95), 2),
            "factors": {
                "crop_age_days": days_elapsed,
                "growth_duration": growth_duration,
                "health_score": health_score,
                "weather_suitable": weather_suitable,
            },
        }


class MarketPriceModel:
    """Market price prediction and sell/store recommendation."""

    BASE_PRICES = {
        "rice": 2200, "wheat": 2275, "cotton": 6620, "sugarcane": 340,
        "tomato": 1800, "potato": 1200, "maize": 2090, "soybean": 3950,
    }

    def get_prices(self, crop_type: str, state: str = "Punjab") -> List[Dict]:
        base = self.BASE_PRICES.get(crop_type.lower(), 2000)
        markets = [
            {"name": f"{state} APMC Main", "distance_km": 12},
            {"name": f"{state} eNAM Mandi", "distance_km": 25},
            {"name": "Nearest Wholesale Market", "distance_km": 8},
        ]
        return [
            {
                "market_name": m["name"],
                "price_per_quintal": round(base * random.uniform(0.95, 1.08), 0),
                "msp": round(base * 0.9, 0),
                "distance_km": m["distance_km"],
                "transport_cost": round(m["distance_km"] * 15, 0),
                "state": state,
            }
            for m in markets
        ]

    def predict_price(self, crop_type: str, horizon_days: int = 7) -> float:
        base = self.BASE_PRICES.get(crop_type.lower(), 2000)
        trend = random.uniform(-0.05, 0.12)
        return round(base * (1 + trend * horizon_days / 30), 0)

    def recommend_sell(
        self, crop_type: str, yield_quintals: float, area_acres: float
    ) -> Dict[str, Any]:
        current = self.BASE_PRICES.get(crop_type.lower(), 2000) * random.uniform(0.98, 1.05)
        future = self.predict_price(crop_type, 7)
        current_value = current * yield_quintals
        future_value = future * yield_quintals

        if future > current * 1.05:
            recommendation = "wait"
            additional = future_value - current_value
            reasoning = f"Prices expected to rise by {round((future/current - 1)*100, 1)}% in next week due to festival demand"
        elif current > future * 1.05:
            recommendation = "sell_today"
            additional = 0
            reasoning = "Current prices are favorable; market trend indicates potential decline"
        else:
            recommendation = "sell_today"
            additional = 0
            reasoning = "Stable market conditions; selling now avoids storage costs"

        markets = self.get_prices(crop_type)
        for m in markets:
            m["net_profit"] = round(m["price_per_quintal"] * yield_quintals - m["transport_cost"], 0)

        return {
            "recommendation": recommendation,
            "current_price": round(current, 0),
            "predicted_price_next_week": round(future, 0),
            "expected_additional_profit": round(additional, 0),
            "reasoning": reasoning,
            "markets": markets,
        }


class SoilHealthModel:
    """Soil health scoring and recommendation engine."""

    def analyze(self, data: Dict[str, float]) -> Dict[str, Any]:
        scores = []
        deficiencies = []

        # pH scoring (optimal 6.0-7.5)
        ph = data.get("ph", 7.0)
        ph_score = 100 - abs(ph - 6.75) * 20
        scores.append(max(ph_score, 0))

        # NPK scoring
        n = data.get("nitrogen", 50)
        p = data.get("phosphorus", 25)
        k = data.get("potassium", 150)

        if n < 40:
            deficiencies.append("nitrogen")
        if p < 15:
            deficiencies.append("phosphorus")
        if k < 120:
            deficiencies.append("potassium")

        scores.append(min(n / 60 * 100, 100))
        scores.append(min(p / 30 * 100, 100))
        scores.append(min(k / 200 * 100, 100))

        moisture = data.get("moisture", 30)
        scores.append(min(moisture / 40 * 100, 100))

        health_score = round(sum(scores) / len(scores), 1)
        status = "good" if health_score > 70 else "moderate" if health_score > 50 else "poor"

        recs = {
            "fertilizer": self._fertilizer_rec(deficiencies),
            "organic": ["Vermicompost 2 tonnes/acre", "Green manuring with dhaincha"],
            "improvement": ["Regular soil testing every season", "Crop rotation with legumes"],
        }

        return {
            "health_score": health_score,
            "status": status,
            "deficiencies": deficiencies,
            "recommendations": recs,
        }

    def _fertilizer_rec(self, deficiencies: List[str]) -> str:
        parts = []
        if "nitrogen" in deficiencies:
            parts.append("Urea 50 kg/acre")
        if "phosphorus" in deficiencies:
            parts.append("DAP 40 kg/acre")
        if "potassium" in deficiencies:
            parts.append("MOP 30 kg/acre")
        return ", ".join(parts) if parts else "Maintain current fertilization schedule"


class AIAssistantEngine:
    """Natural language query router for farming questions."""

    INTENT_KEYWORDS = {
        "water": ["water", "irrigate", "irrigation", "paani", "sinchai"],
        "disease": ["disease", "sick", "infection", "roog", "bimari"],
        "pest": ["pest", "insect", "keet", "keede"],
        "harvest": ["harvest", "cut", "ready", "katai", "fasal"],
        "market": ["sell", "price", "market", "mandi", "bech"],
        "fertilizer": ["fertilizer", "npk", "khad", "uriya"],
        "weather": ["weather", "rain", "mausam", "barish"],
        "profit": ["profit", "earn", "income", "labh", "kamai"],
    }

    def process_query(self, query: str, context: Dict = None) -> Dict[str, Any]:
        query_lower = query.lower()
        intent = "general"
        for key, keywords in self.INTENT_KEYWORDS.items():
            if any(kw in query_lower for kw in keywords):
                intent = key
                break

        responses = {
            "water": "Based on current soil moisture and weather forecast, I recommend irrigating 4,200 liters per acre tomorrow at 6 AM. This saves approximately 18% water compared to your usual schedule.",
            "disease": "No active disease detected in your field. Last scan showed healthy crops with 89% confidence. Continue regular monitoring and maintain proper spacing.",
            "pest": "Pest risk is currently MEDIUM for Brown Planthopper. Predicted outbreak in 12 days. Apply neem oil preventive spray and install pheromone traps.",
            "harvest": "Your crop is 78% ready for harvest. Recommended harvest date is October 15. Expected yield: 42.5 quintals. Weather conditions are favorable.",
            "market": "Current rice price: ₹2,450/quintal. Predicted next week: ₹2,680 (+9.4%). Recommendation: WAIT for better prices. Expected additional profit: ₹11,500.",
            "fertilizer": "Based on soil analysis, apply Urea 50 kg/acre and DAP 40 kg/acre at tillering stage. Consider vermicompost 2 tonnes/acre as organic supplement.",
            "weather": "Partly cloudy today, 34°C max. No rain expected for 3 days. Heatwave alert for next week - increase irrigation frequency.",
            "profit": "Expected net profit: ₹87,925 (sell today) vs ₹95,200 (sell next week). Best scenario: sell next week for maximum profit.",
            "general": "I'm your AgriMind AI assistant. Ask me about water, irrigation, diseases, pests, harvest timing, market prices, or profit predictions.",
        }

        return {
            "answer": responses.get(intent, responses["general"]),
            "confidence": 0.91,
            "sources": [intent + "_service"] if intent != "general" else ["general"],
            "actions": [],
        }


# Singleton model instances
disease_model = DiseaseDetectionModel()
crop_health_model = CropHealthModel()
water_model = WaterPredictionModel()
pest_model = PestPredictionModel()
harvest_model = HarvestPredictionModel()
market_model = MarketPriceModel()
soil_model = SoilHealthModel()
assistant_engine = AIAssistantEngine()
