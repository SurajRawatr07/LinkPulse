import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../server/app.ts';
import { connectDB, disconnectDB } from '../server/src/config/db.ts';
import { seedMongoDatabase } from '../server/src/seed/mongoSeed.ts';
import { Link, DomainBlocklist, User, ClickEvent } from '../server/src/models/index.ts';


describe('LinkPulse End-to-End API Test Suite', () => {
  let userToken = '';
  let secondUserToken = '';
  let adminToken = '';
  let createdLinkId = '';
  const testAlias = `test-${Date.now()}`;
  const registeredEmail = `registered_${Date.now()}@test.io`;
  const registeredPassword = 'Password123!';
  const bootstrapSecret = 'test_admin_bootstrap_secret_2026';

  beforeAll(async () => {
    process.env.ADMIN_BOOTSTRAP_SECRET = bootstrapSecret;
    await connectDB();
    await seedMongoDatabase();
  });

  afterAll(async () => {
    // Teardown
  });

  describe('1. Health & System Status', () => {
    it('returns healthy status on /api/health', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.database.status).toBe('healthy');
    });

    it('returns ready status on /api/ready', async () => {
      const res = await request(app).get('/api/ready');
      expect(res.status).toBe(200);
      expect(res.body.ready).toBe(true);
    });
  });

  describe('2. Real User Registration & Password Security', () => {
    it('allows a new user to register with real bcrypt hashing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Jane Doe',
          email: registeredEmail,
          password: registeredPassword,
          role: 'admin', // Attack attempt: client tries to self-grant admin
        });

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe(registeredEmail);
      // Strictly verify server enforced 'user' role and ignored client role
      expect(res.body.user.role).toBe('user');
      expect(res.body.token).toBeDefined();

      // Verify in database that password is stored as hash, NEVER plaintext
      const dbUser = await User.findOne({ email: registeredEmail });
      expect(dbUser).toBeDefined();
      expect(dbUser!.passwordHash).not.toBe(registeredPassword);
      expect(dbUser!.passwordHash.startsWith('$2')).toBe(true);
      expect(dbUser!.role).toBe('user');
    });

    it('rejects duplicate email registration with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Another Person',
          email: registeredEmail,
          password: 'AnotherPassword123!',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already exists');
    });

    it('rejects passwords shorter than 8 characters', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Short Pass',
          email: `short_${Date.now()}@test.io`,
          password: 'short',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('8 characters');
    });
  });

  describe('3. Login, Sessions & Logout', () => {
    it('successfully logs in with registered credentials and sets session cookie', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: registeredEmail, password: registeredPassword });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(registeredEmail);
      expect(res.body.user.role).toBe('user');
      expect(res.headers['set-cookie']).toBeDefined();

      userToken = res.body.token;
    });

    it('rejects invalid password with generic error message', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: registeredEmail, password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password.');
    });

    it('rejects non-existent email with same generic error message', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody_exists@domain.com', password: 'SomePassword123!' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password.');
    });

    it('retrieves current authenticated user profile via /api/v1/auth/me', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(registeredEmail);
      expect(res.body.user.role).toBe('user');
    });

    it('blocks unauthenticated access to protected routes', async () => {
      const res = await request(app).get('/api/v1/links');
      expect(res.status).toBe(401);
    });

    it('allows logging out and clearing session cookie', async () => {
      const res = await request(app).post('/api/v1/auth/logout');
      expect(res.status).toBe(200);
      expect(res.headers['set-cookie']).toBeDefined();
    });
  });

  describe('4. Secure Admin Account Provisioning & Role Enforcement', () => {
    const adminEmail = `admin_${Date.now()}@linkpulse.io`;
    const adminPassword = 'AdminSecurePass2026!';

    it('rejects bootstrap-admin endpoint if x-bootstrap-secret is missing or incorrect', async () => {
      const resWithoutSecret = await request(app)
        .post('/api/v1/auth/bootstrap-admin')
        .send({ email: adminEmail, password: adminPassword });
      expect(resWithoutSecret.status).toBe(403);

      const resWithWrongSecret = await request(app)
        .post('/api/v1/auth/bootstrap-admin')
        .set('x-bootstrap-secret', 'wrong_secret')
        .send({ email: adminEmail, password: adminPassword });
      expect(resWithWrongSecret.status).toBe(403);
    });

    it('successfully provisions real administrator account with valid server secret', async () => {
      const res = await request(app)
        .post('/api/v1/auth/bootstrap-admin')
        .set('x-bootstrap-secret', bootstrapSecret)
        .send({
          email: adminEmail,
          password: adminPassword,
          name: 'Chief Security Officer',
        });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('admin');
      expect(res.body.user.email).toBe(adminEmail);

      // Log in as this real provisioned administrator
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: adminEmail, password: adminPassword });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.user.role).toBe('admin');
      adminToken = loginRes.body.token;
    });

    it('strictly forbids regular users from accessing administrator endpoints', async () => {
      const userRes = await request(app)
        .get('/api/v1/admin/overview')
        .set('Authorization', `Bearer ${userToken}`);
      expect(userRes.status).toBe(403);
      expect(userRes.body.error).toContain('Administrator');
    });

    it('permits authorized administrator to access admin telemetry and controls', async () => {
      const adminRes = await request(app)
        .get('/api/v1/admin/overview')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.status).toBe(200);
      expect(adminRes.body.stats).toBeDefined();
    });
  });

  describe('5. Resource Ownership & Access Isolation', () => {
    it('creates a link owned by User 1', async () => {
      const res = await request(app)
        .post('/api/v1/links')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          destinationUrl: 'https://github.com/SurajRawatr07/LinkPulse',
          customAlias: testAlias,
          title: 'LinkPulse GitHub Repo',
        });

      expect(res.status).toBe(201);
      expect(res.body.link.shortCode).toBe(testAlias);
      createdLinkId = res.body.link.id;
    });

    it('registers a second regular user (User 2)', async () => {
      const user2Email = `user2_${Date.now()}@test.io`;
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Second User',
          email: user2Email,
          password: 'PasswordUser2!',
        });

      expect(res.status).toBe(201);
      secondUserToken = res.body.token;
    });

    it('prevents User 2 from updating or deleting User 1 private link', async () => {
      // User 2 tries to update User 1's link
      const patchRes = await request(app)
        .patch(`/api/v1/links/${createdLinkId}`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({ title: 'Hacked Title' });

      expect(patchRes.status).toBe(403);

      // User 2 tries to delete User 1's link
      const deleteRes = await request(app)
        .delete(`/api/v1/links/${createdLinkId}`)
        .set('Authorization', `Bearer ${secondUserToken}`);

      expect(deleteRes.status).toBe(403);
    });

    it('ensures User 2 link directory query does not expose User 1 links', async () => {
      const res = await request(app)
        .get('/api/v1/links')
        .set('Authorization', `Bearer ${secondUserToken}`);

      expect(res.status).toBe(200);
      const items = res.body.items || [];
      const hasUser1Link = items.some((item: any) => item.id === createdLinkId || item.shortCode === testAlias);
      expect(hasUser1Link).toBe(false);
    });
  });

  describe('6. Short Link Creation & Validation', () => {
    it('rejects duplicate custom alias at database level', async () => {
      const res = await request(app)
        .post('/api/v1/links')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          destinationUrl: 'https://example.com/other',
          customAlias: testAlias,
          title: 'Duplicate Alias Test',
        });
      expect(res.status).toBe(409);
    });

    it('rejects invalid destination URL format', async () => {
      const res = await request(app)
        .post('/api/v1/links')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          destinationUrl: 'not-a-valid-url',
          title: 'Invalid URL Test',
        });
      expect(res.status).toBe(400);
    });

    it('allows checking alias availability via /api/v1/links/check-alias', async () => {
      const resTaken = await request(app)
        .get(`/api/v1/links/check-alias?alias=${testAlias}`);
      expect(resTaken.body.available).toBe(false);

      const resFree = await request(app)
        .get(`/api/v1/links/check-alias?alias=completely-unique-alias-${Date.now()}`);
      expect(resFree.body.available).toBe(true);
    });
  });

  describe('7. Server-Side Redirect Engine & Live Click Tracking', () => {
    it('resolves public link metadata via /api/v1/redirect/:code/metadata', async () => {
      const res = await request(app).get(`/api/v1/redirect/${testAlias}/metadata`);
      expect(res.status).toBe(200);
      expect(res.body.shortCode).toBe(testAlias);
      expect(res.body.destinationUrl).toBe('https://github.com/SurajRawatr07/LinkPulse');
    });

    it('executes real 302 redirect on /r/:code and sets proper headers', async () => {
      const res = await request(app)
        .get(`/r/${testAlias}`)
        .set('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        .set('Referer', 'https://news.ycombinator.com');

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('https://github.com/SurajRawatr07/LinkPulse');
      expect(res.headers['x-redirect-engine']).toBe('LinkPulse-PolicyEngine-v2');
    });

    it('increments click count and creates a persistent ClickEvent record', async () => {
      const res = await request(app)
        .get(`/api/v1/links/${createdLinkId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.link.clicksCount).toBeGreaterThanOrEqual(1);

      const clicksRes = await request(app)
        .get(`/api/v1/analytics/clicks/${createdLinkId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(clicksRes.status).toBe(200);
      expect(clicksRes.body.clicks.length).toBeGreaterThanOrEqual(1);
      expect(clicksRes.body.clicks[0].referrer).toBe('https://news.ycombinator.com');
    });

    it('computes accurate link analytics summary', async () => {
      const res = await request(app)
        .get(`/api/v1/analytics/link/${createdLinkId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.analytics.totalClicks).toBeGreaterThanOrEqual(1);
      expect(res.body.analytics.devices.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('8. Advanced Redirect Rules (Password, Expiry, Click Limits)', () => {
    it('enforces password protection challenge on protected link', async () => {
      const passAlias = `pass-${Date.now()}`;
      const createRes = await request(app)
        .post('/api/v1/links')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          destinationUrl: 'https://secret.com/docs',
          customAlias: passAlias,
          password: 'supersecretpass',
        });
      expect(createRes.status).toBe(201);

      // Request without password returns 403 challenge
      const redirectRes = await request(app)
        .get(`/r/${passAlias}`)
        .set('Accept', 'application/json');
      expect(redirectRes.status).toBe(403);
      expect(redirectRes.body.status).toBe('password_required');

      // Verify incorrect password
      const wrongPassRes = await request(app)
        .post(`/api/v1/redirect/${passAlias}/verify-password`)
        .send({ password: 'wrong' });
      expect(wrongPassRes.status).toBe(401);

      // Verify correct password
      const rightPassRes = await request(app)
        .post(`/api/v1/redirect/${passAlias}/verify-password`)
        .send({ password: 'supersecretpass' });
      expect(rightPassRes.status).toBe(200);
      expect(rightPassRes.body.verified).toBe(true);
      expect(rightPassRes.body.token).toBeDefined();

      // Access with verified token succeeds
      const token = rightPassRes.body.token;
      const authorizedRes = await request(app).get(`/r/${passAlias}?access_token=${token}`);
      expect(authorizedRes.status).toBe(302);
      expect(authorizedRes.headers.location).toBe('https://secret.com/docs');
    });

    it('enforces click limits atomically', async () => {
      const limitAlias = `cap-${Date.now()}`;
      await request(app)
        .post('/api/v1/links')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          destinationUrl: 'https://limited.com/offer',
          customAlias: limitAlias,
          clickLimit: 1,
        });

      // 1st click succeeds
      const firstRes = await request(app).get(`/r/${limitAlias}`);
      expect(firstRes.status).toBe(302);

      // 2nd click blocked due to quota reached
      const secondRes = await request(app)
        .get(`/r/${limitAlias}`)
        .set('Accept', 'application/json');
      expect(secondRes.status).toBe(403);
      expect(secondRes.body.status).toBe('limit_reached');
    });
  });

  describe('9. Policy Lab Simulator', () => {
    it('simulates redirect policy outcomes without creating click events', async () => {
      const res = await request(app)
        .post('/api/v1/policy-lab/simulate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          hypotheticalLink: {
            destinationUrl: 'https://example.com/desktop',
            deviceTargeting: {
              mobileUrl: 'https://example.com/mobile',
            },
            clickLimit: 10,
          },
          device: 'mobile',
          simulatedClicksCount: 2,
        });
      expect(res.status).toBe(200);
      expect(res.body.evaluation.status).toBe('success');
      expect(res.body.evaluation.destinationUrl).toBe('https://example.com/mobile');
    });
  });

  describe('10. Bulk CSV Import Engine', () => {
    it('imports valid rows, skips duplicates, and returns structured summary', async () => {
      const uniqueCode = `csv-${Date.now()}`;
      const res = await request(app)
        .post('/api/v1/imports/bulk')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rows: [
            { url: 'https://example.com/page1', alias: uniqueCode, title: 'Imported Page 1' },
            { url: 'https://example.com/page2', alias: uniqueCode, title: 'Duplicate Row' }, // Duplicate alias
            { url: 'not-a-url', title: 'Invalid URL Row' }, // Invalid format
          ],
        });
      expect(res.status).toBe(200);
      expect(res.body.summary.successful).toBe(1);
      expect(res.body.summary.failed).toBe(2);
      expect(res.body.imported.length).toBe(1);
      expect(res.body.skipped.length).toBe(2);
    });
  });

  describe('11. Link-in-Bio Pages', () => {
    it('allows user to save and retrieve their bio page', async () => {
      const bioSlug = `user-${Date.now()}`;
      const saveRes = await request(app)
        .put('/api/v1/bio/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          slug: bioSlug,
          title: 'Creator Bio',
          bio: 'Building open-source developer tools',
          theme: 'emerald',
          links: [{ id: 'b1', title: 'My Portfolio', url: 'https://portfolio.me', isActive: true }],
        });
      expect(saveRes.status).toBe(200);
      expect(saveRes.body.page.slug).toBe(bioSlug);

      // Public resolution
      const publicRes = await request(app).get(`/api/v1/bio/p/${bioSlug}`);
      expect(publicRes.status).toBe(200);
      expect(publicRes.body.page.title).toBe('Creator Bio');
    });
  });

  describe('12. Trust Center & Domain Blocking', () => {
    it('allows reporting abuse on a link', async () => {
      const reportRes = await request(app)
        .post('/api/v1/trust-center/report')
        .send({
          shortCode: testAlias,
          reason: 'Phishing suspicion for testing',
          reporterEmail: 'tester@security.org',
        });
      expect(reportRes.status).toBe(201);
      expect(reportRes.body.report).toBeDefined();
    });

    it('blocks links when domain is added to blocklist by admin', async () => {
      const blockRes = await request(app)
        .post('/api/v1/admin/blocklist')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          domain: 'malicious-domain.xyz',
          reason: 'Malware distribution',
        });
      expect(blockRes.status).toBe(201);

      // Create link targeting blocked domain
      const linkRes = await request(app)
        .post('/api/v1/links')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          destinationUrl: 'https://malicious-domain.xyz/payload',
          title: 'Dangerous Link',
        });
      expect(linkRes.status).toBe(400);
      expect(linkRes.body.error).toContain('blocklist');
    });
  });

  describe('13. Link Lifecycle Center API', () => {
    let lifecycleLinkId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/links')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          destinationUrl: 'https://example.com/lifecycle-test',
          title: 'Lifecycle Test Link',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          clickLimit: 50,
        });
      lifecycleLinkId = res.body.link.id;
    });

    it('retrieves lifecycle health summary and categorizes critical links', async () => {
      const res = await request(app)
        .get('/api/v1/lifecycle/summary')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.counts).toBeDefined();
      expect(res.body.counts.total).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(res.body.criticalLinks)).toBe(true);
    });

    it('extends link expiration by +30 days via lifecycle endpoint', async () => {
      const res = await request(app)
        .post(`/api/v1/lifecycle/extend-expiry/${lifecycleLinkId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ days: 30 });
      expect(res.status).toBe(200);
      expect(res.body.link.expiresAt).toBeDefined();
    });

    it('increases click quota via lifecycle endpoint', async () => {
      const res = await request(app)
        .post(`/api/v1/lifecycle/increase-limit/${lifecycleLinkId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ additionalClicks: 100 });
      expect(res.status).toBe(200);
      expect(res.body.link.clickLimit).toBe(150);
    });

    it('toggles link active/suspended status via lifecycle endpoint', async () => {
      const res = await request(app)
        .post(`/api/v1/lifecycle/${lifecycleLinkId}/toggle`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.link.isActive).toBe(false);
    });
  });

  describe('14. Session Resilience & Token Consistency', () => {
    it('authenticates successfully via cookie when header is absent', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', [`lp_session=${userToken}`]);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(registeredEmail);
    });

    it('rejects invalid or placeholder local tokens with structured 401 response', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer local_tok_usr_invalid123');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHENTICATED');
    });

    it('rejects tampered signature tokens with SESSION_EXPIRED code', async () => {
      const parts = userToken.split('.');
      const tampered = parts[0] + '.tamperedSignature123';
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tampered}`);
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('SESSION_EXPIRED');
    });
  });

  describe('15. Demo Credentials & Root Vanity Redirects', () => {
    it('authenticates successfully with seeded Demo User credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'demo.user@linkpulse.test',
          password: 'DemoUser@123',
        });
      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('user');
      expect(res.body.token).toBeDefined();
    });

    it('authenticates successfully with seeded Demo Admin credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'demo.admin@linkpulse.test',
          password: 'DemoAdmin@123',
        });
      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('admin');
      expect(res.body.token).toBeDefined();
    });

    it('resolves root-level vanity short code directly without /r/ prefix', async () => {
      const res = await request(app).get('/demopulse');
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('github.com');
    });
  });

  describe('16. Homepage Clean Design & Lottie Contract', () => {
    it('verifies exact local Lottie animation asset exists and is valid Lottie JSON', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const assetPath = path.resolve('src/assets/hero-animation.json');
      expect(fs.existsSync(assetPath)).toBe(true);
      const jsonContent = JSON.parse(fs.readFileSync(assetPath, 'utf8'));
      expect(jsonContent.v).toBeDefined();
      expect(Array.isArray(jsonContent.layers)).toBe(true);
      expect(jsonContent.w).toBe(512);
      expect(jsonContent.h).toBe(512);
    });

    it('verifies Navbar strictly exposes only Home, How It Works, and FAQ', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const navPath = path.resolve('src/components/layout/Navbar.tsx');
      const content = fs.readFileSync(navPath, 'utf8');
      expect(content).toMatch(/>\s*Home\s*</);
      expect(content).toMatch(/>\s*How It Works\s*</);
      expect(content).toMatch(/>\s*FAQ\s*</);
      // Must not contain '#features' or feature grid links
      expect(content).not.toContain('href="#features"');
      expect(content).not.toMatch(/>\s*Features\s*</);
    });

    it('verifies LandingPage strictly adheres to the 5 required advanced feature categories in the modal', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const modalPath = path.resolve('src/components/common/AdvancedFeaturesModal.tsx');
      const content = fs.readFileSync(modalPath, 'utf8');
      expect(content).toContain('Smart Link Lifecycle');
      expect(content).toContain('Policy Lab');
      expect(content).toContain('Trust Center');
      expect(content).toContain('Campaign Intelligence');
      expect(content).toContain('QR & Bulk Link Studio');
      expect(content).toContain('Explore LinkPulse Features');
    });

    it('verifies Final CTA preserves exact requested wording and hierarchy', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const landingPath = path.resolve('src/pages/LandingPage.tsx');
      const content = fs.readFileSync(landingPath, 'utf8');
      expect(content).toContain('GET STARTED TODAY');
      expect(content).toContain('Ready to shorten your first link?');
      expect(content).toContain('Create Free Account');
      expect(content).toContain('Sign In');
    });
  });
});

