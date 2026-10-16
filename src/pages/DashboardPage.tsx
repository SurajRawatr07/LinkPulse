import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import {
  Link2,
  MousePointerClick,
  Users,
  Activity,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Plus,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { clicksApi, linksApi, campaignsApi } from '../lib/api';
import { DashboardAnalytics, TimeRange, Campaign, Link as LinkType } from '../types';
import { formatCompactNumber } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';

const DEVICE_COLORS = ['#0f9d8a', '#0284c7', '#f59e0b'];

export function DashboardPage() {
  const { user } = useAuthStore();
  const { success } = useToastStore();
  const navigate = useNavigate();

  // Filters: Period (7d, 30d, 90d) and Campaign
  const [range, setRange] = useState<TimeRange>('30d');
  const [campaignId, setCampaignId] = useState<string>('');

  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [topLinks, setTopLinks] = useState<LinkType[]>([]);
  const [linkAlerts, setLinkAlerts] = useState<LinkType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      if (!user) return;
      setIsLoading(true);
      try {
        const isAdmin = user.role === 'admin';
        const targetUserId = isAdmin ? undefined : user.id;

        const [analyticsData, allLinks, campData] = await Promise.all([
          clicksApi.getDashboardAnalytics({
            range,
            campaignId: campaignId || undefined,
            userId: targetUserId,
            isAdmin,
          }),
          linksApi.getLinks({
            userId: targetUserId,
            campaignId: campaignId || undefined,
          }),
          campaignsApi.getCampaigns(targetUserId),
        ]);

        setAnalytics(analyticsData);
        setCampaigns(campData);

        // Top 5 links by clicks
        const sorted = [...allLinks].sort((a, b) => b.clicksCount - a.clicksCount);
        setTopLinks(sorted.slice(0, 5));

        // Link alerts: Expiring soon (within 7 days), click limit almost reached (>= 85%), or disabled
        const now = Date.now();
        const sevenDays = 7 * 86400000;
        const alerts = allLinks.filter((l) => {
          if (!l.isActive || l.abuseFlag) return true;
          if (l.rules.expiresAt) {
            const exp = new Date(l.rules.expiresAt).getTime();
            if (exp > now && exp - now <= sevenDays) return true;
          }
          if (l.rules.clickLimit && l.clicksCount >= l.rules.clickLimit * 0.85) return true;
          return false;
        });
        setLinkAlerts(alerts.slice(0, 5));
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, [user, range, campaignId]);

  function handleCopy(id: string, shortCode: string) {
    const full = `${window.location.origin}/r/${shortCode}`;
    navigator.clipboard.writeText(full);
    setCopiedId(id);
    success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Filters: Period (7d, 30d, 90d) and Campaign */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {user?.role === 'admin' ? 'Platform Analytics Dashboard' : 'Analytics Dashboard'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {user?.role === 'admin'
              ? 'Platform-wide telemetry and visitor volume'
              : 'Real-time performance metrics for your short links'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period selector */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 text-xs">
            {(['7d', '30d', '90d'] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  range === r
                    ? 'bg-teal-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Campaign Filter */}
          <div className="w-44">
            <Select
              className="text-xs py-1.5 min-h-[38px]"
              options={[
                { value: '', label: 'All Campaigns' },
                ...campaigns.map((c) => ({ value: c.id, label: c.name })),
              ]}
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
            />
          </div>

          <Link to="/app/links/new">
            <Button variant="primary" size="sm" className="text-xs min-h-[38px]">
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Create Link</span>
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-28" />
              </Card>
            ))}
          </div>
          <Card className="p-6">
            <Skeleton className="h-64 w-full" />
          </Card>
        </div>
      ) : !analytics ? (
        <EmptyState
          title="No Analytics Available"
          description="Create your first link to start streaming real-time click events."
          actionLabel="Create Short Link"
          onAction={() => navigate('/app/links/new')}
        />
      ) : (
        <>
          {/* 4 KPI Cards: Total links, Total clicks, Unique visitors, Active links */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 space-y-1">
              <span className="text-xs text-slate-500">Total Links</span>
              <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                {formatCompactNumber(analytics.totalLinks)}
              </p>
              <span className="text-[11px] text-slate-400">Created in workspace</span>
            </Card>

            <Card className="p-4 space-y-1">
              <span className="text-xs text-slate-500">Total Clicks</span>
              <p className="text-2xl font-bold font-mono text-teal-600 dark:text-teal-400 tabular-nums">
                {formatCompactNumber(analytics.totalClicks)}
              </p>
              <span className="text-[11px] text-slate-400">In selected period</span>
            </Card>

            <Card className="p-4 space-y-1">
              <span className="text-xs text-slate-500">Unique Visitors</span>
              <p className="text-2xl font-bold font-mono text-sky-600 dark:text-sky-400 tabular-nums">
                {formatCompactNumber(analytics.uniqueVisitors)}
              </p>
              <span className="text-[11px] text-slate-400">
                {Math.round((analytics.uniqueVisitors / (analytics.totalClicks || 1)) * 100)}% unique ratio
              </span>
            </Card>

            <Card className="p-4 space-y-1">
              <span className="text-xs text-slate-500">Active Links</span>
              <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                {analytics.activeLinks}
              </p>
              <span className="text-[11px] text-emerald-600">Routing traffic</span>
            </Card>
          </div>

          {/* ONLY 3 CHARTS: (1) Clicks over time line, (2) Devices donut, (3) Top referrers bar */}

          {/* Chart 1: Clicks Over Time (Line) */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Clicks Over Time
                </h3>
                <p className="text-xs text-slate-500">Daily click frequency across active links</p>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.clicksOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    stroke="#94a3b8"
                    tickFormatter={(str) => {
                      try {
                        const parts = str.split('-');
                        return `${parts[1]}/${parts[2]}`;
                      } catch {
                        return str;
                      }
                    }}
                  />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="clicks"
                    stroke="#0f9d8a"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Chart 2: Devices (donut) & Chart 3: Top referrers (bar) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chart 2: Devices (donut) */}
            <Card className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Device Breakdown
                </h3>
                <p className="text-xs text-slate-500">Distribution by client hardware</p>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.deviceBreakdown}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                    >
                      {analytics.deviceBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={DEVICE_COLORS[index % DEVICE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: '#fff',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center gap-4 text-xs font-mono">
                {analytics.deviceBreakdown.map((dev, idx) => (
                  <div key={dev.name} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-xs"
                      style={{ backgroundColor: DEVICE_COLORS[idx % DEVICE_COLORS.length] }}
                    />
                    <span>{dev.name}: {dev.percentage}%</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Chart 3: Top referrers (bar) */}
            <Card className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Top Referrers
                </h3>
                <p className="text-xs text-slate-500">Traffic origin domains</p>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.topReferrers} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: '#fff',
                      }}
                    />
                    <Bar dataKey="count" fill="#0f9d8a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="text-xs text-slate-400 font-mono text-center">
                Top visitor acquisition channels
              </div>
            </Card>
          </div>

          {/* 2 TABLES: Top links & Link alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Table 1: Top Links */}
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Top Performing Links
                  </h3>
                  <p className="text-xs text-slate-500">Most clicked short links</p>
                </div>
                <Link to="/app/links">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View all
                  </Button>
                </Link>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {topLinks.map((link) => (
                  <div key={link.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <Link
                        to={`/app/links/${link.id}`}
                        className="font-mono font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                      >
                        /{link.shortCode}
                      </Link>
                      <p className="text-slate-700 dark:text-slate-300 truncate max-w-xs">{link.title}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono font-bold tabular-nums">
                        {formatCompactNumber(link.clicksCount)} clicks
                      </span>
                      <button
                        onClick={() => handleCopy(link.id, link.shortCode)}
                        className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                        title="Copy link"
                      >
                        {copiedId === link.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Table 2: Link Alerts */}
            <Card className="p-5 space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Link Alerts</span>
                </h3>
                <p className="text-xs text-slate-500">Expiring soon, limit almost reached, or disabled</p>
              </div>

              {linkAlerts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  All active links are healthy and within quota limits.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {linkAlerts.map((link) => {
                    const isLimitClose = link.rules.clickLimit && link.clicksCount >= link.rules.clickLimit * 0.85;
                    const isExpSoon = Boolean(link.rules.expiresAt);

                    return (
                      <div key={link.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <Link
                            to={`/app/links/${link.id}`}
                            className="font-mono font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                          >
                            /{link.shortCode}
                          </Link>
                          <p className="text-slate-500 truncate max-w-xs">{link.title}</p>
                        </div>

                        <div className="shrink-0">
                          {!link.isActive || link.abuseFlag ? (
                            <Badge variant="danger" size="sm">Disabled</Badge>
                          ) : isLimitClose ? (
                            <Badge variant="warning" size="sm">Near Limit</Badge>
                          ) : (
                            <Badge variant="warning" size="sm">Expiring Soon</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
