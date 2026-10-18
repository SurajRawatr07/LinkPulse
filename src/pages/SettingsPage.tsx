import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Key,
  Sun,
  Moon,
  Laptop,
  Shield,
  Copy,
  Check,
  Building,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { useToastStore } from '../store/useToastStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { success, error: toastError } = useToastStore();

  const [workspaceName, setWorkspaceName] = useState(user?.workspaceName || 'TechFlow HQ');
  const [apiKey, setApiKey] = useState('lp_live_9f81a7b8e2194d2093e1a0b5f67');
  const [copiedKey, setCopiedKey] = useState(false);

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
          <User className="w-4 h-4 text-neutral-900 dark:text-white" />
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
                      ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs dark:border-white dark:bg-white dark:text-neutral-900'
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
          <Key className="w-4 h-4 text-neutral-900 dark:text-white" />
          <span>Developer API Token</span>
        </h3>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input value={apiKey} readOnly isMono className="text-xs" />
            <Button variant="outline" size="md" onClick={handleCopyApiKey} className="shrink-0 text-xs">
              {copiedKey ? <Check className="w-4 h-4 text-neutral-900 dark:text-white" /> : <Copy className="w-4 h-4" />}
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

      {/* Account Security & Role Status */}
      <Card className="p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-neutral-900 dark:text-white" />
            <span>Account Security & Verified Role</span>
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            Your role is assigned on the server and verified cryptographically on every protected request.
          </p>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs">
          <div>
            <span className="font-medium text-neutral-800 dark:text-neutral-200">Current Role: </span>
            <span className="font-semibold uppercase tracking-wider text-neutral-900 dark:text-white">
              {user.role}
            </span>
          </div>
          <span className="text-[11px] text-neutral-500">
            Account ID: {user.id.slice(-8)}
          </span>
        </div>
      </Card>
    </div>
  );
}
