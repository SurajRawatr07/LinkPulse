import { BioPage } from '../../types';
import { db } from '../../lib/api/mockDb';

export const bioService = {
  async getBioPage(userId: string): Promise<BioPage> {
    return db.getBioByUserId(userId);
  },

  async getPublicBioPage(slug: string): Promise<BioPage> {
    const page = await db.getBioBySlug(slug);
    if (!page) throw new Error('Bio profile not found');
    return page;
  },

  async saveBioPage(userId: string, data: Partial<BioPage>): Promise<BioPage> {
    return db.saveBioPage(userId, data);
  },

  async trackBioClick(slug: string, linkId: string): Promise<void> {
    return db.trackBioClick(slug, linkId);
  },
};
