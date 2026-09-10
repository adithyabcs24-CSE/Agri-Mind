'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import FarmFieldSelector from '@/components/FarmFieldSelector';
import { Droplets, Clock, TrendingDown, Gauge, AlertCircle, Plus, RefreshCw, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useFarmField } from '@/context/FarmFieldContext';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Link from 'next/link';

const weeklyWater = [
  { day: 'Mon', Required: 4500, Used: 4200 },
  { day: 'Tue', Required: 4300, Used: 4100 },
  { day: 'Wed', Required: 4600, Used: 4400 },
  { day: 'Thu', Required: 4200, Used: 3800 },
  { day: 'Fri', Required: 4500, Used: 3200 },
  { day: 'Sat', Required: 4400, Used: 2900 },
  { day: 'Sun', Required: 4100, Used: 3100 },
];

export default function WaterPage() {
  const {
    farms,
    fields,
    selectedFarmId,
    selectedFieldId,
    isOffline
  } = useFarmField();

  // Load water prediction via TanStack Query
  const { data: waterPred, isLoading, refetch } = useQuery({
    queryKey: ['water-prediction', selectedFieldId],
    queryFn: async () => {
      try {
        const res = await api.predictWater(selectedFieldId);
        return res;
      } catch (err) {
        console.warn('API water prediction failed, using mock data:', err);
        return {
          daily_requirement_liters: 4500,
          per_acre_liters: 4500,
          per_plant_liters: 2.3,
          water_saving_pct: 18.5,
          next_irrigation: new Date(Date.now() + 24*60*60*1000).toISOString(),
          remaining_moisture_pct: 28.5,
          evapotranspiration_mm: 5.2
        };
      }
    },
    enabled: !!selectedFieldId,
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Header title="Water Resource Management" />
      
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Selection Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card flex flex-wrap gap-4 items-center justify-between py-4"
        >
          <FarmFieldSelector />

          <button 
            onClick={() => selectedFieldId && refetch()}
            className="btn-primary text-xs py-2 flex items-center gap-1.5"
            disabled={isLoading || !selectedFieldId}
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refit Water Models
          </button>
        </motion.div>

        {farms.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center card bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl max-w-lg mx-auto mt-12 shadow-xl">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 font-display">No Farms Available</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
              Please register a farm to run crop water requirement analysis.
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
              Please add a field layout to analyze soil moisture stress.
            </p>
            <Link href="/dashboard/settings" className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold">
              <Plus className="w-4 h-4" /> Create New Field
            </Link>
          </div>
        ) : !selectedFieldId ? (
          <div className="text-center p-12 text-slate-450 card border border-dashed rounded-2xl bg-white dark:bg-slate-950">
            Select a field layout to compute water resource budgets.
          </div>
        ) : (
          <>
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                title="Today's Requirement" 
                value={waterPred ? `${waterPred.daily_requirement_liters.toLocaleString()} L` : 'N/A'} 
                subtitle="Per acre volume" 
                icon={Droplets} 
                color="blue" 
              />
              <StatCard 
                title="Per Plant Volume" 
                value={waterPred?.per_plant_liters ? `${waterPred.per_plant_liters} L` : '2.3 L'} 
                subtitle="~10,000 plants/acre" 
                icon={Gauge} 
                color="green" 
              />
              <StatCard 
                title="Water Saved" 
                value={waterPred ? `${waterPred.water_saving_pct}%` : 'N/A'} 
                subtitle="vs flood irrigation" 
                icon={TrendingDown} 
                color="green" 
              />
              <StatCard 
                title="Next Scheduled Irrigation" 
                value={waterPred?.next_irrigation ? new Date(waterPred.next_irrigation).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '6:00 AM'} 
                subtitle="Daily automation slot" 
                icon={Clock} 
                color="amber" 
              />
            </div>

            {/* Charts & Water Tank Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Usage Chart */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="card lg:col-span-2"
              >
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-6 font-display">Weekly Water Ingestion Logs</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyWater}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800/80" />
                    <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
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
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="Required" fill="#3b82f6" opacity={0.3} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Used" fill="#22c55e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Interactive Water Tank visualization */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card flex flex-col justify-between"
              >
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 font-display">Silo Reservoir Level</h3>
                
                <div className="flex flex-col items-center py-4">
                  {/* Cylinder Water Tank */}
                  <div className="relative w-32 h-44 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center">
                    {/* Wave Effect */}
                    <motion.div 
                      initial={{ y: "100%" }}
                      animate={{ y: "22%" }}
                      transition={{ type: 'spring', stiffness: 40, damping: 10 }}
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600/85 to-blue-400/80 w-full h-full rounded-b-3xl"
                      style={{ transformOrigin: 'bottom center' }}
                    />
                    {/* Float glass reading */}
                    <div className="relative z-10 text-center select-none pointer-events-none">
                      <p className="text-3xl font-black text-slate-800 dark:text-slate-100 font-display">
                        {waterPred?.remaining_moisture_pct ? Math.round(waterPred.remaining_moisture_pct * 2.5) : 78}%
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Capacity</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-3">Device: tank-silo-01 (15,000L)</span>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/40 text-xs text-slate-500 leading-relaxed font-semibold">
                  Tank holds sufficient volume for the next 3 scheduled irrigation cycles.
                </div>
              </motion.div>
            </div>

            {/* Detailed Recommendation strip */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="card space-y-5"
            >
              <h3 className="font-bold text-slate-800 dark:text-slate-200 font-display">Irrigation Recommendation Advisory</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-green-500/10 border border-green-500/15 rounded-2xl md:col-span-1">
                  <span className="text-[9px] font-bold bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full uppercase">Optimal Action</span>
                  <p className="font-extrabold text-sm text-slate-850 dark:text-slate-200 mt-2">✅ Action: Start Irrigation</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Next cycle scheduled for tomorrow at 6:00 AM
                  </p>
                </div>
                
                <div className="md:col-span-2 space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-500">
                      <span>Soil Moisture Level</span>
                      <span className="text-slate-800 dark:text-slate-200">
                        {waterPred ? `${waterPred.remaining_moisture_pct}%` : '28.5%'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${waterPred?.remaining_moisture_pct || 28.5}%` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/40 text-xs font-semibold">
                    <div>
                      <span className="text-slate-400 font-bold text-[10px] block uppercase">Evapotranspiration</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {waterPred?.evapotranspiration_mm ? `${waterPred.evapotranspiration_mm} mm/day` : '5.2 mm/day'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold text-[10px] block uppercase">Rain (24h)</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">0 mm</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold text-[10px] block uppercase">Irrigation Efficiency</span>
                      <span className="font-bold text-green-600">87.5%</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}
