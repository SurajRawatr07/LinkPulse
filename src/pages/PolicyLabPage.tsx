import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Play,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Clock,
  Ban,
  Smartphone,
  Laptop,
  Tablet,
  Bot,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { linksApi, policyLabApi } from '../lib/api';
import { Link as LinkType } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { getBaseShortUrl } from '../lib/utils';

export function PolicyLabPage() {
  const { user } = useAuthStore();
  const { error: toastError, success } = useToastStore();

  const [links, setLinks] = useState<LinkType[]>([]);
  const [selectedLinkId, setSelectedLinkId] = useState<string>('');
  const [device, setDevice] = useState<'desktop' | 'ios' | 'android' | 'tablet' | 'bot'>('desktop');
  const [country, setCountry] = useState('US');
  const [simulatedPassword, setSimulatedPassword] = useState('');
  const [simulatedClicks, setSimulatedClicks] = useState<number | ''>('');
  const [simulatedIsActive, setSimulatedIsActive] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  useEffect(() => {
    async function loadUserLinks() {
      if (!user) return;
      try {
        const data = await linksApi.getLinks();
        setLinks(data);
        if (data.length > 0) {
          setSelectedLinkId(data[0].id);
        }
      } catch {
        toastError('Failed to fetch links for Policy Lab');
      }
    }
    loadUserLinks();
  }, [user]);

  const activeLink = links.find((l) => l.id === selectedLinkId);

  async function handleRunSimulation() {
    if (!selectedLinkId && !activeLink) return;
    setIsSimulating(true);

    try {
      const res = await policyLabApi.simulate({
        linkId: selectedLinkId,
        device,
        country,
        providedPassword: simulatedPassword.trim() || undefined,
        simulatedClicksCount: typeof simulatedClicks === 'number' ? simulatedClicks : undefined,
        simulatedIsActive,
      });

      setSimulationResult(res);
      success('Policy evaluation completed');
    } catch (err: any) {
      toastError(err.message || 'Simulation execution failed');
    } finally {
      setIsSimulating(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
              <Sliders className="w-4 h-4" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Policy Lab & Redirect Simulator
            </h1>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Simulate real redirect engine policies across mobile platforms, geolocation rules, and quota thresholds.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Matrix */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 space-y-5">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-3">
              1. Select Target Link
            </h2>

            {links.length === 0 ? (
              <p className="text-xs text-neutral-500">
                No links available. Create a short link first to test redirect policies.
              </p>
            ) : (
              <div className="space-y-3">
                <Select
                  label="Short Link"
                  value={selectedLinkId}
                  onChange={(e) => {
                    setSelectedLinkId(e.target.value);
                    setSimulationResult(null);
                  }}
                  options={links.map((l) => ({
                    value: l.id,
                    label: `/${l.shortCode} — ${l.title || l.originalUrl}`,
                  }))}
                />

                {activeLink && (
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500">Destination:</span>
                      <span className="text-neutral-900 dark:text-white truncate max-w-[200px]">
                        {activeLink.originalUrl}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500">Current Clicks:</span>
                      <span className="text-neutral-900 dark:text-white font-semibold">
                        {activeLink.clicksCount} {activeLink.rules?.clickLimit ? `/ ${activeLink.rules.clickLimit}` : ''}
                      </span>
                    </div>
                    {activeLink.rules?.password && (
                      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-[11px]">
                        <Lock className="w-3 h-3" />
                        <span>Protected by password</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card className="p-6 space-y-5">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-3">
              2. Simulation Parameters
            </h2>

            {/* Device selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Visitor Device / Platform
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'desktop', label: 'Desktop', icon: Laptop },
                  { id: 'ios', label: 'iPhone (iOS)', icon: Smartphone },
                  { id: 'android', label: 'Android', icon: Smartphone },
                  { id: 'tablet', label: 'iPad/Tablet', icon: Tablet },
                  { id: 'bot', label: 'Bot / Crawler', icon: Bot },
                ].map((d) => {
                  const Icon = d.icon;
                  const isSelected = device === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDevice(d.id as any)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900 shadow-xs'
                          : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <Icon className="w-4 h-4 mb-1" />
                      <span className="text-[11px] truncate">{d.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Country Selector */}
            <Select
              label="Simulated Geo Location"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              options={[
                { value: 'US', label: 'United States (US)' },
                { value: 'GB', label: 'United Kingdom (GB)' },
                { value: 'DE', label: 'Germany (DE)' },
                { value: 'FR', label: 'France (FR)' },
                { value: 'CA', label: 'Canada (CA)' },
                { value: 'JP', label: 'Japan (JP)' },
                { value: 'IN', label: 'India (IN)' },
                { value: 'SG', label: 'Singapore (SG)' },
              ]}
            />

            {/* Simulated Password Input */}
            <Input
              label="Simulated Password Attempt"
              type="password"
              placeholder="Enter password to test challenge..."
              value={simulatedPassword}
              onChange={(e) => setSimulatedPassword(e.target.value)}
            />

            {/* Simulated Clicks Override */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Override Clicks Count (Test Quota Caps)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Keep real clicks"
                  value={simulatedClicks}
                  onChange={(e) => setSimulatedClicks(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  className="flex-1 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs"
                />
                {activeLink?.rules?.clickLimit && (
                  <button
                    type="button"
                    onClick={() => setSimulatedClicks(activeLink.rules.clickLimit!)}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 rounded-lg cursor-pointer"
                  >
                    Set at 100%
                  </button>
                )}
              </div>
            </div>

            {/* Status toggle */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Link Active State
              </span>
              <button
                type="button"
                onClick={() => setSimulatedIsActive(!simulatedIsActive)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                  simulatedIsActive ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-300 dark:bg-neutral-700'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white dark:bg-neutral-900 transition-transform ${
                    simulatedIsActive ? 'translate-x-4.5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleRunSimulation}
              disabled={isSimulating || !activeLink}
              className="w-full min-h-[44px]"
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  <span>Evaluating Engine Rules...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  <span>Execute Simulation</span>
                </>
              )}
            </Button>
          </Card>
        </div>

        {/* Right Column: Execution Decision & Trace */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 space-y-5">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-3 flex items-center justify-between">
              <span>Simulation Results & Policy Verdict</span>
              {simulationResult && (
                <span className="font-mono text-[11px] text-neutral-400 font-normal">
                  Trace ID: {simulationResult.traceId || 'sim-live'}
                </span>
              )}
            </h2>

            {!simulationResult ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                  <Sliders className="w-6 h-6 stroke-[1.8]" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  No simulation executed yet
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Configure the device platform, country, and test overrides on the left, then click Execute Simulation.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Decision Banner */}
                <div
                  className={`p-5 rounded-2xl border flex items-start gap-3.5 ${
                    simulationResult.decision === 'redirect' || simulationResult.status === 'success'
                      ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900'
                      : simulationResult.status === 'password_required'
                      ? 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900'
                      : 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900'
                  }`}
                >
                  <div className="mt-0.5">
                    {simulationResult.decision === 'redirect' || simulationResult.status === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : simulationResult.status === 'password_required' ? (
                      <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    )}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-neutral-900 dark:text-white capitalize">
                        Verdict: {simulationResult.decision || simulationResult.status}
                      </span>
                      <Badge
                        variant={
                          simulationResult.status === 'success' || simulationResult.decision === 'redirect'
                            ? 'success'
                            : 'warning'
                        }
                      >
                        HTTP {simulationResult.httpStatus || (simulationResult.status === 'success' ? 302 : 403)}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      {simulationResult.reason || 'Redirect condition fulfilled successfully.'}
                    </p>
                  </div>
                </div>

                {/* Resolved Destination URL */}
                {simulationResult.resolvedDestination && (
                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1.5 font-mono text-xs">
                    <span className="text-[11px] font-sans text-neutral-400 uppercase font-semibold">
                      Final Evaluated Destination:
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-neutral-900 dark:text-white font-medium break-all">
                        {simulationResult.resolvedDestination}
                      </span>
                      <a
                        href={simulationResult.resolvedDestination}
                        target="_blank"
                        rel="noreferrer"
                        className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white shrink-0 p-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Step-by-Step Policy Evaluation Pipeline */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Engine Evaluation Pipeline
                  </h4>

                  <div className="space-y-2 text-xs">
                    {[
                      {
                        step: '1. Domain Safety Check',
                        passed: simulationResult.status !== 'blocked',
                        detail: 'Verified destination hostname against safety blocklist.',
                      },
                      {
                        step: '2. Link Active Status',
                        passed: simulationResult.status !== 'disabled',
                        detail: simulatedIsActive ? 'Link is active.' : 'Halted: Link is disabled.',
                      },
                      {
                        step: '3. Expiration Schedule',
                        passed: simulationResult.status !== 'expired',
                        detail: activeLink?.rules?.expiresAt
                          ? `Scheduled: ${new Date(activeLink.rules.expiresAt).toLocaleString()}`
                          : 'No scheduled expiration.',
                      },
                      {
                        step: '4. Visit Quota Check',
                        passed: simulationResult.status !== 'limit_reached',
                        detail: activeLink?.rules?.clickLimit
                          ? `Quota: ${activeLink.rules.clickLimit} max clicks.`
                          : 'Unlimited clicks allowed.',
                      },
                      {
                        step: '5. Access Password Challenge',
                        passed: simulationResult.status !== 'password_required' && simulationResult.status !== 'password_invalid',
                        detail: activeLink?.rules?.password ? 'Password challenge evaluated.' : 'No password required.',
                      },
                      {
                        step: '6. Device & Geo Targeting',
                        passed: true,
                        detail: `Target platform evaluated: ${device.toUpperCase()} (${country}).`,
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                            {item.step}
                          </span>
                          <p className="text-[11px] text-neutral-500">{item.detail}</p>
                        </div>
                        <Badge variant={item.passed ? 'success' : 'danger'}>
                          {item.passed ? 'PASS' : 'STOP'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
