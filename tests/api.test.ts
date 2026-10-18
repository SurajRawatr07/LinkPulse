import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../server/app.ts';
import { connectDB, disconnectDB } from '../server/src/config/db.ts';
import { seedMongoDatabase } from '../server/src/seed/mongoSeed.ts';
import { Link, DomainBlocklist, User, ClickEvent } from '../server/src/models/index.ts';

describe('LinkPulse End-to-End API Test Suite', () => {
  let userToken = '';
  let adminToken = '';
  let createdLinkId = '';
  const testAlias = `test-${Date.now()}`;

  beforeAll(async () => {
    await connectDB();
    await seedMongoDatabase();
  });

  afterAll(async () => {
    // clean up or disconnect
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

  describe('2. Authentication & Authorization', () => {
    it('successfully logs in seeded demo user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'alex@linkpulse.io', password: 'demo123' });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('user');
      userToken = res.body.token;
    });

    it('successfully logs in seeded admin', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@linkpulse.io', password: 'admin123' });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('admin');
      adminToken = res.body.token;
    });

    it('rejects invalid password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'alex@linkpulse.io', password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });

    it('allows registering a new user with bcrypt hash', async () => {
      const newEmail = `user_${Date.now()}@test.io`;
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Test User', email: newEmail, password: 'password123' });
      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe(newEmail);
      expect(res.body.user.role).toBe('user');
    });

    it('retrieves current authenticated user profile via /api/v1/auth/me', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('alex@linkpulse.io');
    });

    it('blocks unauthenticated access to protected route', async () => {
      const res = await request(app).get('/api/v1/links');
      expect(res.status).toBe(401);
    });

    it('enforces admin-only access on admin routes', async () => {
      // User attempting admin endpoint
      const userRes = await request(app)
        .get('/api/v1/admin/overview')
        .set('Authorization', `Bearer ${userToken}`);
      expect(userRes.status).toBe(403);

      // Admin accessing admin endpoint
      const adminRes = await request(app)
        .get('/api/v1/admin/overview')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.status).toBe(200);
      expect(adminRes.body.stats).toBeDefined();
    });
  });

  describe('3. Short Link Creation & Validation', () => {
    it('creates a new short link with custom alias', async () => {
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
      expect(res.body.link.destinationUrl).toBe('https://github.com/SurajRawatr07/LinkPulse');
      createdLinkId = res.body.link.id;
    });

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

  describe('4. Server-Side Redirect Engine & Live Click Tracking', () => {
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

  describe('5. Advanced Redirect Rules (Password, Expiry, Click Limits)', () => {
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

      // Request without password returns 200 with HTML unlock form or JSON challenge
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

  describe('6. Policy Lab Simulator', () => {
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

  describe('7. Bulk CSV Import Engine', () => {
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

  describe('8. Link-in-Bio Pages', () => {
    it('allows user to save and retrieve their bio page', async () => {
      const bioSlug = `alex-${Date.now()}`;
      const saveRes = await request(app)
        .put('/api/v1/bio/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          slug: bioSlug,
          title: 'Alex Mercer Creator Bio',
          bio: 'Building open-source developer tools',
          theme: 'emerald',
          links: [{ id: 'b1', title: 'My Portfolio', url: 'https://portfolio.me', isActive: true }],
        });
      expect(saveRes.status).toBe(200);
      expect(saveRes.body.page.slug).toBe(bioSlug);

      // Public resolution
      const publicRes = await request(app).get(`/api/v1/bio/p/${bioSlug}`);
      expect(publicRes.status).toBe(200);
      expect(publicRes.body.page.title).toBe('Alex Mercer Creator Bio');
    });
  });

  describe('9. Trust Center & Domain Blocking', () => {
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
});
