import { DashboardAnalytics, AnalyticsSummary } from '../../types';
import { db } from '../../lib/api/mockDb';

export const analyticsService = {
  async getDashboardAnalytics(params: {
    range: string;
    campaignId?: string;
    userId?: string;
    isAdmin?: boolean;
  }): Promise<DashboardAnalytics> {
    return db.getDashboardAnalytics(params);
  },

  async getLinkClicks(linkId: string, range?: string): Promise<AnalyticsSummary> {
    return db.getAnalytics({ range, linkId });
  },

  async recordClick(linkId: string, details?: any): Promise<void> {
    await db.recordClick(linkId, details || {});
  },
};
