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
  // 1. Initialize administrator account from environment variables if configured
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'Platform Administrator';

  if (adminEmail && adminPassword) {
    const cleanEmail = adminEmail.toLowerCase().trim();
    const existingAdmin = await User.findOne({ email: cleanEmail });
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      const apiKey = `lp_sec_${crypto.randomBytes(24).toString('hex')}`;
      await User.create({
        email: cleanEmail,
        passwordHash,
        name: adminName.trim(),
        role: 'admin',
        apiKey,
      });
      console.log(`🛡️ Provisioned administrator account from configured environment: ${cleanEmail}`);
    }
  }

  // 2. Safe Hackathon & Demo Provisioning: Demo Admin & Demo User
  const demoAdminEmail = 'demo.admin@linkpulse.test';
  const existingDemoAdmin = await User.findOne({ email: demoAdminEmail });
  if (!existingDemoAdmin) {
    const passwordHash = await bcrypt.hash('DemoAdmin@123', 10);
    const apiKey = `lp_sec_${crypto.randomBytes(24).toString('hex')}`;
    await User.create({
      email: demoAdminEmail,
      passwordHash,
      name: 'Demo Administrator',
      role: 'admin',
      apiKey,
    });
    console.log(`🛡️ Provisioned Hackathon Demo Administrator (${demoAdminEmail})`);
  }

  const demoUserEmail = 'demo.user@linkpulse.test';
  const existingDemoUser = await User.findOne({ email: demoUserEmail });
  if (!existingDemoUser) {
    const passwordHash = await bcrypt.hash('DemoUser@123', 10);
    const apiKey = `lp_sec_${crypto.randomBytes(24).toString('hex')}`;
    const demoUser = await User.create({
      email: demoUserEmail,
      passwordHash,
      name: 'Demo User',
      role: 'user',
      apiKey,
    });
    console.log(`👤 Provisioned Hackathon Demo User (${demoUserEmail})`);

    // Create a starter link for demo user so Lifecycle & Analytics work immediately
    const demoCamp = await Campaign.create({
      name: 'Summer Product Launch',
      color: '#18181B',
      userId: demoUser._id,
      description: 'Official demo campaign assets and promotion',
    });

    await Link.create({
      userId: demoUser._id,
      shortCode: 'demopulse',
      destinationUrl: 'https://github.com/SurajRawatr07/LinkPulse',
      title: 'LinkPulse Open Source Repository',
      campaignId: demoCamp._id,
      clicksCount: 14,
      uniqueClicksCount: 11,
      isActive: true,
      status: 'active',
      clickLimit: 500,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      tags: ['demo', 'github', 'product'],
    });
  }

  // 3. Seed initial security domain blocklist if empty
  const blocklistCount = await DomainBlocklist.countDocuments();
  if (blocklistCount === 0) {
    await DomainBlocklist.insertMany([
      { domain: 'phishing-target.xyz', reason: 'Verified credential phishing threat' },
      { domain: 'malware-drop.top', reason: 'Malware distribution binary target' },
      { domain: 'crypto-airdrop-drainer.biz', reason: 'Cryptocurrency wallet drainage scam' },
    ]);
    console.log('🛡️ Initialized Trust Center security domain blocklist.');
  }

  // 3. Isolated test environment fixtures (only created in test mode)
  if (process.env.NODE_ENV === 'test' || process.env.SEED_TEST_FIXTURES === 'true') {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🧪 Seeding isolated test environment fixtures...');
      const adminPassHash = await bcrypt.hash('admin123', 10);
      const testAdmin = await User.create({
        email: 'admin@linkpulse.io',
        passwordHash: adminPassHash,
        name: 'Test Administrator',
        role: 'admin',
        apiKey: 'lp_sec_admin_test_fixture',
      });

      const userPassHash = await bcrypt.hash('demo123', 10);
      const testUser = await User.create({
        email: 'alex@linkpulse.io',
        passwordHash: userPassHash,
        name: 'Alex Mercer',
        role: 'user',
        apiKey: 'lp_sec_user_test_fixture',
      });

      const testCamp = await Campaign.create({
        name: 'Test Campaign',
        color: '#18181B',
        userId: testUser._id,
      });

      await Link.create({
        userId: testUser._id,
        shortCode: 'testlink',
        destinationUrl: 'https://github.com',
        title: 'GitHub Test Link',
        campaignId: testCamp._id,
        clicksCount: 5,
        isActive: true,
        status: 'active',
      });
    }
  }
}
