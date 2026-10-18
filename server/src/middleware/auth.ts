import { Request, Response, NextFunction } from 'express';
import { User, IUser } from '../models/index.ts';
import { verifySessionToken } from '../utils/token.ts';

export interface AuthRequest extends Request {
  user?: IUser;
  requestId?: string;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  let token = req.cookies?.lp_session;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  try {
    // If token is an API key
    if (token.startsWith('lp_sec_')) {
      const user = await User.findOne({ apiKey: token });
      if (!user) {
        return res.status(401).json({ error: 'Invalid API Token' });
      }
      req.user = user;
      return next();
    }

    // 2. Verify signed session token
    const payload = verifySessionToken(token);
    if (payload) {
      const user = await User.findById(payload.userId);
      if (!user) {
        return res.status(401).json({ error: 'User account not found' });
      }
      req.user = user;
      return next();
    }

    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  } catch (error) {
    console.error('Authentication verification error:', error);
    return res.status(500).json({ error: 'Failed to verify session' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator privileges required for this action' });
  }

  next();
}
