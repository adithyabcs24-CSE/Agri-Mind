'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import FarmFieldSelector from '@/components/FarmFieldSelector';
import { Leaf, Upload, TrendingUp, AlertCircle, Camera, CheckCircle, Sprout, Loader2, Plus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { useFarmField } from '@/context/FarmFieldContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

const initialChartData = [
  { day: 'Mon', score: 75 }, { day: 'Tue', score: 76 }, { day: 'Wed', score: 78 },
  { day: 'Thu', score: 78 }, { day: 'Fri', score: 80 }, { day: 'Sat', score: 81 },
  { day: 'Sun', score: 82.5 },
];

export default function CropHealthPage() {
  const {
    farms,
    fields,
    selectedFarmId,
    selectedFieldId,
    activeCycle,
    isOffline
  } = useFarmField();

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [chartData, setChartData] = useState(initialChartData);
  const [error, setError] = useState('');

  // Update chart data whenever active cycle score changes
  useEffect(() => {
    if (activeCycle) {
      setChartData(prev => [...prev.slice(0, 6), { day: 'Active', score: activeCycle.health_score }]);
    }
  }, [activeCycle]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedFieldId) {
      setError('Please select a field and upload an image.');
      toast.error('Missing field selection or image file');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('field_id', selectedFieldId);

    const loadingToast = toast.loading('Running AI Crop Diagnostic algorithms...');

    try {
      const data = await api.analyzeCropHealth(formData);
      setResult(data);
      setChartData(prev => [...prev.slice(1), { day: 'New Scan', score: data.health_score }]);
      toast.success('Crop health scan completed successfully!', { id: loadingToast });
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please try again.');
      toast.error(err.message || 'Analysis failed. Please check backend status.', { id: loadingToast });
      
      // Fallback demo data
      const mockResult = {
        health_score: 84.5,
        status: 'Optimal Health',
        ndvi: 0.78,
        growth_stage: 'Vegetative (Day 62)',
        detections: {
          leaf_density: 88,
          chlorophyll_index: 85,
          water_stress: 8,
          nitrogen_efficiency: 92
        },
        recommendations: [
          'Maintain water levels at current depth (2-3 cm)',
          'Top-dress nitrogen fertilizer (Urea @ 30kg/acre) in 3 days',
          'Pest threshold is safe; no chemical action needed.'
        ]
      };
      setResult(mockResult);
      setChartData(prev => [...prev.slice(1), { day: 'Mock Scan', score: mockResult.health_score }]);
      toast.success('Generated demo diagnosis (Fallback Active)', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Header title="Crop Health Monitoring" />
      
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Farm & Field Selection bar */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card flex flex-wrap gap-4 items-center justify-between py-4"
        >
          <FarmFieldSelector />
          <div className="flex items-center gap-2 text-xs font-semibold text-green-700 bg-green-500/10 px-3 py-1.5 rounded-full dark:text-green-400">
            <Sprout className="w-4 h-4" />
            Active Crop Cycle: <span className="font-bold">{activeCycle ? `${activeCycle.crop_name} (${activeCycle.growth_stage})` : 'None'}</span>
          </div>
        </motion.div>

        {farms.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center card bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl max-w-lg mx-auto mt-12 shadow-xl">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 font-display">No Farms Available</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
              Please register a farm to run crop health scans.
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
              Please add a field to associate crop health parameters.
            </p>
            <Link href="/dashboard/settings" className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold">
              <Plus className="w-4 h-4" /> Create New Field
            </Link>
          </div>
        ) : !selectedFieldId ? (
          <div className="text-center p-12 text-slate-450 card border border-dashed rounded-2xl bg-white dark:bg-slate-950">
            Select a field layout to analyze crop health.
          </div>
        ) : (
          <>
            {/* Status Metrics grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Crop Health Score"
                value={result ? result.health_score : activeCycle ? `${activeCycle.health_score.toFixed(1)}` : '82.5'}
                subtitle={result ? `Status: ${result.status}` : 'Good condition'}
                icon={Leaf}
                color="green"
              />
              <StatCard
                title="NDVI index"
                value={result ? result.ndvi : '0.72'}
                subtitle="Satellite/Drone density"
                icon={TrendingUp}
                color="blue"
              />
              <StatCard
                title="Growth Stage"
                value={result ? result.growth_stage.replace('_', ' ') : activeCycle ? activeCycle.growth_stage.toUpperCase() : 'VEGETATIVE'}
                subtitle={`Rice Crop Cycle`}
                icon={CheckCircle}
                color="purple"
              />
            </div>

            {/* Upload & Diagnostics Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Health Analysis Upload Card */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="card flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 font-display">
                    <Camera className="w-5 h-5 text-green-600 dark:text-green-400" /> Upload Field Imagery
                  </h3>
                  
                  <form onSubmit={handleUpload} className="space-y-4">
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-green-500 dark:hover:border-green-400 rounded-2xl p-8 text-center transition-all bg-slate-50/50 dark:bg-slate-900/20 group cursor-pointer relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => setFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="image-file-upload"
                      />
                      <div className="flex flex-col items-center">
                        <Upload className="w-10 h-10 text-slate-400 mb-3 group-hover:text-green-500 transition-colors group-hover:scale-105" />
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Drag leaf images here, or browse files</p>
                        <p className="text-xs text-slate-400 mt-1">Supports drone multispectral TIFF, JPEG, or PNG images</p>
                      </div>
                    </div>

                    <AnimatePresence>
                      {file && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-between text-xs text-green-700 dark:text-green-400"
                        >
                          <div className="flex items-center gap-2">
                            <Leaf className="w-4 h-4" />
                            <span className="font-semibold truncate max-w-[200px]">{file.name}</span>
                          </div>
                          <span className="text-[10px] bg-green-500/20 px-2 py-0.5 rounded-full">Ready</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !file || isOffline}
                      className="btn-primary w-full disabled:from-slate-100 disabled:to-slate-100 dark:disabled:from-slate-800 dark:disabled:to-slate-800 disabled:text-slate-400"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4.5 h-4.5 animate-spin" />
                          Analyzing imagery via AI...
                        </>
                      ) : (
                        'Run Crop Health Diagnosis'
                      )}
                    </button>
                  </form>
                </div>
              </motion.div>

              {/* AI Diagnostic Recommendations Card */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 font-display">Diagnostic Report</h3>
                  {result ? (
                    <div className="space-y-4">
                      <div className="p-3 bg-green-500/10 border border-green-500/15 rounded-xl">
                        <p className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Crop Status</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          Health Score: {result.health_score} ({result.status})
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-display">Indices Analysis</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {Object.entries(result.detections).map(([key, val]: any) => (
                            <div key={key} className="flex justify-between p-2.5 bg-slate-50 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800/40 rounded-xl">
                              <span className="text-slate-500 capitalize">{key.replace('_', ' ')}</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{val}%</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-display mb-1.5">Agronomic Action Required</p>
                        <ul className="text-xs list-disc list-inside text-slate-650 dark:text-slate-350 space-y-1 bg-slate-50 dark:bg-slate-850/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800/20">
                          {result.recommendations.map((rec: string, i: number) => (
                            <li key={i} className="leading-relaxed">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-slate-450 text-sm">
                      Upload drone or satellite leaf imagery to inspect field stress levels.
                    </div>
                  )}
                </div>
                
                {!result && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-[11px] text-slate-500 leading-relaxed mt-4">
                    ℹ️ <strong>Did you know?</strong> Healthy leaves show an NDVI index between 0.6 and 0.9. A drop in NDVI below 0.5 usually indicates water stress.
                  </div>
                )}
              </motion.div>
            </div>

            {/* History trend chart */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="card"
            >
              <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 font-display">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" /> Historical Crop Health Score Trend
              </h3>
              
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="cropHealthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800/80" />
                  <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis domain={[50, 100]} stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: 'none', 
                      borderRadius: '12px',
                      color: '#f8fafc',
                      fontSize: '12px'
                    }} 
                  />
                  <Area type="monotone" dataKey="score" stroke="#16a34a" fill="url(#cropHealthGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}
