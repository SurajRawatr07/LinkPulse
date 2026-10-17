import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { lifecycleApi, linksApi } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { getBaseShortUrl } from '../lib/utils';

export function LifecyclePage() {
  const { user } = useAuthStore();
  const { success, error: toastError } = useToastStore();

  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function loadSummary() {
    setIsLoading(true);
    try {
      const data = await lifecycleApi.getSummary();
      setSummary(data);
    } catch {
      toastError('Failed to fetch link lifecycle metrics');
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

  if (isLoading || !summary) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const { counts, criticalLinks = [] } = summary;

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
            {counts.active || 0}
          </p>
        </Card>

        <Card className="p-4 space-y-1 border-amber-200 dark:border-amber-900/40">
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Expiring Soon (&lt;48h)
          </span>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {counts.expiringSoon || 0}
          </p>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Expired
          </span>
          <p className="text-2xl font-bold text-neutral-500">
            {counts.expired || 0}
          </p>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Cap 100% Reached
          </span>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {counts.limitReached || 0}
          </p>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Disabled
          </span>
          <p className="text-2xl font-bold text-neutral-400">
            {counts.disabled || 0}
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

        {criticalLinks.length === 0 ? (
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
            {criticalLinks.map((link: any) => (
              <div key={link.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                      onClick={() => handleExtendExpiry(link.id, 30)}
                      disabled={processingId === link.id}
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
                      onClick={() => handleIncreaseLimit(link.id, 100)}
                      disabled={processingId === link.id}
                      className="text-xs"
                    >
                      <PlusCircle className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                      <span>+100 Clicks</span>
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(link.id, link.status !== 'disabled')}
                    disabled={processingId === link.id}
                    className="text-xs"
                  >
                    <Power className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
