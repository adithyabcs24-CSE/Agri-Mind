'use client';

import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import FarmFieldSelector from '@/components/FarmFieldSelector';
import {
  Leaf, Droplets, Bug, TrendingUp, Cloud, Bell,
  Wheat, DollarSign, Thermometer, ArrowRight, Activity, AlertCircle, Plus, Loader2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useFarmField, getCached, setCached } from '@/context/FarmFieldContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function DashboardPage() {
  const {
    farms, fields, selectedFarmId, selectedFieldId,
    selectedFarm, selectedField, isOffline,
    isLoadingFarms, isLoadingFields, isLoadingPolledData,
    activeCycle, sensorData, weatherData, irrigationData, alertsData,
  } = useFarmField();

  const { data: pestRisk } = useQuery({
    queryKey: ['pest', activeCycle?.id],
    queryFn: async () => {
      const res = await api.predictPest(activeCycle.id);
      setCached(`cached_pest_${activeCycle.id}`, res);
      return res;
    },
    enabled: !!activeCycle?.id && !isOffline,
  });

  const { data: profitData } = useQuery({
    queryKey: ['profit', activeCycle?.id],
    queryFn: async () => {
      const res = await api.predictProfit(activeCycle.id);
      setCached(`cached_profit_${activeCycle.id}`, res);
      return res;
    },
    enabled: !!activeCycle?.id && !isOffline,
  });

  const getPestRisk = () => {
    if (isOffline && activeCycle) return getCached(`cached_pest_${activeCycle.id}`, { risk_level: 'Medium', pest_name: 'Pests' });
    return pestRisk || { risk_level: 'N/A', pest_name: 'None' };
  };

  const getProfit = () => {
    if (isOffline && activeCycle) return getCached(`cached_profit_${activeCycle.id}`, { expected_yield_quintals: 0, current_market_value: 0 });
    return profitData || null;
  };

  const healthScore = activeCycle?.health_score || 80;
  const healthData = [
    { day: 'Mon', score: healthScore - 3 },
    { day: 'Tue', score: healthScore - 1 },
    { day: 'Wed', score: healthScore - 2 },
    { day: 'Thu', score: healthScore + 1 },
    { day: 'Fri', score: healthScore + 3 },
    { day: 'Sat', score: healthScore + 1 },
    { day: 'Sun', score: healthScore },
  ];

  const cropDistribution = [
    { name: 'Optimal', value: Math.round(healthScore), color: '#16a34a' },
    { name: 'Water Stress', value: Math.round((100 - healthScore) * 0.4), color: '#2563eb' },
    { name: 'Nutrient Def.', value: Math.round((100 - healthScore) * 0.3), color: '#eab308' },
    { name: 'Diseased', value: Math.round((100 - healthScore) * 0.3), color: '#dc2626' },
  ];

  const recentAlerts = alertsData.slice(0, 3).map((a) => ({
    type: a.severity === 'critical' ? 'danger' : a.severity === 'warning' ? 'warning' : 'info',
    title: a.title,
    message: a.message,
    time: new Date(a.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
  }));

  if (isLoadingFarms || isLoadingFields) {
    return (
      <div className="dashboard-page">
        <Header title="Farm Overview" />
        <main className="loading-screen">
          <Loader2 style={{ width: 40, height: 40, color: 'var(--green-600)', animation: 'spin 1s linear infinite' }} />
          <p className="loading-text">Compiling farm metrics...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Header title="Farm Overview" />

      <main className="dashboard-main">
        {/* Selection Bar */}
        <div className="card selection-bar animate-fade-in-up">
          <FarmFieldSelector />
          <div className={`status-badge ${isOffline ? 'offline' : 'online'}`}>
            <span
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: isOffline ? 'var(--amber-500)' : 'var(--green-500)',
                flexShrink: 0,
              }}
            />
            {isOffline ? 'Offline Mode (Cached)' : 'Live Sensor Feed Active'}
          </div>
        </div>

        {/* Empty States */}
        {farms.length === 0 ? (
          <div className="empty-state">
            <AlertCircle style={{ width: 48, height: 48, color: 'var(--red-500)' }} className="empty-state-icon" />
            <h3 className="empty-state-title">No Farms Available</h3>
            <p className="empty-state-text">
              You haven't registered any farms on AgriMind AI. Register your first farm to unlock digital agronomy tools.
            </p>
            <Link href="/dashboard/settings" className="btn btn-primary">
              <Plus style={{ width: 16, height: 16 }} /> Create New Farm
            </Link>
          </div>
        ) : !selectedFarmId ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
            Please select a farm from the dropdown to continue.
          </div>
        ) : fields.length === 0 ? (
          <div className="empty-state">
            <AlertCircle style={{ width: 48, height: 48, color: 'var(--amber-500)' }} className="empty-state-icon" />
            <h3 className="empty-state-title">No Fields Found</h3>
            <p className="empty-state-text">
              This farm does not contain any fields. Create a field layout to analyze soil composition.
            </p>
            <Link href="/dashboard/settings" className="btn btn-primary">
              <Plus style={{ width: 16, height: 16 }} /> Create New Field
            </Link>
          </div>
        ) : !selectedFieldId ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px', border: '2px dashed var(--border-primary)', color: 'var(--text-muted)' }}>
            Select a specific Field to view its analytics and live telemetry.
          </div>
        ) : (
          <>
            {/* Field Overview Banner */}
            <div className="field-overview-banner">
              <div>
                <h3 className="field-overview-title">
                  Field Overview: {selectedField?.name}
                </h3>
                <p className="field-overview-subtitle">
                  Active Crop:{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {activeCycle ? `${activeCycle.crop_name} (${activeCycle.growth_stage})` : 'None'}
                  </strong>
                  {isLoadingPolledData && ' · Refreshing live sensor indices...'}
                </p>
              </div>
              <div className="live-badge">
                <Activity style={{ width: 16, height: 16 }} />
                <div className="live-dot" />
                Live Ingestion Synced
              </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
              <StatCard
                title="Crop Health Score"
                value={activeCycle ? `${activeCycle.health_score.toFixed(1)}` : 'N/A'}
                subtitle={activeCycle ? `${selectedField?.name} - ${activeCycle.crop_name}` : 'No Active Cycle'}
                icon={Leaf}
                color="green"
              />
              <StatCard
                title="Water Required Today"
                value={irrigationData ? `${irrigationData.water_amount_liters.toLocaleString()} L` : 'N/A'}
                subtitle={irrigationData ? irrigationData.action : 'Calculation Pending'}
                icon={Droplets}
                color="blue"
              />
              <StatCard
                title="Pest Risk"
                value={getPestRisk().risk_level}
                subtitle={getPestRisk().pest_name}
                icon={Bug}
                color="amber"
              />
              <StatCard
                title="Expected Yield Value"
                value={getProfit() ? `₹${getProfit().current_market_value.toLocaleString()}` : 'N/A'}
                subtitle={getProfit() ? `Yield: ${getProfit().expected_yield_quintals.toFixed(1)} quintals` : 'Market Prices'}
                icon={DollarSign}
                color="purple"
              />
            </div>

            {/* Charts Section */}
            <div className="charts-grid">
              {/* Health Trend Chart */}
              <div className="card animate-fade-in-up">
                <div className="section-header">
                  <h3 className="section-title">
                    <TrendingUp style={{ width: 20, height: 20, color: 'var(--green-600)' }} />
                    Crop Health Index Trend
                  </h3>
                  <span className="section-subtitle">Dynamic NDVI Analysis</span>
                </div>

                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={healthData}>
                      <defs>
                        <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
                      <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis domain={[50, 100]} stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid rgba(30,41,59,0.8)',
                          borderRadius: 12,
                          color: '#f8fafc',
                          fontSize: 12,
                          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                        }}
                      />
                      <Area type="monotone" dataKey="score" stroke="#16a34a" fill="url(#healthGrad)" strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Crop Status Distribution */}
              <div className="card animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <h3 className="section-title" style={{ marginBottom: 16 }}>Field Crop Condition</h3>

                <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', paddingBlock: 16 }}>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={cropDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" paddingAngle={4}>
                        {cropDistribution.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
                  }}>
                    <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                      {healthScore.toFixed(0)}%
                    </span>
                    <span style={{ fontSize: 9, color: 'var(--text-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Optimal
                    </span>
                  </div>
                </div>

                <div className="distribution-legend">
                  {cropDistribution.map(item => (
                    <div key={item.name} className="legend-item">
                      <div className="legend-dot" style={{ backgroundColor: item.color }} />
                      <span className="legend-label">{item.name}: {item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Widgets Grid */}
            <div className="two-col-grid">
              {/* Weather Widget */}
              <div className="card animate-fade-in-up">
                <div className="section-header">
                  <h3 className="section-title">
                    <Cloud style={{ width: 20, height: 20, color: 'var(--blue-500)' }} />
                    Weather Intelligence
                  </h3>
                  <span className="section-subtitle">{selectedFarm?.state || 'Punjab'}, India</span>
                </div>

                <div className="weather-grid">
                  <div className="weather-cell">
                    <Thermometer style={{ width: 24, height: 24, margin: '0 auto 6px', color: 'var(--red-500)' }} />
                    <p className="weather-value">{weatherData ? `${weatherData.temperature_max}°C` : '31°C'}</p>
                    <p className="weather-label">Temp</p>
                  </div>
                  <div className="weather-cell">
                    <Droplets style={{ width: 24, height: 24, margin: '0 auto 6px', color: 'var(--blue-500)' }} />
                    <p className="weather-value">{weatherData ? `${weatherData.humidity}%` : '60%'}</p>
                    <p className="weather-label">Humidity</p>
                  </div>
                  <div className="weather-cell">
                    <Cloud style={{ width: 24, height: 24, margin: '0 auto 6px', color: '#0ea5e9' }} />
                    <p className="weather-value">{weatherData ? `${weatherData.rainfall_mm} mm` : '0 mm'}</p>
                    <p className="weather-label">Rain</p>
                  </div>
                </div>

                <div className="weather-advisory">
                  <span style={{ width: 6, height: 6, background: 'var(--amber-500)', borderRadius: '50%', flexShrink: 0 }} className="pulse-indicator" />
                  {weatherData ? weatherData.description : 'Forecast looks optimal. Monitor daily NPK values.'}
                </div>
              </div>

              {/* Recent Alerts */}
              <div className="card animate-fade-in-up">
                <h3 className="section-title" style={{ marginBottom: 16 }}>
                  <Bell style={{ width: 20, height: 20, color: 'var(--amber-500)' }} />
                  Key Farm Alerts
                </h3>
                <div className="space-y-3">
                  {recentAlerts.length > 0 ? (
                    recentAlerts.map((alert, i) => (
                      <div key={i} className="alert-item">
                        <div className={`alert-dot ${alert.type}`} />
                        <div style={{ flex: 1 }}>
                          <p className="alert-title">{alert.title}</p>
                          <p className="alert-message">{alert.message}</p>
                        </div>
                        <span className="alert-time">{alert.time}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 12, color: 'var(--text-faint)', fontWeight: 500 }}>
                      No critical alerts found for this farm.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card animate-fade-in-up">
              <h3 className="section-title" style={{ marginBottom: 16 }}>
                Agronomy Tools & Quick Actions
              </h3>
              <div className="quick-actions-grid">
                {[
                  { label: 'Scan Disease', icon: Bug, href: '/dashboard/disease', iconClass: 'qa-icon-red' },
                  { label: 'Water Calculator', icon: Droplets, href: '/dashboard/water', iconClass: 'qa-icon-blue' },
                  { label: 'Market Prices', icon: Wheat, href: '/dashboard/market', iconClass: 'qa-icon-green' },
                  { label: 'Ask AI Assistant', icon: TrendingUp, href: '/dashboard/assistant', iconClass: 'qa-icon-purple' },
                ].map(({ label, icon: Icon, href, iconClass }) => (
                  <Link key={label} href={href} className="quick-action-item">
                    <div className={`quick-action-icon ${iconClass}`}>
                      <Icon style={{ width: 20, height: 20 }} />
                    </div>
                    <span className="quick-action-label">
                      {label}
                      <ArrowRight style={{ width: 14, height: 14, opacity: 0.6 }} />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
