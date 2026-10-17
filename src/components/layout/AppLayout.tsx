import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  Link2,
  BarChart3,
  Link as LinkIcon,
  PlusCircle,
  FileSpreadsheet,
  FolderKanban,
  Tags,
  Settings,
  Shield,
  Users,
  Ban,
  LogOut,
  Sun,
  Moon,
  Menu,
  ChevronRight,
  QrCode,
  Sparkles,
  Sliders,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { ToastContainer } from '../ui/ToastContainer';
import { Drawer } from '../ui/Drawer';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuthStore();
  const { effectiveTheme, toggleTheme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Authentication & role guards
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6] dark:bg-neutral-950">
        <div className="w-8 h-8 border-2 border-neutral-900 dark:border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Admin route guard
  if (location.pathname.startsWith('/admin') && user.role !== 'admin') {
    return <Navigate to="/app/dashboard" replace />;
  }

  const userNav = [
    { label: 'Dashboard', path: '/app/dashboard', icon: BarChart3 },
    { label: 'Links', path: '/app/links', icon: LinkIcon },
    { label: 'Create Link', path: '/app/links/new', icon: PlusCircle },
    { label: 'QR Studio', path: '/app/qr', icon: QrCode },
    { label: 'Link-in-Bio', path: '/app/bio', icon: Sparkles },
    { label: 'Policy Lab', path: '/app/policy-lab', icon: Sliders },
    { label: 'Lifecycle', path: '/app/lifecycle', icon: Clock },
    { label: 'Campaigns', path: '/app/campaigns', icon: FolderKanban },
    { label: 'Tags', path: '/app/tags', icon: Tags },
    { label: 'Bulk Import', path: '/app/links/import', icon: FileSpreadsheet },
    { label: 'Trust & Safety', path: '/app/trust-center', icon: Shield },
    { label: 'Settings', path: '/app/settings', icon: Settings },
  ];

  const adminNav = [
    { label: 'Platform Overview', path: '/admin/overview', icon: BarChart3 },
    { label: 'All Links', path: '/admin/links', icon: LinkIcon },
    { label: 'Users Directory', path: '/admin/users', icon: Users },
    { label: 'Abuse Reports', path: '/admin/abuse', icon: ShieldAlert },
    { label: 'Domain Blocklist', path: '/admin/blocklist', icon: Ban },
  ];

  const currentLabel =
    [...userNav, ...adminNav].find((i) => location.pathname === i.path || (i.path !== '/app/links' && location.pathname.startsWith(i.path)))?.label ||
    'Dashboard';

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs group-hover:bg-black transition-colors">
            <Link2 className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <span className="font-display text-base font-bold tracking-tight text-neutral-900 dark:text-white leading-none block">
              LinkPulse
            </span>
            <span className="text-[10px] text-neutral-500 font-medium">
              Short links, smart insights
            </span>
          </div>
        </Link>
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <p className="px-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
            Workspace
          </p>
          <nav className="space-y-1">
            {userNav.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/app/links' && item.path !== '/app/dashboard' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileDrawerOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 min-h-[44px] text-xs font-medium rounded-xl transition-all whitespace-nowrap',
                    isActive
                      ? 'bg-neutral-900 text-white font-medium shadow-2xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
                  )}
                >
                  <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-white' : 'text-neutral-500')} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {user.role === 'admin' && (
          <div>
            <p className="px-3 text-[11px] font-semibold text-rose-500 uppercase tracking-wider mb-1.5">
              Admin Controls
            </p>
            <nav className="space-y-1">
              {adminNav.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 min-h-[44px] text-xs font-medium rounded-lg transition-colors whitespace-nowrap',
                      isActive
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                    )}
                  >
                    <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400')} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* User profile footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {user.name}
              </span>
              <Badge variant={user.role === 'admin' ? 'danger' : 'info'} size="sm">
                {user.role}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
              {user.email}
            </p>
          </div>

          <button
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            title="Log out"
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans">
      {/* Desktop Sidebar (240px) */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-[#faf9f6] dark:bg-neutral-900/90 z-20">
        <NavContent />
      </aside>

      {/* Mobile Drawer */}
      <Drawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        title="Menu"
      >
        <NavContent />
      </Drawer>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-14 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-500 dark:text-neutral-400 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 truncate">
              <span className="hidden sm:inline">Workspace</span>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400 hidden sm:inline" />
              <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                {currentLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              {effectiveTheme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
