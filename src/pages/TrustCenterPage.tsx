import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  AlertTriangle,
  Search,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { trustCenterApi, adminApi } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';

export function TrustCenterPage() {
  const { user } = useAuthStore();
  const { success, error: toastError } = useToastStore();

  const [overview, setOverview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Reputation scanner state
  const [scanUrl, setScanUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  // Abuse report modal/form
  const [reportCode, setReportCode] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Admin abuse reports list
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await trustCenterApi.getOverview();
        setOverview(data);

        if (user?.role === 'admin') {
          const repData = await adminApi.getAbuseReports();
          setReports(repData);
        }
      } catch {
        toastError('Failed to load Trust Center telemetry');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user]);

  async function handleScanDomain(e: React.FormEvent) {
    e.preventDefault();
    if (!scanUrl.trim()) return;
    setIsScanning(true);
    setScanResult(null);

    try {
      const res = await trustCenterApi.checkDomain(scanUrl.trim());
      setScanResult(res);
      success('Domain reputation analyzed');
    } catch (err: any) {
      toastError(err.message || 'Scan failed');
    } finally {
      setIsScanning(false);
    }
  }

  async function handleSubmitAbuse(e: React.FormEvent) {
    e.preventDefault();
    if (!reportCode.trim() || !reportReason.trim()) return;
    setIsSubmittingReport(true);

    try {
      await trustCenterApi.reportAbuse({
        shortCode: reportCode.trim().replace(/^\//, ''),
        reason: reportReason.trim(),
        reporterEmail: user?.email || undefined,
      });
      success('Abuse report filed for investigation');
      setReportCode('');
      setReportReason('');
    } catch (err: any) {
      toastError(err.message || 'Failed to file report');
    } finally {
      setIsSubmittingReport(false);
    }
  }

  async function handleResolveReport(id: string, status: 'resolved' | 'dismissed', action?: 'disable_link') {
    try {
      await adminApi.resolveAbuseReport(id, status, action);
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      success(action === 'disable_link' ? 'Link disabled and incident resolved' : 'Report updated');
    } catch {
      toastError('Failed to update report');
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Trust & Safety Center
            </h1>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Enterprise domain reputation screening, threat blocklists, and anti-abuse protection.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Security Posture Score
              </span>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {overview.securityScore || 98}%
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </Card>

          <Card className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Blocked Threat Domains
              </span>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {overview.stats?.blockedDomains || 0}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
              <Ban className="w-5 h-5" />
            </div>
          </Card>

          <Card className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Pending Abuse Reports
              </span>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {overview.stats?.pendingReports || 0}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </Card>
        </div>
      )}

      {/* Two Column Layout: Scanner and Report Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Domain Scanner */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-3 flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span>Real-Time Domain Risk Scanner</span>
            </h2>

            <form onSubmit={handleScanDomain} className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="https://suspicious-target.com/..."
                  value={scanUrl}
                  onChange={(e) => setScanUrl(e.target.value)}
                  className="flex-1"
                />
                <Button variant="primary" size="md" type="submit" disabled={isScanning}>
                  {isScanning ? 'Scanning...' : 'Scan Domain'}
                </Button>
              </div>
            </form>

            {scanResult && (
              <div
                className={`p-4 rounded-xl border space-y-2 text-xs ${
                  scanResult.valid && !scanResult.blocked
                    ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <div className="flex items-center gap-1.5">
                    {scanResult.valid && !scanResult.blocked ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600" />
                    )}
                    <span>Verdict: {scanResult.valid && !scanResult.blocked ? 'Clean Domain' : 'Blocked / Risk Detected'}</span>
                  </div>
                  <Badge variant={scanResult.valid && !scanResult.blocked ? 'success' : 'danger'}>
                    {scanResult.valid && !scanResult.blocked ? 'SAFE' : 'RESTRICTED'}
                  </Badge>
                </div>
                <p className="text-[11px] font-mono leading-relaxed">
                  Hostname: {scanResult.hostname || 'Unresolvable'}
                  {scanResult.reason && ` • Reason: ${scanResult.reason}`}
                </p>
              </div>
            )}
          </Card>

          {/* Audit Logs */}
          {overview?.recentAuditLogs && (
            <Card className="p-6 space-y-4">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Recent Platform Audit Trail</span>
              </h2>

              <div className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
                {overview.recentAuditLogs.map((log: any) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {log.action}
                      </span>
                      <p className="text-[11px] text-neutral-500 font-mono">
                        Actor: {log.userEmail} • Target: {log.resourceType}/{log.resourceId}
                      </p>
                    </div>
                    <span className="text-[11px] text-neutral-400">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: File Abuse Report & Admin Moderation */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Report Suspicious Link</span>
            </h2>

            <form onSubmit={handleSubmitAbuse} className="space-y-3">
              <Input
                label="Short Code or Alias"
                placeholder="e.g. promo2026 or flash-sale"
                value={reportCode}
                onChange={(e) => setReportCode(e.target.value)}
                required
              />
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Reason for Report
                </label>
                <textarea
                  placeholder="Explain phishing, malware, or policy violation..."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  rows={3}
                  required
                  className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <Button variant="primary" size="md" type="submit" disabled={isSubmittingReport} className="w-full min-h-[44px]">
                {isSubmittingReport ? 'Submitting...' : 'Submit Incident Report'}
              </Button>
            </form>
          </Card>

          {/* Admin Moderation Queue (only visible to admin) */}
          {user?.role === 'admin' && (
            <Card className="p-6 space-y-4">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-3 flex items-center justify-between">
                <span>Incident Queue ({reports.filter((r) => r.status === 'pending').length} pending)</span>
                <Badge variant="warning">Admin Only</Badge>
              </h2>

              {reports.length === 0 ? (
                <p className="text-xs text-neutral-500">No abuse reports in queue.</p>
              ) : (
                <div className="space-y-3 text-xs">
                  {reports.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-neutral-900 dark:text-white">
                          /{r.shortCode}
                        </span>
                        <Badge variant={r.status === 'pending' ? 'warning' : 'default'}>
                          {r.status}
                        </Badge>
                      </div>
                      <p className="text-neutral-600 dark:text-neutral-400 text-[11px]">
                        {r.reason}
                      </p>
                      {r.status === 'pending' && (
                        <div className="flex gap-2 pt-1">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleResolveReport(r.id, 'resolved', 'disable_link')}
                            className="text-[11px] py-1"
                          >
                            Disable Link
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResolveReport(r.id, 'dismissed')}
                            className="text-[11px] py-1"
                          >
                            Dismiss
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
