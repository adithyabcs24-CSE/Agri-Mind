'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { auth } from '@/lib/auth';
import {
  DEMO_FARM,
  DEMO_FIELDS,
  DEMO_CYCLE,
  DEMO_SENSORS,
  DEMO_WEATHER,
  DEMO_IRRIGATION,
  DEMO_ALERTS,
} from '@/lib/demoData';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Setup custom Axios instance with auth headers
export const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401 && typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const isDemo = token?.startsWith('demo-') || token === 'demo-mode';
      if (!isDemo) {
        localStorage.removeItem('token');
        localStorage.removeItem('agrimind_user');
        localStorage.removeItem('cached_farms');
        localStorage.removeItem('selectedFarmId');
        localStorage.removeItem('selectedFieldId');
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login?expired=1';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Cache helpers
export function getCached<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const val = localStorage.getItem(key);
  return val ? JSON.parse(val) : fallback;
}

export function setCached<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

interface Farm {
  id: string;
  name: string;
  total_area_acres: number;
  latitude?: number;
  longitude?: number;
  state?: string;
  district?: string;
}

interface Field {
  id: string;
  farm_id: string;
  name: string;
  area_acres: number;
  soil_type: string;
  status: string;
}

interface FarmFieldContextType {
  farms: Farm[];
  fields: Field[];
  selectedFarmId: string;
  selectedFieldId: string;
  selectedFarm: Farm | null;
  selectedField: Field | null;
  setSelectedFarmId: (id: string) => void;
  setSelectedFieldId: (id: string) => void;
  isOffline: boolean;
  isLoadingFarms: boolean;
  isLoadingFields: boolean;
  isLoadingPolledData: boolean;
  error: string | null;
  refetchFarms: () => Promise<void>;
  refetchFields: (farmId: string) => Promise<void>;
  refetchAllFieldData: () => Promise<void>;
  
  // Polled data states
  activeCycle: any;
  sensorData: any;
  weatherData: any;
  irrigationData: any;
  alertsData: any[];
}

const FarmFieldContext = createContext<FarmFieldContextType | undefined>(undefined);

