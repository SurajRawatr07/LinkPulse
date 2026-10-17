import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.ts';
import { AnalyticsService } from '../services/analyticsService.ts';

export class AnalyticsController {
  public static async getOverview(req: AuthRequest, res: Response) {
    const { linkId, campaignId, startDate, endDate, filterBots } = req.query;

    try {
      const data = await AnalyticsService.getAnalyticsOverview({
        userId: req.user!.role === 'admin' ? undefined : String(req.user!._id),
        linkId: linkId ? String(linkId) : undefined,
        campaignId: campaignId ? String(campaignId) : undefined,
        startDate: startDate ? new Date(String(startDate)) : undefined,
        endDate: endDate ? new Date(String(endDate)) : undefined,
        filterBots: filterBots === 'true',
      });

      return res.json(data);
    } catch (error) {
      console.error('Analytics overview error:', error);
      return res.status(500).json({ error: 'Failed to retrieve analytics.' });
    }
  }

  public static async exportCsv(req: AuthRequest, res: Response) {
    const { linkId } = req.query;

    try {
      const csv = await AnalyticsService.exportCsv({
        userId: req.user!.role === 'admin' ? undefined : String(req.user!._id),
        linkId: linkId ? String(linkId) : undefined,
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="linkpulse_analytics_${Date.now()}.csv"`);
      return res.send(csv);
    } catch (error) {
      console.error('Analytics CSV export error:', error);
      return res.status(500).json({ error: 'Failed to export CSV.' });
    }
  }

  public static async getLinkAnalytics(req: AuthRequest, res: Response) {
    const { id } = req.params;

    try {
      const summary = await AnalyticsService.getLinkAnalytics(id, String(req.user!._id));
      if (!summary) {
        return res.status(404).json({ error: 'Link not found' });
      }
      return res.json({ analytics: summary });
    } catch (error) {
      console.error('Link analytics error:', error);
      return res.status(500).json({ error: 'Failed to fetch link analytics.' });
    }
  }

  public static async getLinkClicks(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const limit = Math.min(100, parseInt(String(req.query.limit || 50), 10));

    try {
      const clicks = await AnalyticsService.getLinkClicks(id, limit);
      return res.json({ clicks });
    } catch (error) {
      console.error('Link clicks error:', error);
      return res.status(500).json({ error: 'Failed to fetch click logs.' });
    }
  }
}
