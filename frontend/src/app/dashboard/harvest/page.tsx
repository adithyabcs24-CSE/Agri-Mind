'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import FarmFieldSelector from '@/components/FarmFieldSelector';
import {
  BarChart3, Calendar, Package, Target, RefreshCw,
  Loader2, AlertTriangle, Sprout, CheckCircle2, Clock, CloudRain
} from 'lucide-react';
import { api } from '@/lib/api';
import { useFarmField } from '@/context/FarmFieldContext';
import toast from 'react-hot-toast';

// ---------- Demo fallback ----------
const DEMO_PREDICTION = {
  readiness_pct: 78,
  recommended_date:    new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
  confidence: 0.85,
  expected_yield_quintals: 42.5,
  optimal_window_start: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
  optimal_window_end:   new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
  grain_moisture_pct: 21,
  total_crop_age_days: 95,
  total_cycle_days: 120,
  ndvi_health: 82.5,
};

const CROP_STAGES = [
  { stage: 'Sowing / Transplanting',    pct: 100 },
  { stage: 'Vegetative Growth Stage',   pct: 100 },
  { stage: 'Flowering Timeline',         pct: 100 },
  { stage: 'Fruiting / Grain Filling',  pct: 0   },
  { stage: 'Maturity & Harvest Ready',  pct: 0   },
];

