import { DashboardAnalytics, AnalyticsSummary, TimeRange, ClickEvent } from '../../types';
import { db } from '../../lib/api/mockDb';

export const analyticsService = {
  async getDashboardAnalytics(params: {
    range: TimeRange;
    campaignId?: string;
    userId?: string;
    isAdmin?: boolean;
  }): Promise<DashboardAnalytics> {
    return db.getDashboardAnalytics(params);
  },

  async getAnalytics(options: { range?: string; linkId?: string; userId?: string }): Promise<AnalyticsSummary> {
    return db.getAnalytics(options);
  },

  async getLinkClicks(linkId: string, limit = 50): Promise<ClickEvent[]> {
    return db.getLinkClicks(linkId, limit);
  },

  async recordClick(params: {
    linkId: string;
    referrer?: string;
    userAgent?: string;
    source?: 'direct' | 'qr';
  }): Promise<void> {
    await db.recordClick(params);
  },
};
