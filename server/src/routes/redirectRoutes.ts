import { Router } from 'express';
import { RedirectController } from '../controllers/redirectController.ts';
import { Link } from '../models/index.ts';

export const redirectRoutes = Router();

const SYSTEM_PREFIXES = new Set([
  'api', 'app', 'admin', 'login', 'register', 'signup',
  'r', 'bio', 'b', 'assets', 'src', 'node_modules', '@vite',
  'favicon.ico', 'robots.txt', 'sitemap.xml', 'health', 'ready',
  'dashboard', 'links', 'qr', 'policy-lab', 'lifecycle', 'trust-center', 'settings',
]);

redirectRoutes.get('/api/v1/redirect/:code/metadata', RedirectController.resolveMetadata);
redirectRoutes.post('/api/v1/redirect/:code/verify-password', RedirectController.verifyPassword);
redirectRoutes.get('/r/:code', RedirectController.handleRedirect);

// Root vanity / short-code redirect: e.g. domain.com/:code
redirectRoutes.get('/:code', async (req, res, next) => {
  const code = req.params.code?.toLowerCase();
  if (!code || SYSTEM_PREFIXES.has(code) || code.includes('.')) {
    return next();
  }

  try {
    const link = await Link.findOne({ shortCode: code });
    if (link) {
      return RedirectController.handleRedirect(req, res);
    }
  } catch {
    // Ignore and fall through to SPA
  }

  next();
});
