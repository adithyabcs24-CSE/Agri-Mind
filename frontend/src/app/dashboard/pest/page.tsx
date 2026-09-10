'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import FarmFieldSelector from '@/components/FarmFieldSelector';
import {
  Bug, Thermometer, Droplets, Calendar, AlertTriangle,
  ShieldAlert, CheckSquare, RefreshCw, Loader2
} from 'lucide-react';
import { api } from '@/lib/api';
import { useFarmField } from '@/context/FarmFieldContext';
import toast from 'react-hot-toast';

// ---------- Demo fallback (always visible if API fails) ----------
const DEMO_PREDICTION = {
  risk_level: 'Medium',
  confidence: 0.82,
  pest_name: 'Brown Planthopper',
  predicted_outbreak_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  factors: { temperature: 32.5, humidity: 78, rainfall_7d: 45 },
  preventive_actions: [
    'Maintain field sanitation by removing alternate weed hosts from bunds',
    'Avoid excessive usage of nitrogenous fertilizers — split N application',
    'Deploy yellow sticky traps @ 10 traps/acre at 30 cm above canopy',
    'Ensure alternate wetting and drying (AWD) water management schedule',
    'Apply Neem-based pesticide (Azadirachtin 0.03%) as first-line biopesticide',
  ],
};

// Risk level color mapping
const RISK_COLOR: Record<string, string> = {
  high: '#dc2626', medium: '#f59e0b', low: '#16a34a',
};

