import { Router } from 'express';
import { PolicyLabController } from '../controllers/policyLabController.ts';
import { requireAuth } from '../middleware/auth.ts';

export const policyLabRoutes = Router();

policyLabRoutes.use(requireAuth);

policyLabRoutes.post('/simulate', PolicyLabController.simulate);
