'use client';

import { useState } from 'react';
import { Bell, Search, User, LogOut, ChevronDown, Settings } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Header({ title }: { title: string }) {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const paths = pathname.split('/').filter(Boolean);

  const mockNotifications = [
    { id: 1, text: 'Medium Pest Risk: Brown Planthopper detected', type: 'warning', time: '2h ago' },
    { id: 2, text: 'Irrigation scheduled: Tomorrow 6:00 AM', type: 'info', time: '4h ago' },
    { id: 3, text: 'Crop Health Index: Score improved to 82.5', type: 'success', time: '1d ago' },
  ];

  return (
    <header className="header">
      {/* Breadcrumbs / Page Title */}
      <div className="header-breadcrumb">
        <div className="header-breadcrumb-path">
          <span>AgriMind</span>
          {paths.map((p, idx) => (
            <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>/</span>
              <span className={idx === paths.length - 1 ? 'header-breadcrumb-active' : ''}>
                {p.replace(/-/g, ' ')}
              </span>
            </span>
          ))}
        </div>
        <h2 className="header-title">{title}</h2>
      </div>

      {/* Action Controls */}
      <div className="header-actions">
        {/* Search */}
        <div className="header-search">
          <Search className="header-search-icon" style={{ width: 15, height: 15 }} />
          <input
            type="text"
            placeholder="Quick search... (Press '/')"
            className="header-search-input"
          />
          <kbd className="header-search-kbd">/</kbd>
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setNotifDropdownOpen(!notifDropdownOpen); setDropdownOpen(false); }}
            className="header-icon-btn"
            aria-label="Notifications"
          >
            <Bell style={{ width: 18, height: 18 }} />
            <span className="header-notif-dot pulse-indicator" />
          </button>

          {notifDropdownOpen && (
            <>
              <div className="dropdown-backdrop" onClick={() => setNotifDropdownOpen(false)} />
              <div className="dropdown notif-dropdown" style={{ right: 0 }}>
                <div className="notif-header">
                  <span className="notif-header-title">Recent Farm Alerts</span>
                  <span className="notif-header-action">Mark all read</span>
                </div>
                {mockNotifications.map(n => (
                  <div key={n.id} className="notif-item">
                    <div className={`notif-dot ${n.type}`} />
                    <div>
                      <p className="notif-text">{n.text}</p>
                      <p className="notif-time">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* User Profile */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => { setDropdownOpen(!dropdownOpen); setNotifDropdownOpen(false); }}
            className="header-user"
          >
            <div className="header-avatar">
              <User style={{ width: 16, height: 16 }} />
            </div>
            <span className="header-user-name">Rajesh Kumar</span>
            <ChevronDown style={{ width: 14, height: 14, color: 'var(--text-faint)' }} />
          </div>

          {dropdownOpen && (
            <>
              <div className="dropdown-backdrop" onClick={() => setDropdownOpen(false)} />
              <div className="dropdown" style={{ minWidth: 200 }}>
                <div className="dropdown-header">
                  <p className="dropdown-header-name">Rajesh Kumar</p>
                  <p className="dropdown-header-email">farmer@agrimind.ai</p>
                </div>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="dropdown-item"
                >
                  <Settings style={{ width: 15, height: 15, color: 'var(--text-faint)' }} />
                  Settings
                </Link>
                <div className="dropdown-divider" />
                <a
                  href="/login"
                  onClick={() => {
                    setDropdownOpen(false);
                    if (typeof window !== 'undefined') localStorage.removeItem('token');
                  }}
                  className="dropdown-item danger"
                >
                  <LogOut style={{ width: 15, height: 15 }} />
                  Sign Out
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
