import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, Eye, EyeOff, ArrowRight, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { EmailSchema } from '../../lib/validators';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, logout } = useAuthStore();
  const { success, error: toastError } = useToastStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const [isLoading, setIsLoading] = useState(false);

  function fillDemoCredentials() {
    setEmail('demo.admin@linkpulse.test');
    setPassword('DemoAdmin@123');
    setErrors({});
  }

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
      setErrors((prev) => ({ ...prev, password: 'Admin password is required' }));
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
    if (!passOk) validationMap.password = 'Admin password is required';

    if (Object.keys(validationMap).length > 0) {
      setErrors(validationMap);
      return;
    }

    setIsLoading(true);
    try {
      const user = await login(email.trim().toLowerCase(), password);
      
      // Strict role verification: only 'admin' allowed in Admin Portal
      if (user.role !== 'admin') {
        await logout();
        const msg = 'Access denied: This account lacks administrator privileges. Please sign in via the User Login page.';
        setErrors({ general: msg });
        toastError('Access Restricted', msg);
        setIsLoading(false);
        return;
      }

      success(`Administrator access granted. Welcome, ${user.name}`);
      navigate('/admin/overview');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid administrator credentials.';
      setErrors({ general: msg });
      toastError('Authentication Failed', msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <Card className="max-w-md w-full p-6 sm:p-8 space-y-6 border-neutral-300 dark:border-neutral-700 shadow-md">
        {/* Header with Admin Badge */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs group-hover:bg-black transition-colors">
                <Shield className="w-4.5 h-4.5 stroke-[2.2] text-amber-400" />
              </div>
              <span className="font-display text-lg font-bold text-neutral-900 dark:text-white">
                LinkPulse
              </span>
            </Link>
            <span className="px-2.5 py-1 text-[11px] font-semibold tracking-wider uppercase rounded-full bg-neutral-900 text-amber-400 dark:bg-amber-400/10 dark:text-amber-400 border border-neutral-800 dark:border-amber-400/20">
              Admin Portal
            </span>
          </div>
          
          <h1 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-neutral-900 dark:text-white">
            Administrator Login
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 font-body">
            Restricted access for system telemetry, domain blocklists, abuse reports, and user governance.
          </p>
        </div>

        {/* Demo Credentials Box */}
        <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-900 dark:text-white">
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
              <span>Demo Administrator Credentials</span>
            </div>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="text-[11px] font-semibold text-neutral-900 dark:text-white bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
            >
              Fill Demo Credentials
            </button>
          </div>
          <div className="text-[11px] font-mono text-neutral-600 dark:text-neutral-300 space-y-0.5">
            <p><span className="text-neutral-400">Email:</span> demo.admin@linkpulse.test</p>
            <p><span className="text-neutral-400">Password:</span> DemoAdmin@123</p>
          </div>
        </div>

        {errors.general && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errors.general}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Administrator Email"
            type="email"
            placeholder="admin@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={validateEmailOnBlur}
            error={errors.email}
            helperText="Enter verified administrator email address"
            required
            autoComplete="email"
          />

          <Input
            label="Administrator Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={validatePasswordOnBlur}
            error={errors.password}
            helperText="Enter your secure administrative password"
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

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2 min-h-[44px] bg-neutral-900 hover:bg-black text-white"
            isLoading={isLoading}
          >
            <span>Authenticate Administrator</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to User Login</span>
          </Link>
          <span className="text-[11px] text-neutral-400 font-mono">RBAC v2.4</span>
        </div>
      </Card>
    </div>
  );
}
