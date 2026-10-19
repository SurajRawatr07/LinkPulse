import React, { useEffect, useRef } from 'react';
import {
  X,
  Clock,
  Sliders,
  ShieldAlert,
  FolderKanban,
  QrCode,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

interface AdvancedFeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdvancedFeaturesModal({ isOpen, onClose }: AdvancedFeaturesModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }

    if (isOpen) {
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      // Focus close button for accessible keyboard navigation
      setTimeout(() => closeButtonRef.current?.focus(), 50);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const features = [
    {
      id: 'lifecycle',
      icon: Clock,
      title: 'Smart Link Lifecycle',
      badge: 'Active & Expiry Control',
      route: '/app/lifecycle',
      desc: 'Create and manage short links, configure expiry, and pause or resume links where supported. Monitor time-to-live thresholds and link operational states from a centralized lifecycle view.',
    },
    {
      id: 'policylab',
      icon: Sliders,
      title: 'Policy Lab',
      badge: 'Routing Rule Engine',
      route: '/app/policy-lab',
      desc: 'Preview link policies such as expiry, pause status, click limits, and device targeting. Explain the expected rule outcome transparently so you know exactly where visitors are routed.',
    },
    {
      id: 'trustcenter',
      icon: ShieldAlert,
      title: 'Trust Center',
      badge: 'Pre-Redirect Safety',
      route: '/app/trust-center',
      desc: 'Show available URL safety checks, explain detected warnings, and provide appropriate pause or review actions. Protect your visitors without claiming guaranteed or absolute protection.',
    },
    {
      id: 'campaigns',
      icon: FolderKanban,
      title: 'Campaign Intelligence',
      badge: 'Cohort Organization',
      route: '/app/campaigns',
      desc: 'Organize links into campaigns, compare recorded click events, and filter available analytics. Track verified redirect counts cleanly without fabricated traffic or artificial spikes.',
    },
    {
      id: 'qrstudio',
      icon: QrCode,
      title: 'QR & Bulk Link Studio',
      badge: 'Vector Codes & Batch CSV',
      route: '/app/qr',
      desc: 'Generate QR codes for supported short links and validate CSV files before importing multiple URLs. Batch process campaign links with column verification and duplicate filtering.',
    },
  ];

  function handleFeatureClick(route: string) {
    onClose();
    if (user) {
      navigate(route);
    } else {
      navigate(`/login?redirect=${encodeURIComponent(route)}`);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="features-modal-title"
    >
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/60 dark:bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Box */}
      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-200 transition-colors"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 sm:py-5 border-b border-neutral-200 dark:border-neutral-800 shrink-0 bg-white/95 dark:bg-neutral-900/95">
          <div className="space-y-0.5">
            <h2
              id="features-modal-title"
              className="font-display text-xl sm:text-2xl font-normal text-neutral-900 dark:text-white tracking-tight"
            >
              Explore LinkPulse Features
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Advanced capabilities available in your workspace
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close features modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-7 space-y-4">
          <div className="space-y-3">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.id}
                  className="p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-[#faf9f6] dark:bg-neutral-800/50 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center shrink-0 shadow-2xs">
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <h3 className="font-display text-base sm:text-lg font-medium text-neutral-900 dark:text-neutral-100">
                        {feat.title}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleFeatureClick(feat.route)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <span>Open</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-body pl-12">
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-7 py-3.5 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50/70 dark:bg-neutral-900/70 shrink-0">
          <span>All advanced tools are included with your free LinkPulse account.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
