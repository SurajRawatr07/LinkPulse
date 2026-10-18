import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Link2, Eye, EyeOff, ArrowRight, AlertCircle, Shield } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
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
      const user = await login(email.trim().toLowerCase(), password);
      success(`Welcome back, ${user.name}`);
      if (user.role === 'admin') {
        navigate('/admin/overview');
      } else {
        navigate('/app/dashboard');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password.';
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
            Sign in to Your Account
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 font-body">
            Enter your credentials to manage your links and view real-time click insights.
          </p>
        </div>

        {errors.general && (
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
          >
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          <span className="flex-shrink mx-3 text-xs text-slate-400">secure authentication</span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
        </div>

        <div className="p-3 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-neutral-800 dark:text-neutral-200 shrink-0" />
          <span>Role-based access is strictly verified on the server for all protected workspace and administrative operations.</span>
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
