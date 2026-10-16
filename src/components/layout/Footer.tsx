import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#000000] text-[#FFFFFF] border-t border-[#27272A] no-underline">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-10 sm:pb-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-12 gap-y-10 gap-x-6 sm:gap-8 lg:gap-6 pb-10 sm:pb-12 border-b border-[#27272A]">
          {/* Brand Info */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-4 space-y-3.5 pr-0 lg:pr-8">
            <Link
              to="/"
              className="font-display text-xl font-bold tracking-tight text-[#FFFFFF] hover:opacity-90 transition-opacity cursor-pointer no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FFFFFF] inline-flex items-center gap-2"
            >
              <div className="w-6 h-6 rounded-md bg-white text-black flex items-center justify-center font-bold text-xs">
                LP
              </div>
              <span>LinkPulse</span>
            </Link>
            <p className="text-sm text-[#A1A1AA] leading-relaxed max-w-sm">
              Fast, dependable URL shortening and click intelligence built for modern teams.
            </p>
          </div>

          {/* Platform */}
          <div className="col-span-1 lg:col-span-2 space-y-3.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#FFFFFF]">
              Platform
            </h3>
            <ul className="space-y-2.5 text-sm text-[#A1A1AA]">
              <li>
                <Link
                  to="/"
                  className="py-0.5 text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors duration-200 cursor-pointer text-left block"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/app/links"
                  className="py-0.5 text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors duration-200 cursor-pointer text-left block"
                >
                  My Links
                </Link>
              </li>
              <li>
                <Link
                  to="/app/links/new"
                  className="py-0.5 text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors duration-200 cursor-pointer text-left block"
                >
                  Create Link
                </Link>
              </li>
            </ul>
          </div>

          {/* Solutions */}
          <div className="col-span-1 lg:col-span-2 space-y-3.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#FFFFFF]">
              Solutions
            </h3>
            <ul className="space-y-2.5 text-sm text-[#A1A1AA]">
              <li>
                <Link
                  to="/app/campaigns"
                  className="py-0.5 text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors duration-200 cursor-pointer text-left block"
                >
                  Campaigns
                </Link>
              </li>
              <li>
                <Link
                  to="/app/analytics"
                  className="py-0.5 text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors duration-200 cursor-pointer text-left block"
                >
                  Analytics
                </Link>
              </li>
              <li>
                <Link
                  to="/app/qr-codes"
                  className="py-0.5 text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors duration-200 cursor-pointer text-left block"
                >
                  QR Codes
                </Link>
              </li>
              <li>
                <Link
                  to="/app/import"
                  className="py-0.5 text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors duration-200 cursor-pointer text-left block"
                >
                  CSV Import
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="col-span-1 lg:col-span-2 space-y-3.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#FFFFFF]">
              Resources
            </h3>
            <ul className="space-y-2.5 text-sm text-[#A1A1AA]">
              <li>
                <a
                  href="#faq"
                  className="py-0.5 text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors duration-200 cursor-pointer text-left block"
                >
                  Frequently Asked Questions
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="py-0.5 text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors duration-200 cursor-pointer text-left block"
                >
                  How It Works
                </a>
              </li>
              <li>
                <Link
                  to="/admin/blocklist"
                  className="py-0.5 text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors duration-200 cursor-pointer text-left block"
                >
                  Safety & Blocklist
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div className="col-span-1 lg:col-span-2 space-y-3.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#FFFFFF]">
              Account
            </h3>
            <ul className="space-y-2.5 text-sm text-[#A1A1AA]">
              <li>
                <Link
                  to="/login"
                  className="py-0.5 text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors duration-200 cursor-pointer text-left block"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="py-0.5 font-medium text-[#FFFFFF] hover:text-[#A1A1AA] transition-colors duration-200 cursor-pointer text-left block"
                >
                  Register
                </Link>
              </li>
              <li>
                <Link
                  to="/app/settings"
                  className="py-0.5 text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors duration-200 cursor-pointer text-left block"
                >
                  Settings
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#A1A1AA]">
          <span className="text-center md:text-left">
            © {currentYear} LinkPulse. All rights reserved.
          </span>
          <span className="text-center text-[#A1A1AA]">
            Open URL Infrastructure & Analytics
          </span>
          <div className="flex items-center gap-3.5 no-underline">
            <span className="text-xs sm:text-sm font-medium text-[#FFFFFF] tracking-wide no-underline">
              Built by LinkPulse Engineering
            </span>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkPulse on GitHub"
                className="inline-flex items-center justify-center rounded-sm text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors duration-200 no-underline"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                  className="w-5 h-5 shrink-0"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z"
                  />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkPulse on LinkedIn"
                className="inline-flex items-center justify-center rounded-sm text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors duration-200 no-underline"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                  className="w-5 h-5 shrink-0"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.778-.773 1.778-1.729V1.73C24 .774 23.205 0 22.225 0z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
