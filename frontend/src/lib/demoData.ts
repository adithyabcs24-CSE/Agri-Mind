// AgriMind AI - Comprehensive Demo Data for instant testing

export const DEMO_FARM = {
  id: 'demo-farm-01',
  name: 'Green Valley Agro Farm',
  total_area_acres: 12.5,
  latitude: 30.9010,
  longitude: 75.8573,
  state: 'Punjab',
  district: 'Ludhiana',
};

export const DEMO_FIELDS = [
  {
    id: 'demo-field-01',
    farm_id: 'demo-farm-01',
    name: 'Field A - Basmati Rice',
    area_acres: 4.5,
    soil_type: 'Alluvial Loam',
    status: 'Active',
  },
  {
    id: 'demo-field-02',
    farm_id: 'demo-farm-01',
    name: 'Field B - Durum Wheat',
    area_acres: 5.2,
    soil_type: 'Clay Loam',
    status: 'Active',
  },
  {
    id: 'demo-field-03',
    farm_id: 'demo-farm-01',
    name: 'Field C - Organic Mustard',
    area_acres: 2.8,
    soil_type: 'Sandy Loam',
    status: 'Fallow',
  },
];

export const DEMO_CYCLE = {
  id: 'demo-cycle-01',
  field_id: 'demo-field-01',
  crop_name: 'Basmati Rice (Pusa 1121)',
  growth_stage: 'Vegetative Tillering',
  health_score: 84.5,
  sowing_date: '2026-07-15',
  expected_harvest: '2026-11-20',
};

export const DEMO_SENSORS = {
  soil_moisture: 68.2,
  soil_temperature: 24.5,
  air_humidity: 71.0,
  air_temperature: 30.5,
  nitrogen: 142,
  phosphorus: 48,
  potassium: 195,
  ph: 6.8,
};

export const DEMO_WEATHER = {
  temperature_max: 31.0,
  temperature_min: 22.5,
  humidity: 65,
  rainfall_mm: 0.0,
  description: 'Optimal sunny conditions with light breeze. Low disease sporulation risk today.',
};

export const DEMO_IRRIGATION = {
  water_amount_liters: 12500,
  action: 'Scheduled drip irrigation tomorrow at 06:00 AM',
  status: 'optimal',
};

export const DEMO_ALERTS = [
  {
    severity: 'info',
    title: 'Soil Nitrogen Balance Optimal',
    message: 'Field A sensors report optimal nitrate availability for tillering phase.',
    created_at: new Date().toISOString(),
  },
  {
    severity: 'warning',
    title: 'Pest Surveillance Watch',
    message: 'Ambient humidity in Ludhiana district indicates moderate Brown Planthopper alert.',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    severity: 'info',
    title: 'Solar Radiance Favorable',
    message: 'Photosynthetic activity index high across North plots.',
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
];

export const DEMO_PEST = {
  risk_level: 'Low - Guarded',
  pest_name: 'Brown Planthopper',
};

export const DEMO_PROFIT = {
  expected_yield_quintals: 45.0,
  current_market_value: 135000,
};
