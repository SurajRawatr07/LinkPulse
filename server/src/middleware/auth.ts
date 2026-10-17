import { Request, Response, NextFunction } from 'express';
import { User, IUser } from '../models/index.ts';

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

    // Decode session token
    let decodedString = '';
    try {
      decodedString = Buffer.from(token, 'base64').toString('utf-8');
    } catch {
      return res.status(401).json({ error: 'Malformed authentication token' });
    }

    const [email, secret] = decodedString.split(':');
    if (!email || !secret) {
      return res.status(401).json({ error: 'Invalid session structure' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'User account not found' });
    }

    req.user = user;
    next();
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
