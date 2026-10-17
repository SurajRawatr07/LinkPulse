import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
}

const rateLimitBuckets = new Map<string, { count: number; resetTime: number }>();

export function createRateLimiter(config: RateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    const key = `${req.baseUrl || req.path}:${ip}`;
    const now = Date.now();
    const bucket = rateLimitBuckets.get(key);

    if (!bucket || now > bucket.resetTime) {
      rateLimitBuckets.set(key, { count: 1, resetTime: now + config.windowMs });
      return next();
    }

    if (bucket.count >= config.maxRequests) {
      const retryAfterSec = Math.ceil((bucket.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      return res.status(429).json({
        error: config.message,
        retryAfter: retryAfterSec,
      });
    }

    bucket.count += 1;
    next();
  };
}

// Preset limiters for key surfaces
export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 attempts per minute
  message: 'Too many authentication attempts. Please wait a minute and try again.',
});

export const creationRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60, // 60 link creations per minute
  message: 'Link creation rate limit reached. Please pace your requests.',
});

export const reportsRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  maxRequests: 10,
  message: 'Abuse report submission limit reached. Please wait before submitting more reports.',
});
