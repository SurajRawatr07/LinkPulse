import { Router } from 'express';
import { ImportsController } from '../controllers/importsController.ts';
import { requireAuth } from '../middleware/auth.ts';

export const importsRoutes = Router();

importsRoutes.use(requireAuth);

importsRoutes.post('/bulk', ImportsController.processBulkImport);
