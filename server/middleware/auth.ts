import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../../src/lib/firebase-admin.ts';
import { db } from '../../src/db/index.ts';
import { users } from '../../src/db/schema.ts';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';


export interface AuthenticatedUser {
  id: number;
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  avatarUrl?: string | null;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

// Simple in-memory session store for tokens (supports Firebase & Direct tokens)
const activeSessions = new Map<string, AuthenticatedUser>();

export function createSessionToken(user: AuthenticatedUser): string {
  const token = `lp_sess_${crypto.randomBytes(32).toString('hex')}`;
  activeSessions.set(token, user);
  return token;
}

export function removeSessionToken(token: string): void {
  activeSessions.delete(token);
}

export async function resolveUserFromToken(token: string): Promise<AuthenticatedUser | null> {
  // 1. Check local session cache
  if (activeSessions.has(token)) {
    return activeSessions.get(token)!;
  }

  // 2. Try Firebase ID token verification
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (decoded && decoded.uid) {
      // Find or create user in Cloud SQL
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.uid, decoded.uid))
        .limit(1);

      if (existing.length > 0) {
        const u: AuthenticatedUser = {
          id: existing[0].id,
          uid: existing[0].uid,
          email: existing[0].email,
          name: existing[0].name,
          role: existing[0].role as 'admin' | 'user',
          avatarUrl: existing[0].avatarUrl,
        };
        activeSessions.set(token, u);
        return u;
      }

      // Check if this is the first user in the database
      const allUsers = await db.select({ id: users.id }).from(users).limit(2);
      const isFirst = allUsers.length === 0;

      const newUser = await db
        .insert(users)
        .values({
          uid: decoded.uid,
          email: decoded.email || `${decoded.uid}@linkpulse.local`,
          name: decoded.name || 'LinkPulse User',
          role: isFirst ? 'admin' : 'user',
          avatarUrl: decoded.picture || null,
        })
        .returning();

      const u: AuthenticatedUser = {
        id: newUser[0].id,
        uid: newUser[0].uid,
        email: newUser[0].email,
        name: newUser[0].name,
        role: newUser[0].role as 'admin' | 'user',
        avatarUrl: newUser[0].avatarUrl,
      };
      activeSessions.set(token, u);
      return u;
    }
  } catch {
    // Not a Firebase token or failed verification
  }

  return null;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.lp_token;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : cookieToken;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Missing authentication token' });
  }

  try {
    const user = await resolveUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(401).json({ error: 'Unauthorized: Authentication failed' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.lp_token;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : cookieToken;

  if (token) {
    try {
      const user = await resolveUserFromToken(token);
      if (user) {
        req.user = user;
      }
    } catch {
      // Ignore errors for optional auth
    }
  }
  next();
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  await requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
  });
};
