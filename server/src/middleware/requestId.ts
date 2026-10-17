import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const reqId = (req.headers['x-request-id'] as string) || `req_${crypto.randomBytes(8).toString('hex')}`;
  (req as any).requestId = reqId;
  res.setHeader('X-Request-Id', reqId);

  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test' && !req.url.startsWith('/@') && !req.url.startsWith('/src/')) {
      console.log(`[${new Date().toISOString()}] [${reqId}] ${req.method} ${req.originalUrl || req.url} ${res.statusCode} (${duration}ms)`);
    }
  });

  next();
}
