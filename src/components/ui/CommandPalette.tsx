import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Link as LinkIcon,
  PlusCircle,
  BarChart3,
  QrCode,
  Sparkles,
  FolderKanban,
  Tags,
  Settings,
  Shield,
  Sun,
  Moon,
  ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { linksApi } from '../../lib/api';
import { Link } from '../../types';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [links, setLinks] = useState<Link[]>([]);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toggleTheme } = useThemeStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && user) {
      linksApi.getLinks({ userId: user.role === 'admin' ? undefined : user.id }).then(setLinks);
    }
  }, [isOpen, user]);

  const actions = useMemo(() => {
    const list = [
      { id: 'create', title: 'Create New Link', icon: PlusCircle, path: '/app/links/new', group: 'Actions' },
      { id: 'dashboard', title: 'Analytics Dashboard', icon: BarChart3, path: '/app/dashboard', group: 'Navigation' },
      { id: 'links', title: 'All Short Links', icon: LinkIcon, path: '/app/links', group: 'Navigation' },
      { id: 'campaigns', title: 'Campaigns', icon: FolderKanban, path: '/app/campaigns', group: 'Navigation' },
      { id: 'tags', title: 'Tags Management', icon: Tags, path: '/app/tags', group: 'Navigation' },
      { id: 'qr', title: 'QR Code Studio', icon: QrCode, path: '/app/qr', group: 'Navigation' },
      { id: 'bio', title: 'Link-in-Bio Builder', icon: Sparkles, path: '/app/bio', group: 'Navigation' },
      { id: 'settings', title: 'Settings & Workspace', icon: Settings, path: '/app/settings', group: 'Navigation' },
      {
        id: 'theme',
        title: 'Toggle Dark / Light Theme',
        icon: Sun,
        action: () => toggleTheme(),
        group: 'Preferences',
      },
    ];

    if (user?.role === 'admin') {
      list.push(
        { id: 'admin-overview', title: 'Admin Overview', icon: Shield, path: '/admin/overview', group: 'Admin' },
        { id: 'admin-links', title: 'Admin Links & Moderation', icon: Shield, path: '/admin/links', group: 'Admin' },
        { id: 'admin-users', title: 'Admin Users Directory', icon: Shield, path: '/admin/users', group: 'Admin' },
        { id: 'admin-blocklist', title: 'Admin Domain Blocklist', icon: Shield, path: '/admin/blocklist', group: 'Admin' },
        { id: 'admin-abuse', title: 'Admin Abuse Queue', icon: Shield, path: '/admin/abuse', group: 'Admin' }
      );
    }

    return list;
  }, [user, toggleTheme]);

  const filteredActions = useMemo(() => {
    if (!query.trim()) return actions;
    const q = query.toLowerCase();
    return actions.filter((a) => a.title.toLowerCase().includes(q) || a.group.toLowerCase().includes(q));
  }, [actions, query]);

  const filteredLinks = useMemo(() => {
    if (!query.trim()) return links.slice(0, 5);
    const q = query.toLowerCase();
    return links
      .filter((l) => l.title.toLowerCase().includes(q) || l.shortCode.toLowerCase().includes(q) || l.originalUrl.toLowerCase().includes(q))
      .slice(0, 6);
  }, [links, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4">
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0 mr-3" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command, page, or search your links..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500">
            ESC
          </kbd>
        </div>

        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredActions.length > 0 && (
            <div className="py-2">
              <p className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Quick Actions
              </p>
              {filteredActions.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setIsOpen(false);
                      if (item.action) {
                        item.action();
                      } else if (item.path) {
                        navigate(item.path);
                      }
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-slate-400 group-hover:text-teal-600" />
                      <span className="font-medium">{item.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{item.group}</span>
                  </button>
                );
              })}
            </div>
          )}

          {filteredLinks.length > 0 && (
            <div className="py-2">
              <p className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Matching Links
              </p>
              {filteredLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => {
                    setIsOpen(false);
                    navigate(`/app/links/${link.id}`);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-teal-600 dark:text-teal-400 font-medium shrink-0">
                      /{link.shortCode}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 truncate">{link.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 shrink-0">
                    <span className="font-mono text-[11px] tabular-nums">{link.clicksCount} clicks</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {filteredActions.length === 0 && filteredLinks.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching commands or links found for "{query}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
