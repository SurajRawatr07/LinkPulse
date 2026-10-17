import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Lock,
  Calendar,
  Smartphone,
  AlertTriangle,
  Download,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  Power,
  BarChart2,
  Clock,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { linksApi, clicksApi, policyLabApi } from '../lib/api';
import { useToastStore } from '../store/useToastStore';
import { Link as LinkType, ClickEvent, AnalyticsSummary } from '../types';
import { formatCompactNumber, cn, getBaseShortUrl } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { ConfirmDialog } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';

export function LinkDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToastStore();

  const [link, setLink] = useState<LinkType | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [clickLog, setClickLog] = useState<ClickEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active tab: 'overview' | 'analytics' | 'rules' | 'qr' | 'logs'
  const [activeTab, setActiveTab] = useState('overview');

  // QR Customizer state
  const [qrFgColor, setQrFgColor] = useState('#171717');
  const [qrBgColor, setQrBgColor] = useState('#ffffff');
  const [qrSize, setQrSize] = useState(200);

  // Delete modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadLinkDetails() {
      if (!id) return;
      setIsLoading(true);
      try {
        const [linkData, analyticsData, recentClicks] = await Promise.all([
          linksApi.getLinkById(id),
          clicksApi.getAnalytics({ range: '30d', linkId: id }),
          clicksApi.getLinkClicks(id, 50),
        ]);

        if (!linkData) {
          toastError('Link not found');
          navigate('/app/links');
          return;
        }

        setLink(linkData);
        setAnalytics(analyticsData);
        setClickLog(recentClicks);
      } catch {
        toastError('Failed to load link data');
      } finally {
        setIsLoading(false);
      }
    }

    loadLinkDetails();
  }, [id, navigate]);

  function handleCopy() {
    if (!link) return;
    const full = `${getBaseShortUrl()}/r/${link.shortCode}`;
    navigator.clipboard.writeText(full);
    setCopied(true);
    success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleToggleActive() {
    if (!link) return;
    try {
      const updated = await linksApi.updateLink(link.id, { isActive: !link.isActive });
      setLink(updated);
      success(updated.isActive ? 'Link enabled' : 'Link disabled');
    } catch {
      toastError('Failed to update status');
    }
  }

  async function handleDelete() {
    if (!link) return;
    try {
      await linksApi.deleteLink(link.id);
      success('Link deleted');
      navigate('/app/links');
    } catch {
      toastError('Failed to delete link');
    }
  }

  function handleDownloadSvg() {
    const svgEl = document.getElementById('qr-svg-code');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const linkEl = document.createElement('a');
    linkEl.href = url;
    linkEl.download = `linkpulse-qr-${link?.shortCode}.svg`;
    document.body.appendChild(linkEl);
    linkEl.click();
    document.body.removeChild(linkEl);
    success('QR Code downloaded as SVG');
  }

  if (isLoading || !link) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-60" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const fullShortUrl = `${getBaseShortUrl()}/r/${link.shortCode}`;

  return (
    <div className="space-y-6">
      {/* Back button & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/app/links"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-bold text-neutral-900 dark:text-white">
                /{link.shortCode}
              </span>
              {!link.isActive ? (
                <Badge variant="danger" size="sm">Disabled</Badge>
              ) : (
                <Badge variant="success" size="sm">Active</Badge>
              )}
            </div>
            <h1 className="text-sm font-semibold text-neutral-900 dark:text-white truncate mt-0.5">
              {link.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} className="text-xs">
            {copied ? <Check className="w-3.5 h-3.5 mr-1 text-neutral-900 dark:text-white" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            <span>{copied ? 'Copied' : 'Copy URL'}</span>
          </Button>

          <a href={fullShortUrl} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" className="text-xs">
              <ExternalLink className="w-3.5 h-3.5 mr-1" />
              <span>Test Redirect</span>
            </Button>
          </a>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleActive}
            className="text-xs"
          >
            <Power className="w-3.5 h-3.5 mr-1" />
            <span>{link.isActive ? 'Disable' : 'Enable'}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteConfirmOpen(true)}
            className="text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Target Destination URL Card */}
      <Card className="p-4 bg-neutral-50 dark:bg-neutral-900/60 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 truncate mr-4">
          <span className="text-neutral-400 font-sans font-medium shrink-0">Destination:</span>
          <span className="text-neutral-700 dark:text-neutral-300 truncate">{link.originalUrl}</span>
        </div>
        <span className="text-neutral-400 text-[11px] shrink-0 font-sans">
          Created {new Date(link.createdAt).toLocaleDateString()}
        </span>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <span className="text-xs text-neutral-500">Total Visits</span>
          <p className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white">
            {formatCompactNumber(link.clicksCount)}
          </p>
          <span className="text-[11px] text-neutral-700 dark:text-neutral-300 font-mono">
            {link.uniqueClicksCount} unique visitors
          </span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-xs text-neutral-500">QR Code Scans</span>
          <p className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white">
            {link.qrScansCount}
          </p>
          <span className="text-[11px] text-neutral-500">
            {Math.round((link.qrScansCount / (link.clicksCount || 1)) * 100)}% of total volume
          </span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-xs text-neutral-500">Security Invariant</span>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">
            {link.rules.password ? 'Protected' : 'Open'}
          </p>
          <span className="text-[11px] text-neutral-500">
            {link.rules.clickLimit ? `Limit: ${link.rules.clickLimit} cap` : 'Uncapped clicks'}
          </span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-xs text-neutral-500">Safety Status</span>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">
            {link.abuseStatus === 'clean' ? 'Verified' : 'Flagged'}
          </p>
          <span className="text-[11px] text-neutral-500">Domain blocklist checked</span>
        </Card>
      </div>

      {/* Tabs navigation */}
      <Tabs
        tabs={[
          { id: 'overview', label: 'Overview & Charts' },
          { id: 'rules', label: 'Redirect Rules' },
          { id: 'qr', label: 'QR Code Studio' },
          { id: 'logs', label: `Click Log (${clickLog.length})` },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* TAB 1: Overview & Charts */}
      {activeTab === 'overview' && analytics && (
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Clicks Over Last 30 Days
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.clicksOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="linkDetailGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#171717" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#171717" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#737373" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#737373" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171717',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                  />
                  <Area type="monotone" dataKey="clicks" stroke="#171717" strokeWidth={2} fill="url(#linkDetailGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Top Referrers
              </h3>
              <div className="space-y-2 text-xs">
                {analytics.referrers.map((ref: { name: string; count: number; percentage: number }) => (
                  <div key={ref.name} className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400 truncate max-w-xs">{ref.name}</span>
                    <span className="font-mono tabular-nums">{ref.count}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Device Distribution
              </h3>
              <div className="space-y-2 text-xs">
                {analytics.devices.map((dev: { name: string; count: number; percentage: number }) => (
                  <div key={dev.name} className="flex items-center justify-between">
                    <span className="capitalize text-slate-600 dark:text-slate-400">{dev.name}</span>
                    <span className="font-mono tabular-nums">{dev.count} ({dev.percentage}%)</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: Rules */}
      {activeTab === 'rules' && (
        <Card className="p-6 space-y-6 max-w-2xl">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            Active Configuration Rules
          </h3>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-medium text-slate-600 dark:text-slate-400">Password Access:</span>
              <span className="font-mono">
                {link.rules.password ? `Enabled (${link.rules.password})` : 'Disabled'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-medium text-slate-600 dark:text-slate-400">Expiration Date:</span>
              <span className="font-mono">
                {link.rules.expiresAt ? new Date(link.rules.expiresAt).toLocaleString() : 'Never'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-medium text-slate-600 dark:text-slate-400">Visitor Click Limit:</span>
              <span className="font-mono">
                {link.rules.clickLimit ? `${link.rules.clickLimit} clicks` : 'Unlimited'}
              </span>
            </div>

            <div className="space-y-2 py-2">
              <span className="font-medium text-slate-600 dark:text-slate-400">Device Routing Targets:</span>
              {link.rules.deviceTargeting && Object.keys(link.rules.deviceTargeting).length > 0 ? (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg space-y-1.5 font-mono text-[11px]">
                  {link.rules.deviceTargeting.ios && <p>iOS: {link.rules.deviceTargeting.ios}</p>}
                  {link.rules.deviceTargeting.android && <p>Android: {link.rules.deviceTargeting.android}</p>}
                  {link.rules.deviceTargeting.desktop && <p>Desktop: {link.rules.deviceTargeting.desktop}</p>}
                </div>
              ) : (
                <p className="text-slate-400">No device targeting rules configured.</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* TAB 3: QR Studio */}
      {activeTab === 'qr' && (
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Visual Canvas */}
            <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
              <div
                style={{ backgroundColor: qrBgColor, padding: '16px', borderRadius: '12px' }}
                className="shadow-sm"
              >
                <QRCodeSVG
                  id="qr-svg-code"
                  value={`${fullShortUrl}?src=qr`}
                  size={qrSize}
                  fgColor={qrFgColor}
                  bgColor={qrBgColor}
                  level="H"
                />
              </div>
              <p className="mt-4 text-xs font-mono text-slate-400">
                Encodes: {fullShortUrl}?src=qr
              </p>
            </div>

            {/* Customizer settings */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Customize QR Output
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Foreground Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={qrFgColor}
                      onChange={(e) => setQrFgColor(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                    />
                    <span className="font-mono">{qrFgColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Background Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={qrBgColor}
                      onChange={(e) => setQrBgColor(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                    />
                    <span className="font-mono">{qrBgColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Size: {qrSize}px
                  </label>
                  <input
                    type="range"
                    min="120"
                    max="300"
                    step="10"
                    value={qrSize}
                    onChange={(e) => setQrSize(Number(e.target.value))}
                    className="w-full accent-neutral-900"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
                <Button variant="primary" size="sm" onClick={handleDownloadSvg}>
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  <span>Download SVG</span>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 4: Click History Logs */}
      {activeTab === 'logs' && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-800/80 text-neutral-500 font-semibold uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Referrer</th>
                  <th className="py-3 px-4">Device & OS</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4 text-right">Bot Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {clickLog.map((event) => (
                  <tr key={event.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                    <td className="py-3 px-4 font-mono text-[11px] text-neutral-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 truncate max-w-xs text-neutral-700 dark:text-neutral-300">
                      {event.referrer}
                    </td>
                    <td className="py-3 px-4 capitalize">
                      {event.deviceType} · {event.os}
                    </td>
                    <td className="py-3 px-4">
                      {event.city ? `${event.city}, ` : ''}{event.country}
                    </td>
                    <td className="py-3 px-4 uppercase text-[10px] font-mono font-semibold">
                      {event.source}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {event.isBot ? (
                        <Badge variant="warning" size="sm">Bot Crawler</Badge>
                      ) : (
                        <span className="text-neutral-900 dark:text-white font-medium text-[11px]">Human</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Short Link"
        message={`Are you sure you want to delete /${link.shortCode}? Traffic to this short code will return 404.`}
        confirmLabel="Delete Permanently"
        isDestructive
      />
    </div>
  );
}
