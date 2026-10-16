import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Link2, Eye, EyeOff, ArrowRight, Check, X, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { authApi } from '../lib/api';
import { NameSchema, EmailSchema, PasswordSchema, checkPasswordRules } from '../lib/validators';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export function SignupPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const { success, error: toastError } = useToastStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Field errors
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const [isLoading, setIsLoading] = useState(false);
  const [isFirstUser, setIsFirstUser] = useState(false);

  useEffect(() => {
    authApi.getUserCount().then((count) => {
      setIsFirstUser(count === 0);
    });
  }, []);

  const passwordAnalysis = checkPasswordRules(password);

  function validateField(fieldName: 'name' | 'email' | 'password' | 'confirmPassword') {
    const newErrors = { ...errors };

    if (fieldName === 'name') {
      const res = NameSchema.safeParse(name);
      if (!res.success) {
        newErrors.name = res.error.issues[0].message;
      } else {
        delete newErrors.name;
      }
    }

    if (fieldName === 'email') {
      const res = EmailSchema.safeParse(email);
      if (!res.success) {
        newErrors.email = res.error.issues[0].message;
      } else {
        delete newErrors.email;
      }
    }

    if (fieldName === 'password') {
      const res = PasswordSchema.safeParse(password);
      if (!res.success) {
        newErrors.password = res.error.issues[0].message;
      } else {
        delete newErrors.password;
      }
    }

    if (fieldName === 'confirmPassword') {
      if (confirmPassword !== password) {
        newErrors.confirmPassword = 'Passwords do not match';
      } else {
        delete newErrors.confirmPassword;
      }
    }

    setErrors(newErrors);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nameRes = NameSchema.safeParse(name);
    const emailRes = EmailSchema.safeParse(email);
    const passRes = PasswordSchema.safeParse(password);
    const confirmMatch = confirmPassword === password;

    const validationMap: typeof errors = {};
    if (!nameRes.success) validationMap.name = nameRes.error.issues[0].message;
    if (!emailRes.success) validationMap.email = emailRes.error.issues[0].message;
    if (!passRes.success) validationMap.password = passRes.error.issues[0].message;
    if (!confirmMatch) validationMap.confirmPassword = 'Passwords do not match';

    if (Object.keys(validationMap).length > 0) {
      setErrors(validationMap);
      return;
    }

    setIsLoading(true);
    try {
      const user = await register(name, email, password);
      success(`Account created! Welcome, ${user.name}`);
      const redirectUrl = searchParams.get('url');
      if (redirectUrl) {
        navigate(`/app/links/new?url=${encodeURIComponent(redirectUrl)}`);
      } else {
        navigate('/app/dashboard');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      if (msg.includes('already registered')) {
        setErrors((prev) => ({ ...prev, email: 'This email is already registered.' }));
      } else {
        toastError('Signup Error', msg);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <Card className="max-w-md w-full p-6 sm:p-8 space-y-6">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-xs">
              <Link2 className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="text-base font-bold text-slate-900 dark:text-white">
              LinkPulse
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Create your account
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Start shortening links and streaming analytics in seconds.
          </p>
        </div>

        {/* Note shown only for the first user */}
        {isFirstUser && (
          <div className="p-3 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 rounded-lg text-xs text-teal-800 dark:text-teal-300 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Administrator Notice:</span> The first registered account automatically receives full Administrator privileges and pre-seeded sample data.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Sarah Chen"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => validateField('name')}
            error={errors.name}
            helperText="Letters and spaces only (2-50 characters)"
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="user@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => validateField('email')}
            error={errors.email}
            helperText="Enter your active email address"
            required
          />

          {/* Password with live rules checklist and strength meter */}
          <div className="space-y-2">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => validateField('password')}
              error={errors.password}
              helperText="8 to 64 characters with mixed case, number and symbol"
              required
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

            {/* Strength Meter */}
            {password.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Password strength:</span>
                  <span
                    className={`font-semibold ${
                      passwordAnalysis.strength === 'Strong'
                        ? 'text-emerald-600'
                        : passwordAnalysis.strength === 'Medium'
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {passwordAnalysis.strength}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden flex gap-1">
                  <div
                    className={`h-full transition-all duration-200 ${
                      passwordAnalysis.score >= 2 ? 'bg-rose-500 w-1/3' : 'bg-transparent'
                    }`}
                  />
                  <div
                    className={`h-full transition-all duration-200 ${
                      passwordAnalysis.score >= 4 ? 'bg-amber-500 w-1/3' : 'bg-transparent'
                    }`}
                  />
                  <div
                    className={`h-full transition-all duration-200 ${
                      passwordAnalysis.score === 6 ? 'bg-emerald-500 w-1/3' : 'bg-transparent'
                    }`}
                  />
                </div>

                {/* Live Rules Checklist */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5 text-[11px]">
                  {passwordAnalysis.rules.map((rule) => (
                    <div
                      key={rule.id}
                      className={`flex items-center gap-1.5 ${
                        rule.valid ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {rule.valid ? (
                        <Check className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-700 shrink-0 inline-block" />
                      )}
                      <span>{rule.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <Input
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => validateField('confirmPassword')}
            error={errors.confirmPassword}
            helperText="Must match your password above"
            required
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Toggle confirm password visibility"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2 min-h-[44px]"
            isLoading={isLoading}
          >
            <span>Create Account</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          <span className="flex-shrink mx-3 text-xs text-slate-400">or sign up with</span>
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
                success(`Welcome to LinkPulse, ${data.user.name}!`);
                navigate(data.user.role === 'admin' ? '/admin/links' : '/app/dashboard');
              } else {
                toastError('Google sign in failed');
              }
            } catch (err: any) {
              console.error('Google Sign-In Error:', err);
              toastError('Google sign-in canceled or failed');
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

        <p className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-teal-600 dark:text-teal-400 font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
