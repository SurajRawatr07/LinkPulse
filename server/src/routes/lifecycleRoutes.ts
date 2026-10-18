import { Router } from 'express';
import { LifecycleController } from '../controllers/lifecycleController.ts';
import { requireAuth } from '../middleware/auth.ts';

export const lifecycleRoutes = Router();

lifecycleRoutes.use(requireAuth);

lifecycleRoutes.get('/summary', LifecycleController.getSummary);
lifecycleRoutes.post('/:id/toggle', LifecycleController.toggleStatus);
lifecycleRoutes.post('/extend-expiry/:id', LifecycleController.extendExpiry);
lifecycleRoutes.post('/:id/extend-expiry', LifecycleController.extendExpiry);
lifecycleRoutes.post('/increase-limit/:id', LifecycleController.increaseLimit);
lifecycleRoutes.post('/:id/increase-limit', LifecycleController.increaseLimit);
