import { Router, Response } from 'express';
import { db } from '../../src/db/index.ts';
import { links, clickEvents } from '../../src/db/schema.ts';
import { eq, and, sql, desc, inArray, gte } from 'drizzle-orm';
import { AuthRequest, requireAuth } from '../middleware/auth.ts';

export const analyticsRouter = Router();

// 1. Dashboard Overview Analytics
analyticsRouter.get('/overview', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { range = '30d', linkId, campaignId } = req.query as Record<string, string>;

  // Calculate start date
  const now = new Date();
  let startDate = new Date();
  if (range === '24h') {
    startDate.setHours(startDate.getHours() - 24);
  } else if (range === '7d') {
    startDate.setDate(startDate.getDate() - 7);
  } else {
    // 30d default
    startDate.setDate(startDate.getDate() - 30);
  }

  try {
    // Find all links for the user
    const linkConditions = [
      eq(links.userId, userId),
      eq(links.isArchived, false),
    ];
    if (linkId && linkId !== 'all') {
      linkConditions.push(eq(links.id, parseInt(linkId)));
    }
    if (campaignId && campaignId !== 'all') {
      linkConditions.push(eq(links.campaignId, parseInt(campaignId)));
    }

    const userLinks = await db
      .select()
      .from(links)
      .where(and(...linkConditions));

    const totalLinks = userLinks.length;
    const activeLinks = userLinks.filter(
      (l) =>
        l.isActive &&
        (!l.expiresAt || new Date(l.expiresAt) > now) &&
        (l.clickLimit === null || l.clicksCount < l.clickLimit)
    ).length;
    const expiredLinks = userLinks.filter(
      (l) => l.expiresAt && new Date(l.expiresAt) <= now
    ).length;

    const userLinkIds = userLinks.map((l) => l.id);

    if (userLinkIds.length === 0) {
      return res.json({
        kpis: {
          totalLinks: 0,
          activeLinks: 0,
          expiredLinks: 0,
          totalClicks: 0,
          uniqueVisitors: 0,
          humanClicks: 0,
          botClicks: 0,
        },
        clicksOverTime: [],
        deviceDistribution: [],
        browserDistribution: [],
        topReferrers: [],
        topLinks: [],
        alerts: [],
      });
    }

    // Click events in range
    const [eventTotals] = await db
      .select({
        totalClicks: sql<number>`count(*)`,
        uniqueVisitors: sql<number>`count(distinct ${clickEvents.ipHash})`,
        humanClicks: sql<number>`count(*) filter (where ${clickEvents.isBot} = false)`,
        botClicks: sql<number>`count(*) filter (where ${clickEvents.isBot} = true)`,
      })
      .from(clickEvents)
      .where(
        and(
          inArray(clickEvents.linkId, userLinkIds),
          gte(clickEvents.timestamp, startDate)
        )
      );

    // Clicks grouped by date
    const clicksByDate = await db
      .select({
        date: sql<string>`TO_CHAR(${clickEvents.timestamp}, 'YYYY-MM-DD')`,
        clicks: sql<number>`count(*)`,
        uniqueVisitors: sql<number>`count(distinct ${clickEvents.ipHash})`,
      })
      .from(clickEvents)
      .where(
        and(
          inArray(clickEvents.linkId, userLinkIds),
          gte(clickEvents.timestamp, startDate)
        )
      )
      .groupBy(sql`TO_CHAR(${clickEvents.timestamp}, 'YYYY-MM-DD')`)
      .orderBy(sql`TO_CHAR(${clickEvents.timestamp}, 'YYYY-MM-DD')`);

    // Device distribution
    const deviceDist = await db
      .select({
        name: clickEvents.device,
        value: sql<number>`count(*)`,
      })
      .from(clickEvents)
      .where(
        and(
          inArray(clickEvents.linkId, userLinkIds),
          gte(clickEvents.timestamp, startDate)
        )
      )
      .groupBy(clickEvents.device);

    // Browser distribution
    const browserDist = await db
      .select({
        name: clickEvents.browser,
        value: sql<number>`count(*)`,
      })
      .from(clickEvents)
      .where(
        and(
          inArray(clickEvents.linkId, userLinkIds),
          gte(clickEvents.timestamp, startDate)
        )
      )
      .groupBy(clickEvents.browser)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    // Top referrers
    const topReferrers = await db
      .select({
        name: clickEvents.referrer,
        value: sql<number>`count(*)`,
      })
      .from(clickEvents)
      .where(
        and(
          inArray(clickEvents.linkId, userLinkIds),
          gte(clickEvents.timestamp, startDate)
        )
      )
      .groupBy(clickEvents.referrer)
      .orderBy(desc(sql`count(*)`))
      .limit(6);

    // Top performing links
    const topLinks = [...userLinks]
      .sort((a, b) => b.clicksCount - a.clicksCount)
      .slice(0, 5)
      .map((l) => ({
        id: l.id,
        title: l.title,
        shortCode: l.shortCode,
        destinationUrl: l.destinationUrl,
        clicks: l.clicksCount,
        isActive: l.isActive,
      }));

    // Link alerts (expiring within 7 days or >= 80% click limit)
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const alerts = userLinks
      .filter((l) => {
        if (!l.isActive) return false;
        const nearExpiry =
          l.expiresAt &&
          new Date(l.expiresAt) > now &&
          new Date(l.expiresAt) <= sevenDaysLater;
        const nearLimit =
          l.clickLimit !== null && l.clicksCount >= l.clickLimit * 0.8;
        return nearExpiry || nearLimit;
      })
      .slice(0, 5)
      .map((l) => ({
        id: l.id,
        title: l.title,
        shortCode: l.shortCode,
        type:
          l.clickLimit && l.clicksCount >= l.clickLimit * 0.8
            ? 'limit'
            : 'expiry',
        message:
          l.clickLimit && l.clicksCount >= l.clickLimit * 0.8
            ? `${l.clicksCount} / ${l.clickLimit} clicks reached (>=80%)`
            : `Expiring soon: ${new Date(l.expiresAt!).toLocaleDateString()}`,
      }));

    return res.json({
      kpis: {
        totalLinks,
        activeLinks,
        expiredLinks,
        totalClicks: Number(eventTotals?.totalClicks || 0),
        uniqueVisitors: Number(eventTotals?.uniqueVisitors || 0),
        humanClicks: Number(eventTotals?.humanClicks || 0),
        botClicks: Number(eventTotals?.botClicks || 0),
      },
      clicksOverTime: clicksByDate.map((c) => ({
        date: c.date,
        clicks: Number(c.clicks),
        uniqueVisitors: Number(c.uniqueVisitors),
      })),
      deviceDistribution: deviceDist.map((d) => ({
        name: d.name.charAt(0).toUpperCase() + d.name.slice(1),
        value: Number(d.value),
      })),
      browserDistribution: browserDist.map((b) => ({
        name: b.name,
        value: Number(b.value),
      })),
      topReferrers: topReferrers.map((r) => ({
        name: r.name,
        value: Number(r.value),
      })),
      topLinks,
      alerts,
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});
