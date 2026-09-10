// Auth Store — manages authentication state in localStorage
// Token + user are persisted so refresh doesn't log users out

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'farmer' | 'admin';
}

const TOKEN_KEY = 'token';
const USER_KEY = 'agrimind_user';

class AuthStore {
  /** Save token + user to localStorage */
  setAuth(token: string, user: AuthUser) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  /** Returns token or null */
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  /** Returns parsed user or null */
  getUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /** True if a token exists */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /** True if currently logged in as a demo user */
  isDemo(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    return !!(
      token?.startsWith('demo-token-') ||
      token === 'demo-mode' ||
      user?.email?.toLowerCase().includes('demo')
    );
  }

  /** Clear all auth data — call on logout */
  logout() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

export const auth = new AuthStore();
