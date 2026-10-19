import { Campaign, Tag } from '../../types';
import { db } from '../../lib/api/mockDb';

export const campaignService = {
  async getCampaigns(userId?: string): Promise<Campaign[]> {
    return db.getCampaigns(userId);
  },

  async getCampaign(id: string): Promise<Campaign> {
    const campaigns = await db.getCampaigns();
    const found = campaigns.find((c) => c.id === id);
    if (!found) throw new Error('Campaign not found');
    return found;
  },

  async createCampaign(data: {
    userId: string;
    name: string;
    description?: string;
    color: string;
  }): Promise<Campaign> {
    return db.createCampaign(data);
  },

  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign> {
    return db.updateCampaign(id, updates);
  },

  async deleteCampaign(id: string): Promise<void> {
    return db.deleteCampaign(id);
  },
};

export const tagService = {
  async getTags(userId?: string): Promise<Tag[]> {
    return db.getTags(userId);
  },

  async createTag(name: string, userId: string, color?: string): Promise<Tag> {
    return db.createTag(name, color, userId);
  },

  async deleteTag(id: string): Promise<void> {
    return db.deleteTag(id);
  },
};
