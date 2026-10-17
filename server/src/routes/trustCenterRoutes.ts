import { Router } from 'express';
import { TrustCenterController } from '../controllers/trustCenterController.ts';
import { requireAuth, requireAdmin } from '../middleware/auth.ts';
import { reportsRateLimiter } from '../middleware/rateLimit.ts';

export const trustCenterRoutes = Router();

// Public abuse report submission
trustCenterRoutes.post('/report-abuse', reportsRateLimiter, TrustCenterController.submitAbuseReport);

// Authenticated surfaces
trustCenterRoutes.get('/overview', requireAuth, TrustCenterController.getOverview);
trustCenterRoutes.post('/check-domain', requireAuth, TrustCenterController.checkDomain);
trustCenterRoutes.get('/audit-logs', requireAuth, TrustCenterController.getAuditLogs);

// Admin moderation
trustCenterRoutes.get('/abuse-reports', requireAuth, requireAdmin, TrustCenterController.getAbuseReports);
trustCenterRoutes.patch('/abuse-reports/:id', requireAuth, requireAdmin, TrustCenterController.resolveAbuseReport);
