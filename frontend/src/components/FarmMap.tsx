'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, ZoomControl, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon (CDN-sourced to avoid webpack issues)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Green pulsing farm icon
const farmIcon = L.divIcon({
  className: '',
  html: `
    <div style="
      width: 36px; height: 36px;
      background: linear-gradient(135deg, #16a34a, #22c55e);
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 4px 16px rgba(22,163,74,0.5);
      display: flex; align-items: center; justify-content: center;
    ">
      <div style="
        width: 10px; height: 10px;
        background: white;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
    <div style="
      position: absolute; top: -4px; left: -4px;
      width: 44px; height: 44px;
      border-radius: 50%;
      background: rgba(22,163,74,0.2);
      animation: ping 1.5s ease-in-out infinite;
    "></div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

// Sensor node icon
const sensorIcon = L.divIcon({
  className: '',
  html: `
    <div style="
      width: 22px; height: 22px;
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(37,99,235,0.5);
    "></div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -11],
});

interface FarmMapProps {
  centerLat?: number;
  centerLng?: number;
  farmName?: string;
  fieldName?: string;
  healthScore?: number;
  areaAcres?: number;
  state?: string;
}

const FIELD_OFFSETS: [number, number][] = [
  [-0.0012, -0.0018], [-0.0012, 0.0018],
  [0.0012, 0.0018],   [0.0012, -0.0018],
];

// Sensor node offsets relative to center
const SENSOR_OFFSETS: { offset: [number, number]; label: string; value: string }[] = [
  { offset: [-0.0006, -0.0009], label: 'N-P-K Sensor', value: 'N:82 P:45 K:60' },
  { offset: [-0.0006, 0.0009],  label: 'Soil pH Probe', value: 'pH: 6.8 · Temp 28°C' },
  { offset: [0.0006, 0.0009],   label: 'Moisture Node', value: 'SM: 62% · Irrigation: Active' },
  { offset: [0.0006, -0.0009],  label: 'Rain Gauge',    value: 'Rain: 0mm · Wind: 12 km/h' },
];

export default function FarmMap({
  centerLat = 30.9010,
  centerLng = 75.8573,
  farmName = 'Green Valley Farm',
  fieldName = 'Field A',
  healthScore = 82.5,
  areaAcres = 4.2,
  state = 'Punjab',
}: FarmMapProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const center: [number, number] = [centerLat, centerLng];

  const fieldBoundary: [number, number][] = FIELD_OFFSETS.map(
    ([dlat, dlng]) => [centerLat + dlat, centerLng + dlng]
  );

  const sensorNodes = SENSOR_OFFSETS.map(({ offset: [dlat, dlng], label, value }) => ({
    position: [centerLat + dlat, centerLng + dlng] as [number, number],
    label,
    value,
  }));

  const healthColor = healthScore >= 80 ? '#16a34a' : healthScore >= 60 ? '#eab308' : '#dc2626';

  return (
    <MapContainer
      center={center}
      zoom={15}
      style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}
      zoomControl={false}
    >
      <ZoomControl position="bottomright" />
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="OpenStreetMap">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellite (Esri)">
          <TileLayer
            attribution='&copy; Esri &mdash; Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      {/* Farm center marker */}
      <Marker position={center} icon={farmIcon}>
        <Popup>
          <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 160 }}>
            <strong style={{ fontSize: 13, color: '#0f172a' }}>🌾 {farmName}</strong>
            <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0' }}>{state}, India</p>
          </div>
        </Popup>
      </Marker>

      {/* Field boundary polygon */}
      <Polygon
        positions={fieldBoundary}
        pathOptions={{
          color: healthColor,
          fillColor: healthColor,
          fillOpacity: 0.18,
          weight: 2.5,
          dashArray: undefined,
        }}
      >
        <Popup>
          <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 160 }}>
            <strong style={{ fontSize: 13, color: '#0f172a' }}>📍 {fieldName}</strong>
            <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 2px' }}>
              Health: <strong style={{ color: healthColor }}>{healthScore}%</strong>
            </p>
            <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>{areaAcres} acres · {state}</p>
          </div>
        </Popup>
      </Polygon>

      {/* IoT Sensor nodes */}
      {sensorNodes.map((s, i) => (
        <Marker key={i} position={s.position} icon={sensorIcon}>
          <Popup>
            <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 150 }}>
              <strong style={{ fontSize: 12, color: '#1e40af' }}>📡 {s.label}</strong>
              <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0' }}>{s.value}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
