import { Link } from '../../types';
import { db } from '../../lib/api/mockDb';

export const linkService = {
  async getLinks(params?: {
    userId?: string;
    campaignId?: string;
    tag?: string;
    search?: string;
    status?: 'all' | 'active' | 'expired' | 'disabled' | 'expiring';
    page?: number;
    limit?: number;
  }): Promise<Link[]> {
    return db.getLinks(params);
  },

  async getLink(id: string): Promise<Link> {
    const link = await db.getLink(id);
    if (!link) throw new Error('Link not found');
    return link;
  },

  async getLinkByCode(code: string): Promise<Link | null> {
    return db.getLinkByCode(code);
  },

  async createLink(data: {
    userId: string;
    originalUrl: string;
    shortCode?: string;
    title?: string;
    campaignId?: string;
    tags?: string[];
    rules?: any;
  }): Promise<Link> {
    return db.createLink(data);
  },

  async updateLink(id: string, updates: Partial<Link>): Promise<Link> {
    return db.updateLink(id, updates);
  },

  async deleteLink(id: string): Promise<void> {
    return db.deleteLink(id);
  },

  async bulkDeleteLinks(ids: string[]): Promise<void> {
    return db.bulkDeleteLinks(ids);
  },

  async bulkSetStatus(ids: string[], isActive: boolean): Promise<void> {
    return db.bulkSetStatus(ids, isActive);
  },

  async verifyPassword(id: string, passwordPlain: string): Promise<boolean> {
    return db.verifyPassword(id, passwordPlain);
  },
};
