import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Link2, Eye, EyeOff, ArrowRight, Lock, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { db } from '../lib/api/mockDb';
import { authApi } from '../lib/api';
import { EmailSchema } from '../lib/validators';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { success, error: toastError } = useToastStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const [isLoading, setIsLoading] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Check lockout on mount and tick countdown
  useEffect(() => {
    function checkLock() {
      const attempts = db.getFailedAttempts();
      if (attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
        const diff = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
        setLockoutRemaining(diff);
      } else {
        setLockoutRemaining(0);
      }
    }

    checkLock();
    const interval = setInterval(checkLock, 1000);
    return () => clearInterval(interval);
  }, []);

  function validateEmailOnBlur() {
    const res = EmailSchema.safeParse(email);
    if (!res.success) {
      setErrors((prev) => ({ ...prev, email: res.error.issues[0].message }));
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.email;
        return next;
      });
    }
  }

  function validatePasswordOnBlur() {
    if (!password) {
      setErrors((prev) => ({ ...prev, password: 'Password is required' }));
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.password;
        return next;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    if (lockoutRemaining > 0) {
      return;
    }

    const emailRes = EmailSchema.safeParse(email);
    const passOk = Boolean(password && password.length >= 1);

    const validationMap: typeof errors = {};
    if (!emailRes.success) validationMap.email = emailRes.error.issues[0].message;
    if (!passOk) validationMap.password = 'Password is required';

    if (Object.keys(validationMap).length > 0) {
      setErrors(validationMap);
      return;
    }

    setIsLoading(true);
    try {
      const user = await login(email, password);
      success(`Welcome back, ${user.name}`);
      if (user.role === 'admin') {
        navigate('/admin/links');
      } else {
        navigate('/app/dashboard');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Email or password is incorrect.';
      setErrors({ general: msg });
      toastError('Login Failed', msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <Card className="max-w-md w-full p-6 sm:p-8 space-y-6">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs group-hover:bg-black transition-colors">
              <Link2 className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <span className="font-display text-lg font-bold text-neutral-900 dark:text-white">
              LinkPulse
            </span>
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-neutral-900 dark:text-white">
            Sign in to Your Workspace
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 font-body">
            Enter your credentials to manage links and view real-time click insights.
          </p>
        </div>

        {/* Lockout banner */}
        {lockoutRemaining > 0 && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0 text-rose-600" />
            <div>
              <span className="font-semibold">Security Lockout:</span> Too many failed attempts. Try again in{' '}
              <span className="font-mono font-bold text-rose-700 dark:text-rose-200">
                {lockoutRemaining}s
              </span>
              .
            </div>
          </div>
        )}

        {errors.general && lockoutRemaining === 0 && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errors.general}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="user@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={validateEmailOnBlur}
            error={errors.email}
            helperText="Enter your registered account email"
            disabled={lockoutRemaining > 0}
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={validatePasswordOnBlur}
            error={errors.password}
            helperText="Enter your account password"
            disabled={lockoutRemaining > 0}
            required
            autoComplete="current-password"
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-neutral-900 rounded cursor-pointer"
              />
              <span>Remember me</span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2 min-h-[44px]"
            isLoading={isLoading}
            disabled={lockoutRemaining > 0}
          >
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          <span className="flex-shrink mx-3 text-xs text-slate-400">or continue with</span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
        </div>

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={async () => {
            setIsLoading(true);
            try {
              const { auth, googleAuthProvider } = await import('../lib/firebase');
              const { signInWithPopup } = await import('firebase/auth');
              const result = await signInWithPopup(auth, googleAuthProvider);
              const idToken = await result.user.getIdToken();
              const res = await fetch('/api/v1/auth/google-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
              });
              const data = await res.json();
              if (data.user && data.token) {
                localStorage.setItem('lp_token', data.token);
                await login(data.user.email, 'google_auth_placeholder');
                success(`Welcome, ${data.user.name}`);
                navigate(data.user.role === 'admin' ? '/admin/links' : '/app/dashboard');
              } else {
                toastError('Google sign in failed');
              }
            } catch (err: any) {
              console.error('Google Sign-In Error:', err);
              toastError('Google Sign-In canceled or failed');
            } finally {
              setIsLoading(false);
            }
          }}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors min-h-[44px] cursor-pointer shadow-xs"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Quick Demo Logins for Hackathon Evaluators */}
        <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
          <p className="text-[11px] text-neutral-500 font-medium text-center">
            Hackathon Evaluator Quick Access:
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={async () => {
                setIsLoading(true);
                try {
                  const user = await authApi.demoLogin('user');
                  success(`Logged in as User: ${user.name}`);
                  navigate('/app/dashboard');
                } catch {
                  toastError('Demo sign in failed');
                } finally {
                  setIsLoading(false);
                }
              }}
              className="pearl-btn-pearl px-3 py-2.5 text-xs font-semibold rounded-xl text-neutral-900 border border-neutral-300 hover:bg-neutral-50 transition-colors cursor-pointer text-center"
            >
              Demo User
            </button>
            <button
              type="button"
              onClick={async () => {
                setIsLoading(true);
                try {
                  const user = await authApi.demoLogin('admin');
                  success(`Logged in as Admin: ${user.name}`);
                  navigate('/admin/links');
                } catch {
                  toastError('Demo admin sign in failed');
                } finally {
                  setIsLoading(false);
                }
              }}
              className="pearl-btn-pearl px-3 py-2.5 text-xs font-semibold rounded-xl text-neutral-900 border border-neutral-300 hover:bg-neutral-50 transition-colors cursor-pointer text-center"
            >
              Demo Admin
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-neutral-600">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-neutral-900 dark:text-white font-semibold underline decoration-neutral-300 hover:decoration-neutral-900">
            Create an account
          </Link>
        </p>
      </Card>
    </div>
  );
}
