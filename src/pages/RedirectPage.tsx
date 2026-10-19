import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  Link2,
  Ban,
  ShieldAlert,
  Clock,
  AlertTriangle,
  Lock,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { linksApi, clicksApi, adminApi } from '../lib/api';
import { evaluateRedirectRules, RedirectEvaluationResult } from '../lib/utils';
import { Link as LinkType } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export function RedirectPage() {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();

  const [evalResult, setEvalResult] = useState<RedirectEvaluationResult | null>(null);
  const [linkObj, setLinkObj] = useState<LinkType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Password challenge
  const [passwordInput, setPasswordInput] = useState('');
  const [countdown, setCountdown] = useState(2);
  const clickLoggedRef = useRef(false);

  useEffect(() => {
    async function resolveRedirect() {
      if (!code) {
        setEvalResult({ status: 'not_found', message: 'No link code provided.' });
        setIsLoading(false);
        return;
      }

      try {
        const link = await linksApi.getLinkByCode(code);

        if (!link) {
          setEvalResult({ status: 'not_found', message: 'Link code not found.' });
          setIsLoading(false);
          return;
        }

        setLinkObj(link);

        if (link.isDeleted || !link.isActive) {
          setEvalResult({ status: 'disabled', message: 'This short link has been disabled by its owner or an administrator.' });
          setIsLoading(false);
          return;
        }

        if (link.abuseFlag) {
          setEvalResult({ status: 'blocklisted', domain: link.domain, message: 'This destination has been restricted for safety.' });
          setIsLoading(false);
          return;
        }

        if (link.rules?.expiresAt && new Date() > new Date(link.rules.expiresAt)) {
          setEvalResult({ status: 'expired', message: 'This link has expired.' });
          setIsLoading(false);
          return;
        }

        if (link.rules?.clickLimit && link.clicksCount >= link.rules.clickLimit) {
          setEvalResult({ status: 'limit_reached', message: 'This link has reached its maximum visit limit.' });
          setIsLoading(false);
          return;
        }

        if (link.rules?.password) {
          setEvalResult({ status: 'password_required', message: 'Password required' });
          setIsLoading(false);
          return;
        }

        // Direct server-side redirect is preferred
        const dest = link.originalUrl;
        setEvalResult({ status: 'success', destinationUrl: dest });
      } catch {
        setEvalResult({ status: 'not_found', message: 'Unable to resolve link.' });
      } finally {
        setIsLoading(false);
      }
    }

    resolveRedirect();
  }, [code, searchParams]);

  // Immediate redirect for successful resolution
  useEffect(() => {
    if (evalResult?.status === 'success' && evalResult.destinationUrl) {
      window.location.replace(evalResult.destinationUrl);
    }
  }, [evalResult]);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code) return;

    try {
      const res = await fetch(`/api/v1/redirect/${encodeURIComponent(code)}/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await res.json();
      if (res.ok && data.verified) {
        if (linkObj) {
          setEvalResult({ status: 'success', destinationUrl: linkObj.originalUrl });
        } else {
          window.location.href = data.redirectUrl || `/r/${code}`;
        }
      } else {
        setEvalResult({ status: 'password_invalid', message: data.error || 'Incorrect password' });
      }
    } catch {
      setEvalResult({ status: 'password_invalid', message: 'Verification network error' });
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6] dark:bg-[#0a0a0a] p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-neutral-900 dark:border-white border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-neutral-600 font-mono">Resolving link...</p>
        </div>
      </div>
    );
  }

  // 1. Code not found
  if (evalResult?.status === 'not_found') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <Card className="max-w-md w-full text-center p-8 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <Link2 className="w-6 h-6 stroke-[1.8]" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Link Not Found
          </h1>
          <p className="text-xs text-slate-500">
            The short code <span className="font-mono text-slate-800 dark:text-slate-200">/{code}</span> does not exist or has been removed.
          </p>
          <div className="pt-2">
            <Link to="/">
              <Button variant="primary" size="sm" className="w-full min-h-[44px]">
                Return Home
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // 2. Disabled
  if (evalResult?.status === 'disabled') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <Card className="max-w-md w-full text-center p-8 space-y-4 border-amber-200 dark:border-amber-900/50">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center mx-auto">
            <Ban className="w-6 h-6 stroke-[1.8]" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Link Disabled
          </h1>
          <p className="text-xs text-slate-500">
            {evalResult.message}
          </p>
          <Link to="/">
            <Button variant="outline" size="sm" className="w-full min-h-[44px]">
              Back to Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // 3. Domain blocklisted
  if (evalResult?.status === 'blocklisted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <Card className="max-w-md w-full text-center p-8 space-y-4 border-rose-200 dark:border-rose-900/50">
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6 stroke-[1.8]" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Blocked for Safety
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            The target domain ({evalResult.domain}) is listed on our safety blocklist. Redirection was halted to protect your security.
          </p>
          <Link to="/">
            <Button variant="outline" size="sm" className="w-full min-h-[44px]">
              Leave Page
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // 4. Expired
  if (evalResult?.status === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <Card className="max-w-md w-full text-center p-8 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6 stroke-[1.8]" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Link Expired
          </h1>
          <p className="text-xs text-slate-500">
            This short link has reached its scheduled expiration date and is no longer active.
          </p>
          <Link to="/">
            <Button variant="outline" size="sm" className="w-full min-h-[44px]">
              Back to Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // 5. Click limit reached
  if (evalResult?.status === 'limit_reached') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <Card className="max-w-md w-full text-center p-8 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 stroke-[1.8]" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Limit Reached
          </h1>
          <p className="text-xs text-slate-500">
            This short link has reached its maximum visit quota.
          </p>
          <Link to="/">
            <Button variant="outline" size="sm" className="w-full min-h-[44px]">
              Back to Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // 6. Password protected
  if (evalResult?.status === 'password_required' || evalResult?.status === 'password_invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6] dark:bg-[#0a0a0a] p-4">
        <Card className="max-w-md w-full p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6 stroke-[1.8]" />
            </div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white">
              Password Protected Link
            </h1>
            <p className="text-xs text-neutral-500">
              Please enter the access password to proceed to the destination.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Enter password..."
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              error={evalResult.status === 'password_invalid' ? evalResult.message : undefined}
              autoFocus
            />
            <Button type="submit" variant="primary" size="md" className="w-full min-h-[44px]">
              Verify & Proceed
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  // 7 & 8. Redirect with short countdown
  if (evalResult?.status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6] dark:bg-[#0a0a0a] p-4">
        <Card className="max-w-md w-full text-center p-8 space-y-5">
          <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 stroke-[1.8]" />
          </div>

          <div>
            <h1 className="text-lg font-bold text-neutral-900 dark:text-white">
              Redirecting...
            </h1>
            <p className="text-xs text-neutral-500 font-mono break-all mt-1">
              {evalResult.destinationUrl}
            </p>
          </div>

          <div className="py-1">
            <span className="font-mono text-xs font-semibold px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">
              Redirecting in {countdown}s
            </span>
          </div>

          <a
            href={evalResult.destinationUrl}
            className="text-xs text-neutral-900 dark:text-neutral-100 hover:underline inline-flex items-center gap-1 font-semibold"
          >
            <span>Click here if not redirected</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </Card>
      </div>
    );
  }

  return null;
}
