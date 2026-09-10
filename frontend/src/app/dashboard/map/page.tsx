'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import dynamic from 'next/dynamic';
import { MapPin, Radio, Sprout, Layers, Loader2, Map as MapIcon, LocateFixed, AlertCircle } from 'lucide-react';
import { useFarmField } from '@/context/FarmFieldContext';
import toast from 'react-hot-toast';

// Load FarmMap client-side only (Leaflet requires browser APIs)
const FarmMap = dynamic(() => import('@/components/FarmMap'), {
  ssr: false,
  loading: () => (
    <div className="map-loading">
      <div style={{ textAlign: 'center' }}>
        <Loader2 style={{ width: 36, height: 36, color: 'var(--green-600)', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ fontSize: 13, color: 'var(--text-faint)', fontWeight: 600 }}>Initializing GIS Overlays...</p>
      </div>
    </div>
  ),
});

export default function MapPage() {
  const { selectedFarm, selectedField, activeCycle } = useFarmField();

  // GPS / geolocation state
  const [gpsLat, setGpsLat]             = useState<number | null>(null);
  const [gpsLng, setGpsLng]             = useState<number | null>(null);
  const [gpsLoading, setGpsLoading]     = useState(false);
  const [gpsError, setGpsError]         = useState('');
  const [useGps, setUseGps]             = useState(false);

  // Determine display coordinates:
  // Priority → GPS (if enabled) → farm lat/lng → Ludhiana default
  const centerLat = useGps && gpsLat != null ? gpsLat  : (selectedFarm?.latitude  ?? 30.9010);
  const centerLng = useGps && gpsLng != null ? gpsLng  : (selectedFarm?.longitude ?? 75.8573);

  const farmName    = selectedFarm?.name ?? 'Green Valley Farm';
  const fieldName   = selectedField?.name ?? 'Field A';
  const healthScore = activeCycle?.health_score ?? 82.5;
  const areaAcres   = selectedField?.area_acres ?? 4.2;
  const state       = selectedFarm?.state ?? 'Punjab';

  // Auto-request GPS on mount (non-blocking — only if permission is already granted)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.permissions?.query({ name: 'geolocation' }).then(status => {
      if (status.state === 'granted') fetchGPS();
    });
  }, []);

  const fetchGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    setGpsError('');
    const tid = toast.loading('Fetching your current location...');

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setGpsLat(coords.latitude);
        setGpsLng(coords.longitude);
        setUseGps(true);
        setGpsLoading(false);
        toast.success(
          `Location acquired: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
          { id: tid }
        );
      },
      (err) => {
        setGpsLoading(false);
        setUseGps(false);
        const msg =
          err.code === 1 ? 'Location access denied. Please allow location in browser settings.' :
          err.code === 2 ? 'Location unavailable. Check your device GPS.' :
          'Location request timed out. Try again.';
        setGpsError(msg);
        toast.error(msg, { id: tid });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const clearGPS = () => {
    setUseGps(false);
    setGpsLat(null);
    setGpsLng(null);
    setGpsError('');
    toast('Reverted to farm coordinates', { icon: '📍' });
  };

  return (
    <div className="dashboard-page">
      <Header title="GIS Farm Boundaries" />

      <main className="dashboard-main">
        {/* Info stats bar */}
        <div className="three-col-grid">
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="stat-card-icon green" style={{ padding: 12 }}>
              <MapPin style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <p className="stat-card-label">Farm Location</p>
              <p className="stat-card-value" style={{ fontSize: 18 }}>{farmName}</p>
              <p className="stat-card-subtitle">{state}, India</p>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="stat-card-icon blue" style={{ padding: 12 }}>
              <Sprout style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <p className="stat-card-label">Active Field</p>
              <p className="stat-card-value" style={{ fontSize: 18, color: 'var(--green-600)' }}>
                Health: {healthScore.toFixed(1)}%
              </p>
              <p className="stat-card-subtitle">
                {areaAcres} Acres · {activeCycle ? `${activeCycle.crop_name} (${activeCycle.growth_stage})` : 'No Active Crop'}
              </p>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="stat-card-icon purple" style={{ padding: 12 }}>
              <Radio style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <p className="stat-card-label">IoT Sensor Nodes</p>
              <p className="stat-card-value" style={{ fontSize: 18 }}>4 Devices</p>
              <p className="stat-card-subtitle">NPK · pH · Moisture · Rain</p>
            </div>
          </div>
        </div>

        {/* GPS error */}
        {gpsError && (
          <div className="banner warning" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
            {gpsError}
          </div>
        )}

        {/* Map container */}
        <div className="card animate-fade-in-up" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
          {/* Map header bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000,
            background: 'linear-gradient(to bottom, rgba(15,23,42,0.88), transparent)',
            padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          }}>
            <MapIcon style={{ width: 18, height: 18, color: '#4ade80' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>
              {useGps ? 'Your Current Location' : `${farmName} — Farm GIS View`}
            </span>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
              {/* GPS toggle button */}
              {useGps ? (
                <button
                  onClick={clearGPS}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(251,191,36,0.4)',
                    background: 'rgba(251,191,36,0.15)', color: '#fbbf24',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  <LocateFixed style={{ width: 13, height: 13 }} />
                  GPS Active — Revert to Farm
                </button>
              ) : (
                <button
                  onClick={fetchGPS}
                  disabled={gpsLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(74,222,128,0.4)',
                    background: 'rgba(22,163,74,0.2)', color: '#4ade80',
                    fontSize: 11, fontWeight: 700, cursor: gpsLoading ? 'not-allowed' : 'pointer',
                    opacity: gpsLoading ? 0.7 : 1, transition: 'all 0.2s',
                  }}
                >
                  {gpsLoading
                    ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />
                    : <LocateFixed style={{ width: 13, height: 13 }} />
                  }
                  {gpsLoading ? 'Locating...' : 'Use My Location'}
                </button>
              )}

              <div className="live-badge" style={{ background: 'rgba(22,163,74,0.2)', border: '1px solid rgba(22,163,74,0.4)' }}>
                <div className="live-dot" />
                OSM / Satellite
              </div>
            </div>
          </div>

          <div style={{ height: 520 }}>
            <FarmMap
              centerLat={centerLat}
              centerLng={centerLng}
              farmName={useGps ? 'Your Location' : farmName}
              fieldName={fieldName}
              healthScore={healthScore}
              areaAcres={areaAcres}
              state={state}
            />
          </div>

          {/* Map legend footer */}
          <div style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border-primary)',
            display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center',
            background: 'var(--bg-card)',
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Map Legend
            </span>
            {[
              { color: '#16a34a', label: 'Farm / GPS marker' },
              { color: '#16a34a', label: 'Field boundary (health-colored)', opacity: 0.4 },
              { color: '#2563eb', label: 'IoT sensor nodes' },
            ].map(({ color, label, opacity }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 12, height: 12, borderRadius: '50%', background: color,
                  opacity: opacity ?? 1, border: '2px solid white',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
              </div>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Layers style={{ width: 14, height: 14, color: 'var(--text-faint)' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: useGps ? 'var(--green-600)' : 'var(--text-faint)' }}>
                {useGps ? '📍 GPS' : '🏠 Farm'}: {centerLat.toFixed(4)}, {centerLng.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
