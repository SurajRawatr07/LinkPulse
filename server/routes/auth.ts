import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../../src/db/index.ts';
import { users } from '../../src/db/schema.ts';
import { eq } from 'drizzle-orm';
import {
  AuthRequest,
  createSessionToken,
  removeSessionToken,
  requireAuth,
  resolveUserFromToken,
  AuthenticatedUser,
} from '../middleware/auth.ts';

export const authRouter = Router();

// In-memory lockout tracking
interface AttemptRecord {
  count: number;
  lockedUntil?: number;
}
const loginAttempts = new Map<string, AttemptRecord>();

// 1. Google Auth Exchange / Session Sync
authRouter.post('/google-session', async (req: Request, res: Response) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ error: 'Missing Firebase idToken' });
  }

  try {
    const user = await resolveUserFromToken(idToken);
    if (!user) {
      return res.status(401).json({ error: 'Invalid Google authentication token' });
    }

    const sessionToken = createSessionToken(user);
    res.cookie('lp_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      user,
      token: sessionToken,
    });
  } catch (error) {
    console.error('Google session sync error:', error);
    return res.status(500).json({ error: 'Failed to authenticate Google session' });
  }
});

// 2. Email & Password Register
authRouter.post('/register', async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Name must be at least 2 characters long' });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email address required' });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      return res.status(409).json({ error: 'This email is already registered' });
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Check if this is the first user (becomes admin)
    const allUsers = await db.select({ id: users.id }).from(users).limit(1);
    const isFirst = allUsers.length === 0;

    const uid = `usr_${crypto.randomBytes(12).toString('hex')}`;

    const [newUser] = await db
      .insert(users)
      .values({
        uid,
        email: normalizedEmail,
        name: name.trim(),
        role: isFirst ? 'admin' : 'user',
        passwordHash,
      })
      .returning();

    const authUser: AuthenticatedUser = {
      id: newUser.id,
      uid: newUser.uid,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role as 'admin' | 'user',
      avatarUrl: newUser.avatarUrl,
    };

    const sessionToken = createSessionToken(authUser);
    res.cookie('lp_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      user: authUser,
      token: sessionToken,
      message: isFirst ? 'Welcome! First user assigned Admin role.' : 'Account created successfully',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to create account' });
  }
});

// 3. Email & Password Login
authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const now = Date.now();
  const attempt = loginAttempts.get(normalizedEmail) || { count: 0 };

  if (attempt.lockedUntil && attempt.lockedUntil > now) {
    const remainingSeconds = Math.ceil((attempt.lockedUntil - now) / 1000);
    return res.status(429).json({
      error: `Too many failed attempts. Account locked for ${remainingSeconds}s.`,
      lockedUntil: attempt.lockedUntil,
    });
  }

  try {
    const records = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (records.length === 0) {
      attempt.count += 1;
      if (attempt.count >= 5) {
        attempt.lockedUntil = now + 60 * 1000; // 1 min lock
      }
      loginAttempts.set(normalizedEmail, attempt);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = records[0];
    if (!user.passwordHash) {
      return res.status(400).json({
        error: 'This account was created with Google Sign-In. Please sign in with Google.',
      });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      attempt.count += 1;
      if (attempt.count >= 5) {
        attempt.lockedUntil = now + 60 * 1000;
        loginAttempts.set(normalizedEmail, attempt);
        return res.status(429).json({
          error: 'Too many failed attempts. Account locked for 60 seconds.',
          lockedUntil: attempt.lockedUntil,
        });
      }
      loginAttempts.set(normalizedEmail, attempt);
      return res.status(401).json({
        error: `Invalid email or password (${5 - attempt.count} attempts remaining)`,
      });
    }

    // Reset attempts on success
    loginAttempts.delete(normalizedEmail);

    const authUser: AuthenticatedUser = {
      id: user.id,
      uid: user.uid,
      email: user.email,
      name: user.name,
      role: user.role as 'admin' | 'user',
      avatarUrl: user.avatarUrl,
    };

    const sessionToken = createSessionToken(authUser);
    res.cookie('lp_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      user: authUser,
      token: sessionToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

// 4. Current User Session Check
authRouter.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  return res.json({ user: req.user });
});

// 5. Logout
authRouter.post('/logout', (req: Request, res: Response) => {
  const token = req.cookies?.lp_token || (req.headers.authorization?.startsWith('Bearer ') && req.headers.authorization.substring(7));
  if (token) {
    removeSessionToken(token);
  }
  res.clearCookie('lp_token');
  return res.json({ success: true, message: 'Logged out successfully' });
});

// 6. Demo Account Quick Sign-In (For evaluators and hackathon testing)
authRouter.post('/demo-login', async (req: Request, res: Response) => {
  const { role = 'user' } = req.body;
  const demoEmail = role === 'admin' ? 'admin@linkpulse.io' : 'alex@linkpulse.io';
  const demoName = role === 'admin' ? 'LinkPulse Administrator' : 'Alex Rivera';
  const demoUid = role === 'admin' ? 'demo_admin_uid' : 'demo_user_uid';

  try {
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, demoEmail))
      .limit(1);

    if (!user) {
      [user] = await db
        .insert(users)
        .values({
          uid: demoUid,
          email: demoEmail,
          name: demoName,
          role: role === 'admin' ? 'admin' : 'user',
        })
        .returning();
    } else if (role === 'admin' && user.role !== 'admin') {
      [user] = await db
        .update(users)
        .set({ role: 'admin' })
        .where(eq(users.id, user.id))
        .returning();
    }

    const authUser: AuthenticatedUser = {
      id: user.id,
      uid: user.uid,
      email: user.email,
      name: user.name,
      role: user.role as 'admin' | 'user',
      avatarUrl: user.avatarUrl,
    };

    const sessionToken = createSessionToken(authUser);
    res.cookie('lp_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      user: authUser,
      token: sessionToken,
    });
  } catch (error) {
    console.error('Demo login error:', error);
    return res.status(500).json({ error: 'Failed demo login' });
  }
});
