'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import FarmFieldSelector from '@/components/FarmFieldSelector';
import { Sprout, Compass, HelpCircle, CheckCircle, AlertTriangle, Loader2, Calendar, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { useFarmField } from '@/context/FarmFieldContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function FertilizerPage() {
  const { farms, fields, selectedFarmId, selectedFieldId, activeCycle } = useFarmField();

  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [error, setError] = useState('');

  const loadFertilizerRecommendation = async (fieldId: string) => {
    setLoading(true);
    setError('');
    setRecommendation(null);
    const loadingToast = toast.loading('Modeling crop nutrient absorption rates...');

    try {
      if (!activeCycle || !activeCycle.id) throw new Error('No active crop cycle found for this field.');
      const data = await api.getFertilizerRecommendation(activeCycle.id);
      setRecommendation(data);
      toast.success('Nutrient plan loaded!', { id: loadingToast });
    } catch (err: any) {
      console.warn('API error, using mock fertilizer fallback:', err);
      setError(err.message || 'Failed to retrieve fertilizer recommendation.');
      const mockRec = {
        npk_requirement: { N: 60, P: 30, K: 40 },
        application: {
          timing: 'Basal application at transplanting (Day 0), followed by top-dressing in 2 splits (Day 25, Day 55)',
          quantity_per_acre: {
            'Urea': '120 kg',
            'Single Super Phosphate (SSP)': '150 kg',
            'Muriate of Potash (MOP)': '60 kg',
          },
        },
        organic_alternatives: [
          'Apply decomposed farmyard manure (FYM) @ 4 tonnes/acre during field preparation',
          'Deploy Azospirillum bio-fertilizer cultures to enhance organic nitrogen absorption',
        ],
        micronutrients: ['Zinc Sulphate', 'Boron', 'Iron Chelates'],
      };
      setRecommendation(mockRec);
      toast.success('Generated demo fertilizer recommendations (Fallback Active)', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedFieldId && activeCycle) {
      loadFertilizerRecommendation(selectedFieldId);
    } else {
      setRecommendation(null);
      if (selectedFieldId && !activeCycle) {
        setError('No active crop cycle found for this field. Fertilizer advice requires an active crop cycle.');
      }
    }
  }, [selectedFieldId, activeCycle]);

  return (
    <div className="dashboard-page">
      <Header title="Fertilizer Advisor" />

      <main className="dashboard-main">
        {/* Field Selector */}
        <div className="card selection-bar animate-fade-in-up">
          <FarmFieldSelector />
          <div className="status-badge online">
            <Sprout style={{ width: 14, height: 14 }} />
            Active Cycle:{' '}
            <strong style={{ marginLeft: 4 }}>
              {activeCycle ? `${activeCycle.crop_name} (${activeCycle.growth_stage})` : 'None'}
            </strong>
          </div>
        </div>

        {farms.length === 0 ? (
          <div className="empty-state">
            <AlertTriangle style={{ width: 48, height: 48, color: 'var(--red-500)' }} className="empty-state-icon" />
            <h3 className="empty-state-title">No Farms Available</h3>
            <p className="empty-state-text">Please register a farm to run nutrient modeling plans.</p>
            <Link href="/dashboard/settings" className="btn btn-primary">
              <Plus style={{ width: 16, height: 16 }} /> Create New Farm
            </Link>
          </div>
        ) : !selectedFarmId ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>Please select a farm to continue.</div>
        ) : fields.length === 0 ? (
          <div className="empty-state">
            <AlertTriangle style={{ width: 48, height: 48, color: 'var(--amber-500)' }} className="empty-state-icon" />
            <h3 className="empty-state-title">No Fields Found</h3>
            <p className="empty-state-text">Please add a field to compute fertilizer dosage schedules.</p>
            <Link href="/dashboard/settings" className="btn btn-primary">
              <Plus style={{ width: 16, height: 16 }} /> Create New Field
            </Link>
          </div>
        ) : !selectedFieldId ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px', border: '2px dashed var(--border-primary)', color: 'var(--text-muted)' }}>
            Select a field with an active crop cycle to formulate fertilizer recommendations.
          </div>
        ) : (
          <>
            {error && (
              <div className="banner warning">
                <AlertTriangle style={{ width: 16, height: 16, flexShrink: 0 }} />
                {error}
              </div>
            )}

            {loading ? (
              <div className="loading-screen">
                <Loader2 style={{ width: 40, height: 40, color: 'var(--green-600)', animation: 'spin 1s linear infinite' }} />
                <p className="loading-text">Formulating synthetic/organic nutrient ratios...</p>
              </div>
            ) : recommendation ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Overview cards */}
                <div className="three-col-grid">
                  <StatCard
                    title="Target N-P-K Ratio"
                    value={`${recommendation.npk_requirement.N}-${recommendation.npk_requirement.P}-${recommendation.npk_requirement.K}`}
                    subtitle="Prescribed base elements (kg/acre)"
                    icon={Sprout}
                    color="green"
                  />
                  <StatCard
                    title="Commercial Nitrogen (Urea)"
                    value={recommendation.application.quantity_per_acre['Urea'] || '130 kg'}
                    subtitle="Primary vegetative promoter"
                    icon={Compass}
                    color="blue"
                  />
                  <StatCard
                    title="Root Phosphate (SSP/DAP)"
                    value={recommendation.application.quantity_per_acre['Single Super Phosphate (SSP)'] || '130 kg'}
                    subtitle="Essential cell division input"
                    icon={HelpCircle}
                    color="purple"
                  />
                </div>

                <div className="two-col-grid">
                  {/* Application Details */}
                  <div className="card">
                    <h3 className="section-title" style={{ marginBottom: 16 }}>
                      <Calendar style={{ width: 20, height: 20, color: 'var(--green-600)' }} />
                      Fertilizer Dosage & Schedules
                    </h3>

                    <div style={{ padding: 16, background: 'var(--bg-muted)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)' }}>
                      <div style={{ marginBottom: 16 }}>
                        <span className="form-label" style={{ display: 'block', marginBottom: 6 }}>Application Timeline</span>
                        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          {recommendation.application.timing}
                        </p>
                      </div>

                      <div>
                        <span className="form-label" style={{ display: 'block', marginBottom: 10 }}>Prescribed Dosage Weight</span>
                        {Object.entries(recommendation.application.quantity_per_acre).map(([name, qty]: any) => (
                          <div key={name} className="data-table-row">
                            <span className="data-table-key">{name}</span>
                            <span className="data-table-val">{qty}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Organic & Micronutrients */}
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div>
                      <h3 className="section-title" style={{ marginBottom: 12 }}>
                        <CheckCircle style={{ width: 20, height: 20, color: 'var(--green-600)' }} />
                        Organic Equivalents
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {recommendation.organic_alternatives.map((alt: string, i: number) => (
                          <div key={i} style={{
                            padding: '14px 16px', background: 'rgba(22,163,74,0.05)',
                            border: '1px solid rgba(22,163,74,0.1)', borderRadius: 'var(--radius-lg)',
                            fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1.6,
                          }}>
                            {alt}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="section-title" style={{ marginBottom: 12 }}>Secondary Micronutrients</h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {recommendation.micronutrients.map((micro: string) => (
                          <span key={micro} className="chip">{micro}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--text-faint)' }}>
                No active fertilizer diagnostics plan.
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
