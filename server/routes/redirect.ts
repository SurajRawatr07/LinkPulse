import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { UAParser } from 'ua-parser-js';
import { db } from '../../src/db/index.ts';
import {
  links,
  clickEvents,
  domainBlocklist,
  qrCodes,
} from '../../src/db/schema.ts';
import { eq, sql } from 'drizzle-orm';

export const redirectRouter = Router();

// In-memory verification tokens for password-protected links
const verifiedAccessTokens = new Set<string>();

function getIpHash(req: Request): string {
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    '127.0.0.1';
  // Salt with daily date string so raw IP is never permanently stored
  const salt = new Date().toISOString().slice(0, 10);
  return crypto.createHash('sha256').update(`${ip}-${salt}`).digest('hex').substring(0, 16);
}

function parseClient(req: Request) {
  const uaString = req.headers['user-agent'] || '';
  const parser = new UAParser(uaString);
  const result = parser.getResult();

  const isBot = /bot|googlebot|crawler|spider|robot|crawling/i.test(uaString);
  const deviceType = result.device.type || (isBot ? 'bot' : 'desktop'); // 'mobile', 'tablet', etc.

  return {
    device: deviceType === 'mobile' ? 'mobile' : deviceType === 'tablet' ? 'tablet' : isBot ? 'bot' : 'desktop',
    browser: result.browser.name || 'Unknown',
    os: result.os.name || 'Unknown',
    isBot,
    userAgent: uaString.substring(0, 500),
  };
}

// 1. Password Verification API for protected links
redirectRouter.post('/api/v1/redirect/:code/verify-password', async (req: Request, res: Response) => {
  const { code } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  try {
    const [link] = await db
      .select()
      .from(links)
      .where(eq(links.shortCode, code))
      .limit(1);

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    if (!link.passwordHash) {
      return res.json({ verified: true });
    }

    const isValid = await bcrypt.compare(password, link.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    // Generate verified token
    const token = `lp_pass_${code}_${crypto.randomBytes(16).toString('hex')}`;
    verifiedAccessTokens.add(token);

    // Set cookie valid for 10 minutes
    res.cookie(`lp_verified_${code}`, token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000,
    });

    return res.json({
      verified: true,
      token,
      redirectUrl: `/r/${code}?access_token=${token}`,
    });
  } catch (error) {
    console.error('Password verify error:', error);
    return res.status(500).json({ error: 'Failed to verify password' });
  }
});

// 2. Public Short Code Redirect Engine (GET /r/:code)
redirectRouter.get('/r/:code', async (req: Request, res: Response) => {
  const { code } = req.params;
  const isQrScan = req.query.qr === '1';
  const ipHash = getIpHash(req);
  const clientInfo = parseClient(req);
  const referrer = (req.headers['referer'] as string) || (isQrScan ? 'QR Code' : 'Direct');

  try {
    // Step 1: Find the short code
    const [link] = await db
      .select()
      .from(links)
      .where(eq(links.shortCode, code))
      .limit(1);

    // Step 2: Not found
    if (!link || link.isArchived) {
      return res.status(404).redirect(`/app/redirect-status?code=${code}&status=not_found`);
    }

    // Step 3: Check whether link is disabled or blocked
    if (!link.isActive) {
      await logEvent(link.id, ipHash, referrer, clientInfo, 'disabled');
      return res.status(403).redirect(`/app/redirect-status?code=${code}&status=disabled`);
    }

    if (link.isBlocked) {
      await logEvent(link.id, ipHash, referrer, clientInfo, 'blocked');
      return res.status(403).redirect(`/app/redirect-status?code=${code}&status=blocked&reason=${encodeURIComponent(link.blockReason || 'Safety policy violation')}`);
    }

    // Also check domain blocklist
    try {
      const destUrl = new URL(link.destinationUrl);
      const [blockedDomain] = await db
        .select()
        .from(domainBlocklist)
        .where(eq(domainBlocklist.domain, destUrl.hostname.toLowerCase()))
        .limit(1);

      if (blockedDomain) {
        await logEvent(link.id, ipHash, referrer, clientInfo, 'blocked');
        return res.status(403).redirect(`/app/redirect-status?code=${code}&status=blocked&reason=${encodeURIComponent(blockedDomain.reason)}`);
      }
    } catch {
      // Ignore invalid URL parse
    }

    // Step 4: Check expiry date
    if (link.expiresAt && new Date(link.expiresAt) <= new Date()) {
      await logEvent(link.id, ipHash, referrer, clientInfo, 'expired');
      return res.status(410).redirect(`/app/redirect-status?code=${code}&status=expired`);
    }

    // Step 5: Check click limit
    if (link.clickLimit !== null && link.clicksCount >= link.clickLimit) {
      await logEvent(link.id, ipHash, referrer, clientInfo, 'limit_reached');
      return res.status(410).redirect(`/app/redirect-status?code=${code}&status=limit_reached`);
    }

    // Step 6: Password protection check
    if (link.passwordHash) {
      const cookieVal = req.cookies?.[`lp_verified_${code}`];
      const queryToken = req.query.access_token as string;
      const hasVerifiedToken =
        (cookieVal && verifiedAccessTokens.has(cookieVal)) ||
        (queryToken && verifiedAccessTokens.has(queryToken));

      if (!hasVerifiedToken) {
        // Redirect to password challenge view
        return res.redirect(`/app/redirect-password?code=${code}&title=${encodeURIComponent(link.title)}`);
      }
    }

    // Step 7: Device-targeting rules
    let targetUrl = link.destinationUrl;
    if (clientInfo.device === 'mobile' && link.mobileUrl) {
      targetUrl = link.mobileUrl;
    } else if (clientInfo.device === 'tablet' && link.tabletUrl) {
      targetUrl = link.tabletUrl;
    } else if (clientInfo.device === 'desktop' && link.desktopUrl) {
      targetUrl = link.desktopUrl;
    }

    // Step 8: Asynchronously record valid visit and update click counter atomically
    await Promise.all([
      db
        .update(links)
        .set({
          clicksCount: sql`${links.clicksCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(links.id, link.id)),
      logEvent(link.id, ipHash, referrer, clientInfo, 'success'),
      isQrScan
        ? db
            .update(qrCodes)
            .set({ scansCount: sql`${qrCodes.scansCount} + 1` })
            .where(eq(qrCodes.linkId, link.id))
        : Promise.resolve(),
    ]);

    // Step 9: Redirect cleanly with HTTP 302
    return res.redirect(302, targetUrl);
  } catch (error) {
    console.error('Redirect error for code:', code, error);
    return res.status(500).redirect(`/app/redirect-status?code=${code}&status=error`);
  }
});

// Helper to log click events without crashing redirects
async function logEvent(
  linkId: number,
  ipHash: string,
  referrer: string,
  client: ReturnType<typeof parseClient>,
  outcome: 'success' | 'password_prompt' | 'expired' | 'limit_reached' | 'blocked' | 'disabled'
) {
  try {
    await db.insert(clickEvents).values({
      linkId,
      ipHash,
      referrer: referrer ? referrer.slice(0, 255) : 'Direct',
      userAgent: client.userAgent,
      device: client.device,
      browser: client.browser,
      os: client.os,
      isBot: client.isBot,
      outcome,
    });
  } catch (err) {
    console.error('Failed to log click event:', err);
  }
}
