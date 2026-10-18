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

  // 2. Seed initial security domain blocklist if empty
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
