import type { Request, Response } from 'express';
import app from '../server/app.ts';
import { connectDB } from '../server/src/config/db.ts';

export default async function handler(req: Request, res: Response) {
  try {
    await connectDB();
  } catch (err) {
    console.error('Vercel serverless database connection error:', err);
  }

  // Normalize URL path if Vercel strips the /api prefix
  if (req.url && req.url.startsWith('/v1/')) {
    req.url = '/api' + req.url;
  }

  return app(req, res);
}
