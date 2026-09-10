'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Leaf, Lock, Mail, ArrowRight, Loader2, Sprout, Brain,
  BarChart3, User, Eye, EyeOff, ShieldCheck, RefreshCw, ChevronLeft, Phone, Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { auth, AuthUser } from '@/lib/auth';
import {
  DEMO_FARM,
  DEMO_FIELDS,
  DEMO_CYCLE,
  DEMO_SENSORS,
  DEMO_WEATHER,
  DEMO_IRRIGATION,
  DEMO_ALERTS,
  DEMO_PEST,
  DEMO_PROFIT,
} from '@/lib/demoData';

// ─── Types ──────────────────────────────────────────────────────────────────
type View = 'login' | 'signup' | 'otp';

interface PendingUser {
  name: string;
  email: string;
  password: string;
  phone?: string;
  otp: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── OTP Input Component ─────────────────────────────────────────────────────
function OtpInput({
  value,
  onChange,
  shake,
}: {
  value: string[];
  onChange: (val: string[]) => void;
  shake: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (idx: number, char: string) => {
    const digit = char.replace(/\D/g, '').slice(-1);
    const next = [...value];
    next[idx] = digit;
    onChange(next);
    if (digit && idx < value.length - 1) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (value[idx]) {
        const next = [...value];
        next[idx] = '';
        onChange(next);
      } else if (idx > 0) {
        refs.current[idx - 1]?.focus();
      }
    }
    if (e.key === 'ArrowLeft' && idx > 0) refs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < value.length - 1) refs.current[idx + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, value.length);
    const next = [...value];
    for (let i = 0; i < value.length; i++) next[i] = pasted[i] || '';
    onChange(next);
    const lastFilled = Math.min(pasted.length, value.length - 1);
    refs.current[lastFilled]?.focus();
  };

  return (
    <div className={`otp-grid ${shake ? 'otp-shake' : ''}`}>
      {value.map((digit, idx) => (
        <input
          key={idx}
          ref={el => { refs.current[idx] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleChange(idx, e.target.value)}
          onKeyDown={e => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          onFocus={e => e.target.select()}
          className={`otp-box ${digit ? 'otp-box-filled' : ''}`}
          aria-label={`OTP digit ${idx + 1}`}
          id={`otp-digit-${idx}`}
        />
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();

  // View state
  const [view, setView] = useState<View>('login');
  const [animDir, setAnimDir] = useState<'forward' | 'back'>('forward');
  const [animating, setAnimating] = useState(false);

  // Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Sign Up
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('919110625567');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [showSignupPw, setShowSignupPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  // OTP (4 digits for SMS OTP)
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [otpShake, setOtpShake] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [pendingUser, setPendingUser] = useState<PendingUser | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('expired=1')) {
      window.history.replaceState({}, document.title, window.location.pathname);
      toast.error('Session expired. Please sign in or use Demo Mode.', { duration: 4000 });
    } else if (auth.isAuthenticated()) {
      window.location.href = '/dashboard';
    }
  }, []);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // ── Navigation ──
  const navigate = useCallback((to: View, dir: 'forward' | 'back' = 'forward') => {
    if (animating) return;
    setAnimDir(dir);
    setAnimating(true);
    setTimeout(() => {
      setView(to);
      setAnimating(false);
    }, 280);
  }, [animating]);

  // ── Instant Demo Login ──
  const loginWithDemo = () => {
    setLoginLoading(true);
    const tid = toast.loading('Launching AgriMind AI Interactive Demo...');
    const demoToken = 'demo-token-agrimind-' + Date.now();
    const demoUser: AuthUser = {
      id: 'demo-001',
      name: 'Rajesh Kumar (Demo Farmer)',
      email: 'demo@agrimind.ai',
      role: 'farmer',
    };

    api.setToken(demoToken);
    auth.setAuth(demoToken, demoUser);

    try {
      localStorage.setItem('cached_farms', JSON.stringify([DEMO_FARM]));
      localStorage.setItem(`cached_fields_${DEMO_FARM.id}`, JSON.stringify(DEMO_FIELDS));
      localStorage.setItem('selectedFarmId', DEMO_FARM.id);
      localStorage.setItem('selectedFieldId', DEMO_FIELDS[0].id);
      localStorage.setItem(`cached_active_cycle_${DEMO_FIELDS[0].id}`, JSON.stringify(DEMO_CYCLE));
      localStorage.setItem(`cached_sensors_${DEMO_FIELDS[0].id}`, JSON.stringify(DEMO_SENSORS));
      localStorage.setItem(`cached_weather_${DEMO_FIELDS[0].id}`, JSON.stringify(DEMO_WEATHER));
      localStorage.setItem(`cached_irrigation_${DEMO_FIELDS[0].id}`, JSON.stringify(DEMO_IRRIGATION));
      localStorage.setItem('cached_alerts', JSON.stringify(DEMO_ALERTS));
      localStorage.setItem(`cached_pest_${DEMO_CYCLE.id}`, JSON.stringify(DEMO_PEST));
      localStorage.setItem(`cached_profit_${DEMO_CYCLE.id}`, JSON.stringify(DEMO_PROFIT));
    } catch (err) {
      console.warn('LocalStorage demo write notice:', err);
    }

    toast.success('Welcome to AgriMind AI Demo! 🌿', { id: tid });
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 350);
  };

  // ── Login Submit ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error('Please enter your email and password');
      return;
    }

    const cleanEmail = loginEmail.trim().toLowerCase();
    const isDemo =
      cleanEmail === 'demo@agrimind.ai' ||
      cleanEmail.includes('demo') ||
      cleanEmail === 'farmer@agrimind.ai' ||
      loginPassword === 'demo1234' ||
      loginPassword === 'Farmer@123';

    if (isDemo) {
      loginWithDemo();
      return;
    }

    setLoginLoading(true);
    const tid = toast.loading('Signing you into Neon Cloud DB...');
    try {
      const res = await api.login(loginEmail, loginPassword);
      api.setToken(res.access_token);

      // Clean all stale local storage so real database records load fresh
      localStorage.removeItem('cached_farms');
      localStorage.removeItem('selectedFarmId');
      localStorage.removeItem('selectedFieldId');
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('cached_fields_')) localStorage.removeItem(k);
      });

