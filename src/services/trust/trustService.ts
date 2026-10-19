import { BlocklistEntry, AbuseReport } from '../../types';
import { db } from '../../lib/api/mockDb';

export const trustService = {
  async getHealth(): Promise<{ status: string; uptime: number; blocklistCount: number }> {
    const blocklist = await db.getBlocklist();
    return {
      status: 'healthy',
      uptime: 99.98,
      blocklistCount: blocklist.length,
    };
  },

  async checkDomain(url: string): Promise<{ isBlocked: boolean; entry?: BlocklistEntry; reason?: string }> {
    return db.checkDomain(url);
  },

  async reportAbuse(data: {
    linkId?: string;
    shortCode?: string;
    originalUrl?: string;
    reason: string;
    reporterEmail?: string;
  }): Promise<{ success: boolean; reportId: string }> {
    return db.reportAbuse(data);
  },

  async getBlocklist(): Promise<BlocklistEntry[]> {
    return db.getBlocklist();
  },

  async addBlocklistEntry(domain: string, reason: string): Promise<BlocklistEntry> {
    return db.addToBlocklist(domain, reason, 'Admin Console');
  },

  async removeBlocklistEntry(id: string): Promise<void> {
    return db.removeFromBlocklist(id);
  },

  async getAbuseReports(): Promise<AbuseReport[]> {
    return db.getAbuseReports();
  },

  async resolveAbuseReport(id: string, resolution: 'resolved' | 'dismissed', takeAction?: 'disable_link'): Promise<void> {
    return db.resolveAbuseReport(id, resolution, takeAction);
  },

  async getOverview(): Promise<any> {
    return db.getPlatformStats();
  },
};
