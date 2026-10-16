import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Key,
  Sun,
  Moon,
  Laptop,
  RotateCcw,
  Shield,
  Copy,
  Check,
  Building,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { useToastStore } from '../store/useToastStore';
import { systemApi } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ConfirmDialog } from '../components/ui/Modal';

export function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { success, error: toastError } = useToastStore();

  const [workspaceName, setWorkspaceName] = useState(user?.workspaceName || 'TechFlow HQ');
  const [apiKey, setApiKey] = useState('lp_live_9f81a7b8e2194d2093e1a0b5f67');
  const [copiedKey, setCopiedKey] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setUser({ ...user, workspaceName });
    success('Workspace settings updated');
  }

  function handleRegenerateApiKey() {
    const newKey = `lp_live_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    setApiKey(newKey);
    success('New API key generated');
  }

  function handleCopyApiKey() {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    success('API key copied to clipboard');
    setTimeout(() => setCopiedKey(false), 2000);
  }

  async function handleResetDemoData() {
    setIsResetting(true);
    try {
      await systemApi.resetDemoData();
      success('Demo data restored to initial state');
      setResetModalOpen(false);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch {
      toastError('Failed to reset demo data');
      setIsResetting(false);
    }
  }

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Settings & Workspace
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage workspace settings, appearance preferences, API credentials, and demo data
        </p>
      </div>

      {/* Profile & Workspace */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-teal-600" />
          <span>User Profile & Workspace</span>
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name" value={user.name} disabled />
            <Input label="Email Address" value={user.email} disabled />
          </div>

          <Input
            label="Workspace Name"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
          />

          <div className="pt-2 flex justify-end">
            <Button type="submit" variant="primary" size="sm">
              Save Workspace
            </Button>
          </div>
        </form>
      </Card>

      {/* Appearance & Theming */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
          Appearance & Theme
        </h3>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Theme Mode
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'system', label: 'System', icon: Laptop },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = theme === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTheme(item.id as 'light' | 'dark' | 'system')}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 mb-1.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* API Key Placeholder */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <Key className="w-4 h-4 text-teal-600" />
          <span>Developer API Token</span>
        </h3>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input value={apiKey} readOnly isMono className="text-xs" />
            <Button variant="outline" size="md" onClick={handleCopyApiKey} className="shrink-0 text-xs">
              {copiedKey ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="md" onClick={handleRegenerateApiKey} className="shrink-0 text-xs">
              Roll Key
            </Button>
          </div>
          <p className="text-[11px] text-slate-500">
            Use this token in Authorization: Bearer headers for programmatic URL creation and webhook ingestion.
          </p>
        </div>
      </Card>

      {/* Reset Demo Data */}
      <Card className="p-6 space-y-4 border-rose-200 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10">
        <div>
          <h3 className="text-sm font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            <span>Reset Demo Store & Analytics</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Restores the mock database back to original seed data (~40 links, 3 users, campaigns, blocklist, and ~3,000 realistic click events).
          </p>
        </div>

        <Button
          variant="danger"
          size="sm"
          onClick={() => setResetModalOpen(true)}
          className="text-xs"
        >
          Reset Demo Data to Default
        </Button>
      </Card>

      {/* Reset Confirm Dialog */}
      <ConfirmDialog
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={handleResetDemoData}
        title="Reset All Demo Data"
        message="This will wipe all newly created links and restore the default 40 sample links, campaigns, and ~3,000 click events. Continue?"
        confirmLabel="Reset Everything"
        isDestructive
        isLoading={isResetting}
      />
    </div>
  );
}