export default function PestPage() {
  const { selectedFarm, selectedField, activeCycle } = useFarmField();

  const [loading, setLoading]       = useState(false);
  const [prediction, setPrediction] = useState<any>(DEMO_PREDICTION);
  const [error, setError]           = useState('');
  const [checked, setChecked]       = useState<Record<number, boolean>>({});

  const loadPestPrediction = async () => {
    setLoading(true);
    setError('');
    const tid = toast.loading('Querying ML pest risk prediction models...');

    try {
      if (!activeCycle?.id) throw new Error('No active crop cycle — showing demo data.');
      const data = await api.predictPest(activeCycle.id);
      setPrediction(data);
      toast.success('Pest prediction synced!', { id: tid });
    } catch (err: any) {
      console.warn('Pest API fallback:', err.message);
      setPrediction(DEMO_PREDICTION);
      toast.success('Demo pest risk data loaded', { id: tid });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPestPrediction(); }, [activeCycle?.id]);

  const riskColor  = RISK_COLOR[prediction.risk_level?.toLowerCase()] ?? '#3b82f6';
  const riskStat   = prediction.risk_level?.toLowerCase() === 'high' ? 'red'
                   : prediction.risk_level?.toLowerCase() === 'medium' ? 'amber' : 'green';
  const outbreakDate = new Date(prediction.predicted_outbreak_date).toLocaleDateString('en-IN',
    { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="dashboard-page">
      <Header title="Pest Risk Analysis" />

      <main className="dashboard-main">
        {/* Selection & refresh bar */}
        <div className="card selection-bar animate-fade-in-up">
          <FarmFieldSelector />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="status-badge online">
              <Bug style={{ width: 14, height: 14 }} />
              Crop: <strong style={{ marginLeft: 4 }}>{activeCycle?.crop_name ?? 'Demo Mode'}</strong>
            </div>
            <button
              onClick={loadPestPrediction}
              disabled={loading}
              className="btn btn-secondary btn-sm"
            >
              {loading
                ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />
                : <RefreshCw style={{ width: 13, height: 13 }} />}
              Refit Predictors
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
            <p className="loading-text">Fitting agricultural pest risk parameters...</p>
          </div>
        ) : (
          <>
            {/* Stats overview */}
            <div className="stats-grid">
              <StatCard
                title="Pest Risk Level"
                value={prediction.risk_level.toUpperCase()}
                subtitle={`Confidence: ${Math.round(prediction.confidence * 100)}%`}
                icon={ShieldAlert}
                color={riskStat as any}
              />
              <StatCard
                title="Primary Pest Threat"
                value={prediction.pest_name}
                subtitle="Identified threat vector"
                icon={Bug}
                color="amber"
              />
              <StatCard
                title="Predicted Outbreak"
                value={outbreakDate}
                subtitle="Based on climate modeling"
                icon={Calendar}
                color="red"
              />
              <StatCard
                title="Relative Humidity"
                value={`${prediction.factors.humidity}%`}
                subtitle="Favors pest reproduction"
                icon={Droplets}
                color="blue"
              />
            </div>

            <div className="charts-grid">
              {/* Microclimate risk factors */}
              <div className="card animate-fade-in-up">
                <h3 className="section-title" style={{ marginBottom: 24 }}>
                  <Thermometer style={{ width: 20, height: 20, color: 'var(--green-600)' }} />
                  Microclimate Risk Contributors
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {[
                    { label: 'TEMPERATURE THRESHOLD', value: `${prediction.factors.temperature}°C`, pct: (prediction.factors.temperature / 50) * 100, color: '#dc2626' },
                    { label: 'AIR RELATIVE HUMIDITY',  value: `${prediction.factors.humidity}%`,    pct: prediction.factors.humidity,                 color: '#2563eb' },
                    { label: '7-DAY ACCUMULATED RAIN', value: `${prediction.factors.rainfall_7d} mm`,pct: Math.min((prediction.factors.rainfall_7d / 150) * 100, 100), color: '#16a34a' },
                  ].map(({ label, value, pct, color }) => (
                    <div key={label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        <span>{label}</span>
                        <span style={{ color: 'var(--text-primary)' }}>{value}</span>
                      </div>
                      <div style={{ width: '100%', background: 'var(--bg-muted)', height: 8, borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: color, transition: 'width 1s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Risk score gauge */}
                <div style={{ marginTop: 24, padding: 16, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 'var(--radius-xl)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: riskColor }} className="pulse-indicator" />
                    <span style={{ fontSize: 11, fontWeight: 800, color: riskColor, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {prediction.risk_level} Risk Detected
                    </span>
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    💡 High relative humidity (&gt;75%) and temperatures between 28°C–33°C create the optimal
                    breeding window for <strong>{prediction.pest_name}</strong>.
                  </p>
                </div>
              </div>

              {/* IPM Preventive actions */}
              <div className="card animate-fade-in-up">
                <h3 className="section-title" style={{ marginBottom: 20 }}>
                  <CheckSquare style={{ width: 20, height: 20, color: 'var(--green-600)' }} />
                  Integrated Pest Management (IPM)
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {prediction.preventive_actions.map((action: string, i: number) => (
                    <label
                      key={i}
                      htmlFor={`ipm-${i}`}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px',
                        background: checked[i] ? 'rgba(22,163,74,0.06)' : 'var(--bg-muted)',
                        border: checked[i] ? '1px solid rgba(22,163,74,0.2)' : '1px solid var(--border-primary)',
                        borderRadius: 'var(--radius-xl)', cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <input
                        type="checkbox"
                        id={`ipm-${i}`}
                        checked={!!checked[i]}
                        onChange={e => setChecked(prev => ({ ...prev, [i]: e.target.checked }))}
                        style={{ marginTop: 2, accentColor: 'var(--green-600)', width: 15, height: 15, flexShrink: 0 }}
                      />
                      <span style={{
                        fontSize: 12, fontWeight: 600, color: checked[i] ? 'var(--text-faint)' : 'var(--text-secondary)',
                        lineHeight: 1.6, textDecoration: checked[i] ? 'line-through' : 'none',
                      }}>
                        {action}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="info-box" style={{ marginTop: 16 }}>
                  ✅ {Object.values(checked).filter(Boolean).length} of {prediction.preventive_actions.length} IPM actions completed
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