      // Fetch user info from database
      let user: AuthUser;
      if (res.user) {
        user = {
          id: String(res.user.id || '1'),
          name: res.user.full_name || 'Farmer',
          email: res.user.email || loginEmail,
          role: (res.user.role || 'farmer') as any,
        };
      } else {
        try {
          const me = await api.getMe();
          user = { id: String(me.id || '1'), name: me.full_name || 'Farmer', email: me.email || loginEmail, role: (me.role || 'farmer') as any };
        } catch {
          user = { id: '1', name: loginEmail.split('@')[0], email: loginEmail, role: 'farmer' };
        }
      }
      auth.setAuth(res.access_token, user);
      toast.success('Connected to Neon Realtime Database! 🌿', { id: tid });
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 300);
    } catch (err: any) {
      toast.error(err.message || 'Invalid email or password. Use One-Click Demo below!', { id: tid });
    } finally {
      setLoginLoading(false);
    }
  };


  // ── Signup Submit ──
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim()) { toast.error('Please enter your name'); return; }
    if (!signupEmail.trim()) { toast.error('Please enter your email'); return; }
    if (signupPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (signupPassword !== signupConfirm) { toast.error('Passwords do not match'); return; }

    setSignupLoading(true);
    const tid = toast.loading('Sending verification code...');

    try {
      // Call backend: dispatches SMS OTP via otp.dev and emails
      const res = await api.sendOtp(signupName, signupEmail, signupPassword, signupPhone);
      if (res.sms_sent) {
        toast.success(`📱 SMS OTP sent to +${res.phone || signupPhone}! Check your phone.`, { id: tid, duration: 8000 });
      } else if (res.email_sent) {
        toast.success(`✉️ OTP sent to ${signupEmail} — check your inbox!`, { id: tid, duration: 6000 });
      } else if (res.dev_otp) {
        toast.success(`Dev Mode: Your OTP is ${res.dev_otp}`, { id: tid, duration: 12000 });
      } else {
        toast.success(`OTP generated — check your SMS or server console`, { id: tid, duration: 6000 });
      }
      const len = res.code_length || 4;
      setOtpDigits(new Array(len).fill(''));
      setPendingUser({ name: signupName, email: signupEmail, password: signupPassword, phone: signupPhone, otp: res.dev_otp || '' });
      setResendTimer(60);
      navigate('otp', 'forward');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send OTP. Is the backend running?', { id: tid });
    } finally {
      setSignupLoading(false);
    }
  };

  // ── Resend OTP ──
  const handleResendOtp = async () => {
    if (!pendingUser || resendTimer > 0) return;
    setResendTimer(60);
    try {
      const res = await api.sendOtp(pendingUser.name, pendingUser.email, pendingUser.password, pendingUser.phone);
      const len = res.code_length || 4;
      setOtpDigits(new Array(len).fill(''));
      if (res.sms_sent) {
        toast.success(`📱 New SMS OTP sent to +${res.phone || pendingUser.phone}!`);
      } else if (res.email_sent) {
        toast.success(`✉️ New OTP sent to ${pendingUser.email}`);
      } else if (res.dev_otp) {
        toast.success(`Dev Mode: New OTP is ${res.dev_otp}`, { duration: 12000 });
        setPendingUser(prev => prev ? { ...prev, otp: res.dev_otp || '' } : null);
      } else {
        toast.success('New OTP generated — check your SMS or server console');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend OTP');
    }
  };

  // ── OTP Verify ──
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const entered = otpDigits.join('');
    if (entered.length < otpDigits.length) { toast.error(`Please enter all ${otpDigits.length} digits`); return; }
    if (!pendingUser) return;

    setOtpLoading(true);

    try {
      // Real backend: verifies SMS OTP via otp.dev or in-memory, creates user, returns JWT
      const res = await api.verifyOtp(
        pendingUser.email,
        entered,
        pendingUser.name,
        pendingUser.password,
        pendingUser.phone,
      );
      api.setToken(res.access_token);
      // Fetch user profile
      let user: AuthUser;
      if (res.user) {
        user = {
          id: String(res.user.id || Date.now().toString()),
          name: res.user.full_name || pendingUser.name,
          email: res.user.email || pendingUser.email,
          role: (res.user.role || 'farmer') as any,
        };
      } else {
        try {
          const me = await api.getMe();
          user = { id: String(me.id || Date.now().toString()), name: me.full_name || pendingUser.name, email: me.email || pendingUser.email, role: (me.role || 'farmer') as any };
        } catch {
          user = { id: Date.now().toString(), name: pendingUser.name, email: pendingUser.email, role: 'farmer' };
        }
      }
      auth.setAuth(res.access_token, user);
      toast.success('✅ Phone & Account verified! Welcome to AgriMind AI 🌿');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 300);
    } catch (err: any) {
      setOtpShake(true);
      setTimeout(() => setOtpShake(false), 600);
      toast.error(err.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="auth-page">
      {/* Animated Background */}
      <div className="login-bg">
        <div className="login-bg-grid" />
        <div className="login-bg-orb login-bg-orb-1" />
        <div className="login-bg-orb login-bg-orb-2" />
        <div className="login-bg-orb login-bg-orb-3" />
      </div>

      <div className="auth-wrapper">
        {/* Brand Section */}
        <div className="login-logo-section">
          <div className="login-logo-icon">
            <Leaf style={{ width: 36, height: 36 }} />
          </div>
          <h1 className="login-logo-title">AgriMind AI</h1>
          <p className="login-logo-subtitle">AI-Powered Smart Agriculture Platform</p>
          <div className="login-features">
            <span className="login-feature-pill"><Sprout style={{ width: 10, height: 10 }} />Crop Analytics</span>
            <span className="login-feature-pill"><Brain style={{ width: 10, height: 10 }} />AI Advisory</span>
            <span className="login-feature-pill"><BarChart3 style={{ width: 10, height: 10 }} />Market Intel</span>
          </div>
        </div>

        {/* Card Container */}
        <div className={`auth-card-container ${animating ? `auth-exit-${animDir}` : 'auth-enter'}`}>

          {/* ── LOGIN VIEW ─────────────────────────────────────── */}
          {view === 'login' && (
            <div className="login-card auth-card">
              <h2 className="auth-card-title">Welcome back</h2>
              <p className="auth-card-sub">Sign in to your farm dashboard</p>

              <form onSubmit={handleLogin} className="login-form">
                <div className="login-field">
                  <label className="login-label" htmlFor="login-email">Email Address</label>
                  <div className="login-input-wrapper">
                    <div className="login-input-icon"><Mail style={{ width: 16, height: 16 }} /></div>
                    <input
                      id="login-email"
                      type="email"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      placeholder="farmer@agrimind.ai"
                      className="login-input"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="login-field">
                  <label className="login-label" htmlFor="login-password">Password</label>
                  <div className="login-input-wrapper">
                    <div className="login-input-icon"><Lock style={{ width: 16, height: 16 }} /></div>
                    <input
                      id="login-password"
                      type={showLoginPw ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="login-input"
                      autoComplete="current-password"
                    />
                    <button type="button" className="pw-toggle" onClick={() => setShowLoginPw(p => !p)} aria-label="Toggle password">
                      {showLoginPw ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loginLoading} className="login-submit-btn">
                  {loginLoading
                    ? <><Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />Authenticating...</>
                    : <>Enter Dashboard<ArrowRight style={{ width: 18, height: 18 }} /></>
                  }
                </button>
              </form>

              <div className="auth-divider"><span>Don&apos;t have an account?</span></div>
              <button className="auth-switch-btn" onClick={() => navigate('signup', 'forward')}>
                Create new account
              </button>

              <div className="login-demo-box">
                <button
                  type="button"
                  id="btn-one-click-demo"
                  className="login-submit-btn"
                  style={{
                    background: 'linear-gradient(135deg, #15803d 0%, #16a34a 50%, #22c55e 100%)',
                    marginBottom: '10px',
                    padding: '11px 18px',
                    fontSize: '13px',
                    fontWeight: 700,
                    boxShadow: '0 4px 14px rgba(34, 197, 94, 0.35)',
                  }}
                  onClick={loginWithDemo}
                  disabled={loginLoading}
                >
                  <Zap style={{ width: 16, height: 16, fill: '#fef08a', color: '#fef08a' }} />
                  Instant Demo Access (1-Click)
                </button>
                <p className="login-demo-text">
                  Demo Account: <span className="login-demo-cred">demo@agrimind.ai</span> / <span className="login-demo-cred">demo1234</span>
                </p>
                <button
                  type="button"
                  className="auth-switch-btn"
                  style={{ marginTop: '6px', fontSize: '11px', padding: '4px 10px', background: 'transparent', border: 'none', color: '#86efac', textDecoration: 'underline' }}
                  onClick={() => { setLoginEmail('demo@agrimind.ai'); setLoginPassword('demo1234'); }}
                >
                  Or fill form credentials
                </button>
              </div>
            </div>
          )}

          {/* ── SIGNUP VIEW ────────────────────────────────────── */}
          {view === 'signup' && (
            <div className="login-card auth-card">
              <button className="auth-back-btn" onClick={() => navigate('login', 'back')}>
                <ChevronLeft style={{ width: 16, height: 16 }} /> Back to Login
              </button>
              <h2 className="auth-card-title">Create account</h2>
              <p className="auth-card-sub">Join thousands of smart farmers</p>

              <form onSubmit={handleSignup} className="login-form">
                <div className="login-field">
                  <label className="login-label" htmlFor="signup-name">Full Name</label>
                  <div className="login-input-wrapper">
                    <div className="login-input-icon"><User style={{ width: 16, height: 16 }} /></div>
                    <input
                      id="signup-name"
                      type="text"
                      value={signupName}
                      onChange={e => setSignupName(e.target.value)}
                      placeholder="Rajesh Kumar"
                      className="login-input"
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div className="login-field">
                  <label className="login-label" htmlFor="signup-email">Email Address</label>
                  <div className="login-input-wrapper">
                    <div className="login-input-icon"><Mail style={{ width: 16, height: 16 }} /></div>
                    <input
                      id="signup-email"
                      type="email"
                      value={signupEmail}
                      onChange={e => setSignupEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="login-input"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="login-field">
                  <label className="login-label" htmlFor="signup-phone">Mobile Number (Real-time SMS OTP)</label>
                  <div className="login-input-wrapper">
                    <div className="login-input-icon"><Phone style={{ width: 16, height: 16 }} /></div>
                    <input
                      id="signup-phone"
                      type="tel"
                      value={signupPhone}
                      onChange={e => setSignupPhone(e.target.value)}
                      placeholder="919110625567"
                      className="login-input"
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <div className="login-field">
                  <label className="login-label" htmlFor="signup-password">Password</label>
                  <div className="login-input-wrapper">
                    <div className="login-input-icon"><Lock style={{ width: 16, height: 16 }} /></div>
                    <input
                      id="signup-password"
                      type={showSignupPw ? 'text' : 'password'}
                      value={signupPassword}
                      onChange={e => setSignupPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="login-input"
                      autoComplete="new-password"
                    />
                    <button type="button" className="pw-toggle" onClick={() => setShowSignupPw(p => !p)} aria-label="Toggle password">
                      {showSignupPw ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                    </button>
                  </div>
                  {/* Password strength bar */}
                  {signupPassword.length > 0 && (
                    <div className="pw-strength">
                      {[0, 1, 2, 3].map(i => (
                        <div key={i} className={`pw-strength-bar ${
                          signupPassword.length >= 8 && i <= 3 ? 'pw-strength-strong' :
                          signupPassword.length >= 6 && i <= 2 ? 'pw-strength-medium' :
                          signupPassword.length >= 3 && i <= 1 ? 'pw-strength-weak' :
                          signupPassword.length >= 1 && i === 0 ? 'pw-strength-weak' : ''
                        }`} />
                      ))}
                      <span className="pw-strength-label">
                        {signupPassword.length >= 8 ? '✓ Strong' : signupPassword.length >= 6 ? 'Medium' : 'Weak'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="login-field">
                  <label className="login-label" htmlFor="signup-confirm">Confirm Password</label>
                  <div className="login-input-wrapper">
                    <div className="login-input-icon"><Lock style={{ width: 16, height: 16 }} /></div>
                    <input
                      id="signup-confirm"
                      type={showConfirmPw ? 'text' : 'password'}
                      value={signupConfirm}
                      onChange={e => setSignupConfirm(e.target.value)}
                      placeholder="Repeat password"
                      className={`login-input ${signupConfirm && signupPassword !== signupConfirm ? 'input-error' : ''}`}
                      autoComplete="new-password"
                    />
                    <button type="button" className="pw-toggle" onClick={() => setShowConfirmPw(p => !p)} aria-label="Toggle confirm password">
                      {showConfirmPw ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                    </button>
                  </div>
                  {signupConfirm && signupPassword !== signupConfirm && (
                    <p className="field-error">Passwords do not match</p>
                  )}
                </div>

                <button type="submit" disabled={signupLoading} className="login-submit-btn">
                  {signupLoading
                    ? <><Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />Sending OTP...</>
                    : <>Continue with OTP<ArrowRight style={{ width: 18, height: 18 }} /></>
                  }
                </button>
              </form>
            </div>
          )}

          {/* ── OTP VIEW ───────────────────────────────────────── */}
          {view === 'otp' && (
            <div className="login-card auth-card otp-card">
              <button className="auth-back-btn" onClick={() => navigate('signup', 'back')}>
                <ChevronLeft style={{ width: 16, height: 16 }} /> Back
              </button>

              <div className="otp-icon-wrap">
                <ShieldCheck style={{ width: 36, height: 36 }} />
              </div>
              <h2 className="auth-card-title">Verify Phone & Account</h2>
              <p className="auth-card-sub">
                {pendingUser?.phone ? (
                  <>
                    We&apos;ve sent a 4-digit SMS OTP to<br />
                    <strong>+{pendingUser.phone}</strong>
                  </>
                ) : (
                  <>
                    We&apos;ve sent a verification code to<br />
                    <strong>{pendingUser?.email}</strong>
                  </>
                )}
              </p>

              <form onSubmit={handleVerifyOtp} className="login-form">
                <OtpInput value={otpDigits} onChange={setOtpDigits} shake={otpShake} />

                <button type="submit" disabled={otpLoading || otpDigits.join('').length < otpDigits.length} className="login-submit-btn">
                  {otpLoading
                    ? <><Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />Verifying...</>
                    : <>Verify & Access Dashboard<ArrowRight style={{ width: 18, height: 18 }} /></>
                  }
                </button>
              </form>

              <div className="otp-resend-row">
                {resendTimer > 0 ? (
                  <span className="otp-resend-timer">Resend OTP in {resendTimer}s</span>
                ) : (
                  <button className="otp-resend-btn" onClick={handleResendOtp}>
                    <RefreshCw style={{ width: 14, height: 14 }} />
                    Resend OTP
                  </button>
                )}
              </div>

              <div className="login-demo-box" style={{ marginTop: '0.75rem' }}>
                <p className="login-demo-text">
                  🔒 Never share this OTP with anyone. It expires in 5 minutes.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
