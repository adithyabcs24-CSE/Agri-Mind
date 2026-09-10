'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import FarmFieldSelector from '@/components/FarmFieldSelector';
import {
  ShoppingCart, TrendingUp, MapPin, AlertTriangle, RefreshCw,
  Loader2, DollarSign, Sprout, TrendingDown, CheckCircle2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { api } from '@/lib/api';
import { useFarmField } from '@/context/FarmFieldContext';
import toast from 'react-hot-toast';

// ---------- Static demo data (always shown as baseline) ----------
const DEMO_PRICE_HISTORY = [
  { week: 'W1', Price: 2180, MSP: 2183 },
  { week: 'W2', Price: 2260, MSP: 2183 },
  { week: 'W3', Price: 2340, MSP: 2183 },
  { week: 'W4', Price: 2430, MSP: 2183 },
  { week: 'W5', Price: 2510, MSP: 2183 },
  { week: 'W6', Price: 2450, MSP: 2183 },
  { week: 'W7 (est)', Price: 2680, MSP: 2183 },
];

const DEMO_MARKETS = [
  { name: 'Ludhiana APMC Mandi', price: 2450, distance: 12, transport: 800,  netPrice: 2438, profit: 102700, tag: 'Best Option' },
  { name: 'Punjab eNAM Mandi',    price: 2420, distance: 25, transport: 1500, netPrice: 2414, profit: 101350, tag: '' },
  { name: 'Amritsar Wholesale',   price: 2380, distance: 38, transport: 2200, netPrice: 2372, profit: 98500,  tag: '' },
  { name: 'Delhi NCR Terminal',   price: 2600, distance: 320, transport: 9800, netPrice: 2428, profit: 101800, tag: 'Highest MSP' },
];

const DEMO_CROPS = [
  { name: 'Paddy (Rice)',      msp: 2183,  current: 2450,  predicted: 2680,  trend: 9.4  },
  { name: 'Wheat',             msp: 2275,  current: 2380,  predicted: 2410,  trend: 1.3  },
  { name: 'Maize',             msp: 1962,  current: 2100,  predicted: 1980,  trend: -5.7 },
  { name: 'Cotton (Kapas)',    msp: 6620,  current: 6900,  predicted: 7200,  trend: 4.3  },
  { name: 'Arecanut (Supari)', msp: 22000, current: 48500, predicted: 52000, trend: 7.2  },
];

// Arecanut-specific mandi outlets (Mangaluru, Kerala, Karnataka belt)
const ARECANUT_MARKETS = [
  { name: 'Mangaluru APMC Mandi',   price: 48500, distance: 18,  transport: 1200,  netPrice: 48490, profit: 388000, tag: 'Best Option'  },
  { name: 'Sirsi Arecanut Market',  price: 47200, distance: 42,  transport: 2800,  netPrice: 47186, profit: 374000, tag: ''             },
  { name: 'Shivamogga APMC',        price: 46800, distance: 95,  transport: 5500,  netPrice: 46745, profit: 368000, tag: ''             },
  { name: 'Kannur (Kerala) eNAM',   price: 49000, distance: 180, transport: 9000,  netPrice: 48955, profit: 382000, tag: 'Highest Rate' },
];

export default function MarketPage() {
  const { selectedFarm, selectedField, activeCycle, isOffline } = useFarmField();

  const [loading, setLoading] = useState(false);
  const [rec, setRec]         = useState<any>(null);
  const [history, setHistory] = useState(DEMO_PRICE_HISTORY);
  const [markets, setMarkets] = useState(DEMO_MARKETS);
  const [selectedCrop, setSelectedCrop] = useState(DEMO_CROPS[0]);
  const [error, setError]     = useState('');

  // ---------- Load live data when there's an active cycle ----------
  const loadMarketIntelligence = async () => {
    setLoading(true);
    setError('');
    const tid = toast.loading('Querying eNAM & APMC mandi price indices...');

    try {
      if (!activeCycle?.id) throw new Error('No active crop cycle — showing demo data.');

      const [recData, priceData] = await Promise.all([
        api.getSellRecommendation(activeCycle.id),
        api.getMarketPrices(activeCycle.crop_type_id, selectedFarm?.state || 'Punjab'),
      ]);

      setRec(recData);
      if (priceData?.history)
        setHistory(priceData.history.map((h: any, i: number) => ({ week: `W${i + 1}`, Price: h.price, MSP: 2183 })));
      if (priceData?.markets) setMarkets(priceData.markets);
      toast.success('Market data synced!', { id: tid });
    } catch (err: any) {
      console.warn('Market API fallback:', err.message);

      // Build a mock rec from the selected crop demo data
      setRec({
        action: 'wait',
        recommendation_text: `Prices expected to rise ${selectedCrop.trend > 0 ? selectedCrop.trend.toFixed(1) + '%' : 'slightly'} next week due to seasonal demand. Monitor eNAM mandi portal daily.`,
        current_price: selectedCrop.current,
        predicted_price: selectedCrop.predicted,
        msp: selectedCrop.msp,
        best_market: DEMO_MARKETS[0].name,
      });
      toast.success('Demo market data loaded', { id: tid });
    } finally {
      setLoading(false);
    }
  };

  // Load whenever field/cycle changes
  useEffect(() => { loadMarketIntelligence(); }, [activeCycle?.id, selectedCrop]);

  // Update selected crop data
  const handleCropChange = (c: typeof DEMO_CROPS[0]) => {
    setSelectedCrop(c);
    const isAreacanut = c.name.toLowerCase().includes('arecanut');

    // Scale weekly history to the crop's price range
    setHistory(DEMO_PRICE_HISTORY.map((d, i) => ({
      week: d.week,
      Price: Math.round(c.current * (0.88 + i * 0.022)),
      MSP: c.msp,
    })));

    // Use crop-appropriate mandi outlets
    const baseMarkets = isAreacanut ? ARECANUT_MARKETS : DEMO_MARKETS;
    setMarkets(baseMarkets.map(m => ({
      ...m,
      profit: Math.round(c.current * 8 - m.transport),   // 8 quintals avg lot size
    })));
  };


  const trendPositive = (rec?.predicted_price ?? selectedCrop.predicted) > (rec?.current_price ?? selectedCrop.current);

  return (
    <div className="dashboard-page">
      <Header title="Market Intelligence" />

      <main className="dashboard-main">
        {/* Selection bar */}
        <div className="card selection-bar animate-fade-in-up">
          <FarmFieldSelector />
          <div className="status-badge online">
            <Sprout style={{ width: 14, height: 14 }} />
            Crop:{' '}
            <strong style={{ marginLeft: 4 }}>
              {activeCycle ? activeCycle.crop_name : selectedCrop.name}
            </strong>
          </div>
        </div>

        {error && (
          <div className="banner warning">
            <AlertTriangle style={{ width: 16, height: 16, flexShrink: 0 }} />
            {error} — Showing demo market data below.
          </div>
        )}

        {/* Crop selector tabs (always visible) */}
        <div className="card animate-fade-in-up">
          <p className="stat-card-label" style={{ marginBottom: 12 }}>Browse Crop Price Indices</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {DEMO_CROPS.map(c => (
              <button
                key={c.name}
                onClick={() => handleCropChange(c)}
                className={`chip${selectedCrop.name === c.name ? ' active' : ''}`}
                style={{
                  padding: '8px 18px', cursor: 'pointer', fontWeight: 600,
                  background: selectedCrop.name === c.name
                    ? 'linear-gradient(135deg, var(--green-600), var(--green-500))'
                    : 'var(--bg-muted)',
                  color: selectedCrop.name === c.name ? 'white' : 'var(--text-secondary)',
                  border: selectedCrop.name === c.name ? 'none' : '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 12, transition: 'all var(--transition-fast)',
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-screen">
            <Loader2 style={{ width: 36, height: 36, color: 'var(--green-600)', animation: 'spin 1s linear infinite' }} />
            <p className="loading-text">Re-calculating mandi profit thresholds...</p>
          </div>
        ) : (
          <>
            {/* AI Recommendation banner */}
            {rec && (
              <div className="market-rec-banner animate-fade-in-up">
                <div>
                  <span className="market-rec-tag">
                    {trendPositive ? <TrendingUp style={{ width: 12, height: 12 }} /> : <TrendingDown style={{ width: 12, height: 12 }} />}
                    AI Mandi Recommendation
                  </span>
                  <h3 className="market-rec-title">
                    Decision: {rec.action?.toUpperCase() || 'WAIT'}
                  </h3>
                  <p className="market-rec-text">{rec.recommendation_text}</p>
                </div>
                <button
                  onClick={loadMarketIntelligence}
                  className="btn btn-primary btn-sm"
                  style={{ alignSelf: 'flex-start', flexShrink: 0 }}
                >
                  <RefreshCw style={{ width: 14, height: 14 }} />
                  Re-check Mandi
                </button>
              </div>
            )}

            {/* Quick stats */}
            <div className="stats-grid">
              <StatCard
                title="Current Mandi Price"
                value={`₹${rec?.current_price ?? selectedCrop.current}`}
                subtitle="Per quintal — live eNAM index"
                icon={ShoppingCart}
                color="green"
              />
              <StatCard
                title="Predicted Next-Week Price"
                value={`₹${rec?.predicted_price ?? selectedCrop.predicted}`}
                subtitle="AI price forecast model"
                icon={TrendingUp}
                color="blue"
                trend={{ value: selectedCrop.trend, label: 'vs current week' }}
              />
              <StatCard
                title="Government MSP"
                value={`₹${rec?.msp ?? selectedCrop.msp}`}
                subtitle="Minimum Support Price (GOI)"
                icon={DollarSign}
                color="amber"
              />
              <StatCard
                title="Best Mandi Outlet"
                value={rec?.best_market ?? DEMO_MARKETS[0].name}
                subtitle="Recommended by AI routing"
                icon={MapPin}
                color="purple"
              />
            </div>

            {/* Charts & Mandi Table */}
            <div className="charts-grid">
              {/* Price Trajectory Chart */}
              <div className="card animate-fade-in-up">
                <div className="section-header" style={{ marginBottom: 20 }}>
                  <h3 className="section-title">
                    <TrendingUp style={{ width: 18, height: 18, color: 'var(--green-600)' }} />
                    7-Week Mandi Price Trajectory
                  </h3>
                  <span className="section-subtitle">{selectedCrop.name}</span>
                </div>

                <ResponsiveContainer width="100%" height={270}>
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.12)" />
                    <XAxis dataKey="week" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis
                      domain={['dataMin - 100', 'dataMax + 100']}
                      stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false}
                      tickFormatter={v => `₹${v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a', border: '1px solid rgba(30,41,59,0.8)',
                        borderRadius: 12, color: '#f8fafc', fontSize: 12,
                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                      }}
                      formatter={(val: any) => [`₹${val}`, '']}
                    />
                    {/* MSP reference line */}
                    <ReferenceLine
                      y={selectedCrop.msp}
                      stroke="#f59e0b"
                      strokeDasharray="6 4"
                      label={{ value: 'MSP', fill: '#f59e0b', fontSize: 11, fontWeight: 700 }}
                    />
                    <Area
                      type="monotone" dataKey="Price"
                      stroke="#16a34a" fill="url(#priceGrad)" strokeWidth={2.5}
                      dot={{ r: 3, fill: '#16a34a', strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>

                <div style={{ display: 'flex', gap: 20, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-primary)' }}>
                  {[
                    { color: '#16a34a', label: 'Mandi Price' },
                    { color: '#f59e0b', label: 'Government MSP', dashed: true },
                  ].map(({ color, label, dashed }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 24, height: 2,
                        borderRadius: 2,
                        borderTop: dashed ? `2px dashed ${color}` : undefined,
                        borderBottom: dashed ? `2px dashed ${color}` : undefined,
                        background: dashed ? 'transparent' : color,
                      }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mandi Outlet Comparison */}
              <div className="card animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 className="section-title">
                  <MapPin style={{ width: 18, height: 18, color: 'var(--amber-500)' }} />
                  Mandi Outlet Comparison
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {markets.map((m, i) => (
                    <div
                      key={i}
                      className="mandi-row"
                      style={{
                        background: i === 0 ? 'rgba(22,163,74,0.06)' : 'var(--bg-muted)',
                        border: i === 0 ? '1px solid rgba(22,163,74,0.25)' : '1px solid var(--border-primary)',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <p style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)' }}>{m.name}</p>
                          {(m.tag || i === 0) && (
                            <span style={{
                              fontSize: 9, fontWeight: 700, padding: '2px 8px',
                              borderRadius: 'var(--radius-full)', textTransform: 'uppercase',
                              background: i === 0 ? 'rgba(22,163,74,0.15)' : 'rgba(245,158,11,0.15)',
                              color: i === 0 ? 'var(--green-600)' : 'var(--amber-600)',
                              letterSpacing: '0.08em',
                            }}>
                              {m.tag || 'Best Option'}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 10, color: 'var(--text-faint)', fontWeight: 600 }}>
                          {m.distance} km away · Transport: ₹{m.transport.toLocaleString()}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>
                          ₹{m.price}/q
                        </p>
                        <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--green-600)', marginTop: 2 }}>
                          Est. ₹{m.profit.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Best deal summary */}
                <div className="info-box" style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <CheckCircle2 style={{ width: 16, height: 16, color: 'var(--green-600)', flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <strong>{DEMO_MARKETS[0].name}</strong> offers the best net profit after transport costs.
                    Consider timing your sale during peak festival season for maximum returns.
                  </p>
                </div>
              </div>
            </div>

            {/* eNAM Info bar */}
            <div className="card animate-fade-in-up" style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
              <div>
                <p className="stat-card-label">Data Source</p>
                <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginTop: 4 }}>
                  eNAM · AGMARKNET · APMC Punjab · GOI MSP Portal
                </p>
              </div>
              <div style={{ width: 1, height: 40, background: 'var(--border-primary)' }} />
              <div>
                <p className="stat-card-label">Last Synced</p>
                <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--green-600)', marginTop: 4 }}>
                  {new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div style={{ width: 1, height: 40, background: 'var(--border-primary)' }} />
              <div>
                <p className="stat-card-label">Season</p>
                <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginTop: 4 }}>
                  Kharif 2025–26
                </p>
              </div>
              <button
                onClick={loadMarketIntelligence}
                className="btn btn-secondary btn-sm"
                style={{ marginLeft: 'auto' }}
              >
                <RefreshCw style={{ width: 14, height: 14 }} />
                Refresh Prices
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
