'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard, Leaf, Bug, Droplets, Cloud, Sprout,
  Bell, Map, BarChart3, Brain, Settings,
  Sun, Moon, Wheat, ShoppingCart, DollarSign, FileText, Radio,
  ChevronLeft, ChevronRight, LogOut
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/crop-health', label: 'Crop Health', icon: Leaf },
  { href: '/dashboard/disease', label: 'Disease Scanner', icon: Bug },
  { href: '/dashboard/pest', label: 'Pest Risk', icon: Bug },
  { href: '/dashboard/soil', label: 'Soil Analysis', icon: Sprout },
  { href: '/dashboard/water', label: 'Water Manage', icon: Droplets },
  { href: '/dashboard/irrigation', label: 'Irrigation Control', icon: Droplets },
  { href: '/dashboard/weather', label: 'Weather Intel', icon: Cloud },
  { href: '/dashboard/fertilizer', label: 'Fertilizer Advisor', icon: Wheat },
  { href: '/dashboard/harvest', label: 'Harvest Predict', icon: BarChart3 },
  { href: '/dashboard/market', label: 'Market Prices', icon: ShoppingCart },
  { href: '/dashboard/profit', label: 'Profit Analysis', icon: DollarSign },
  { href: '/dashboard/sensors', label: 'IoT Sensors', icon: Radio },
  { href: '/dashboard/map', label: 'Farm Map', icon: Map },
  { href: '/dashboard/alerts', label: 'Alert Center', icon: Bell },
  { href: '/dashboard/assistant', label: 'AI Assistant', icon: Brain },
  { href: '/dashboard/reports', label: 'Reports Gen', icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const handleLogout = () => {
    auth.logout();
    api.clearToken();
    toast.success('Logged out successfully');
    router.replace('/login');
  };

  useEffect(() => {
    setMounted(true);
    setCurrentUser(auth.getUser());
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved) setIsCollapsed(JSON.parse(saved));
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', JSON.stringify(next));
      return next;
    });
  };

  if (!mounted) return null;

  return (
    <aside className={`sidebar${isCollapsed ? ' collapsed' : ''}`}>
      {/* Top Brand Header */}
      <div>
        <div className="sidebar-brand">
          <Link href="/dashboard" className="sidebar-brand-link">
            <div className="sidebar-logo">
              <Leaf style={{ width: 20, height: 20 }} />
            </div>
            {!isCollapsed && (
              <div className="sidebar-brand-text">
                <span className="sidebar-brand-name">AgriMind AI</span>
                <span className="sidebar-brand-tagline">Farming SaaS</span>
              </div>
            )}
          </Link>
          {!isCollapsed && (
            <button onClick={toggleSidebar} className="sidebar-collapse-btn" aria-label="Collapse sidebar">
              <ChevronLeft style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (pathname.startsWith(href) && href !== '/dashboard');
            return (
              <Link
                key={href}
                href={href}
                className={`sidebar-nav-link${isActive ? ' active' : ''}`}
                title={isCollapsed ? label : undefined}
              >
                <Icon className="sidebar-nav-link-icon" style={{ width: 20, height: 20 }} />
                {!isCollapsed && (
                  <span className="sidebar-nav-label">{label}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        {/* Logged in User Pill */}
        {!isCollapsed && currentUser && (
          <div style={{
            padding: '8px 10px',
            marginBottom: '6px',
            background: 'rgba(22, 163, 74, 0.08)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(22, 163, 74, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <div style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #16a34a, #22c55e)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 800,
              flexShrink: 0,
            }}>
              {(currentUser.name || 'F').slice(0, 2).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden', lineHeight: 1.2 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                {currentUser.name || 'Farmer'}
              </p>
              <p style={{ fontSize: 9, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '2px 0 0' }}>
                {currentUser.role || 'farmer'}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="sidebar-footer-btn"
          title={isCollapsed ? 'Toggle Theme' : undefined}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {theme === 'dark' ? (
              <Sun style={{ width: 18, height: 18, color: '#fbbf24', flexShrink: 0 }} />
            ) : (
              <Moon style={{ width: 18, height: 18, color: '#6366f1', flexShrink: 0 }} />
            )}
            {!isCollapsed && <span style={{ fontSize: 13 }}>Theme Mode</span>}
          </div>
          {!isCollapsed && (
            <span style={{ fontSize: 10, color: 'var(--text-faint)', fontWeight: 500, textTransform: 'capitalize' }}>
              {theme}
            </span>
          )}
        </button>

        <Link
          href="/dashboard/settings"
          className={`sidebar-footer-btn${pathname === '/dashboard/settings' ? ' active' : ''}`}
          title={isCollapsed ? 'Settings' : undefined}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Settings style={{ width: 18, height: 18, flexShrink: 0 }} />
            {!isCollapsed && <span style={{ fontSize: 13 }}>Settings</span>}
          </div>
        </Link>

        <button
          onClick={handleLogout}
          className="sidebar-footer-btn"
          title={isCollapsed ? 'Logout' : undefined}
          style={{ color: 'var(--red-500)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <LogOut style={{ width: 18, height: 18, flexShrink: 0, color: 'var(--red-500)' }} />
            {!isCollapsed && <span style={{ fontSize: 13, color: 'var(--red-500)' }}>Logout</span>}
          </div>
        </button>

        {isCollapsed && (
          <button
            onClick={toggleSidebar}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '10px', borderRadius: 'var(--radius-md)', color: 'var(--text-faint)',
              background: 'none', border: 'none', cursor: 'pointer', transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-muted)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            aria-label="Expand sidebar"
          >
            <ChevronRight style={{ width: 18, height: 18 }} />
          </button>
        )}
      </div>
    </aside>
  );
}
