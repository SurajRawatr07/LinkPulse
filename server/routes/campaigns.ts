import { Router, Response } from 'express';
import { db } from '../../src/db/index.ts';
import { campaigns, links, clickEvents } from '../../src/db/schema.ts';
import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import { AuthRequest, requireAuth } from '../middleware/auth.ts';

export const campaignsRouter = Router();

// 1. List Campaigns with aggregated metrics
campaignsRouter.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    const userCampaigns = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.userId, userId))
      .orderBy(desc(campaigns.createdAt));

    const campaignIds = userCampaigns.map((c) => c.id);

    let statsMap: Record<
      number,
      { linkCount: number; totalClicks: number; uniqueVisitors: number }
    > = {};

    if (campaignIds.length > 0) {
      // Find all links for these campaigns
      const campaignLinks = await db
        .select({
          id: links.id,
          campaignId: links.campaignId,
          clicksCount: links.clicksCount,
        })
        .from(links)
        .where(
          and(
            eq(links.userId, userId),
            eq(links.isArchived, false),
            inArray(links.campaignId, campaignIds)
          )
        );

      const linkIds = campaignLinks.map((l) => l.id);

      // Clicks and unique visitors per link
      let clicksPerLink: Record<number, number> = {};
      let uniquePerLink: Record<number, number> = {};

      if (linkIds.length > 0) {
        const eventStats = await db
          .select({
            linkId: clickEvents.linkId,
            total: sql<number>`count(*)`,
            unique: sql<number>`count(distinct ${clickEvents.ipHash})`,
          })
          .from(clickEvents)
          .where(inArray(clickEvents.linkId, linkIds))
          .groupBy(clickEvents.linkId);

        eventStats.forEach((s) => {
          clicksPerLink[s.linkId] = Number(s.total);
          uniquePerLink[s.linkId] = Number(s.unique);
        });
      }

      campaignLinks.forEach((l) => {
        if (!l.campaignId) return;
        if (!statsMap[l.campaignId]) {
          statsMap[l.campaignId] = { linkCount: 0, totalClicks: 0, uniqueVisitors: 0 };
        }
        statsMap[l.campaignId].linkCount += 1;
        statsMap[l.campaignId].totalClicks += l.clicksCount || (clicksPerLink[l.id] || 0);
        statsMap[l.campaignId].uniqueVisitors += uniquePerLink[l.id] || 0;
      });
    }

    const items = userCampaigns.map((c) => ({
      ...c,
      linkCount: statsMap[c.id]?.linkCount || 0,
      totalClicks: statsMap[c.id]?.totalClicks || 0,
      uniqueVisitors: statsMap[c.id]?.uniqueVisitors || 0,
    }));

    return res.json({ items });
  } catch (error) {
    console.error('List campaigns error:', error);
    return res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// 2. Create Campaign
campaignsRouter.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { name, description, startDate, endDate } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Campaign name is required' });
  }

  try {
    const [newCampaign] = await db
      .insert(campaigns)
      .values({
        userId,
        name: name.trim(),
        description: description ? description.trim() : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      })
      .returning();

    return res.status(201).json({ campaign: newCampaign });
  } catch (error) {
    console.error('Create campaign error:', error);
    return res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// 3. Update Campaign
campaignsRouter.patch('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const campaignId = parseInt(req.params.id);
  const { name, description, startDate, endDate } = req.body;

  try {
    const updates: Partial<typeof campaigns.$inferInsert> = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description ? description.trim() : null;
    if (startDate !== undefined) updates.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updates.endDate = endDate ? new Date(endDate) : null;

    const [updated] = await db
      .update(campaigns)
      .set(updates)
      .where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    return res.json({ campaign: updated });
  } catch (error) {
    console.error('Update campaign error:', error);
    return res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// 4. Delete Campaign
campaignsRouter.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const campaignId = parseInt(req.params.id);

  try {
    // Unlink any associated links first
    await db
      .update(links)
      .set({ campaignId: null })
      .where(and(eq(links.campaignId, campaignId), eq(links.userId, userId)));

    const [deleted] = await db
      .delete(campaigns)
      .where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    return res.json({ success: true, message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    return res.status(500).json({ error: 'Failed to delete campaign' });
  }
});
