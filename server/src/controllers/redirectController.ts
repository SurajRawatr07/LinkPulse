import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Link, QrCode } from '../models/index.ts';
import { RedirectService } from '../services/redirectService.ts';

const verifiedTokens = new Set<string>();

export class RedirectController {
  public static async resolveMetadata(req: Request, res: Response) {
    const { code } = req.params;
    try {
      const link = await Link.findOne({ shortCode: code.toLowerCase() });
      if (!link) {
        return res.status(404).json({ error: 'Link not found' });
      }

      return res.json({
        id: String(link._id),
        shortCode: link.shortCode,
        title: link.title || link.shortCode,
        destinationUrl: link.destinationUrl,
        originalUrl: link.destinationUrl,
        hasPassword: !!link.passwordHash,
        isActive: link.isActive,
        status: link.status,
        expiresAt: link.expiresAt ? new Date(link.expiresAt).toISOString() : undefined,
        clickLimit: link.clickLimit,
        clicksCount: link.clicksCount,
      });
    } catch (error) {
      console.error('Resolve link error:', error);
      return res.status(500).json({ error: 'Failed to resolve link' });
    }
  }

  public static async verifyPassword(req: Request, res: Response) {
    const { code } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    try {
      const link = await Link.findOne({ shortCode: code.toLowerCase() });
      if (!link) {
        return res.status(404).json({ error: 'Link not found' });
      }

      if (!link.passwordHash) {
        return res.json({ verified: true });
      }

      const isValid = await bcrypt.compare(password, link.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Incorrect password. Access denied.' });
      }

      const token = `lp_pass_${code}_${crypto.randomBytes(16).toString('hex')}`;
      verifiedTokens.add(token);

      res.cookie(`lp_verified_${code}`, token, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });

      return res.json({
        verified: true,
        token,
        redirectUrl: `/r/${code}?access_token=${token}`,
      });
    } catch (error) {
      console.error('Verify password error:', error);
      return res.status(500).json({ error: 'Internal verification failure' });
    }
  }

  public static async handleRedirect(req: Request, res: Response) {
    const { code } = req.params;
    const isQrScan = req.query.qr === '1';

    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    const verifiedCookie = req.cookies?.[`lp_verified_${code}`];
    const accessToken = req.query.access_token as string;
    const verifiedToken =
      (verifiedCookie && verifiedTokens.has(verifiedCookie)) ||
      (accessToken && verifiedTokens.has(accessToken))
        ? accessToken || verifiedCookie
        : undefined;

    // Track QR scan count if scanned via QR
    if (isQrScan) {
      Link.findOne({ shortCode: code.toLowerCase() }).then((link) => {
        if (link) {
          QrCode.updateOne({ linkId: link._id }, { $inc: { scansCount: 1 } }).catch(() => {});
        }
      });
    }

    try {
      const evaluation = await RedirectService.executeLiveRedirect(code, {
        userAgent: req.headers['user-agent'] || '',
        referrer: (req.headers.referer || req.headers.referrer || '') as string,
        ip: clientIp,
        country: (req.headers['cf-ipcountry'] as string) || (req.headers['x-country-code'] as string) || 'US',
        verifiedToken,
      });

      // 1. Successful redirect
      if (evaluation.status === 'success' && evaluation.destinationUrl) {
        // Prevent open redirect to relative or dangerous protocols
        let target = evaluation.destinationUrl;
        if (!target.startsWith('http://') && !target.startsWith('https://')) {
          target = 'https://' + target;
        }

        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('X-Redirect-Engine', 'LinkPulse-PolicyEngine-v2');
        return res.redirect(302, target);
      }

      // If client requests JSON
      if (req.headers.accept?.includes('application/json')) {
        return res.status(evaluation.status === 'not_found' ? 404 : 403).json(evaluation);
      }

      // 2. Otherwise render high-editorial fallback status screen (Project Era theme)
      const titleMap: Record<string, string> = {
        not_found: 'Link Not Found',
        disabled: 'Link Disabled',
        blocked: 'Destination Blocked',
        expired: 'Link Expired',
        limit_reached: 'Click Limit Reached',
        password_required: 'Password Protected',
        password_invalid: 'Access Denied',
      };

      const title = titleMap[evaluation.status] || 'Notice';
      const reason = evaluation.reason || 'This short link cannot be resolved.';

      if (evaluation.status === 'password_required') {
        // Render interactive password unlock page
        return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Required — LinkPulse</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;600;700&family=Outfit:wght@400;500;600;700&display=swap">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Outfit', -apple-system, sans-serif; background: #faf9f6; color: #171717; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: #ffffff; border: 1px solid rgba(0,0,0,0.08); border-radius: 16px; padding: 36px; max-width: 420px; width: 100%; box-shadow: 0 4px 24px rgba(0,0,0,0.04); text-align: center; }
    h1 { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 600; margin-bottom: 8px; }
    p { font-size: 13px; color: #737373; margin-bottom: 24px; line-height: 1.5; }
    input { width: 100%; padding: 12px 14px; border: 1px solid #d4d4d4; border-radius: 10px; font-size: 14px; margin-bottom: 16px; outline: none; }
    input:focus { border-color: #171717; ring: 2px solid rgba(0,0,0,0.1); }
    button { width: 100%; padding: 12px; background: #171717; color: #ffffff; border: none; border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer; transition: background 0.15s; }
    button:hover { background: #000000; }
    .error { color: #dc2626; font-size: 12px; margin-top: 12px; display: none; }
  </style>
</head>
<body>
  <div class="card">
    <div style="width:48px;height:48px;border-radius:12px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#171717" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    </div>
    <h1>Password Protected</h1>
    <p>This destination link requires an access password to proceed.</p>
    <form id="passForm">
      <input type="password" id="password" placeholder="Enter link password..." required autofocus />
      <button type="submit" id="submitBtn">Verify & Proceed</button>
      <div id="err" class="error"></div>
    </form>
  </div>
  <script>
    document.getElementById('passForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('submitBtn');
      const err = document.getElementById('err');
      btn.innerText = 'Verifying...';
      btn.disabled = true;
      err.style.display = 'none';

      try {
        const res = await fetch('/api/v1/redirect/${code}/verify-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: document.getElementById('password').value })
        });
        const data = await res.json();
        if (res.ok && data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else {
          err.innerText = data.error || 'Incorrect password';
          err.style.display = 'block';
          btn.innerText = 'Verify & Proceed';
          btn.disabled = false;
        }
      } catch (e) {
        err.innerText = 'Network error during verification';
        err.style.display = 'block';
        btn.innerText = 'Verify & Proceed';
        btn.disabled = false;
      }
    });
  </script>
</body>
</html>`);
      }

      // Other block or termination reason
      return res.status(evaluation.status === 'not_found' ? 404 : 403).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — LinkPulse</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;600;700&family=Outfit:wght@400;500;600;700&display=swap">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Outfit', -apple-system, sans-serif; background: #faf9f6; color: #171717; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: #ffffff; border: 1px solid rgba(0,0,0,0.08); border-radius: 16px; padding: 36px; max-width: 440px; width: 100%; box-shadow: 0 4px 24px rgba(0,0,0,0.04); text-align: center; }
    .badge { display: inline-block; font-family: monospace; font-size: 11px; font-weight: 600; text-transform: uppercase; padding: 4px 10px; border-radius: 20px; background: #f5f5f5; color: #525252; margin-bottom: 12px; }
    h1 { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 600; margin-bottom: 8px; }
    p { font-size: 13px; color: #737373; margin-bottom: 24px; line-height: 1.5; }
    a { display: inline-block; padding: 10px 20px; background: #171717; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 13px; }
    a:hover { background: #000000; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">${evaluation.status.replace('_', ' ')}</span>
    <h1>${title}</h1>
    <p>${reason}</p>
    <a href="/">Go to LinkPulse Home</a>
  </div>
</body>
</html>`);
    } catch (error) {
      console.error('Redirect handler error:', error);
      return res.status(500).send('Internal redirect engine error');
    }
  }
}
