'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import FarmFieldSelector from '@/components/FarmFieldSelector';
import { Sprout, AlertCircle, CheckCircle, Save, Percent, Droplet, Loader2, Plus } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useFarmField } from '@/context/FarmFieldContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function SoilPage() {
  const {
    farms,
    fields,
    selectedFarmId,
    selectedFieldId,
    activeCycle,
    isOffline
  } = useFarmField();

  // Form parameters
  const [moisture, setMoisture] = useState(28.5);
  const [ph, setPh] = useState(6.8);
  const [nitrogen, setNitrogen] = useState(45.0);
  const [phosphorus, setPhosphorus] = useState(22.0);
  const [potassium, setPotassium] = useState(180.0);
  const [organicCarbon, setOrganicCarbon] = useState(0.85);
  const [ec, setEc] = useState(0.42);
  const [temperature, setTemperature] = useState(26.0);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Dynamically initialize NPK based on active cycle crop
  useEffect(() => {
    if (activeCycle) {
      setError('');
      setResult(null);
      if (activeCycle.crop_name === 'Rice') {
        setNitrogen(45.0);
        setPhosphorus(22.0);
        setPotassium(180.0);
      } else {
        setNitrogen(55.0);
        setPhosphorus(28.0);
        setPotassium(195.0);
      }
    } else if (selectedFieldId) {
      setError('No active crop cycle found for this field. Soil analysis requires an active crop cycle.');
    }
  }, [activeCycle, selectedFieldId]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCycle) {
      setError('Cannot analyze soil without an active crop cycle.');
      toast.error('Active crop cycle is required for soil diagnostics.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const loadingToast = toast.loading('Running chemical composition soil analysis...');

    try {
      const payload = {
        crop_cycle_id: activeCycle.id,
        moisture,
        ph,
        nitrogen,
        phosphorus,
        potassium,
        organic_carbon: organicCarbon,
        ec,
        temperature,
      };

      const data = await api.analyzeSoil(payload);
      setResult(data);
      setSuccessMsg('Soil health records saved to history.');
      toast.success('Soil diagnostics compiled successfully!', { id: loadingToast });
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please check inputs.');
      toast.error(err.message || 'Analysis failed. Using local diagnostic model.', { id: loadingToast });
      
      // Fallback demo data
      const mockResult = {
        health_score: 76.5,
        status: 'Moderate',
        deficiencies: ['nitrogen', 'phosphorus'],
        recommendations: {
          fertilizer: 'Apply Diammonium Phosphate (DAP) @ 50kg/acre and Urea @ 35kg/acre to offset deficiencies.',
          organic: [
            'Incorporate well-decomposed farmyard manure (FYM) @ 5 tonnes/acre',
            'Sow green manure crop (Sesbania) prior to transplanting'
          ],
          improvement: [
            'Maintain alternate wetting and drying schedules to balance carbon levels',
            'Conduct deep plowing during summer to solarize soil pathogens'
          ]
        }
      };
      setResult(mockResult);
      setSuccessMsg('Demo soil records loaded.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'good': return 'green';
      case 'moderate': return 'amber';
      case 'poor': return 'red';
      default: return 'blue';
    }
  };

  // Build chart data reflecting current inputs vs target ideal NPK balance
  const radarData = [
    { subject: 'Nitrogen', Current: nitrogen, Target: 65, fullMark: 100 },
    { subject: 'Phosphorus', Current: phosphorus * 2.5, Target: 60, fullMark: 100 },
    { subject: 'Potassium', Current: potassium / 2.5, Target: 80, fullMark: 100 },
    { subject: 'Moisture', Current: moisture * 2, Target: 70, fullMark: 100 },
    { subject: 'pH Balance', Current: ph * 10, Target: 70, fullMark: 100 },
    { subject: 'Organic Carbon', Current: organicCarbon * 75, Target: 75, fullMark: 100 }
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Header title="Soil Chemistry Analysis" />
      
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Selection Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card flex flex-wrap gap-4 items-center justify-between py-4"
        >
          <FarmFieldSelector />
          <div className="flex items-center gap-2 text-xs font-semibold text-green-700 bg-green-500/10 px-3 py-1.5 rounded-full dark:text-green-400">
            <Sprout className="w-4 h-4" />
            Active Cycle: <span className="font-bold">{activeCycle ? `${activeCycle.crop_name} (${activeCycle.growth_stage})` : 'None'}</span>
          </div>
        </motion.div>

        {farms.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center card bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl max-w-lg mx-auto mt-12 shadow-xl">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 font-display">No Farms Available</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
              Please register a farm to run soil diagnostics.
            </p>
            <Link href="/dashboard/settings" className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold">
              <Plus className="w-4 h-4" /> Create New Farm
            </Link>
          </div>
        ) : !selectedFarmId ? (
          <div className="text-center p-12 text-slate-450">Please select a farm to continue.</div>
        ) : fields.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center card bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl max-w-lg mx-auto mt-12 shadow-xl">
            <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 font-display">No Fields Found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
              Create a field layout to analyze soil composition and nutrient balances.
            </p>
            <Link href="/dashboard/settings" className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold">
              <Plus className="w-4 h-4" /> Create New Field
            </Link>
          </div>
        ) : !selectedFieldId ? (
          <div className="text-center p-12 text-slate-450 card border border-dashed rounded-2xl bg-white dark:bg-slate-950">
            Select a field layout to run soil analysis.
          </div>
        ) : (
          <>
            {error && (
              <div className="card bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-405 p-4 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {successMsg && (
              <div className="card bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 p-4 rounded-xl flex items-center gap-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{successMsg}</p>
              </div>
            )}

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Soil Health Score"
                value={result ? result.health_score : '72.0'}
                subtitle={result ? `Status: ${result.status}` : 'Moderate status'}
                icon={Sprout}
                color={getStatusColor(result ? result.status : 'moderate')}
              />
              <StatCard
                title="N-P-K Value (mg/kg)"
                value={`${nitrogen} - ${phosphorus} - ${potassium}`}
                subtitle="Nitrogen - Phosphorus - Potassium"
                icon={Percent}
                color="blue"
              />
              <StatCard
                title="Soil Moisture"
                value={`${moisture}%`}
                subtitle="Optimal range: 30% - 40%"
                icon={Droplet}
                color="green"
              />
            </div>

            {/* Input Parameters & Radar Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Soil Input Form */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="card lg:col-span-2"
              >
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2 font-display">
                  <Sprout className="w-5 h-5 text-green-600 dark:text-green-400" /> Enter Chemistry Readings
                </h3>
                
                <form onSubmit={handleAnalyze} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">Moisture (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={moisture}
                      onChange={e => setMoisture(parseFloat(e.target.value))}
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">pH Value</label>
                    <input
                      type="number"
                      step="0.1"
                      value={ph}
                      onChange={e => setPh(parseFloat(e.target.value))}
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">Nitrogen (N) (mg/kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={nitrogen}
                      onChange={e => setNitrogen(parseFloat(e.target.value))}
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">Phosphorus (P) (mg/kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={phosphorus}
                      onChange={e => setPhosphorus(parseFloat(e.target.value))}
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">Potassium (K) (mg/kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={potassium}
                      onChange={e => setPotassium(parseFloat(e.target.value))}
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">Organic Carbon (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={organicCarbon}
                      onChange={e => setOrganicCarbon(parseFloat(e.target.value))}
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">EC Conductivity (dS/m)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={ec}
                      onChange={e => setEc(parseFloat(e.target.value))}
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">Temperature (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={temperature}
                      onChange={e => setTemperature(parseFloat(e.target.value))}
                      className="form-input"
                    />
                  </div>

                  <div className="md:col-span-2 pt-3">
                    <button
                      type="submit"
                      disabled={loading || !activeCycle}
                      className="btn-primary w-full"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin animate-ping" />
                          Saving Chemistry Records...
                        </>
                      ) : (
                        'Run Soil Diagnostics'
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>

              {/* Radar Chart Visualizer */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card flex flex-col justify-between"
              >
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2 font-display">Soil Parameter Balance</h3>
                
                <div className="flex-1 flex items-center justify-center min-h-[220px]">
                  <ResponsiveContainer width="100%" height={230}>
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="#cbd5e1" className="dark:stroke-slate-800/80" />
                      <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={9} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" fontSize={8} />
                      <Radar name="Current" dataKey="Current" stroke="#16a34a" fill="#16a34a" fillOpacity={0.25} />
                      <Radar name="Target Optimal" dataKey="Target" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.05} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* Recommendations & Deficiencies */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="card"
            >
              <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 font-display">Diagnostic Prescription</h3>
              {result ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Alert Status Card */}
                  <div className="space-y-4">
                    <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                      result.status.toLowerCase() === 'good' ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' :
                      result.status.toLowerCase() === 'moderate' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' :
                      'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
                    }`}>
                      <span className="font-extrabold uppercase text-[10px] tracking-wide block mb-1">Index Analysis</span>
                      Soil chemistry index score is <strong className="font-extrabold text-sm">{result.health_score} / 100</strong>, indicating <strong className="font-extrabold">{result.status.toUpperCase()}</strong> nutrient concentration.
                    </div>

                    {result.deficiencies.length > 0 ? (
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2 font-display">Deficiencies Detected</span>
                        <div className="flex flex-wrap gap-1.5">
                          {result.deficiencies.map((def: string) => (
                            <span key={def} className="px-2.5 py-1 bg-red-500/10 border border-red-500/10 text-red-700 dark:text-red-400 rounded-xl text-[10px] capitalize font-bold">
                              {def} deficit
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-green-500/10 border border-green-500/10 rounded-2xl text-xs text-green-700 dark:text-green-400 font-semibold flex items-center gap-1.5">
                        <CheckCircle className="w-4.5 h-4.5" /> All chemical properties optimal.
                      </div>
                    )}
                  </div>

                  {/* Action Prescription */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl">
                      <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2 font-display">Synthetic Application Advice</span>
                      <p className="text-xs text-slate-700 dark:text-slate-350 font-semibold leading-relaxed">
                        {result.recommendations.fertilizer}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl">
                        <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2 font-display">Organic Interventions</span>
                        <ul className="text-xs list-disc list-inside text-slate-650 dark:text-slate-450 space-y-1">
                          {result.recommendations.organic.map((org: string, i: number) => (
                            <li key={i}>{org}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl">
                        <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2 font-display">Long-Term Soil Management</span>
                        <ul className="text-xs list-disc list-inside text-slate-650 dark:text-slate-450 space-y-1">
                          {result.recommendations.improvement.map((imp: string, i: number) => (
                            <li key={i}>{imp}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No diagnostic report active. Submit soil metrics above.
                </div>
              )}
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}
