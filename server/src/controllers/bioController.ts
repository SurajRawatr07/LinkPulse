import { Request, Response } from 'express';
import { BioPage, User } from '../models/index.ts';
import { AuthRequest } from '../middleware/auth.ts';

export class BioController {
  /**
   * Get current user's bio page (creates default if missing)
   */
  public static async getMyBio(req: AuthRequest, res: Response) {
    const userId = req.user!._id;

    try {
      let page = await BioPage.findOne({ userId });
      if (!page) {
        // Create initial bio page for user
        const baseSlug = req.user!.name.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'my-profile';
        let uniqueSlug = baseSlug;
        let counter = 1;
        while (await BioPage.findOne({ slug: uniqueSlug })) {
          uniqueSlug = `${baseSlug}-${counter++}`;
        }

        page = await BioPage.create({
          userId,
          slug: uniqueSlug,
          title: req.user!.name,
          bio: 'Welcome to my official LinkPulse bio page.',
          theme: 'default',
          socialLinks: [
            { platform: 'twitter', url: 'https://twitter.com' },
            { platform: 'github', url: 'https://github.com' },
          ],
          links: [
            {
              id: 'l1',
              title: 'My Latest Project',
              url: 'https://github.com',
              isActive: true,
              clicksCount: 0,
            },
          ],
          clicksCount: 0,
        });
      }

      return res.json({ page });
    } catch (error) {
      console.error('Get my bio error:', error);
      return res.status(500).json({ error: 'Failed to retrieve bio page.' });
    }
  }

  /**
   * Update current user's bio page
   */
  public static async updateMyBio(req: AuthRequest, res: Response) {
    const userId = req.user!._id;
    const { slug, title, bio, avatar, theme, socialLinks, links } = req.body;

    try {
      if (slug) {
        const cleanSlug = String(slug).toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
        const existing = await BioPage.findOne({ slug: cleanSlug, userId: { $ne: userId } });
        if (existing) {
          return res.status(400).json({ error: 'This slug is already claimed by another user.' });
        }
      }

      const updates: any = {};
      if (slug !== undefined) updates.slug = String(slug).toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
      if (title !== undefined) updates.title = String(title).trim();
      if (bio !== undefined) updates.bio = String(bio).trim();
      if (avatar !== undefined) updates.avatar = avatar;
      if (theme !== undefined) updates.theme = theme;
      if (socialLinks !== undefined) updates.socialLinks = socialLinks;
      if (links !== undefined) updates.links = links;

      const page = await BioPage.findOneAndUpdate(
        { userId },
        { $set: updates },
        { new: true, upsert: true }
      );

      return res.json({ page });
    } catch (error) {
      console.error('Update bio error:', error);
      return res.status(500).json({ error: 'Failed to save bio page.' });
    }
  }

  /**
   * Public fetch by slug
   */
  public static async getBySlug(req: Request, res: Response) {
    const { slug } = req.params;

    try {
      const page = await BioPage.findOne({ slug: slug.toLowerCase() }).lean();
      if (!page) {
        return res.status(404).json({ error: 'Bio page not found.' });
      }

      return res.json({ page });
    } catch (error) {
      console.error('Get bio by slug error:', error);
      return res.status(500).json({ error: 'Failed to resolve bio profile.' });
    }
  }

  /**
   * Public click tracking for a link on a bio page
   */
  public static async trackClick(req: Request, res: Response) {
    const { slug } = req.params;
    const { linkId } = req.body;

    try {
      const page = await BioPage.findOne({ slug: slug.toLowerCase() });
      if (!page) {
        return res.status(404).json({ error: 'Bio page not found.' });
      }

      page.clicksCount = (page.clicksCount || 0) + 1;
      if (linkId && page.links) {
        const item = page.links.find((l) => l.id === linkId);
        if (item) {
          item.clicksCount = (item.clicksCount || 0) + 1;
        }
      }
      await page.save();

      return res.json({ success: true });
    } catch (error) {
      console.error('Track bio click error:', error);
      return res.status(500).json({ error: 'Failed to record click.' });
    }
  }
}
