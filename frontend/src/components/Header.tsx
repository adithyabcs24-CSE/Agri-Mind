'use client';

import { useState, useEffect } from 'react';
import { Bell, Search, User, LogOut, ChevronDown, Settings, Shield } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth, AuthUser } from '@/lib/auth';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function Header({ title }: { title: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    // 1. Initial sync from local storage
    const local = auth.getUser();
    if (local) {
      setCurrentUser(local);
    }

    // 2. Fetch fresh details from backend database if token is available
    if (auth.isAuthenticated() && !auth.isDemo()) {
      api.getMe()
        .then((me) => {
          if (me) {
            const updated: AuthUser = {
              id: String(me.id || local?.id || '1'),
              name: me.full_name || me.name || local?.name || 'Farmer',
              email: me.email || local?.email || 'farmer@agrimind.ai',
              role: (me.role || local?.role || 'farmer') as any,
            };
            setCurrentUser(updated);
            auth.setAuth(auth.getToken() || '', updated);
          }
        })
        .catch(() => {
          // Backend offline or fallback to local
        });
    }
  }, []);

  const handleSignOut = (e: React.MouseEvent) => {
    e.preventDefault();
    setDropdownOpen(false);
    auth.logout();
    api.clearToken();
    toast.success('Logged out successfully');
    router.replace('/login');
  };

  const paths = pathname.split('/').filter(Boolean);

  const displayName = currentUser?.name || 'Farmer';
  const displayEmail = currentUser?.email || 'farmer@agrimind.ai';
  const displayRole = currentUser?.role || 'farmer';
  const userInitials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'FM';

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
            <div className="header-avatar" style={{ fontWeight: 700, fontSize: 11, background: 'linear-gradient(135deg, #16a34a, #22c55e)', color: '#ffffff' }}>
              {userInitials}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', lineHeight: 1.2 }}>
              <span className="header-user-name" style={{ fontWeight: 600 }}>{displayName}</span>
              <span style={{ fontSize: 9, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {displayRole}
              </span>
            </div>
            <ChevronDown style={{ width: 14, height: 14, color: 'var(--text-faint)', marginLeft: 2 }} />
          </div>

          {dropdownOpen && (
            <>
              <div className="dropdown-backdrop" onClick={() => setDropdownOpen(false)} />
              <div className="dropdown" style={{ minWidth: 230, right: 0 }}>
                <div className="dropdown-header" style={{ padding: '12px 14px' }}>
                  <p className="dropdown-header-name" style={{ fontWeight: 700, fontSize: 13 }}>{displayName}</p>
                  <p className="dropdown-header-email" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{displayEmail}</p>
                  <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 99, background: 'rgba(22, 163, 74, 0.12)', color: '#22c55e', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                    <Shield style={{ width: 10, height: 10 }} />
                    {displayRole} Account
                  </div>
                </div>
                <div className="dropdown-divider" style={{ margin: '4px 0' }} />
                <Link
                  href="/dashboard/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="dropdown-item"
                >
                  <Settings style={{ width: 15, height: 15, color: 'var(--text-faint)' }} />
                  Account Settings
                </Link>
                <div className="dropdown-divider" style={{ margin: '4px 0' }} />
                <a
                  href="/login"
                  onClick={handleSignOut}
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