export function FarmFieldProvider({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  
  const [selectedFarmId, setSelectedFarmIdState] = useState('');
  const [selectedFieldId, setSelectedFieldIdState] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [isLoadingFarms, setIsLoadingFarms] = useState(false);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [isLoadingPolledData, setIsLoadingPolledData] = useState(false);

  // Polled data states
  const [activeCycle, setActiveCycle] = useState<any>(null);
  const [sensorData, setSensorData] = useState<any>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [irrigationData, setIrrigationData] = useState<any>(null);
  const [alertsData, setAlertsData] = useState<any[]>([]);

  // Ref to cancel pending requests on quick switches
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync network status
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOffline(!navigator.onLine);

    const handleOnline = () => {
      setIsOffline(false);
      toast.success('Internet connection restored. Syncing data...');
      refetchFarms().then(() => {
        if (selectedFarmId) {
          refetchFields(selectedFarmId);
        }
      });
    };

    const handleOffline = () => {
      setIsOffline(true);
      toast.error('Offline Mode active. Using cached farm data.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [selectedFarmId]);

  // Load selection from localStorage on mount
  useEffect(() => {
    const savedFarmId = localStorage.getItem('selectedFarmId');
    const savedFieldId = localStorage.getItem('selectedFieldId');
    if (savedFarmId) setSelectedFarmIdState(savedFarmId);
    if (savedFieldId) setSelectedFieldIdState(savedFieldId);
  }, []);

  // Set selected farm ID
  const setSelectedFarmId = useCallback((id: string) => {
    setSelectedFarmIdState(id);
    if (id) {
      localStorage.setItem('selectedFarmId', id);
    } else {
      localStorage.removeItem('selectedFarmId');
    }
    // Reset field when farm changes
    setSelectedFieldIdState('');
    localStorage.removeItem('selectedFieldId');
    setFields([]);
    setActiveCycle(null);
    setSensorData(null);
    setWeatherData(null);
    setIrrigationData(null);
  }, []);

  // Set selected field ID
  const setSelectedFieldId = useCallback((id: string) => {
    setSelectedFieldIdState(id);
    if (id) {
      localStorage.setItem('selectedFieldId', id);
    } else {
      localStorage.removeItem('selectedFieldId');
    }
  }, []);

  // Fetch all Farms
  const refetchFarms = useCallback(async () => {
    setIsLoadingFarms(true);
    setError(null);

    let fetchedFarms: Farm[] = [];

    if (typeof window !== 'undefined' && !navigator.onLine) {
      // Offline mode: load from cache
      fetchedFarms = getCached<Farm[]>('cached_farms', []);
    } else {
      try {
        const response = await axiosInstance.get<Farm[]>('/farms/');
        fetchedFarms = response.data;
        setCached('cached_farms', response.data);
      } catch (err: any) {
        console.warn('Failed to fetch farms from API, loading cache:', err);
        fetchedFarms = getCached<Farm[]>('cached_farms', []);
      }
    }

    // Fallback to rich Demo Farm if empty and in demo mode or demo token
    const isDemo = auth.isDemo();
    if (fetchedFarms.length === 0 && isDemo) {
      fetchedFarms = [DEMO_FARM];
      setCached('cached_farms', fetchedFarms);
    }

    const sortedFarms = fetchedFarms.sort((a, b) => a.name.localeCompare(b.name));
    setFarms(sortedFarms);

    // Auto-select the first farm alphabetically if none is selected OR if the selected farm is not in the list
    if (sortedFarms.length > 0) {
      const savedFarmId = localStorage.getItem('selectedFarmId');
      const isSavedInList = sortedFarms.some(f => f.id === savedFarmId);
      if (isSavedInList && savedFarmId) {
        setSelectedFarmIdState(savedFarmId);
      } else {
        setSelectedFarmIdState(sortedFarms[0].id);
        localStorage.setItem('selectedFarmId', sortedFarms[0].id);
      }
    } else {
      setSelectedFarmIdState('');
      localStorage.removeItem('selectedFarmId');
    }

    setIsLoadingFarms(false);
  }, []);

  // Fetch Fields for a specific Farm
  const refetchFields = useCallback(async (farmId: string) => {
    if (!farmId) return;
    setIsLoadingFields(true);
    setError(null);

    let fetchedFields: Field[] = [];

    if (typeof window !== 'undefined' && !navigator.onLine) {
      // Offline mode: load fields from cache
      fetchedFields = getCached<Field[]>(`cached_fields_${farmId}`, []);
    } else {
      try {
        const response = await axiosInstance.get<Field[]>(`/farms/${farmId}/fields`);
        fetchedFields = response.data;
        setCached(`cached_fields_${farmId}`, response.data);
      } catch (err: any) {
        console.warn('Failed to fetch fields from API, loading cache:', err);
        fetchedFields = getCached<Field[]>(`cached_fields_${farmId}`, []);
      }
    }

    // Fallback to rich Demo Fields if empty and in demo mode or for demo farm
    const isDemo = auth.isDemo();
    if (fetchedFields.length === 0 && (isDemo || farmId === DEMO_FARM.id)) {
      fetchedFields = DEMO_FIELDS;
      setCached(`cached_fields_${farmId}`, fetchedFields);
    }

    // Sort fields alphabetically
    const sortedFields = fetchedFields.sort((a, b) => a.name.localeCompare(b.name));
    setFields(sortedFields);

    // Auto-select the first field alphabetically if none is selected OR if the selected field is not in this farm
    if (sortedFields.length > 0) {
      const savedFieldId = localStorage.getItem('selectedFieldId');
      const isSavedInCurrentFarm = sortedFields.some(f => f.id === savedFieldId);
      if (isSavedInCurrentFarm && savedFieldId) {
        setSelectedFieldIdState(savedFieldId);
      } else {
        setSelectedFieldIdState(sortedFields[0].id);
        localStorage.setItem('selectedFieldId', sortedFields[0].id);
      }
    } else {
      setSelectedFieldIdState('');
      localStorage.removeItem('selectedFieldId');
    }

    setIsLoadingFields(false);
  }, []);

  // Load farms on mount
  useEffect(() => {
    refetchFarms();
  }, [refetchFarms]);

  // Load fields when selected farm changes
  useEffect(() => {
    if (selectedFarmId) {
      refetchFields(selectedFarmId);
    } else {
      setFields([]);
    }
  }, [selectedFarmId, refetchFields]);

  // Unified call to fetch all field-specific info
  const refetchAllFieldData = useCallback(async () => {
    if (!selectedFieldId) return;

    // Cancel any ongoing fetch to avoid race conditions
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsLoadingPolledData(true);

    const isDemo = auth.isDemo();
    if (isDemo || selectedFieldId.startsWith('demo-')) {
      setActiveCycle(DEMO_CYCLE);
      setSensorData(DEMO_SENSORS);
      setWeatherData(DEMO_WEATHER);
      setIrrigationData(DEMO_IRRIGATION);
      setAlertsData(DEMO_ALERTS);
      setCached(`cached_active_cycle_${selectedFieldId}`, DEMO_CYCLE);
      setCached(`cached_sensors_${selectedFieldId}`, DEMO_SENSORS);
      setCached(`cached_weather_${selectedFieldId}`, DEMO_WEATHER);
      setCached(`cached_irrigation_${selectedFieldId}`, DEMO_IRRIGATION);
      setCached('cached_alerts', DEMO_ALERTS);
      setIsLoadingPolledData(false);
      return;
    }

    if (typeof window !== 'undefined' && !navigator.onLine) {
      // Offline: load cached field info
      setActiveCycle(getCached(`cached_active_cycle_${selectedFieldId}`, null));
      setSensorData(getCached(`cached_sensors_${selectedFieldId}`, null));
      setWeatherData(getCached(`cached_weather_${selectedFieldId}`, null));
      setIrrigationData(getCached(`cached_irrigation_${selectedFieldId}`, null));
      setAlertsData(getCached(`cached_alerts`, []));
      setIsLoadingPolledData(false);
      return;
    }

    try {
      // Fetch active cycle first
      const activeCycleRes = await axiosInstance.get(`/farms/fields/${selectedFieldId}/active-cycle`, { signal })
        .then(r => r.data)
        .catch(() => null);

      setActiveCycle(activeCycleRes);
      setCached(`cached_active_cycle_${selectedFieldId}`, activeCycleRes);

      // Fetch weather
      const weatherRes = await axiosInstance.get(`/weather/forecast/${selectedFieldId}`, { signal })
        .then(r => r.data)
        .catch(() => null);
      setWeatherData(weatherRes);
      setCached(`cached_weather_${selectedFieldId}`, weatherRes);

      // Fetch sensors
      const sensorRes = await axiosInstance.get(`/sensors/${selectedFieldId}/latest`, { signal })
        .then(r => r.data)
        .catch(() => null);
      setSensorData(sensorRes);
      setCached(`cached_sensors_${selectedFieldId}`, sensorRes);

      // Fetch irrigation recommendation
      const irrigationRes = await axiosInstance.get(`/irrigation/recommend/${selectedFieldId}`, { signal })
        .then(r => r.data)
        .catch(() => null);
      setIrrigationData(irrigationRes);
      setCached(`cached_irrigation_${selectedFieldId}`, irrigationRes);

      // Fetch alerts
      const alertsRes = await axiosInstance.get('/alerts/', { signal })
        .then(r => r.data)
        .catch(() => []);
      setAlertsData(alertsRes);
      setCached('cached_alerts', alertsRes);

    } catch (err: any) {
      if (axios.isCancel(err)) {
        // Request was canceled, do nothing
        return;
      }
      console.error('Failed to load polled field data:', err);
    } finally {
      setIsLoadingPolledData(false);
    }
  }, [selectedFieldId]);

  // Load field-specific data when selected field changes
  useEffect(() => {
    if (selectedFieldId) {
      refetchAllFieldData();
    } else {
      setActiveCycle(null);
      setSensorData(null);
      setWeatherData(null);
      setIrrigationData(null);
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedFieldId, refetchAllFieldData]);

  // Auto-polling mechanism (30 seconds) when online
  useEffect(() => {
    if (!selectedFieldId || isOffline) return;

    const interval = setInterval(() => {
      refetchAllFieldData();
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedFieldId, isOffline, refetchAllFieldData]);

  const selectedFarm = farms.find(f => f.id === selectedFarmId) || null;
  const selectedField = fields.find(f => f.id === selectedFieldId) || null;

  return (
    <FarmFieldContext.Provider
      value={{
        farms,
        fields,
        selectedFarmId,
        selectedFieldId,
        selectedFarm,
        selectedField,
        setSelectedFarmId,
        setSelectedFieldId,
        isOffline,
        isLoadingFarms,
        isLoadingFields,
        isLoadingPolledData,
        error,
        refetchFarms,
        refetchFields,
        refetchAllFieldData,
        
        activeCycle,
        sensorData,
        weatherData,
        irrigationData,
        alertsData,
      }}
    >
      {children}
    </FarmFieldContext.Provider>
  );
}

export function useFarmField() {
  const context = useContext(FarmFieldContext);
  if (!context) {
    throw new Error('useFarmField must be used within a FarmFieldProvider');
  }
  return context;
}
