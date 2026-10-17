import { Router } from 'express';
import { LifecycleController } from '../controllers/lifecycleController.ts';
import { requireAuth } from '../middleware/auth.ts';

export const lifecycleRoutes = Router();

lifecycleRoutes.use(requireAuth);

lifecycleRoutes.get('/summary', LifecycleController.getSummary);
lifecycleRoutes.post('/:id/toggle', LifecycleController.toggleStatus);
