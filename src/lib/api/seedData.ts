import { Campaign, Tag, Link, ClickEvent, BlocklistEntry, DeviceType, BrowserType, OsType } from '../../types';

export const INITIAL_BLOCKLIST: BlocklistEntry[] = [
  {
    id: 'block_1',
    domain: 'phishing-vault.net',
    reason: 'Verified credential phishing host targeting logins.',
    addedAt: '2026-09-01T10:00:00Z',
    addedBy: 'Security Bot',
  },
  {
    id: 'block_2',
    domain: 'malware-drop.xyz',
    reason: 'Malicious payload delivery scripts.',
    addedAt: '2026-09-15T14:30:00Z',
    addedBy: 'Security Bot',
  },
  {
    id: 'block_3',
    domain: 'crypto-scam-giveaway.co',
    reason: 'Impersonation scam soliciting private credentials.',
    addedAt: '2026-09-20T09:15:00Z',
    addedBy: 'Security Bot',
  },
];

export function createInitialSeedData(targetUserId: string): {
  campaigns: Campaign[];
  tags: Tag[];
  links: Link[];
  clicks: ClickEvent[];
} {
  const campaigns: Campaign[] = [
    {
      id: 'camp_launch',
      userId: targetUserId,
      name: 'Product Launch Q4',
      description: 'Global launch and rollout assets.',
      color: '#0f9d8a',
      createdAt: '2026-09-15T10:00:00Z',
    },
    {
      id: 'camp_deals',
      userId: targetUserId,
      name: 'Holiday Promotions',
      description: 'Discount coupons and seasonal deals.',
      color: '#d97706',
      createdAt: '2026-09-20T11:00:00Z',
    },
    {
      id: 'camp_docs',
      userId: targetUserId,
      name: 'Developer Documentation',
      description: 'Guides and API references.',
      color: '#4f46e5',
      createdAt: '2026-09-25T14:00:00Z',
    },
  ];

  const tags: Tag[] = [
    { id: 'tag_product', userId: targetUserId, name: 'Product', createdAt: '2026-09-15T10:00:00Z' },
    { id: 'tag_marketing', userId: targetUserId, name: 'Marketing', createdAt: '2026-09-15T10:00:00Z' },
    { id: 'tag_docs', userId: targetUserId, name: 'Documentation', createdAt: '2026-09-15T10:00:00Z' },
    { id: 'tag_social', userId: targetUserId, name: 'Social', createdAt: '2026-09-15T10:00:00Z' },
    { id: 'tag_internal', userId: targetUserId, name: 'Internal', createdAt: '2026-09-15T10:00:00Z' },
  ];

  // ~20 links with a mix of active, expired, disabled, password-protected, click-limited
  const links: Link[] = [
    {
      id: 'link_1',
      userId: targetUserId,
      originalUrl: 'https://github.com/facebook/react',
      shortCode: 'react',
      title: 'React Official Repository',
      domain: 'github.com',
      createdAt: '2026-09-16T10:00:00Z',
      updatedAt: '2026-09-16T10:00:00Z',
      isActive: true,
      tags: ['Product', 'Documentation'],
      campaignId: 'camp_docs',
      clicksCount: 342,
      uniqueClicksCount: 290,
      qrScansCount: 38,
      rules: {
        mobileUrl: 'https://m.github.com/facebook/react',
      },
    },
    {
      id: 'link_2',
      userId: targetUserId,
      originalUrl: 'https://vite.dev/guide',
      shortCode: 'vite-docs',
      title: 'Vite Getting Started Guide',
      domain: 'vite.dev',
      createdAt: '2026-09-18T11:00:00Z',
      updatedAt: '2026-09-18T11:00:00Z',
      isActive: true,
      tags: ['Documentation'],
      campaignId: 'camp_docs',
      clicksCount: 215,
      uniqueClicksCount: 184,
      qrScansCount: 12,
      rules: {},
    },
    {
      id: 'link_3',
      userId: targetUserId,
      originalUrl: 'https://tailwindcss.com/docs',
      shortCode: 'tailwind',
      title: 'Tailwind CSS Documentation',
      domain: 'tailwindcss.com',
      createdAt: '2026-09-20T12:00:00Z',
      updatedAt: '2026-09-20T12:00:00Z',
      isActive: true,
      tags: ['Documentation'],
      campaignId: 'camp_docs',
      clicksCount: 180,
      uniqueClicksCount: 155,
      qrScansCount: 8,
      rules: {},
    },
    {
      id: 'link_4',
      userId: targetUserId,
      originalUrl: 'https://example.com/confidential-investor-brief.pdf',
      shortCode: 'investors',
      title: 'Investor Pitch & Confidential Financials',
      domain: 'example.com',
      createdAt: '2026-09-22T09:30:00Z',
      updatedAt: '2026-09-22T09:30:00Z',
      isActive: true,
      tags: ['Internal'],
      clicksCount: 42,
      uniqueClicksCount: 31,
      qrScansCount: 0,
      rules: {
        password: 'Password123!',
      },
    },
    {
      id: 'link_5',
      userId: targetUserId,
      originalUrl: 'https://example.com/deals/flash-50-percent',
      shortCode: 'flash50',
      title: 'Holiday 50% Flash Sale (Expired)',
      domain: 'example.com',
      createdAt: '2026-09-15T08:00:00Z',
      updatedAt: '2026-09-15T08:00:00Z',
      isActive: true,
      tags: ['Marketing'],
      campaignId: 'camp_deals',
      clicksCount: 165,
      uniqueClicksCount: 140,
      qrScansCount: 15,
      rules: {
        expiresAt: '2026-09-30T23:59:59Z', // Expired in past
      },
    },
    {
      id: 'link_6',
      userId: targetUserId,
      originalUrl: 'https://example.com/exclusive-beta-invitation',
      shortCode: 'vipbeta',
      title: 'VIP Private Beta (Click Limited: 50 max)',
      domain: 'example.com',
      createdAt: '2026-09-25T14:20:00Z',
      updatedAt: '2026-09-25T14:20:00Z',
      isActive: true,
      tags: ['Product'],
      campaignId: 'camp_launch',
      clicksCount: 50, // Reached limit!
      uniqueClicksCount: 48,
      qrScansCount: 5,
      rules: {
        clickLimit: 50,
      },
    },
    {
      id: 'link_7',
      userId: targetUserId,
      originalUrl: 'https://example.com/staging-cluster-dashboard',
      shortCode: 'staging-dash',
      title: 'Staging Environment Dashboard (Disabled by Owner)',
      domain: 'example.com',
      createdAt: '2026-09-27T16:00:00Z',
      updatedAt: '2026-09-27T16:00:00Z',
      isActive: false, // Disabled
      tags: ['Internal'],
      clicksCount: 28,
      uniqueClicksCount: 14,
      qrScansCount: 0,
      rules: {},
    },
    {
      id: 'link_8',
      userId: targetUserId,
      originalUrl: 'https://news.ycombinator.com',
      shortCode: 'hackernews',
      title: 'Hacker News Community Discussion',
      domain: 'news.ycombinator.com',
      createdAt: '2026-09-28T08:00:00Z',
      updatedAt: '2026-09-28T08:00:00Z',
      isActive: true,
      tags: ['Social'],
      clicksCount: 110,
      uniqueClicksCount: 95,
      qrScansCount: 7,
      rules: {},
    },
    {
      id: 'link_9',
      userId: targetUserId,
      originalUrl: 'https://twitter.com',
      shortCode: 'x-profile',
      title: 'Company Twitter/X Announcement Feed',
      domain: 'twitter.com',
      createdAt: '2026-09-29T10:00:00Z',
      updatedAt: '2026-09-29T10:00:00Z',
      isActive: true,
      tags: ['Social', 'Marketing'],
      campaignId: 'camp_launch',
      clicksCount: 95,
      uniqueClicksCount: 84,
      qrScansCount: 14,
      rules: {},
    },
    {
      id: 'link_10',
      userId: targetUserId,
      originalUrl: 'https://discord.com',
      shortCode: 'discord-join',
      title: 'Discord Community Server Invitation',
      domain: 'discord.com',
      createdAt: '2026-09-30T11:00:00Z',
      updatedAt: '2026-09-30T11:00:00Z',
      isActive: true,
      tags: ['Social', 'Product'],
      campaignId: 'camp_launch',
      clicksCount: 78,
      uniqueClicksCount: 71,
      qrScansCount: 19,
      rules: {},
    },
  ];

  // Add 10 more links to reach ~20 total
  const additional = [
    { title: 'Substack Newsletter Digest', code: 'newsletter', url: 'https://substack.com', tags: ['Marketing'], camp: 'camp_launch' },
    { title: 'YouTube Architecture Teardown', code: 'youtube-arch', url: 'https://youtube.com', tags: ['Social'], camp: 'camp_docs' },
    { title: 'Product Hunt Launch Day', code: 'producthunt', url: 'https://producthunt.com', tags: ['Marketing', 'Product'], camp: 'camp_launch' },
    { title: 'LinkedIn Careers Portal', code: 'careers', url: 'https://linkedin.com', tags: ['Internal'], camp: undefined },
    { title: 'Figma Brand Guidelines', code: 'figma-brand', url: 'https://figma.com', tags: ['Product'], camp: undefined },
    { title: 'REST API Reference v2', code: 'api-reference', url: 'https://example.com/api/v2', tags: ['Documentation'], camp: 'camp_docs' },
    { title: 'Black Friday VIP Coupon', code: 'bf-vip', url: 'https://example.com/bf', tags: ['Marketing'], camp: 'camp_deals' },
    { title: 'Customer Feedback Survey', code: 'feedback', url: 'https://forms.google.com', tags: ['Product'], camp: undefined },
    { title: 'Weekly Engineering Changelog', code: 'changelog', url: 'https://example.com/changelog', tags: ['Documentation'], camp: 'camp_docs' },
    { title: 'Security Compliance Whitepaper', code: 'soc2', url: 'https://example.com/security.pdf', tags: ['Internal'], camp: undefined },
  ];

  additional.forEach((item, idx) => {
    links.push({
      id: `link_extra_${idx + 1}`,
      userId: targetUserId,
      originalUrl: item.url,
      shortCode: item.code,
      title: item.title,
      domain: new URL(item.url).hostname,
      createdAt: new Date(Date.now() - (28 - idx * 2) * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - (10 - idx * 0.5) * 86400000).toISOString(),
      isActive: true,
      tags: item.tags,
      campaignId: item.camp,
      clicksCount: 40 + (idx * 23) % 90,
      uniqueClicksCount: 35 + (idx * 19) % 80,
      qrScansCount: 4 + idx,
      rules: {},
    });
  });

  // Generate ~1000 realistic ClickEvents over the last 30 days
  const clicks: ClickEvent[] = [];
  const referrers = [
    { name: 'Direct', weight: 30 },
    { name: 'Google', weight: 26 },
    { name: 'Twitter / X', weight: 18 },
    { name: 'LinkedIn', weight: 12 },
    { name: 'GitHub', weight: 8 },
    { name: 'Hacker News', weight: 6 },
  ];

  const devices: Array<{ type: DeviceType; weight: number }> = [
    { type: 'desktop', weight: 58 },
    { type: 'mobile', weight: 36 },
    { type: 'tablet', weight: 6 },
  ];

  const browsers: Array<{ name: BrowserType; weight: number }> = [
    { name: 'Chrome', weight: 60 },
    { name: 'Safari', weight: 24 },
    { name: 'Firefox', weight: 10 },
    { name: 'Edge', weight: 6 },
  ];

  const osList: Array<{ name: OsType; weight: number }> = [
    { name: 'macOS', weight: 40 },
    { name: 'Windows', weight: 30 },
    { name: 'iOS', weight: 18 },
    { name: 'Android', weight: 10 },
    { name: 'Linux', weight: 2 },
  ];

  function pickWeighted<T extends { weight: number }>(items: T[]): T {
    const total = items.reduce((sum, it) => sum + it.weight, 0);
    let rand = Math.random() * total;
    for (const it of items) {
      if (rand < it.weight) return it;
      rand -= it.weight;
    }
    return items[0];
  }

  const now = Date.now();
  const thirtyDaysMs = 30 * 86400000;
  const targetClicks = 1000;

  for (let i = 0; i < targetClicks; i++) {
    const link = links[i % links.length];
    const recencyFactor = Math.pow(Math.random(), 1.5);
    const time = new Date(now - (1 - recencyFactor) * thirtyDaysMs);

    const ref = pickWeighted(referrers);
    const dev = pickWeighted(devices);
    const browser = pickWeighted(browsers);
    const os = pickWeighted(osList);
    const isBot = Math.random() < 0.04; // 4% bot traffic
    const isQr = Math.random() < 0.08;

    clicks.push({
      id: `click_${i + 1}`,
      linkId: link.id,
      timestamp: time.toISOString(),
      referrer: ref.name,
      deviceType: dev.type,
      browser: browser.name,
      os: os.name,
      country: 'United States',
      countryCode: 'US',
      isBot,
      isUnique: Math.random() < 0.82,
      source: isQr ? 'qr' : 'direct',
    });
  }

  clicks.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return { campaigns, tags, links, clicks };
}
