'use client';

import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: 'green' | 'blue' | 'amber' | 'red' | 'purple';
}

export default function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'green' }: StatCardProps) {
  return (
    <div className="stat-card">
      {/* Background Glow */}
      <div className={`stat-card-glow ${color}`} />

      <div className="stat-card-header">
        <p className="stat-card-label">{title}</p>
        <div className={`stat-card-icon ${color}`}>
          <Icon style={{ width: 20, height: 20 }} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <p className="stat-card-value">{value}</p>
        {trend && (
          <span className={`trend-badge ${trend.value >= 0 ? 'positive' : 'negative'}`}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      {subtitle && <p className="stat-card-subtitle">{subtitle}</p>}
      {trend && (
        <span style={{ fontSize: 10, color: 'var(--text-faint)', fontWeight: 500, display: 'block', marginTop: 4 }}>
          {trend.label}
        </span>
      )}
    </div>
  );
}
