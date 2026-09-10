'use client';

import Sidebar from '@/components/Sidebar';
import { AuthGuard } from '@/components/AuthGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="app-shell">
        <Sidebar />
        <div className="main-content">
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}
