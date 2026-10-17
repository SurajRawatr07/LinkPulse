import { Router } from 'express';
import { AuthController } from '../controllers/authController.ts';
import { requireAuth } from '../middleware/auth.ts';
import { authRateLimiter } from '../middleware/rateLimit.ts';

export const authRoutes = Router();

authRoutes.post('/register', authRateLimiter, AuthController.register);
authRoutes.post('/login', authRateLimiter, AuthController.login);
authRoutes.post('/demo-login', AuthController.demoLogin);
authRoutes.get('/me', requireAuth, AuthController.me);
authRoutes.post('/logout', AuthController.logout);
