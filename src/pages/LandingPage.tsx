import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Link2,
  ArrowRight,
  MousePointerClick,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  Laptop,
  Globe,
  ChevronDown,
} from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();
  const [quickUrl, setQuickUrl] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  function handleQuickStart(e: React.FormEvent) {
    e.preventDefault();
    if (quickUrl.trim()) {
      navigate(`/register?url=${encodeURIComponent(quickUrl.trim())}`);
    } else {
      navigate('/register');
    }
  }

  const faqs = [
    {
      q: 'How does LinkPulse track link clicks?',
      a: 'Every time someone opens your shortened link, our real-time redirect engine securely logs the timestamp, device platform, operating system, and geographic region before seamlessly directing them to your destination.',
    },
    {
      q: 'Can I protect links with passwords or limits?',
      a: 'Yes. You can protect any link with an encrypted password, specify an expiration date, or set strict maximum click quotas that automatically disable the link once reached.',
    },
    {
      q: 'Are custom short aliases supported?',
      a: 'Yes, you can choose custom memorable short codes (e.g. lp.ee/product-launch) and instantly generate high-resolution QR codes for print and mobile distribution.',
    },
    {
      q: 'Can I import links in bulk from CSV?',
      a: 'Absolutely. Upload CSV spreadsheets with hundreds of URLs at once with automated validation, domain safety verification, and progress reporting.',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-20 overflow-x-hidden">
      {/* 1. Hero Section */}
      <section className="relative w-full overflow-hidden px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 lg:pt-20 pb-12 sm:pb-16 bg-white border-b border-neutral-200/80">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Heading, Subtitle, Form */}
            <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
              <div className="text-xs font-semibold tracking-widest uppercase text-neutral-500 mb-1">
                URL SHORTENER & ANALYTICS PLATFORM
              </div>

              <h1
                style={{ textWrap: 'balance' }}
                className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-normal text-neutral-900 tracking-tight leading-[1.12]"
              >
                Make long links{' '}
                <span className="relative inline-block whitespace-nowrap">
                  <em className="text-[#b45309] not-italic font-normal">short & smart</em>
                </span>
              </h1>

              <div className="max-w-xl space-y-2 text-base sm:text-[17px] text-neutral-600 leading-[1.65] font-body">
                <p>
                  Create clean short links, track real-time click intelligence, and safeguard your audience.
                </p>
                <p>
                  Built with atomic redirect precision, enterprise domain safety, and high-resolution QR generation.
                </p>
              </div>

              {/* Quick URL form */}
              <form
                onSubmit={handleQuickStart}
                className="pt-2 w-full max-w-lg flex flex-col sm:flex-row gap-3"
              >
                <div className="relative flex-1">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                    <Link2 className="w-4.5 h-4.5" />
                  </div>
                  <input
                    type="url"
                    placeholder="https://your-long-website-address.com/..."
                    value={quickUrl}
                    onChange={(e) => setQuickUrl(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-3 min-h-[46px] text-sm rounded-xl border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/15 focus:border-neutral-900 transition-colors shadow-2xs"
                  />
                </div>
                <button
                  type="submit"
                  className="pearl-btn-dark inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 min-h-[46px] text-sm font-semibold whitespace-nowrap cursor-pointer shrink-0"
                >
                  <span>Shorten Link</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="pt-1 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
                <span className="inline-flex items-center gap-1.5 font-medium text-neutral-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900" /> Free to use
                </span>
                <span>·</span>
                <span>No credit card required</span>
                <span>·</span>
                <span>Ready in 10 seconds</span>
              </div>
            </div>

            {/* Right Column: Live Link Visual Card */}
            <div className="lg:col-span-5 flex justify-center w-full">
              <div className="relative w-full max-w-md p-6 sm:p-7 rounded-2xl bg-[#faf9f6] border border-neutral-300/90 shadow-sm space-y-5">
                {/* 1. Long URL card */}
                <div className="p-3.5 rounded-xl border border-neutral-200 bg-white space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 block font-medium">
                    Original Destination URL
                  </span>
                  <p className="font-mono text-neutral-600 text-xs truncate">
                    https://example.com/launches/q4-global-rollout?ref=hackathon
                  </p>
                </div>

                {/* Arrow indicator */}
                <div className="flex items-center justify-center">
                  <div className="w-7 h-7 rounded-full bg-white text-neutral-900 flex items-center justify-center border border-neutral-300 shadow-2xs">
                    <ArrowRight className="w-3.5 h-3.5 rotate-90" />
                  </div>
                </div>

                {/* 2. Short Link Card */}
                <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-900 text-white text-center space-y-1 shadow-sm">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold block">
                    LinkPulse Short Link
                  </span>
                  <p className="font-mono text-lg font-bold text-white tracking-wide">
                    linkpulse.io/r/launch2026
                  </p>
                </div>

                {/* 3. Live Stats Indicator */}
                <div className="pt-1">
                  <div className="flex items-center justify-between text-xs mb-2.5">
                    <span className="font-medium text-neutral-700">
                      Real-Time Activity
                    </span>
                    <span className="font-mono text-[#b45309] font-bold tabular-nums">
                      +1,420 visits logged
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-xl border border-neutral-200 bg-white flex flex-col items-center gap-1.5 text-center">
                      <Smartphone className="w-4 h-4 text-neutral-900" />
                      <span className="text-[11px] text-neutral-600 font-medium">Mobile (64%)</span>
                    </div>

                    <div className="p-3 rounded-xl border border-neutral-200 bg-white flex flex-col items-center gap-1.5 text-center">
                      <Laptop className="w-4 h-4 text-neutral-900" />
                      <span className="text-[11px] text-neutral-600 font-medium">Desktop (31%)</span>
                    </div>

                    <div className="p-3 rounded-xl border border-neutral-200 bg-white flex flex-col items-center gap-1.5 text-center">
                      <Globe className="w-4 h-4 text-neutral-900" />
                      <span className="text-[11px] text-neutral-600 font-medium">Global (18 CTs)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. How It Works (3 Steps) */}
      <section id="how-it-works" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14 space-y-3">
          <div className="text-xs font-semibold tracking-widest uppercase text-neutral-500">
            HOW IT WORKS
          </div>
          <h2
            style={{ textWrap: 'balance' }}
            className="font-display text-2xl sm:text-3xl md:text-4xl font-normal text-neutral-900 tracking-tight leading-[1.15]"
          >
            Three simple steps to{' '}
            <span className="relative inline-block">
              <em className="text-[#b45309] not-italic font-normal">streamline links</em>
            </span>
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 max-w-lg mx-auto">
            Everything you need to turn unwieldy URLs into actionable marketing assets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              title: 'Paste Destination URL',
              desc: 'Enter any long web address. Configure optional custom aliases, click quotas, expiration dates, or passwords.',
            },
            {
              step: '02',
              title: 'Share Anywhere',
              desc: 'Distribute your short URL or download clean vector QR codes for social campaigns, emails, banners, or print.',
            },
            {
              step: '03',
              title: 'Track Click Insights',
              desc: 'Inspect live click events, device breakdowns, referrers, and geolocation metrics on your clean dashboard.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="p-7 rounded-2xl border border-neutral-200/90 bg-[#faf9f6] space-y-4 shadow-2xs hover:border-neutral-300 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white font-mono text-sm font-bold flex items-center justify-center">
                {item.step}
              </div>
              <h3 className="font-display text-xl font-normal text-neutral-900">
                {item.title}
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed font-body">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Core Features Grid */}
      <section id="features" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14 space-y-3">
          <div className="text-xs font-semibold tracking-widest uppercase text-neutral-500">
            PLATFORM CAPABILITIES
          </div>
          <h2
            style={{ textWrap: 'balance' }}
            className="font-display text-2xl sm:text-3xl md:text-4xl font-normal text-neutral-900 tracking-tight leading-[1.15]"
          >
            Built for performance,{' '}
            <span className="relative inline-block">
              <em className="text-[#b45309] not-italic font-normal">reliability & trust</em>
            </span>
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 max-w-lg mx-auto">
            Essential tools designed to give you complete visibility over every click.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 1. Short links */}
          <div className="p-7 rounded-2xl border border-neutral-200/90 bg-[#faf9f6] space-y-4 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
              <Link2 className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-normal text-neutral-900">
              Short Links & Aliases
            </h3>
            <p className="text-sm text-neutral-600 leading-relaxed font-body">
              Convert long parameters into clean, memorable links with custom aliases and optional expiration dates.
            </p>
          </div>

          {/* 2. Click tracking */}
          <div className="p-7 rounded-2xl border border-neutral-200/90 bg-[#faf9f6] space-y-4 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
              <MousePointerClick className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-normal text-neutral-900">
              Click Tracking
            </h3>
            <p className="text-sm text-neutral-600 leading-relaxed font-body">
              Accurate, atomic click counters distinguishing human visitors from automated crawlers in real time.
            </p>
          </div>

          {/* 3. QR codes */}
          <div className="p-7 rounded-2xl border border-neutral-200/90 bg-[#faf9f6] space-y-4 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-normal text-neutral-900">
              Branded QR Codes
            </h3>
            <p className="text-sm text-neutral-600 leading-relaxed font-body">
              Instant high-resolution QR generation for flyers, packaging, menus, and digital displays.
            </p>
          </div>

          {/* 4. Safe links */}
          <div className="p-7 rounded-2xl border border-neutral-200/90 bg-[#faf9f6] space-y-4 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-normal text-neutral-900">
              Safe Links & Blocklist
            </h3>
            <p className="text-sm text-neutral-600 leading-relaxed font-body">
              Pre-redirect domain inspection and spam filtering to block malicious sites before any visitor is harmed.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Live Analytics Demonstration */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl border border-neutral-200/90 bg-[#faf9f6] space-y-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="text-xs font-semibold tracking-widest uppercase text-neutral-500">
                LIVE TRAFFIC ATTRIBUTION
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-normal text-neutral-900">
                Real-time click intelligence
              </h2>
              <p className="text-sm text-neutral-600 max-w-xl">
                Every redirect is logged with device targeting, referrer tracking, and atomic counters backed by PostgreSQL.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-neutral-300 bg-white text-xs font-mono font-medium text-neutral-900 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-neutral-900" />
              Live PostgreSQL Persistence
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Clicks over time preview */}
            <div className="md:col-span-2 p-6 rounded-2xl border border-neutral-200 bg-white space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display text-base font-normal text-neutral-900">
                    Weekly Click Volume
                  </h4>
                  <p className="text-xs text-neutral-500">Continuous 7-day attribution</p>
                </div>
                <span className="text-xs font-mono font-bold text-neutral-900 bg-neutral-100 px-3 py-1 rounded-lg border border-neutral-200">
                  +4,821 Total Visits
                </span>
              </div>

              <div className="h-44 w-full flex items-end gap-3 pt-6 pb-2 px-2 border-b border-neutral-100">
                {[
                  { day: 'Mon', count: 340, height: '42%' },
                  { day: 'Tue', count: 520, height: '64%' },
                  { day: 'Wed', count: 610, height: '75%' },
                  { day: 'Thu', count: 480, height: '59%' },
                  { day: 'Fri', count: 790, height: '96%' },
                  { day: 'Sat', count: 840, height: '100%' },
                  { day: 'Sun', count: 690, height: '84%' },
                ].map((item) => (
                  <div key={item.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-mono font-medium text-neutral-400 group-hover:text-neutral-900 transition-colors">
                      {item.count}
                    </span>
                    <div
                      style={{ height: item.height }}
                      className="w-full max-w-[44px] rounded-t-lg bg-neutral-900 group-hover:bg-neutral-800 transition-all"
                    />
                    <span className="text-xs text-neutral-500 font-medium">{item.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform breakdown */}
            <div className="p-6 rounded-2xl border border-neutral-200 bg-white space-y-5">
              <div>
                <h4 className="font-display text-base font-normal text-neutral-900">
                  Platform Distribution
                </h4>
                <p className="text-xs text-neutral-500">User agents parsed in real time</p>
              </div>

              <div className="space-y-4 pt-1">
                {[
                  { label: 'Mobile (iOS & Android)', pct: '62%', color: 'bg-neutral-900' },
                  { label: 'Desktop (macOS & Windows)', pct: '31%', color: 'bg-neutral-600' },
                  { label: 'Tablet & Others', pct: '7%', color: 'bg-[#b45309]' },
                ].map((d) => (
                  <div key={d.label} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-700 font-medium">{d.label}</span>
                      <span className="font-mono font-bold text-neutral-900">{d.pct}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                      <div className={`h-full rounded-full ${d.color}`} style={{ width: d.pct }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Frequently Asked Questions */}
      <section id="faq" className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-3">
          <div className="text-xs font-semibold tracking-widest uppercase text-neutral-500">
            FAQ
          </div>
          <h2
            style={{ textWrap: 'balance' }}
            className="font-display text-2xl sm:text-3xl md:text-4xl font-normal text-neutral-900 tracking-tight leading-[1.15]"
          >
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={faq.q}
                className="rounded-2xl border border-neutral-200/90 bg-[#faf9f6] overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-display text-base sm:text-lg font-normal text-neutral-900 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-neutral-500 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-sm text-neutral-600 leading-relaxed font-body border-t border-neutral-200/60">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Final Registration Call to Action */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="p-10 sm:p-14 rounded-3xl bg-neutral-900 text-white text-center space-y-6 shadow-xl border border-neutral-800">
          <div className="text-xs font-semibold tracking-widest uppercase text-neutral-400">
            GET STARTED TODAY
          </div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-white">
            Ready to shorten your first link?
          </h2>
          <p className="text-base text-neutral-300 max-w-lg mx-auto font-body">
            Join LinkPulse to create custom links, export branded QR codes, and gain actionable click analytics in seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              className="pearl-btn-pearl inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold cursor-pointer"
              onClick={() => navigate('/register')}
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl px-6 py-3.5 text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-700 transition-colors cursor-pointer"
              onClick={() => navigate('/login')}
            >
              Sign In
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
