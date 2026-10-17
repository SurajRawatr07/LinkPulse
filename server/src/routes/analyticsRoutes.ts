import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController.ts';
import { requireAuth } from '../middleware/auth.ts';

export const analyticsRoutes = Router();

analyticsRoutes.use(requireAuth);

analyticsRoutes.get('/overview', AnalyticsController.getOverview);
analyticsRoutes.get('/export', AnalyticsController.exportCsv);
