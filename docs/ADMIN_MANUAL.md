# Admin Manual - AgriMind AI System Operations

This guide provides instructions for system administrators to manage users, configure IoT sensors, monitor ML model paths, and audit server health.

---

## 1. User Management & Access Control

AgriMind AI enforces Role-Based Access Control (RBAC) with three primary roles:
1. **Admin:** Full access to configure models, register IoT gateways, and audit users.
2. **Agronomist:** View crop health scores, disease logs, and approve custom fertilizer recommendations.
3. **Farmer:** Manage individual farms and fields, view alerts, and scan leaf diseases.

### 1.1 Managing Roles
Roles are specified in the `users` table via the `role` enum. To escalate a user to an Agronomist or Admin, run the following SQL update:
```sql
UPDATE users SET role = 'agronomist' WHERE email = 'expert@agrimind.ai';
```

---

## 2. IoT Device & Sensor Provisioning

Telemetry data is ingested from sensors via the MQTT Broker (port 1883) or WebSocket ports.

### 2.1 Registering an IoT Node
1. Access the database and insert a new device in the `iot_devices` table:
   ```sql
   INSERT INTO iot_devices (id, field_id, device_id, sensor_type, mqtt_topic, status)
   VALUES (uuid_generate_v4(), 'field-uuid-here', 'SM-002-LUD', 'soil_moisture', 'sensors/SM-002-LUD/moisture', 'active');
   ```
2. Configure the physical IoT hardware node to publish JSON telemetry to `sensors/SM-002-LUD/moisture`:
   ```json
   {
     "device_id": "SM-002-LUD",
     "sensor_type": "soil_moisture",
     "value": 31.2,
     "unit": "%"
   }
   ```

### 2.2 Setting Alert Thresholds
Solenoid automatic alerts are triggered based on sensor value thresholds. Modify settings or thresholds within the backend configuration files or db triggers. Critical soil moisture alert is preset at `< 15%`.

---

## 3. ML Model Management & Retraining

AgriMind AI integrates several machine learning models. File paths are defined in `app/core/config.py`.

### 3.1 Model Registry Config
- **YOLOv8 Leaf Disease Model:** `../ml/models/disease_yolov8.pt`
- **Crop Health CNN Model:** `../ml/models/crop_health_cnn.h5`
- **Pest, Water, Price, Yield predictors:** `../ml/models/` (joblib binaries)

### 3.2 Running the Retraining Pipeline
Retrain the predictive models (pest risk, water requirement, price index, yield estimation) when new seasonal datasets are uploaded:
1. Move to the `ml` directory:
   ```bash
   cd ml
   ```
2. Activate python virtual environment and run the pipeline:
   ```bash
   python train_all.py
   ```
This script fits the estimators, checks test metrics, and overwrites the active binaries in `ml/models/`.

---

## 4. Diagnostics & Auditing Logs

### 4.1 System Monitoring
- **API Server Logs:** Access Docker stdout/stderr logs:
  ```bash
  docker compose logs -f backend
  ```
- **Database Logs:** Query TimescaleDB engine performance metrics.
- **Cache Auditing:** Monitor Redis memory usage:
  ```bash
  docker exec -it agrimind-redis redis-cli info memory
  ```
