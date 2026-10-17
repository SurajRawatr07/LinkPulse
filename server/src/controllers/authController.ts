import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../models/index.ts';
import { AuthRequest } from '../middleware/auth.ts';

import { signSessionToken } from '../utils/token.ts';

export class AuthController {
  public static async register(req: Request, res: Response) {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    try {
      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        return res.status(400).json({ error: 'An account with this email address already exists.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const apiKey = `lp_sec_${crypto.randomBytes(24).toString('hex')}`;

      // First user registered or specific email becomes admin, otherwise user
      const count = await User.countDocuments();
      const role = count === 0 ? 'admin' : 'user';

      const user = await User.create({
        email: email.toLowerCase().trim(),
        passwordHash,
        name: name.trim(),
        role,
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

  public static async login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
      const user = await User.findOne({ email: email.toLowerCase().trim() });
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

  public static async demoLogin(req: Request, res: Response) {
    const { role = 'user' } = req.body;
    const targetEmail = role === 'admin' ? 'admin@linkpulse.io' : 'alex@linkpulse.io';

    try {
      let user = await User.findOne({ email: targetEmail });
      if (!user) {
        const passwordHash = await bcrypt.hash(role === 'admin' ? 'admin123' : 'demo123', 10);
        user = await User.create({
          email: targetEmail,
          passwordHash,
          name: role === 'admin' ? 'Administrator' : 'Alex Mercer',
          role: role === 'admin' ? 'admin' : 'user',
          apiKey: `lp_sec_${role}_demo_${crypto.randomBytes(12).toString('hex')}`,
        });
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
    } catch (error) {
      console.error('Demo login error:', error);
      return res.status(500).json({ error: 'Failed to initiate demo session.' });
    }
  }

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
      },
    });
  }

  public static async logout(_req: Request, res: Response) {
    res.clearCookie('lp_session');
    return res.json({ message: 'Successfully logged out.' });
  }
}
