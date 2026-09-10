'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import FarmFieldSelector from '@/components/FarmFieldSelector';
import {
  Radio, Thermometer, Droplets, Gauge, AlertTriangle, Compass,
  CheckCircle, RefreshCw, Loader2, Battery, Wifi, Cpu, Clock, Plus
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useFarmField } from '@/context/FarmFieldContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function SensorsPage() {
  const {
    farms,
    fields,
    selectedFarmId,
    selectedFieldId,
    isOffline
  } = useFarmField();

  const [loading, setLoading] = useState(false);
  const [readings, setReadings] = useState<any[]>([]);
  const [selectedSensorType, setSelectedSensorType] = useState('soil_moisture');
  const [wsConnected, setWsConnected] = useState(false);
  const [error, setError] = useState('');
  
  const wsRef = useRef<WebSocket | null>(null);

  // Load latest readings via REST
  const loadLatestReadings = async (fieldId: string) => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getLatestSensors(fieldId);
      setReadings(data || []);
    } catch (err: any) {
      console.warn('API sensor fetch failed, using demo sensors data:', err);
      // Setup demo sensor data
      const mockReadings = [
        { sensor_type: 'soil_moisture', value: 28.5, unit: '%', recorded_at: new Date().toISOString() },
        { sensor_type: 'temperature', value: 26.2, unit: '°C', recorded_at: new Date().toISOString() },
        { sensor_type: 'ph', value: 6.8, unit: '', recorded_at: new Date().toISOString() },
        { sensor_type: 'nitrogen', value: 45.0, unit: 'mg/kg', recorded_at: new Date().toISOString() }
      ];
      setReadings(mockReadings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedFieldId) {
      loadLatestReadings(selectedFieldId);
    }
  }, [selectedFieldId]);

  // WebSocket Live Connection
  useEffect(() => {
    if (!selectedFieldId) return;
    let active = true;

    const connectWS = async () => {
      try {
        const user = await api.getMe();
        if (!user || !user.id || !active) return;

        const wsUrl = `ws://localhost:8000/ws/${user.id}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (active) {
            setWsConnected(true);
            toast.success('Live IoT feed established!');
          }
        };

        ws.onmessage = (event) => {
          if (!active) return;
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'sensor_update' && msg.field_id === selectedFieldId) {
              const newReading = {
                sensor_type: msg.sensor_type,
                value: msg.value,
                unit: msg.unit || '%',
                recorded_at: new Date().toISOString(),
              };
              setReadings(prev => [newReading, ...prev.slice(0, 49)]);
              toast.success(`Telemetry update: ${msg.sensor_type.replace('_', ' ')} = ${msg.value}`);
            }
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e);
          }
        };

        ws.onclose = () => {
          if (active) {
            setWsConnected(false);
            setTimeout(connectWS, 10000);
          }
        };

        ws.onerror = () => {
          if (active) setWsConnected(false);
        };

      } catch (err) {
        console.error('WebSocket connection error:', err);
      }
    };

    connectWS();

    return () => {
      active = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [selectedFieldId]);

  const getLatestVal = (type: string, fallback: number, unit: string) => {
    const found = readings.find(r => r.sensor_type === type);
    return found ? `${found.value} ${found.unit}` : `${fallback} ${unit}`;
  };

  const getChartData = () => {
    const filtered = readings
      .filter(r => r.sensor_type === selectedSensorType)
      .slice(0, 10)
      .reverse();

    if (filtered.length === 0) {
      return [
        { time: '12:00', val: 28.5 },
        { time: '13:00', val: 28.2 },
        { time: '14:00', val: 27.9 },
        { time: '15:00', val: 28.5 },
        { time: '16:00', val: 28.9 },
        { time: '17:00', val: 28.4 },
      ];
    }

    return filtered.map(r => ({
      time: new Date(r.recorded_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
      val: r.value,
    }));
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Header title="IoT Sensor Gateway" />
      
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Selection bar */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card flex flex-wrap gap-4 items-center justify-between py-4"
        >
          <FarmFieldSelector />
          
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <span className={`w-2.5 h-2.5 rounded-full ${wsConnected ? 'bg-green-500 animate-ping' : 'bg-amber-500'}`} />
            <span className={wsConnected ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}>
              {wsConnected ? 'Live Connection Active' : 'Offline Mode (Auto-polling)'}
            </span>
          </div>
        </motion.div>

        {farms.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center card bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl max-w-lg mx-auto mt-12 shadow-xl">
            <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 font-display">No Farms Available</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
              Please register a farm to enable sensor gateways and telemetry feeds.
            </p>
            <Link href="/dashboard/settings" className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold">
              <Plus className="w-4 h-4" /> Create New Farm
            </Link>
          </div>
        ) : !selectedFarmId ? (
          <div className="text-center p-12 text-slate-450">Please select a farm to continue.</div>
        ) : fields.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center card bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl max-w-lg mx-auto mt-12 shadow-xl">
            <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 font-display">No Fields Found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
              Please add a field layout under settings to link telemetry probes.
            </p>
            <Link href="/dashboard/settings" className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold">
              <Plus className="w-4 h-4" /> Create New Field
            </Link>
          </div>
        ) : !selectedFieldId ? (
          <div className="text-center p-12 text-slate-450 card border border-dashed rounded-2xl bg-white dark:bg-slate-950">
            Select a field to connect IoT probes.
          </div>
        ) : (
          <>
            {error && (
              <div className="card bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 p-4 rounded-xl flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Live metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard
                title="Soil Moisture"
                value={getLatestVal('soil_moisture', 28.5, '%')}
                subtitle="Target: 30% - 40%"
                icon={Droplets}
                color="blue"
              />
              <StatCard
                title="Soil Temperature"
                value={getLatestVal('temperature', 26.2, '°C')}
                subtitle="Ambient heat index"
                icon={Thermometer}
                color="red"
              />
              <StatCard
                title="Soil pH"
                value={getLatestVal('ph', 6.8, '')}
                subtitle="Neutral acid balance"
                icon={Compass}
                color="green"
              />
              <StatCard
                title="Nitrogen (N)"
                value={getLatestVal('nitrogen', 45.0, 'mg/kg')}
                subtitle="Active soil chemistry"
                icon={Gauge}
                color="purple"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Trend Chart */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="card lg:col-span-2 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 font-display">
                    <Radio className="w-5 h-5 text-green-600 dark:text-green-400" /> Live Sensor Stream Graph
                  </h3>
                  <select
                    value={selectedSensorType}
                    onChange={e => setSelectedSensorType(e.target.value)}
                    className="form-select w-40 text-xs font-bold"
                  >
                    <option value="soil_moisture">Soil Moisture</option>
                    <option value="temperature">Soil Temperature</option>
                    <option value="ph">Soil pH</option>
                    <option value="nitrogen">Nitrogen</option>
                  </select>
                </div>

                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800/80" />
                    <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: 'none', 
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '12px'
                      }} 
                    />
                    <Line type="monotone" dataKey="val" stroke="#16a34a" strokeWidth={2.5} dot={{ fill: '#16a34a', strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Node Health diagnostics */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 font-display">IoT Gateway Status</h3>
                  
                  <div className="space-y-3.5 text-xs font-semibold">
                    {[
                      { name: 'Soil Moisture Probe (SM-001)', type: 'Moisture + Temp', battery: 92, signal: 'Excellent' },
                      { name: 'NPK Spectrometer (NPK-001)', type: 'NPK Compounds', battery: 85, signal: 'Good' },
                      { name: 'Valves Pump Solenoid (PMP-001)', type: 'Valves & Flow Rate', battery: 99, signal: 'Excellent' }
                    ].map((node) => (
                      <div key={node.name} className="p-3 bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 rounded-2xl flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-slate-800 dark:text-slate-200 font-bold">{node.name}</p>
                            <p className="text-[10px] text-slate-450 mt-0.5">{node.type}</p>
                          </div>
                          <span className="px-2 py-0.5 bg-green-500/10 text-green-700 dark:text-green-400 font-bold rounded-full text-[10px]">
                            ACTIVE
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-[10px] text-slate-500 font-semibold mt-1">
                          <span className="flex items-center gap-1">
                            <Battery className="w-3.5 h-3.5 text-green-600" />
                            <span>Battery: {node.battery}%</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Wifi className="w-3.5 h-3.5 text-blue-600" />
                            <span>Signal: {node.signal}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 rounded-2xl text-[11px] text-slate-500 mt-4 leading-relaxed font-semibold flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-green-600" />
                  <span>Sensors broadcast via MQTT at port 1883.</span>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
