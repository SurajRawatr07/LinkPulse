import { db } from '../src/db/index.ts';
import {
  users,
  campaigns,
  folders,
  tags,
  links,
  linkTags,
  clickEvents,
  qrCodes,
  domainBlocklist,
  abuseReports,
} from '../src/db/schema.ts';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function seedDatabase() {
  console.log('🌱 Starting Cloud SQL database seeding...');

  try {
    // 1. Create default admin and demo user
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123!', salt);

    const [adminUser] = await db
      .insert(users)
      .values({
        uid: 'demo_admin_uid',
        email: 'admin@linkpulse.io',
        name: 'LinkPulse Administrator',
        role: 'admin',
        passwordHash,
      })
      .onConflictDoNothing()
      .returning();

    const [demoUser] = await db
      .insert(users)
      .values({
        uid: 'demo_user_uid',
        email: 'alex@linkpulse.io',
        name: 'Alex Rivera',
        role: 'user',
        passwordHash,
      })
      .onConflictDoNothing()
      .returning();

    const activeUserId = demoUser?.id || adminUser?.id || 1;

    // 2. Campaigns
    const [c1] = await db
      .insert(campaigns)
      .values({
        userId: activeUserId,
        name: 'Product Launch Q4',
        description: 'Global launch and rollout assets.',
      })
      .returning();

    const [c2] = await db
      .insert(campaigns)
      .values({
        userId: activeUserId,
        name: 'Developer Ecosystem',
        description: 'Guides and API references.',
      })
      .returning();

    // 3. Folders
    const [f1] = await db
      .insert(folders)
      .values({
        userId: activeUserId,
        name: 'Social Media',
        color: '#18181B',
      })
      .returning();

    // 4. Tags
    const [t1] = await db
      .insert(tags)
      .values({
        userId: activeUserId,
        name: 'Featured',
        color: '#18181B',
      })
      .returning();

    const [t2] = await db
      .insert(tags)
      .values({
        userId: activeUserId,
        name: 'Twitter',
        color: '#0284C7',
      })
      .returning();

    // 5. Seed sample links
    const sampleLinks = [
      {
        shortCode: 'pulse-launch',
        destinationUrl: 'https://github.com/features',
        title: 'Q4 Product Launch Keynote',
        campaignId: c1?.id,
        folderId: f1?.id,
        clicksCount: 248,
      },
      {
        shortCode: 'docs-api',
        destinationUrl: 'https://docs.github.com/en/rest',
        title: 'Developer REST API Docs',
        campaignId: c2?.id,
        clicksCount: 184,
      },
      {
        shortCode: 'figma-kit',
        destinationUrl: 'https://www.figma.com/community',
        title: 'LinkPulse Design System Tokens',
        clicksCount: 96,
      },
      {
        shortCode: 'vip-pass',
        destinationUrl: 'https://news.ycombinator.com',
        title: 'VIP Hackathon Access Pass',
        passwordHash: await bcrypt.hash('secret123', salt),
        clicksCount: 32,
      },
    ];

    for (const l of sampleLinks) {
      const [newLink] = await db
        .insert(links)
        .values({
          userId: activeUserId,
          shortCode: l.shortCode,
          destinationUrl: l.destinationUrl,
          title: l.title,
          campaignId: l.campaignId || null,
          folderId: l.folderId || null,
          passwordHash: l.passwordHash || null,
          clicksCount: l.clicksCount,
        })
        .onConflictDoNothing()
        .returning();

      if (newLink) {
        // Tag association
        if (t1) {
          await db.insert(linkTags).values({ linkId: newLink.id, tagId: t1.id }).onConflictDoNothing();
        }
        if (t2) {
          await db.insert(linkTags).values({ linkId: newLink.id, tagId: t2.id }).onConflictDoNothing();
        }

        // QR Code
        await db
          .insert(qrCodes)
          .values({
            linkId: newLink.id,
            foregroundColor: '#171717',
            backgroundColor: '#FFFFFF',
            style: 'squares',
            scansCount: Math.round(l.clicksCount * 0.2),
          })
          .onConflictDoNothing();

        // Generate synthetic click events over the last 7 days
        const referrers = ['Direct', 'Twitter / X', 'LinkedIn', 'Google Search', 'Hacker News'];
        const devices: ('desktop' | 'mobile' | 'tablet')[] = ['mobile', 'mobile', 'desktop', 'desktop', 'tablet'];
        const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];

        for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
          const date = new Date();
          date.setDate(date.getDate() - dayOffset);

          const clicksToday = Math.floor(l.clicksCount / 10) + (dayOffset % 3);
          for (let c = 0; c < clicksToday; c++) {
            const ipHash = crypto.createHash('sha256').update(`ip_${c}_day_${dayOffset}`).digest('hex').substring(0, 16);
            await db.insert(clickEvents).values({
              linkId: newLink.id,
              timestamp: date,
              ipHash,
              referrer: referrers[c % referrers.length],
              device: devices[c % devices.length],
              browser: browsers[c % browsers.length],
              os: devices[c % devices.length] === 'mobile' ? 'iOS' : 'macOS',
              isBot: false,
              outcome: 'success',
            });
          }
        }
      }
    }

    // 6. Blocklist
    await db
      .insert(domainBlocklist)
      .values([
        { domain: 'phishing-vault.net', reason: 'Verified credential phishing host', blockedBy: 'Security Bot' },
        { domain: 'malware-drop.xyz', reason: 'Malicious payload distribution', blockedBy: 'Admin' },
        { domain: 'crypto-scam-giveaway.co', reason: 'Deceptive investment scam', blockedBy: 'Abuse Team' },
      ])
      .onConflictDoNothing();

    console.log('✅ Seeding completed successfully!');
  } catch (err) {
    console.error('Seeding error:', err);
  }
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase().then(() => process.exit(0));
}
