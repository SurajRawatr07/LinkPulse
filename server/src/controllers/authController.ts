import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../models/index.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { signSessionToken } from '../utils/token.ts';

export class AuthController {
  /**
   * Public user registration: ALWAYS creates a standard 'user' role.
   * Admin roles are never assigned via public registration.
   */
  public static async register(req: Request, res: Response) {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const cleanEmail = String(email).toLowerCase().trim();

    try {
      const existing = await User.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(409).json({ error: 'An account with this email address already exists.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const apiKey = `lp_sec_${crypto.randomBytes(24).toString('hex')}`;

      // Strictly enforce regular 'user' role
      const user = await User.create({
        email: cleanEmail,
        passwordHash,
        name: String(name).trim(),
        role: 'user',
        apiKey,
      });

      const token = signSessionToken({
        userId: String(user._id),
        email: user.email,
        role: user.role,
      });

      res.cookie('lp_session', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      return res.status(201).json({
        user: {
          id: String(user._id),
          email: user.email,
          name: user.name,
          role: user.role,
          apiKey: user.apiKey,
        },
        token,
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      return res.status(500).json({ error: 'Failed to create account.' });
    }
  }

  /**
   * User login: validates bcrypt hash and establishes authenticated session.
   */
  public static async login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = String(email).toLowerCase().trim();

    try {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const token = signSessionToken({
        userId: String(user._id),
        email: user.email,
        role: user.role,
      });

      res.cookie('lp_session', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        user: {
          id: String(user._id),
          email: user.email,
          name: user.name,
          role: user.role,
          apiKey: user.apiKey,
        },
        token,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Failed to authenticate.' });
    }
  }

  /**
   * One-time protected administrative bootstrap endpoint.
   * Requires matching server-side ADMIN_BOOTSTRAP_SECRET header.
   */
  public static async bootstrapAdmin(req: Request, res: Response) {
    const bootstrapSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
    const providedSecret = req.headers['x-bootstrap-secret'] as string;

    if (!bootstrapSecret || !providedSecret || providedSecret !== bootstrapSecret) {
      return res.status(403).json({
        error: 'Unauthorized administrator bootstrap. Valid server bootstrap secret is required.',
      });
    }

    const { email, password, name = 'Platform Administrator' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and strong password are required.' });
    }

    if (typeof password !== 'string' || password.length < 10) {
      return res.status(400).json({ error: 'Admin password must be at least 10 characters long.' });
    }

    const cleanEmail = String(email).toLowerCase().trim();

    try {
      const existing = await User.findOne({ email: cleanEmail });
      const passwordHash = await bcrypt.hash(password, 12);

      if (existing) {
        existing.role = 'admin';
        existing.passwordHash = passwordHash;
        existing.name = String(name).trim();
        await existing.save();

        return res.json({
          message: 'Account successfully upgraded to Administrator.',
          user: {
            id: String(existing._id),
            email: existing.email,
            name: existing.name,
            role: existing.role,
          },
        });
      }

      const apiKey = `lp_sec_${crypto.randomBytes(24).toString('hex')}`;
      const user = await User.create({
        email: cleanEmail,
        passwordHash,
        name: String(name).trim(),
        role: 'admin',
        apiKey,
      });

      return res.status(201).json({
        message: 'Administrator account provisioned successfully.',
        user: {
          id: String(user._id),
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (err: any) {
      console.error('Admin bootstrap error:', err);
      return res.status(500).json({ error: 'Failed to provision administrator account.' });
    }
  }

  /**
   * Current user profile resolver
   */
  public static async me(req: AuthRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    return res.json({
      user: {
        id: String(req.user._id),
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        apiKey: req.user.apiKey,
        createdAt: req.user.createdAt,
      },
    });
  }

  /**
   * Logout: clears the authentication session cookie.
   */
  public static async logout(_req: Request, res: Response) {
    res.clearCookie('lp_session', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    return res.json({ message: 'Successfully logged out.' });
  }
}
