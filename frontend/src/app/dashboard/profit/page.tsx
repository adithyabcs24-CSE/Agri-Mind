'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import FarmFieldSelector from '@/components/FarmFieldSelector';
import {
  DollarSign, Landmark, TrendingUp, BarChart2, AlertCircle,
  RefreshCw, Loader2, Sprout, Star, Truck, Warehouse, Scissors
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { api } from '@/lib/api';
import { useFarmField } from '@/context/FarmFieldContext';
import toast from 'react-hot-toast';

// ---------- Demo fallback ----------
const DEMO_PROFIT = {
  expected_yield_quintals: 42.5,
  best_scenario: 'sell_next_week',
  current_market_value: 104125,
  costs: { harvest: 4500, storage: 1200, transport: 1800, total: 7500 },
  scenarios: {
    sell_today:       { net_profit: 96625,  label: 'Sell Today',       desc: 'Deliver crops to nearest local wholesaler mandi immediately.' },
    sell_next_week:   { net_profit: 106425, label: 'Sell Next Week',   desc: 'Hold crop 7 days for expected regional price spike (+9.4%).' },
    store_one_month:  { net_profit: 101725, label: 'Store 1 Month',    desc: 'Use APMC licensed warehouse to capture long-term price gaps.' },
  },
};

const PIE_COLORS = { harvest: '#eab308', storage: '#a855f7', transport: '#3b82f6' };

export default function ProfitPage() {
  const { selectedFarm, selectedField, activeCycle } = useFarmField();

  const [loading, setLoading]       = useState(false);
  const [profitData, setProfitData] = useState<any>(DEMO_PROFIT);
  const [error, setError]           = useState('');

  const loadProfitPrediction = async () => {
    setLoading(true);
    setError('');
    const tid = toast.loading('Calculating scenario profit margins...');

    try {
      if (!activeCycle?.id) throw new Error('No active crop cycle — showing demo data.');
      const data = await api.predictProfit(activeCycle.id);
      // Inject labels/desc if API doesn't return them
      if (data.scenarios) {
        data.scenarios.sell_today       = { ...data.scenarios.sell_today,      label: 'Sell Today',     desc: 'Deliver crops to nearest local wholesaler mandi.' };
        data.scenarios.sell_next_week   = { ...data.scenarios.sell_next_week,  label: 'Sell Next Week', desc: 'Hold crop 7 days for expected regional price spike.' };
        data.scenarios.store_one_month  = { ...data.scenarios.store_one_month, label: 'Store 1 Month',  desc: 'Use APMC licensed warehouse to capture long-term gaps.' };
      }
      setProfitData(data);
      toast.success('Profit forecast synced!', { id: tid });
    } catch (err: any) {
      console.warn('Profit API fallback:', err.message);
      setProfitData(DEMO_PROFIT);
      toast.success('Demo financial data loaded', { id: tid });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfitPrediction(); }, [activeCycle?.id]);

  const pieData = profitData ? [
    { name: 'Harvesting', value: profitData.costs.harvest,   color: PIE_COLORS.harvest   },
    { name: 'Storage',    value: profitData.costs.storage,   color: PIE_COLORS.storage   },
    { name: 'Transport',  value: profitData.costs.transport, color: PIE_COLORS.transport },
  ] : [];

  const barData = profitData ? Object.entries(profitData.scenarios).map(([key, val]: any) => ({
    name: val.label,
    Profit: val.net_profit,
    Expenses: profitData.costs.total + (key === 'store_one_month' ? profitData.costs.storage : 0),
    best: key === profitData.best_scenario,
  })) : [];

  const bestScenario = profitData?.scenarios?.[profitData?.best_scenario];

  return (
    <div className="dashboard-page">
      <Header title="Net Profit Prediction" />

      <main className="dashboard-main">
        {/* Selection bar */}
        <div className="card selection-bar animate-fade-in-up">
          <FarmFieldSelector />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="status-badge online">
              <Sprout style={{ width: 14, height: 14 }} />
              Crop: <strong style={{ marginLeft: 4 }}>{activeCycle?.crop_name ?? 'Demo Mode'}</strong>
            </div>
            <button onClick={loadProfitPrediction} disabled={loading} className="btn btn-secondary btn-sm">
              {loading
                ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />
                : <RefreshCw style={{ width: 13, height: 13 }} />}
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="banner warning">
            <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
            {error} — showing demo data.
          </div>
        )}

        {loading ? (
          <div className="loading-screen">
            <Loader2 style={{ width: 36, height: 36, color: 'var(--green-600)', animation: 'spin 1s linear infinite' }} />
            <p className="loading-text">Formulating financial cost-benefit reports...</p>
          </div>
        ) : profitData && (
          <>
            {/* KPI Cards */}
            <div className="stats-grid">
              <StatCard title="Expected Yield"          value={`${profitData.expected_yield_quintals} q`}                                                       subtitle="From current crop weight"              icon={BarChart2}   color="green"  />
              <StatCard title="Best Net Profit Margin"  value={`₹${bestScenario?.net_profit?.toLocaleString()}`}                                                subtitle={`Strategy: ${bestScenario?.label}`}    icon={DollarSign}  color="green"  />
              <StatCard title="Current Market Value"    value={`₹${profitData.current_market_value?.toLocaleString()}`}                                          subtitle="At base APMC wholesale rate"           icon={Landmark}    color="blue"   />
              <StatCard title="Total Production Costs"  value={`₹${profitData.costs.total?.toLocaleString()}`}                                                   subtitle="Harvest + storage + transport"         icon={TrendingUp}  color="amber"  />
            </div>

            {/* Scenarios + Bar chart */}
            <div className="charts-grid">
              {/* Scenario cards */}
              <div className="card animate-fade-in-up">
                <h3 className="section-title" style={{ marginBottom: 20 }}>
                  <BarChart2 style={{ width: 20, height: 20, color: 'var(--green-600)' }} />
                  Scenario Cost-Benefit Simulation
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {Object.entries(profitData.scenarios).map(([key, val]: any) => {
                    const isBest = key === profitData.best_scenario;
                    return (
                      <div
                        key={key}
                        style={{
                          padding: 16, borderRadius: 'var(--radius-xl)',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                          background: isBest ? 'rgba(22,163,74,0.07)' : 'var(--bg-muted)',
                          border: isBest ? '1px solid rgba(22,163,74,0.25)' : '1px solid var(--border-primary)',
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <p style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                              {val.label}
                            </p>
                            {isBest && (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9,
                                fontWeight: 800, padding: '2px 8px', borderRadius: 'var(--radius-full)',
                                background: 'rgba(22,163,74,0.15)', color: 'var(--green-600)',
                                textTransform: 'uppercase', letterSpacing: '0.08em',
                              }}>
                                <Star style={{ width: 9, height: 9 }} /> Best Option
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', lineHeight: 1.6, maxWidth: 300 }}>
                            {val.desc}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                            ₹{val.net_profit?.toLocaleString()}
                          </p>
                          <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', color: isBest ? 'var(--green-600)' : 'var(--text-faint)' }}>
                            Net Profit
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bar chart */}
              <div className="card animate-fade-in-up">
                <h3 className="section-title" style={{ marginBottom: 20 }}>
                  <TrendingUp style={{ width: 20, height: 20, color: 'var(--blue-500)' }} />
                  Scenario Profit vs Expenses
                </h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={barData} barGap={6}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.12)" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false}
                      tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a', border: '1px solid rgba(30,41,59,0.8)',
                        borderRadius: 12, color: '#f8fafc', fontSize: 12,
                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                      }}
                      formatter={(val: any) => [`₹${val.toLocaleString()}`, '']}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
                    <Bar dataKey="Profit"   fill="#16a34a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Expense breakdown */}
            <div className="two-col-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
              {/* Line-item table */}
              <div className="card animate-fade-in-up">
                <h3 className="section-title" style={{ marginBottom: 20 }}>
                  Operational Expense Statement
                </h3>
                {[
                  { label: 'Harvesting Contractor Fee',            icon: <Scissors  style={{ width: 14, height: 14 }} />, value: profitData.costs.harvest   },
                  { label: 'Licensed Warehouse Storage (monthly)', icon: <Warehouse style={{ width: 14, height: 14 }} />, value: profitData.costs.storage   },
                  { label: 'APMC Freight Logistics & Transport',   icon: <Truck     style={{ width: 14, height: 14 }} />, value: profitData.costs.transport },
                ].map(({ label, icon, value }) => (
                  <div key={label} className="data-table-row" style={{ paddingBlock: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-faint)' }}>
                      {icon}
                      <span className="data-table-key" style={{ margin: 0 }}>{label}</span>
                    </div>
                    <span className="data-table-val">₹{value.toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, marginTop: 4, borderTop: '2px solid var(--border-primary)' }}>
                  <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-primary)' }}>Total Outlay Costs</span>
                  <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--amber-600)' }}>₹{profitData.costs.total.toLocaleString()}</span>
                </div>
              </div>

              {/* Pie donut */}
              <div className="card animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <h3 className="section-title" style={{ marginBottom: 12 }}>Expenses Ratio</h3>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" paddingAngle={4}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(val: any) => [`₹${val.toLocaleString()}`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="distribution-legend">
                  {pieData.map(p => (
                    <div key={p.name} className="legend-item">
                      <div className="legend-dot" style={{ backgroundColor: p.color }} />
                      <span className="legend-label">{p.name}: ₹{p.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
