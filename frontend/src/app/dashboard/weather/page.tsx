'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import FarmFieldSelector from '@/components/FarmFieldSelector';
import { Cloud, Thermometer, Droplets, Wind, Sun, AlertTriangle, Info, Calendar, Loader2, RefreshCw, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useFarmField } from '@/context/FarmFieldContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function WeatherPage() {
  const {
    farms,
    fields,
    selectedFarmId,
    selectedFieldId,
    selectedFarm,
    isOffline
  } = useFarmField();

  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [error, setError] = useState('');

  const loadWeatherForecast = async (fieldId: string) => {
    setLoading(true);
    setError('');
    const loadingToast = toast.loading('Connecting to live agro-weather models...');

    try {
      const data = await api.getWeather(fieldId);
      setWeatherData(data);
      toast.success('Microclimate model updated!', { id: loadingToast });
    } catch (err: any) {
      console.warn('API weather request failed, using mock forecast fallback:', err);
      setError(err.message || 'Failed to retrieve weather intelligence.');
      
      // Fallback data
      const mockWeather = {
        forecast: [
          { date: new Date().toISOString(), temperature_max: 38, temperature_min: 27, humidity: 72, rainfall_mm: 0, wind_speed: 12, description: 'Sunny & Dry', uv_index: 8.5, cloud_cover: 15 },
          { date: new Date(Date.now() + 1*24*60*60*1000).toISOString(), temperature_max: 37, temperature_min: 28, humidity: 70, rainfall_mm: 0, wind_speed: 10, description: 'Partly Cloudy', uv_index: 8.0, cloud_cover: 25 },
          { date: new Date(Date.now() + 2*24*60*60*1000).toISOString(), temperature_max: 38, temperature_min: 27, humidity: 75, rainfall_mm: 2.5, wind_speed: 14, description: 'Isolated Thundershower', uv_index: 7.2, cloud_cover: 45 },
          { date: new Date(Date.now() + 3*24*60*60*1000).toISOString(), temperature_max: 36, temperature_min: 26, humidity: 80, rainfall_mm: 8.0, wind_speed: 16, description: 'Light Showers', uv_index: 6.0, cloud_cover: 65 },
          { date: new Date(Date.now() + 4*24*60*60*1000).toISOString(), temperature_max: 35, temperature_min: 25, humidity: 82, rainfall_mm: 12.0, wind_speed: 15, description: 'Moderate Rain', uv_index: 5.5, cloud_cover: 80 },
          { date: new Date(Date.now() + 5*24*60*60*1000).toISOString(), temperature_max: 34, temperature_min: 25, humidity: 85, rainfall_mm: 15.0, wind_speed: 12, description: 'Heavy Rain', uv_index: 4.8, cloud_cover: 95 },
          { date: new Date(Date.now() + 6*24*60*60*1000).toISOString(), temperature_max: 33, temperature_min: 24, humidity: 88, rainfall_mm: 6.0, wind_speed: 9, description: 'Clearing Showers', uv_index: 6.5, cloud_cover: 50 }
        ]
      };
      setWeatherData(mockWeather);
      toast.success('Generated demo weather telemetry (Fallback Active)', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedFieldId) {
      loadWeatherForecast(selectedFieldId);
    } else {
      setWeatherData(null);
    }
  }, [selectedFieldId]);

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Header title="Weather Intelligence" />
      
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Selection Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card flex flex-wrap gap-4 items-center justify-between py-4"
        >
          <FarmFieldSelector />

          <button 
            onClick={() => selectedFieldId && loadWeatherForecast(selectedFieldId)}
            className="btn-primary text-xs py-2 flex items-center gap-1.5"
            disabled={loading || !selectedFieldId}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh Station
          </button>
        </motion.div>

        {farms.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center card bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl max-w-lg mx-auto mt-12 shadow-xl">
            <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 font-display">No Farms Available</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
              Please register a farm to enable weather analytics.
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
              Please add a field to compute crop microclimate metrics.
            </p>
            <Link href="/dashboard/settings" className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold">
              <Plus className="w-4 h-4" /> Create New Field
            </Link>
          </div>
        ) : !selectedFieldId ? (
          <div className="text-center p-12 text-slate-450 card border border-dashed rounded-2xl bg-white dark:bg-slate-950">
            Select a field layout to connect OpenWeatherMap models.
          </div>
        ) : (
          <>
            {error && (
              <div className="card bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-405 p-4 rounded-xl flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Loader2 className="w-10 h-10 text-green-600 animate-spin mx-auto" />
                  <p className="text-sm text-slate-500 font-medium">Syncing agricultural weather sensors...</p>
                </div>
              </div>
            ) : weatherData ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Today's summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <StatCard
                    title="Current Temperature"
                    value={`${weatherData.forecast[0].temperature_max}°C`}
                    subtitle={`Min: ${weatherData.forecast[0].temperature_min}°C`}
                    icon={Thermometer}
                    color="red"
                  />
                  <StatCard
                    title="Relative Humidity"
                    value={`${weatherData.forecast[0].humidity}%`}
                    subtitle="Favorable for tillering"
                    icon={Droplets}
                    color="blue"
                  />
                  <StatCard
                    title="Today's Rainfall"
                    value={`${weatherData.forecast[0].rainfall_mm} mm`}
                    subtitle={weatherData.forecast[0].description}
                    icon={Cloud}
                    color="blue"
                  />
                  <StatCard
                    title="Wind Speed"
                    value={`${weatherData.forecast[0].wind_speed} km/h`}
                    subtitle="Calm conditions"
                    icon={Wind}
                    color="green"
                  />
                </div>

                {/* Impact Advisory & Weather Warnings */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="card lg:col-span-2 space-y-4">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 font-display">
                      <Info className="w-5 h-5 text-green-600 dark:text-green-400" /> Agronomic Climate Advisories
                    </h3>
                    
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-805 dark:text-amber-400 space-y-2">
                      <div className="flex gap-2 items-center">
                        <AlertTriangle className="w-5 h-5 text-amber-600 fill-current flex-shrink-0" />
                        <span className="font-extrabold text-sm font-display">Microclimate Heat Stress Alert</span>
                      </div>
                      <p className="text-xs leading-relaxed font-semibold">
                        Maximum temperatures will hover near 38°C over the next 4 days. Transpiration rates will climb significantly. Maintain soil water depth at 3cm to prevent panicle blanking in rice.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-808 dark:text-blue-400 space-y-2">
                      <div className="flex gap-2 items-center">
                        <Info className="w-5 h-5 text-blue-600 fill-current flex-shrink-0" />
                        <span className="font-extrabold text-sm font-display">Irrigation Recommendation</span>
                      </div>
                      <p className="text-xs leading-relaxed font-semibold">
                        Precipitation is highly unlikely for the next 48 hours. Reference crop evapotranspiration (ETo) is estimated at 5.2mm/day. Apply standard automatic sequence plan.
                      </p>
                    </div>
                  </div>

                  <div className="card space-y-4">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 font-display">Atmospheric Indices</h3>
                    <div className="space-y-3.5 text-xs font-semibold">
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/40">
                        <span className="text-slate-400">UV Exposure Index</span>
                        <span className="text-slate-800 dark:text-slate-200">{weatherData.forecast[0].uv_index} (High)</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/40">
                        <span className="text-slate-400">Cloud Cover</span>
                        <span className="text-slate-800 dark:text-slate-200">{weatherData.forecast[0].cloud_cover}%</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/40">
                        <span className="text-slate-400">Reference ET (ETo)</span>
                        <span className="text-slate-800 dark:text-slate-200">4.8 mm/day</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-slate-400">Photoperiod daylight</span>
                        <span className="text-slate-800 dark:text-slate-200">13.2 hours</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 7-Day Forecast Grid */}
                <div className="card">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 font-display">
                    <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" /> 7-Day Agricultural Weather Forecast
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {weatherData.forecast.map((day: any, i: number) => (
                      <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 rounded-2xl text-center space-y-2.5 hover:border-green-500/30 transition-all">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-display">
                          {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                        </p>
                        <div className="text-primary-600 font-bold text-xl my-1 flex justify-center">
                          <Sun className="w-8 h-8 text-amber-500" />
                        </div>
                        <p className="text-xs font-bold text-slate-850 dark:text-slate-200">{day.description}</p>
                        <div className="text-[11px] flex justify-center gap-2 font-semibold">
                          <span className="text-red-500">{day.temperature_max}°C</span>
                          <span className="text-blue-500">{day.temperature_min}°C</span>
                        </div>
                        <div className="text-[10px] text-slate-400 pt-2 border-t dark:border-slate-850 space-y-0.5 font-medium">
                          <p>💧 Hum: {day.humidity}%</p>
                          <p>🌧️ Rain: {day.rainfall_mm}mm</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="card text-center py-16 text-slate-400 text-sm">
                No weather intelligence forecasts available.
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
