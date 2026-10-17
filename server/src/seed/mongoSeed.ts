import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  User,
  Campaign,
  Folder,
  Tag,
  Link,
  ClickEvent,
  QrCode,
  DomainBlocklist,
  AbuseReport,
  AuditLog,
} from '../models/index.ts';

export async function seedMongoDatabase() {
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    console.log('MongoDB already populated. Skipping seed.');
    return;
  }

  console.log('🌱 Seeding MongoDB database with demo environment and mock records...');

  // 1. Users
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const admin = await User.create({
    email: 'admin@linkpulse.io',
    passwordHash: adminPasswordHash,
    name: 'LinkPulse Administrator',
    role: 'admin',
    apiKey: 'lp_sec_admin_live_demo_987654321',
  });

  const userPasswordHash = await bcrypt.hash('demo123', 10);
  const alex = await User.create({
    email: 'alex@linkpulse.io',
    passwordHash: userPasswordHash,
    name: 'Alex Mercer',
    role: 'user',
    apiKey: 'lp_sec_alex_live_demo_123456789',
  });

  // 2. Campaigns
  const campLaunch = await Campaign.create({
    name: 'Product Launch Q4',
    description: 'Global launch assets and announcement links.',
    color: '#18181B',
    userId: alex._id,
  });

  const campGrowth = await Campaign.create({
    name: 'Social Media Growth',
    description: 'Community links across Twitter, LinkedIn, and YouTube.',
    color: '#3B82F6',
    userId: alex._id,
  });

  // 3. Folders & Tags
  const folderProd = await Folder.create({ name: 'Product Marketing', color: '#18181B', userId: alex._id });
  const folderDev = await Folder.create({ name: 'Engineering Docs', color: '#10B981', userId: alex._id });

  const tagFeatured = await Tag.create({ name: 'Featured', color: '#18181B', userId: alex._id });
  const tagSocial = await Tag.create({ name: 'Social', color: '#3B82F6', userId: alex._id });

  // 4. Domain Blocklist
  await DomainBlocklist.insertMany([
    { domain: 'phishing-target.xyz', reason: 'Verified credential phishing', blockedBy: admin._id },
    { domain: 'malware-drop.top', reason: 'Malware distribution binary', blockedBy: admin._id },
    { domain: 'crypto-airdrop-drainer.biz', reason: 'Cryptocurrency wallet drainage scam', blockedBy: admin._id },
  ]);

  // 5. Links
  const link1 = await Link.create({
    userId: alex._id,
    shortCode: 'launch2026',
    destinationUrl: 'https://github.com/google',
    title: 'Google Open Source Project',
    campaignId: campLaunch._id,
    folderId: folderProd._id,
    tags: ['Featured', 'Social'],
    clicksCount: 142,
    isActive: true,
    status: 'active',
  });

  const link2 = await Link.create({
    userId: alex._id,
    shortCode: 'docs',
    destinationUrl: 'https://vite.dev',
    title: 'Vite Next-Gen Frontend Tooling',
    campaignId: campLaunch._id,
    folderId: folderDev._id,
    tags: ['Featured'],
    clicksCount: 89,
    isActive: true,
    status: 'active',
  });

  // A/B Experiment Link
  const linkAB = await Link.create({
    userId: alex._id,
    shortCode: 'pricing',
    destinationUrl: 'https://tailwindcss.com',
    title: 'SaaS Pricing & Plan Comparison',
    campaignId: campLaunch._id,
    tags: ['Campaign'],
    clicksCount: 114,
    isActive: true,
    status: 'active',
    aBTesting: {
      enabled: true,
      variants: [
        { label: 'Variant A (Monthly Highlight)', destinationUrl: 'https://tailwindcss.com/docs', weight: 50, clicksCount: 62 },
        { label: 'Variant B (Annual 20% Off)', destinationUrl: 'https://tailwindcss.com/showcase', weight: 50, clicksCount: 52 },
      ],
    },
  });

  // Device Targeting Link
  const linkDevice = await Link.create({
    userId: alex._id,
    shortCode: 'mobile-app',
    destinationUrl: 'https://react.dev',
    title: 'LinkPulse Native Companion',
    campaignId: campGrowth._id,
    clicksCount: 68,
    isActive: true,
    status: 'active',
    deviceTargeting: {
      iosUrl: 'https://apps.apple.com',
      androidUrl: 'https://play.google.com',
      desktopUrl: 'https://react.dev',
    },
  });

  // Password Protected Link
  const secretPasswordHash = await bcrypt.hash('secret123', 10);
  const linkPassword = await Link.create({
    userId: alex._id,
    shortCode: 'vip-vault',
    destinationUrl: 'https://news.ycombinator.com',
    title: 'VIP Hacker News Confidential Dossier',
    passwordHash: secretPasswordHash,
    clicksCount: 34,
    isActive: true,
    status: 'active',
  });

  // Click Limit Reached Link
  const linkLimit = await Link.create({
    userId: alex._id,
    shortCode: 'flash-promo',
    destinationUrl: 'https://wikipedia.org',
    title: 'Flash Sale (Limited to 50 clicks)',
    clickLimit: 50,
    clicksCount: 50,
    isActive: true,
    status: 'limit_reached',
  });

  // Expired Link
  const linkExpired = await Link.create({
    userId: alex._id,
    shortCode: 'old-promo',
    destinationUrl: 'https://archive.org',
    title: 'Archived Promo Code 2025',
    expiresAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    clicksCount: 22,
    isActive: true,
    status: 'expired',
  });

  // 6. QR Codes
  const allCreatedLinks = [link1, link2, linkAB, linkDevice, linkPassword, linkLimit, linkExpired];
  for (const l of allCreatedLinks) {
    await QrCode.create({
      linkId: l._id,
      foregroundColor: '#171717',
      backgroundColor: '#FFFFFF',
      style: 'squares',
      scansCount: Math.round(l.clicksCount * 0.25),
    });
  }

  // 7. Click Events Generation (past 14 days)
  const clickDocs: any[] = [];
  const referrers = ['Direct', 'Twitter / X', 'LinkedIn', 'Google Search', 'Hacker News', 'Reddit'];
  const devices: ('desktop' | 'mobile' | 'tablet')[] = ['desktop', 'mobile', 'mobile', 'desktop', 'tablet'];
  const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
  const countries = ['US', 'US', 'GB', 'DE', 'CA', 'SG', 'FR', 'JP'];

  for (const l of allCreatedLinks) {
    const total = l.clicksCount;
    for (let c = 0; c < total; c++) {
      const dayOffset = Math.floor(Math.random() * 14);
      const date = new Date();
      date.setDate(date.getDate() - dayOffset);
      date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

      const ipSalt = `ip_${(c % 25) + 1}`;
      const ipHash = crypto.createHash('sha256').update(ipSalt).digest('hex').substring(0, 16);

      clickDocs.push({
        linkId: l._id,
        campaignId: l.campaignId,
        timestamp: date,
        ipHash,
        referrer: referrers[c % referrers.length],
        device: devices[c % devices.length],
        browser: browsers[c % browsers.length],
        os: 'macOS',
        country: countries[c % countries.length],
        isBot: c % 30 === 0,
      });
    }
  }

  await ClickEvent.insertMany(clickDocs);

  // 8. Abuse Report sample
  await AbuseReport.create({
    shortCode: 'flash-promo',
    targetUrl: 'https://wikipedia.org',
    reason: 'Reported as suspected unsolicited email link',
    reporterEmail: 'auditor@security.org',
    status: 'pending',
  });

  // 9. Audit Logs
  await AuditLog.insertMany([
    {
      userId: admin._id,
      userEmail: admin.email,
      action: 'blocklist.added',
      resourceType: 'domain',
      resourceId: 'phishing-target.xyz',
      details: { reason: 'Verified credential phishing' },
    },
    {
      userId: alex._id,
      userEmail: alex.email,
      action: 'link.created',
      resourceType: 'link',
      resourceId: 'launch2026',
      details: { destinationUrl: 'https://github.com/google' },
    },
    {
      userId: alex._id,
      userEmail: alex.email,
      action: 'experiment.configured',
      resourceType: 'link',
      resourceId: 'pricing',
      details: { variantsCount: 2 },
    },
  ]);

  console.log('✅ MongoDB database seeding complete!');
}
