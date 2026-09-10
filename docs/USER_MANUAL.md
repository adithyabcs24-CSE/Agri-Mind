# User Manual - AgriMind AI Farmer Guide

Welcome to **AgriMind AI** – your AI-powered digital farming assistant. This manual guides you through using the platform to improve crop yields, prevent disease, conserve water, and maximize profits.

---

## 1. Getting Started

### 1.1 Mobile Login
1. Open the **AgriMind AI** mobile application.
2. Enter your registered email (e.g. `farmer@agrimind.ai`) and password (`Farmer@123`).
3. Tap **Sign In**.

### 1.2 Dashboard Navigation
Upon signing in, you will see your **Farm Overview** dashboard. Use the sidebar on the web or the grid menu on mobile to navigate between sections:
- **Crop Health:** View health scores and NDVI greenness indexes.
- **Disease Scanner:** Identify leaf diseases using your phone camera.
- **Water Calculator:** See exactly how many liters of water your crop requires today.
- **Market Prices:** Compare local APMC Mandis and get store-or-sell advisory.
- **Soil Analysis:** Check soil NPK, pH, and organic carbon values.
- **AI Assistant:** Speak or type questions in your regional language.

---

## 2. Farm & Field Mapping

Before the system can calculate precise recommendations, you must map your fields.
1. Navigate to the **Farm Map** tab.
2. Tap **Add Farm** and enter your farm name, size in acres, and location details.
3. Draw your field boundaries on the interactive GPS map.
4. Select the crop type (e.g. Rice, Wheat, Cotton) and input the sowing date to initialize a crop cycle.

---

## 3. Monitoring Crop Health & Disease

### 3.1 Drone / Satellite Imagery
1. Navigate to **Crop Health**.
2. Click **Upload Imagery**. Select your drone multispectral image or fetch recent Sentinel-2 satellite tiles.
3. Tap **Analyze**. The system will output an NDVI density map and a health score from 0 to 100.

### 3.2 Scanning for Plant Diseases
If you notice spots or wilting on a leaf:
1. Navigate to **Disease Scanner**.
2. Tap **Capture Leaf Image**. Focus your phone camera closely on the affected leaf.
3. Tap **Upload**. The YOLOv8 model will diagnose the disease (e.g., Leaf Blight, Rust), state the severity (Early/Moderate/Severe), and prescribe the exact fungicide and dosage.

---

## 4. Intelligent Water & Irrigation Management

### 4.1 Daily Water Calculator
The system uses weather data and local soil moisture sensors to calculate water requirement:
1. Navigate to **Water Calculator**.
2. See "Today's Requirement" (e.g., 4,500 L per acre).
3. The circular dial displays remaining soil moisture.

### 4.2 Automated Pump Commands
1. Navigate to **Smart Irrigation**.
2. Read the AI recommendation:
   - **Start:** Tells you how many liters to irrigate and for how many minutes.
   - **Stop:** Indicates soil moisture is sufficient.
   - **Delay:** Alerts you that rain is expected shortly, saving you water and electricity.
3. Use the **Manual Overrides** buttons to turn the pump on/off directly from your dashboard.

---

## 5. Selling Crops at Maximum Profit

### 5.1 Sell vs. Store Recommendation
1. Navigate to **Market Intelligence**.
2. Read the sell advisor:
   - **WAIT:** Recommends storing the crop because prices are predicted to rise soon.
   - **SELL TODAY:** Indicates current APMC prices are favorable.
3. Look at the **Market Comparison** table to find which nearby Mandi gives the highest net profit after subtracting freight transport costs.

---

## 6. Consulting the AI Voice Assistant

1. Tap **AI Assistant** or the microphone icon.
2. Ask questions in your preferred language (English, Hindi, Tamil, Telugu, Kannada, or Marathi).
3. *Example queries:*
   - "Should I irrigate my rice field today?"
   - "Fasal me Nitrogen ki kami kaise door karein?" (Hindi)
   - "Fungicide dosage for leaf blight?"
