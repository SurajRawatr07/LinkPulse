import { Router } from 'express';
import { BioController } from '../controllers/bioController.ts';
import { requireAuth } from '../middleware/auth.ts';

export const bioRoutes = Router();

// Protected user bio endpoints
bioRoutes.get('/me', requireAuth, BioController.getMyBio);
bioRoutes.put('/me', requireAuth, BioController.updateMyBio);

// Public bio page resolution & tracking
bioRoutes.get('/p/:slug', BioController.getBySlug);
bioRoutes.post('/p/:slug/click', BioController.trackClick);
