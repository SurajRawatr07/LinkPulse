import { Response } from 'express';
import mongoose from 'mongoose';
import { Campaign, Link, ClickEvent } from '../models/index.ts';
import { AuthRequest } from '../middleware/auth.ts';

export class CampaignsController {
  public static async getCampaigns(req: AuthRequest, res: Response) {
    const userId = req.user!._id;
    const query: any = req.user!.role === 'admin' ? {} : { userId };

    try {
      const items = await Campaign.find(query).sort({ createdAt: -1 }).lean();

      // Aggregate link count and total clicks for each campaign
      const enriched = await Promise.all(
        items.map(async (c) => {
          const links = await Link.find({ campaignId: c._id }).select('_id clicksCount');
          const linkCount = links.length;
          const totalClicks = links.reduce((sum, l) => sum + (l.clicksCount || 0), 0);

          return {
            id: String(c._id),
            name: c.name,
            description: c.description,
            color: c.color,
            linkCount,
            totalClicks,
            createdAt: new Date(c.createdAt).toISOString(),
          };
        })
      );

      return res.json({ items: enriched });
    } catch (error) {
      console.error('Get campaigns error:', error);
      return res.status(500).json({ error: 'Failed to retrieve campaigns.' });
    }
  }

  public static async createCampaign(req: AuthRequest, res: Response) {
    const { name, description, color = '#18181B' } = req.body;
    const userId = req.user!._id;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Campaign name is required.' });
    }

    try {
      const campaign = await Campaign.create({
        name: name.trim(),
        description: description?.trim(),
        color,
        userId,
      });

      return res.status(201).json({
        campaign: {
          id: String(campaign._id),
          name: campaign.name,
          description: campaign.description,
          color: campaign.color,
          createdAt: new Date(campaign.createdAt).toISOString(),
        },
      });
    } catch (error) {
      console.error('Create campaign error:', error);
      return res.status(500).json({ error: 'Failed to create campaign.' });
    }
  }

  public static async updateCampaign(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { name, description, color } = req.body;
    const userId = req.user!._id;

    try {
      const campaign = await Campaign.findById(id);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found.' });
      }

      if (req.user!.role !== 'admin' && String(campaign.userId) !== String(userId)) {
        return res.status(403).json({ error: 'Access denied.' });
      }

      if (name !== undefined) campaign.name = name.trim();
      if (description !== undefined) campaign.description = description.trim();
      if (color !== undefined) campaign.color = color;

      await campaign.save();

      return res.json({
        campaign: {
          id: String(campaign._id),
          name: campaign.name,
          description: campaign.description,
          color: campaign.color,
          updatedAt: new Date(campaign.updatedAt).toISOString(),
        },
      });
    } catch (error) {
      console.error('Update campaign error:', error);
      return res.status(500).json({ error: 'Failed to update campaign.' });
    }
  }

  public static async deleteCampaign(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const userId = req.user!._id;

    try {
      const campaign = await Campaign.findById(id);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found.' });
      }

      if (req.user!.role !== 'admin' && String(campaign.userId) !== String(userId)) {
        return res.status(403).json({ error: 'Access denied.' });
      }

      await Promise.all([
        Campaign.deleteOne({ _id: campaign._id }),
        Link.updateMany({ campaignId: campaign._id }, { $unset: { campaignId: 1 } }),
      ]);

      return res.json({ message: 'Campaign deleted successfully.' });
    } catch (error) {
      console.error('Delete campaign error:', error);
      return res.status(500).json({ error: 'Failed to delete campaign.' });
    }
  }
}
