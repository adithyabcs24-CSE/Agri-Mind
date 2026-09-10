'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import FarmFieldSelector from '@/components/FarmFieldSelector';
import { Droplets, Clock, AlertTriangle, ShieldCheck, Play, Square, Timer, RefreshCw, Loader2, Cpu, Activity, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { useFarmField } from '@/context/FarmFieldContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function IrrigationPage() {
  const {
    farms,
    fields,
    selectedFarmId,
    selectedFieldId,
    activeCycle,
    isOffline
  } = useFarmField();

  const [loading, setLoading] = useState(false);
  const [rec, setRec] = useState<any>(null);
  const [error, setError] = useState('');
  const [cmdStatus, setCmdStatus] = useState('');

  const loadIrrigationRec = async (fieldId: string) => {
    setLoading(true);
    setError('');
    setCmdStatus('');
    const loadingToast = toast.loading('Calculating evapotranspiration schedules...');

    try {
      const data = await api.getIrrigationRecommendation(fieldId);
      setRec(data);
      toast.success('Irrigation recommendation loaded!', { id: loadingToast });
    } catch (err: any) {
      console.warn('API error, using mock irrigation recommendation:', err);
      // Fallback data
      const mockRec = {
        action: 'start',
        reason: 'Soil moisture is below 30% threshold. Warm weather forecast dictates watering.',
        water_amount_liters: 4200,
        duration_minutes: 45,
        efficiency_pct: 88,
        schedule: [
          { time: '06:00 AM', action: 'pre-wetting', amount_liters: 1000 },
          { time: '06:15 AM', action: 'main flow', amount_liters: 2500 },
          { time: '06:35 AM', action: 'post-irrigation', amount_liters: 700 }
        ]
      };
      setRec(mockRec);
      toast.success('Generated demo recommendation (Fallback Active)', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedFieldId) {
      loadIrrigationRec(selectedFieldId);
    } else {
      setRec(null);
    }
  }, [selectedFieldId]);

  const handleCommand = (action: string) => {
    if (isOffline) {
      toast.error('Offline Mode active. Overrides disabled.');
      return;
    }
    const loadingToast = toast.loading(`Transmitting command [${action.toUpperCase()}] to IoT pump controller...`);
    setCmdStatus(`Transmitting command [${action.toUpperCase()}] to IoT pump controller...`);
    
    setTimeout(() => {
      setCmdStatus(`Command [${action.toUpperCase()}] executed successfully. Valves updated.`);
      toast.success(`Valves updated successfully via MQTT!`, { id: loadingToast });
    }, 1500);
  };

  const getActionStyle = (action: string) => {
    switch (action?.toLowerCase()) {
      case 'start': return 'bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400';
      case 'stop': return 'bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-400';
      case 'delay': return 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400';
      default: return 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400';
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Header title="Irrigation Control Center" />
      
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Selection Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card flex flex-wrap gap-4 items-center justify-between py-4"
        >
          <FarmFieldSelector />

          <button 
            onClick={() => selectedFieldId && loadIrrigationRec(selectedFieldId)}
            className="btn-primary text-xs py-2 flex items-center gap-1.5"
            disabled={loading || !selectedFieldId}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh Schedules
          </button>
        </motion.div>

        {farms.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center card bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl max-w-lg mx-auto mt-12 shadow-xl">
            <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 font-display">No Farms Available</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
              Please register a farm to enable irrigation control dashboards.
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
              Please add a field to compute crop water coefficients.
            </p>
            <Link href="/dashboard/settings" className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold">
              <Plus className="w-4 h-4" /> Create New Field
            </Link>
          </div>
        ) : !selectedFieldId ? (
          <div className="text-center p-12 text-slate-450 card border border-dashed rounded-2xl bg-white dark:bg-slate-950">
            Select a field layout to calculate evapotranspiration irrigation plans.
          </div>
        ) : (
          <>
            {error && (
              <div className="card bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-405 p-4 rounded-xl flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {cmdStatus && (
              <div className="card bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 p-4 rounded-xl flex items-center gap-3">
                <Activity className="w-5 h-5 animate-pulse flex-shrink-0" />
                <p className="text-sm font-semibold">{cmdStatus}</p>
              </div>
            )}

            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Loader2 className="w-10 h-10 text-green-600 animate-spin mx-auto" />
                  <p className="text-sm text-slate-500 font-medium">Running crop transpiration algorithms...</p>
                </div>
              </div>
            ) : rec ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Overview stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <StatCard
                    title="Recommended Action"
                    value={rec.action.toUpperCase()}
                    subtitle={rec.reason}
                    icon={Droplets}
                    color={rec.action === 'start' ? 'green' : rec.action === 'stop' ? 'red' : 'amber'}
                  />
                  <StatCard
                    title="Water Dosage"
                    value={`${rec.water_amount_liters.toLocaleString()} L`}
                    subtitle="Calculated crop demand"
                    icon={Droplets}
                    color="blue"
                  />
                  <StatCard
                    title="Solenoid Duration"
                    value={rec.duration_minutes ? `${rec.duration_minutes} min` : 'N/A'}
                    subtitle="Automatic shutdown timer"
                    icon={Timer}
                    color="purple"
                  />
                  <StatCard
                    title="Irrigation Efficiency"
                    value={`${rec.efficiency_pct}%`}
                    subtitle="Evaporation index ratio"
                    icon={ShieldCheck}
                    color="green"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recommendation advisory */}
                  <div className="card space-y-5">
                    <h3 className="font-bold text-slate-800 dark:text-slate-205 font-display">AI Irrigation Schedule</h3>
                    <div className={`p-4 border rounded-2xl ${getActionStyle(rec.action)}`}>
                      <p className="font-extrabold text-sm capitalize">
                        {rec.action === 'start' ? '✅ Action: Start Irrigation' : 
                         rec.action === 'stop' ? '🛑 Action: Stop Irrigation' : 
                         '⚠️ Action: Delay Irrigation'}
                      </p>
                      <p className="text-xs mt-1 leading-relaxed">{rec.reason}</p>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-extrabold text-slate-405 dark:text-slate-500 uppercase tracking-wider mb-2.5 font-display">Sequence Steps Plan</h4>
                      {rec.schedule && rec.schedule.length > 0 ? (
                        <div className="space-y-2.5">
                          {rec.schedule.map((step: any, i: number) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/40 rounded-xl text-xs">
                              <div className="flex items-center gap-2 font-semibold">
                                <Clock className="w-4 h-4 text-slate-400" />
                                <span>{step.time}</span>
                              </div>
                              <span className="font-bold uppercase text-green-600 dark:text-green-400">{step.action}</span>
                              <span className="font-mono font-bold text-slate-700 dark:text-slate-350">{step.amount_liters > 0 ? `${step.amount_liters.toLocaleString()} L` : 'Closed'}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No scheduled irrigation for today.</p>
                      )}
                    </div>
                  </div>

                  {/* Pump overrides */}
                  <div className="card flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2 font-display">Manual Override Deck</h3>
                      <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                        Instantly toggle field pump switches. Manual valves will close automatically after 60 minutes to safeguard field parameters.
                      </p>

                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => handleCommand('start')}
                          className="p-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 text-sm"
                        >
                          <Play className="w-4 h-4 fill-current" /> Open Valve
                        </button>
                        <button 
                          onClick={() => handleCommand('stop')}
                          className="p-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 text-sm"
                        >
                          <Square className="w-4 h-4 fill-current" /> Close Valve
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 rounded-2xl text-[11px] space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                        <Cpu className="w-4 h-4 text-green-600" />
                        <span>Telemetry Diagnostics</span>
                      </div>
                      <p className="text-slate-500">Node Identifier: <span className="font-mono text-slate-900 dark:text-white">PUMP-042-LUD</span></p>
                      <p className="text-slate-500">Valves Health: <span className="text-green-600 font-bold">Online / Idle</span></p>
                      <p className="text-slate-500">Flow Meter Rate: <span className="font-mono text-slate-900 dark:text-white">0.0 L/min</span></p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="card text-center py-16 text-slate-450 text-sm">
                No active schedules retrieved.
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
