'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/auth';

/**
 * AuthGuard — redirects unauthenticated users to /login.
 * Wrap this around any layout that should be protected.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // Public routes that don't need a token
    const publicPaths = ['/login', '/signup'];
    const isPublic = publicPaths.some(p => pathname.startsWith(p));

    if (!isPublic) {
      if (!auth.isAuthenticated()) {
        router.replace('/login');
      } else if (!auth.isDemo()) {
        // Validate with backend in background — auto-eject if stale token from previous DB
        // Skip validation entirely for demo sessions
        import('@/lib/api').then(({ api }) => {
          api.getMe().catch(() => {
            if (!auth.isDemo()) {
              auth.logout();
              router.replace('/login?expired=1');
            }
          });
        });
      }
    }
  }, [pathname, router]);

  // Public routes
  const publicPaths = ['/login', '/signup'];
  const isPublic = publicPaths.some(p => pathname.startsWith(p));

  if (isPublic) {
    return <>{children}</>;
  }

  // During SSR or initial mount, avoid flashing or mismatch
  if (!isClient) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#090d16' }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(34,197,94,0.2)', borderTopColor: '#22c55e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!auth.isAuthenticated()) {
    return null;
  }

  return <>{children}</>;
}
