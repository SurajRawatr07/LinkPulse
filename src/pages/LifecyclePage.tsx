import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Zap,
  PlusCircle,
  ExternalLink,
  Power,
  RefreshCw,
  TrendingUp,
  Link2,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { lifecycleApi, linksApi } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { getBaseShortUrl } from '../lib/utils';

export function LifecyclePage() {
  const { user } = useAuthStore();
  const { success, error: toastError } = useToastStore();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function loadSummary() {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await lifecycleApi.getSummary();
      setSummary(data);
    } catch (err: any) {
      const msg = err.message || 'Failed to fetch link lifecycle metrics';
      setFetchError(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSummary();
  }, [user]);

  async function handleExtendExpiry(id: string, days: number) {
    setProcessingId(id);
    try {
      await lifecycleApi.extendExpiry(id, days);
      success(`Link expiration extended by ${days} days`);
      await loadSummary();
    } catch (err: any) {
      toastError(err.message || 'Failed to extend expiration');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleIncreaseLimit(id: string, count: number) {
    setProcessingId(id);
    try {
      await lifecycleApi.increaseLimit(id, count);
      success(`Click quota increased by +${count} visits`);
      await loadSummary();
    } catch (err: any) {
      toastError(err.message || 'Failed to increase click limit');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleToggleStatus(id: string, currentActive: boolean) {
    setProcessingId(id);
    try {
      await linksApi.updateLink(id, { isActive: !currentActive });
      success(currentActive ? 'Link disabled' : 'Link reactivated');
      await loadSummary();
    } catch {
      toastError('Failed to update status');
    } finally {
      setProcessingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (fetchError && !summary) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
          Unable to Load Link Lifecycle Center
        </h2>
        <p className="text-xs text-neutral-500 max-w-md mx-auto">
          {fetchError}
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Button variant="outline" size="sm" onClick={loadSummary}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Retry
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/app/links/new')}>
            Create New Link
          </Button>
        </div>
      </div>
    );
  }

  const counts = {
    active: 0,
    expiringSoon: 0,
    expired: 0,
    limitReached: 0,
    disabled: 0,
    ...(summary?.counts || summary?.stats || {}),
  };
  const criticalLinks = Array.isArray(summary?.criticalLinks) ? summary.criticalLinks : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
              <Clock className="w-4 h-4" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Link Lifecycle Management
            </h1>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Automated health monitoring for link expirations, visit limits, and scheduled status transitions.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadSummary} className="text-xs">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          <span>Refresh Health Status</span>
        </Button>
      </div>

      {/* KPI Status Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <Card className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Active Links
          </span>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">
            {counts.active ?? 0}
          </p>
        </Card>

        <Card className="p-4 space-y-1 border-amber-200 dark:border-amber-900/40">
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Expiring Soon (&lt;48h)
          </span>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {counts.expiringSoon ?? 0}
          </p>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Expired
          </span>
          <p className="text-2xl font-bold text-neutral-500">
            {counts.expired ?? 0}
          </p>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Cap 100% Reached
          </span>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {counts.limitReached ?? 0}
          </p>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Disabled
          </span>
          <p className="text-2xl font-bold text-neutral-400">
            {counts.disabled ?? 0}
          </p>
        </Card>
      </div>

      {/* Critical Links Requiring Attention */}
      <Card className="p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Lifecycle Attention Queue ({criticalLinks.length})
            </h2>
            <p className="text-xs text-neutral-500">
              Links nearing quota capacity or scheduled expiry dates that may interrupt visitor traffic.
            </p>
          </div>
        </div>

        {counts.total === 0 || (counts.active === 0 && counts.expired === 0 && counts.disabled === 0 && counts.limitReached === 0) ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center mx-auto">
              <Link2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                No links monitored yet
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Create a short link with an expiration date or click quota to track its health and lifecycle transitions here.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/app/links/new')}
              className="text-xs"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
              <span>Create Your First Link</span>
            </Button>
          </div>
        ) : criticalLinks.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              All links are healthy! No links currently require quota increases or expiration extensions.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {criticalLinks.map((link: any) => {
              const linkId = String(link.id || link._id || '');
              return (
                <div key={linkId || link.shortCode} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-neutral-900 dark:text-white">
                        /{link.shortCode}
                      </span>
                      <Badge variant={link.status === 'expired' || link.status === 'limit_reached' ? 'danger' : 'warning'}>
                        {link.warningReason || link.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-neutral-500 truncate max-w-lg">
                      {link.destinationUrl}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-neutral-400 font-mono">
                      <span>Clicks: {link.clicksCount} {link.clickLimit ? `/ ${link.clickLimit}` : ''}</span>
                      {link.expiresAt && (
                        <span>Expires: {new Date(link.expiresAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  {/* Remediation Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {link.expiresAt && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExtendExpiry(linkId, 30)}
                        disabled={processingId === linkId}
                        className="text-xs"
                      >
                        <Calendar className="w-3.5 h-3.5 mr-1 text-amber-500" />
                        <span>+30 Days</span>
                      </Button>
                    )}

                    {link.clickLimit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleIncreaseLimit(linkId, 100)}
                        disabled={processingId === linkId}
                        className="text-xs"
                      >
                        <PlusCircle className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                        <span>+100 Clicks</span>
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(linkId, link.status !== 'disabled')}
                      disabled={processingId === linkId}
                      className="text-xs"
                    >
                      <Power className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
