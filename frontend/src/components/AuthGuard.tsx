'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/auth';

/**
 * AuthGuard — redirects unauthenticated users to /login.
 * Wrap this around any layout that should be protected.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Public routes that don't need a token
    const publicPaths = ['/login', '/signup'];
    const isPublic = publicPaths.some(p => pathname.startsWith(p));

    if (!isPublic) {
      if (!auth.isAuthenticated()) {
        router.replace('/login');
      } else {
        // Validate with backend in background — auto-eject if stale token from previous DB
        import('@/lib/api').then(({ api }) => {
          api.getMe().catch(() => {
            auth.logout();
            router.replace('/login?expired=1');
          });
        });
      }
    }
  }, [pathname, router]);

  // If not authenticated and not on a public path, render nothing while redirecting
  const publicPaths = ['/login', '/signup'];
  const isPublic = publicPaths.some(p => pathname.startsWith(p));
  if (!isPublic && !auth.isAuthenticated()) {
    return null;
  }

  return <>{children}</>;
}
