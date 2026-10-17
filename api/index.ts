import type { Request, Response } from 'express';
import app from '../server/app.ts';
import { connectDB } from '../server/src/config/db.ts';

export default async function handler(req: Request, res: Response) {
  try {
    await connectDB();
  } catch (err) {
    console.error('Vercel serverless database connection error:', err);
  }
  return app(req, res);
}