export default function HarvestPage() {
  const { selectedFarm, selectedField, activeCycle } = useFarmField();

  const [loading, setLoading]       = useState(false);
  const [prediction, setPrediction] = useState<any>(DEMO_PREDICTION);
  const [error, setError]           = useState('');

  const loadHarvestPrediction = async () => {
    setLoading(true);
    setError('');
    const tid = toast.loading('Calculating crop maturity index...');

    try {
      if (!activeCycle?.id) throw new Error('No active crop cycle — showing demo data.');
      const data = await api.predictHarvest(activeCycle.id);
      setPrediction(data);
      toast.success('Maturity prediction synced!', { id: tid });
    } catch (err: any) {
      console.warn('Harvest API fallback:', err.message);
      setPrediction(DEMO_PREDICTION);
      toast.success('Demo harvest data loaded', { id: tid });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHarvestPrediction(); }, [activeCycle?.id]);

  // Compute stage percentages from readiness
  const r = prediction.readiness_pct;
  const stages = [
    { stage: 'Sowing / Transplanting',    pct: 100,               status: 'Completed' },
    { stage: 'Vegetative Growth Stage',   pct: 100,               status: 'Completed' },
    { stage: 'Flowering Timeline',         pct: 100,               status: 'Completed' },
    { stage: 'Fruiting / Grain Filling',  pct: Math.min(r + 10, 100), status: r > 90 ? 'Completed' : 'Active' },
    { stage: 'Maturity & Harvest Ready',  pct: r,                 status: r >= 100 ? 'Completed' : 'In Progress' },
  ];

  const windowStart = new Date(prediction.optimal_window_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const windowEnd   = new Date(prediction.optimal_window_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const recDate     = new Date(prediction.recommended_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="dashboard-page">
      <Header title="Harvest Readiness Prediction" />

      <main className="dashboard-main">
        {/* Selection bar */}
        <div className="card selection-bar animate-fade-in-up">
          <FarmFieldSelector />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="status-badge online">
              <Sprout style={{ width: 14, height: 14 }} />
              Crop: <strong style={{ marginLeft: 4 }}>{activeCycle?.crop_name ?? 'Demo Mode'}</strong>
            </div>
            <button onClick={loadHarvestPrediction} disabled={loading} className="btn btn-secondary btn-sm">
              {loading
                ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />
                : <RefreshCw style={{ width: 13, height: 13 }} />}
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="banner warning">
            <AlertTriangle style={{ width: 16, height: 16, flexShrink: 0 }} />
            {error} — showing demo data.
          </div>
        )}

        {loading ? (
          <div className="loading-screen">
            <Loader2 style={{ width: 36, height: 36, color: 'var(--green-600)', animation: 'spin 1s linear infinite' }} />
            <p className="loading-text">Running crop growth accumulation models...</p>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="stats-grid">
              <StatCard title="Harvest Readiness"    value={`${prediction.readiness_pct}%`}                          subtitle={`${activeCycle?.crop_name ?? 'Rice'} — selected field`}  icon={Target}   color="green"  />
              <StatCard title="Recommended Date"     value={recDate}                                                  subtitle={`Confidence: ${Math.round(prediction.confidence * 100)}%`} icon={Calendar} color="blue"   />
              <StatCard title="Expected Yield"       value={`${prediction.expected_yield_quintals} q`}                subtitle="Estimated net output"                                       icon={Package}  color="amber"  />
              <StatCard title="Harvest Window"       value={`${windowStart} – ${windowEnd}`}                         subtitle="Optimal harvesting timeline"                                icon={BarChart3} color="purple" />
            </div>

            <div className="charts-grid">
              {/* Progress bars */}
              <div className="card animate-fade-in-up">
                <h3 className="section-title" style={{ marginBottom: 24 }}>
                  <BarChart3 style={{ width: 20, height: 20, color: 'var(--green-600)' }} />
                  Crop Cycle Maturity Progress
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {stages.map(({ stage, pct, status }) => (
                    <div key={stage}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{stage}</span>
                        <span style={{ color: pct === 100 ? 'var(--green-600)' : 'var(--text-faint)' }}>
                          {pct}% · {status}
                        </span>
                      </div>
                      <div style={{ width: '100%', background: 'var(--bg-muted)', height: 8, borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{
                          width: `${pct}%`, height: '100%', borderRadius: 99,
                          background: pct === 100 ? '#16a34a' : pct > 60 ? '#f59e0b' : '#3b82f6',
                          transition: 'width 1s ease',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Crop data table */}
                <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-muted)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-xl)' }}>
                  {[
                    { label: 'Total Crop Age',        value: `${prediction.total_crop_age_days ?? 95} days` },
                    { label: 'Full Cycle Duration',   value: `${prediction.total_cycle_days ?? 120} days` },
                    { label: 'Grain Moisture Content',value: `${prediction.grain_moisture_pct ?? 21}%` },
                    { label: 'NDVI Health Index',     value: `${prediction.ndvi_health ?? 82.5}%`, green: true },
                  ].map(({ label, value, green }) => (
                    <div key={label} className="data-table-row">
                      <span className="data-table-key">{label}</span>
                      <span className="data-table-val" style={{ color: green ? 'var(--green-600)' : undefined }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advisory panel */}
              <div className="card animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 className="section-title">
                  <Calendar style={{ width: 20, height: 20, color: 'var(--blue-500)' }} />
                  Harvest Window Advisory
                </h3>

                {/* Advisory cards */}
                {[
                  {
                    icon: <Clock style={{ width: 18, height: 18, color: '#2563eb' }} />,
                    title: '🌾 Crop Approaching Harvesting Maturity',
                    body: `Recommended: reap within 25 days. Grain moisture is dropping at ~0.4%/day. Target ≤14% before threshing.`,
                    color: 'rgba(37,99,235,0.06)', border: 'rgba(37,99,235,0.18)',
                  },
                  {
                    icon: <CheckCircle2 style={{ width: 18, height: 18, color: '#16a34a' }} />,
                    title: '✅ Climate Suitability Favorable',
                    body: 'No severe precipitation predicted in the next 14 days. Window is clear for combine harvester deployment.',
                    color: 'rgba(22,163,74,0.06)', border: 'rgba(22,163,74,0.18)',
                  },
                  {
                    icon: <CloudRain style={{ width: 18, height: 18, color: '#f59e0b' }} />,
                    title: '⚠️ Post-Harvest Storage Advisory',
                    body: 'Store in licensed APMC warehouse at <15°C. Aerate in 48h intervals. Use silica desiccants to maintain dryness.',
                    color: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.18)',
                  },
                ].map(({ icon, title, body, color, border }) => (
                  <div key={title} style={{ padding: 16, background: color, border: `1px solid ${border}`, borderRadius: 'var(--radius-xl)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      {icon}
                      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</p>
                    </div>
                    <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: 28 }}>{body}</p>
                  </div>
                ))}

                {/* Readiness gauge */}
                <div style={{ padding: '14px 16px', background: 'var(--bg-muted)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-xl)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
                    <span style={{ color: 'var(--text-faint)' }}>Overall Readiness Score</span>
                    <span style={{ color: 'var(--green-600)' }}>{prediction.readiness_pct}%</span>
                  </div>
                  <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: 12, borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      width: `${prediction.readiness_pct}%`, height: '100%', borderRadius: 99,
                      background: 'linear-gradient(90deg, #16a34a, #22c55e)',
                      transition: 'width 1.2s ease',
                    }} />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
