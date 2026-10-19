import React from 'react';
import { Link } from 'react-router-dom';
import { Link2 } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-neutral-950 text-neutral-400 border-t border-neutral-800 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-neutral-800/80">
          {/* Brand Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-white font-display text-lg font-bold tracking-tight hover:opacity-90 transition-opacity"
            >
              <div className="w-7 h-7 rounded-lg bg-white text-neutral-950 flex items-center justify-center font-bold text-xs">
                <Link2 className="w-4 h-4 stroke-[2.4]" />
              </div>
              <span>LinkPulse</span>
            </Link>
            <span className="hidden sm:inline text-neutral-700 py-1">·</span>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-sm sm:py-0.5">
              URL shortening and real-time click intelligence.
            </p>
          </div>

          {/* Quick Footer Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm">
            <Link to="/" className="text-neutral-400 hover:text-white transition-colors">
              Home
            </Link>
            <a href="#how-it-works" className="text-neutral-400 hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#faq" className="text-neutral-400 hover:text-white transition-colors">
              FAQ
            </a>
            <Link to="/login" className="text-neutral-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="text-neutral-300 hover:text-white font-medium transition-colors">
              Get Started
            </Link>
          </div>
        </div>

        {/* Bottom copyright & attribution */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <p className="text-center sm:text-left">
            © {currentYear} LinkPulse. All rights reserved.
          </p>
          <p className="text-center sm:text-right font-mono text-[11px] text-neutral-500">
            Open URL Infrastructure & Analytics
          </p>
        </div>
      </div>
    </footer>
  );
}
