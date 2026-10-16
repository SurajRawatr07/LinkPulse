import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../../src/db/index.ts';
import {
  links,
  linkTags,
  tags,
  campaigns,
  folders,
  qrCodes,
  clickEvents,
  domainBlocklist,
} from '../../src/db/schema.ts';
import { eq, and, desc, asc, ilike, sql, inArray } from 'drizzle-orm';
import { AuthRequest, requireAuth } from '../middleware/auth.ts';

export const linksRouter = Router();

// Base62 helper
const BASE62 = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function generateRandomCode(length = 6): string {
  let result = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += BASE62[bytes[i] % BASE62.length];
  }
  return result;
}

// Check if domain is blocked
async function isDomainBlocked(urlStr: string): Promise<{ blocked: boolean; reason?: string }> {
  try {
    const parsed = new URL(urlStr);
    const hostname = parsed.hostname.toLowerCase();
    const blocked = await db
      .select()
      .from(domainBlocklist)
      .where(eq(domainBlocklist.domain, hostname))
      .limit(1);

    if (blocked.length > 0) {
      return { blocked: true, reason: blocked[0].reason };
    }
  } catch {
    return { blocked: true, reason: 'Invalid destination URL format' };
  }
  return { blocked: false };
}

// 1. List User's Links with Filtering and Pagination
linksRouter.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const {
    search,
    status = 'all',
    sort = 'newest',
    campaignId,
    tagId,
    page = '1',
    limit = '10',
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(limit) || 10));
  const offset = (pageNum - 1) * pageSize;

  try {
    const conditions = [
      eq(links.userId, userId),
      eq(links.isArchived, false),
    ];

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push(
        sql`(${links.title} ILIKE ${term} OR ${links.shortCode} ILIKE ${term} OR ${links.destinationUrl} ILIKE ${term})`
      );
    }

    if (status === 'active') {
      conditions.push(
        and(
          eq(links.isActive, true),
          sql`(${links.expiresAt} IS NULL OR ${links.expiresAt} > NOW())`,
          sql`(${links.clickLimit} IS NULL OR ${links.clicksCount} < ${links.clickLimit})`
        )!
      );
    } else if (status === 'disabled') {
      conditions.push(eq(links.isActive, false));
    } else if (status === 'expired') {
      conditions.push(
        sql`(${links.expiresAt} IS NOT NULL AND ${links.expiresAt} <= NOW())`
      );
    }

    if (campaignId && campaignId !== 'all') {
      conditions.push(eq(links.campaignId, parseInt(campaignId)));
    }

    // Determine sorting
    let orderByClause = desc(links.createdAt);
    if (sort === 'oldest') orderByClause = asc(links.createdAt);
    if (sort === 'clicks-high') orderByClause = desc(links.clicksCount);
    if (sort === 'clicks-low') orderByClause = asc(links.clicksCount);
    if (sort === 'title') orderByClause = asc(links.title);

    const whereClause = and(...conditions);

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(links)
      .where(whereClause);

    const total = Number(countResult?.count || 0);

    // Query paginated links
    const userLinks = await db
      .select()
      .from(links)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(pageSize)
      .offset(offset);

    // Fetch related tags and campaigns for these links
    const linkIds = userLinks.map((l) => l.id);
    let tagsByLink: Record<number, any[]> = {};
    let campaignMap: Record<number, any> = {};

    if (linkIds.length > 0) {
      const linkTagRows = await db
        .select({
          linkId: linkTags.linkId,
          tag: tags,
        })
        .from(linkTags)
        .innerJoin(tags, eq(linkTags.tagId, tags.id))
        .where(inArray(linkTags.linkId, linkIds));

      linkTagRows.forEach((row) => {
        if (!tagsByLink[row.linkId]) tagsByLink[row.linkId] = [];
        tagsByLink[row.linkId].push(row.tag);
      });

      const campaignIds = [
        ...new Set(userLinks.map((l) => l.campaignId).filter(Boolean)),
      ] as number[];

      if (campaignIds.length > 0) {
        const campaignRows = await db
          .select()
          .from(campaigns)
          .where(inArray(campaigns.id, campaignIds));

        campaignRows.forEach((c) => {
          campaignMap[c.id] = c;
        });
      }
    }

    const items = userLinks.map((link) => ({
      ...link,
      tags: tagsByLink[link.id] || [],
      campaign: link.campaignId ? campaignMap[link.campaignId] : null,
      hasPassword: Boolean(link.passwordHash),
      isExpired: link.expiresAt ? new Date(link.expiresAt) <= new Date() : false,
      isLimitReached:
        link.clickLimit !== null ? link.clicksCount >= link.clickLimit : false,
    }));

    return res.json({
      items,
      total,
      page: pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Fetch links error:', error);
    return res.status(500).json({ error: 'Failed to fetch links' });
  }
});

// 2. Check Custom Alias Availability
linksRouter.post('/check-alias', requireAuth, async (req: AuthRequest, res: Response) => {
  const { alias } = req.body;
  if (!alias || typeof alias !== 'string') {
    return res.status(400).json({ error: 'Alias is required' });
  }

  const trimmed = alias.trim();
  if (trimmed.length < 3 || trimmed.length > 30) {
    return res.status(400).json({
      available: false,
      error: 'Alias must be between 3 and 30 characters',
    });
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return res.status(400).json({
      available: false,
      error: 'Only letters, numbers, hyphens, and underscores are allowed',
    });
  }

  const reserved = [
    'api', 'admin', 'auth', 'app', 'login', 'register', 'dashboard',
    'links', 'settings', 'campaigns', 'tags', 'qr', 'import', 'about', 'terms', 'privacy'
  ];
  if (reserved.includes(trimmed.toLowerCase())) {
    return res.status(400).json({
      available: false,
      error: 'This alias is reserved by the system',
    });
  }

  try {
    const existing = await db
      .select({ id: links.id })
      .from(links)
      .where(eq(links.shortCode, trimmed))
      .limit(1);

    return res.json({
      available: existing.length === 0,
      alias: trimmed,
    });
  } catch (error) {
    console.error('Alias check error:', error);
    return res.status(500).json({ error: 'Failed to verify alias' });
  }
});

// 3. Create Short Link
linksRouter.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const {
    destinationUrl,
    customAlias,
    title,
    description,
    campaignId,
    folderId,
    tagIds,
    password,
    expiresAt,
    clickLimit,
    mobileUrl,
    tabletUrl,
    desktopUrl,
  } = req.body;

  // Validate destination URL
  if (!destinationUrl || typeof destinationUrl !== 'string') {
    return res.status(400).json({ error: 'Destination URL is required' });
  }

  const trimmedDest = destinationUrl.trim();
  if (!/^https?:\/\//i.test(trimmedDest)) {
    return res.status(400).json({ error: 'URL must start with http:// or https://' });
  }

  if (/^(javascript|data|vbscript|file):/i.test(trimmedDest)) {
    return res.status(400).json({ error: 'Unsupported URL protocol' });
  }

  // Check domain blocklist
  const blockCheck = await isDomainBlocked(trimmedDest);
  if (blockCheck.blocked) {
    return res.status(400).json({
      error: `Destination domain is blocked: ${blockCheck.reason || 'Security threat detected'}`,
    });
  }

  // Resolve short code
  let shortCode = customAlias ? customAlias.trim() : '';
  if (shortCode) {
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(shortCode)) {
      return res.status(400).json({ error: 'Custom alias must be 3-30 characters (letters, numbers, _, -)' });
    }
    const existing = await db
      .select({ id: links.id })
      .from(links)
      .where(eq(links.shortCode, shortCode))
      .limit(1);

    if (existing.length > 0) {
      return res.status(409).json({ error: 'This alias is already in use. Please pick another.' });
    }
  } else {
    // Generate unique code
    let tries = 0;
    while (!shortCode && tries < 10) {
      const candidate = generateRandomCode(6);
      const exists = await db
        .select({ id: links.id })
        .from(links)
        .where(eq(links.shortCode, candidate))
        .limit(1);
      if (exists.length === 0) {
        shortCode = candidate;
      }
      tries++;
    }
    if (!shortCode) {
      shortCode = `lp_${Date.now().toString(36)}`;
    }
  }

  // Password hash if protected
  let passwordHash: string | null = null;
  if (password && typeof password === 'string' && password.trim()) {
    const salt = await bcrypt.genSalt(10);
    passwordHash = await bcrypt.hash(password.trim(), salt);
  }

  try {
    const [newLink] = await db
      .insert(links)
      .values({
        userId,
        shortCode,
        destinationUrl: trimmedDest,
        title: title?.trim() || shortCode,
        description: description?.trim() || null,
        campaignId: campaignId ? parseInt(campaignId) : null,
        folderId: folderId ? parseInt(folderId) : null,
        passwordHash,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        clickLimit: clickLimit ? parseInt(clickLimit) : null,
        mobileUrl: mobileUrl?.trim() || null,
        tabletUrl: tabletUrl?.trim() || null,
        desktopUrl: desktopUrl?.trim() || null,
      })
      .returning();

    // Attach tags if provided
    if (Array.isArray(tagIds) && tagIds.length > 0) {
      for (const tId of tagIds) {
        await db.insert(linkTags).values({
          linkId: newLink.id,
          tagId: parseInt(tId),
        });
      }
    }

    // Create default QR Code record
    await db.insert(qrCodes).values({
      linkId: newLink.id,
      foregroundColor: '#0F9D8A',
      backgroundColor: '#FFFFFF',
      style: 'squares',
    });

    return res.status(201).json({
      link: newLink,
      shortUrl: `/r/${newLink.shortCode}`,
    });
  } catch (error) {
    console.error('Create link error:', error);
    return res.status(500).json({ error: 'Failed to create short link' });
  }
});

// 4. Get Link Details
linksRouter.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const linkId = parseInt(req.params.id);

  try {
    const records = await db
      .select()
      .from(links)
      .where(and(eq(links.id, linkId), eq(links.userId, userId)))
      .limit(1);

    if (records.length === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }

    const link = records[0];

    // Fetch tags
    const linkTagRows = await db
      .select({ tag: tags })
      .from(linkTags)
      .innerJoin(tags, eq(linkTags.tagId, tags.id))
      .where(eq(linkTags.linkId, linkId));

    // Fetch campaign
    let campaign = null;
    if (link.campaignId) {
      const [c] = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.id, link.campaignId))
        .limit(1);
      campaign = c || null;
    }

    // Fetch QR code
    const [qr] = await db
      .select()
      .from(qrCodes)
      .where(eq(qrCodes.linkId, linkId))
      .limit(1);

    return res.json({
      link: {
        ...link,
        hasPassword: Boolean(link.passwordHash),
        tags: linkTagRows.map((r) => r.tag),
        campaign,
        qrCode: qr || null,
      },
    });
  } catch (error) {
    console.error('Get link error:', error);
    return res.status(500).json({ error: 'Failed to fetch link details' });
  }
});

// 5. Update Link Settings
linksRouter.patch('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const linkId = parseInt(req.params.id);
  const {
    title,
    destinationUrl,
    description,
    campaignId,
    folderId,
    tagIds,
    password,
    expiresAt,
    clickLimit,
    mobileUrl,
    tabletUrl,
    desktopUrl,
  } = req.body;

  try {
    const [existing] = await db
      .select()
      .from(links)
      .where(and(eq(links.id, linkId), eq(links.userId, userId)))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: 'Link not found or access denied' });
    }

    const updates: Partial<typeof links.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description ? description.trim() : null;
    if (campaignId !== undefined) updates.campaignId = campaignId ? parseInt(campaignId) : null;
    if (folderId !== undefined) updates.folderId = folderId ? parseInt(folderId) : null;
    if (expiresAt !== undefined) updates.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (clickLimit !== undefined) updates.clickLimit = clickLimit ? parseInt(clickLimit) : null;
    if (mobileUrl !== undefined) updates.mobileUrl = mobileUrl ? mobileUrl.trim() : null;
    if (tabletUrl !== undefined) updates.tabletUrl = tabletUrl ? tabletUrl.trim() : null;
    if (desktopUrl !== undefined) updates.desktopUrl = desktopUrl ? desktopUrl.trim() : null;

    if (destinationUrl) {
      const destTrimmed = destinationUrl.trim();
      const blockCheck = await isDomainBlocked(destTrimmed);
      if (blockCheck.blocked) {
        return res.status(400).json({ error: `Blocked destination domain: ${blockCheck.reason}` });
      }
      updates.destinationUrl = destTrimmed;
    }

    if (password !== undefined) {
      if (password && password.trim()) {
        const salt = await bcrypt.genSalt(10);
        updates.passwordHash = await bcrypt.hash(password.trim(), salt);
      } else {
        updates.passwordHash = null;
      }
    }

    const [updated] = await db
      .update(links)
      .set(updates)
      .where(eq(links.id, linkId))
      .returning();

    // Update tags if provided
    if (Array.isArray(tagIds)) {
      await db.delete(linkTags).where(eq(linkTags.linkId, linkId));
      for (const tId of tagIds) {
        await db.insert(linkTags).values({
          linkId,
          tagId: parseInt(tId),
        });
      }
    }

    return res.json({ link: updated });
  } catch (error) {
    console.error('Update link error:', error);
    return res.status(500).json({ error: 'Failed to update link' });
  }
});

// 6. Disable / Enable Link
linksRouter.post('/:id/disable', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const linkId = parseInt(req.params.id);

  try {
    const [updated] = await db
      .update(links)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(links.id, linkId), eq(links.userId, userId)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Link not found' });
    }

    return res.json({ success: true, link: updated });
  } catch (error) {
    console.error('Disable link error:', error);
    return res.status(500).json({ error: 'Failed to disable link' });
  }
});

linksRouter.post('/:id/enable', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const linkId = parseInt(req.params.id);

  try {
    const [updated] = await db
      .update(links)
      .set({ isActive: true, updatedAt: new Date() })
      .where(and(eq(links.id, linkId), eq(links.userId, userId)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Link not found' });
    }

    return res.json({ success: true, link: updated });
  } catch (error) {
    console.error('Enable link error:', error);
    return res.status(500).json({ error: 'Failed to enable link' });
  }
});

// 7. Archive / Delete Link
linksRouter.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const linkId = parseInt(req.params.id);

  try {
    // Soft delete to preserve historical analytics
    const [updated] = await db
      .update(links)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(and(eq(links.id, linkId), eq(links.userId, userId)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Link not found' });
    }

    return res.json({ success: true, message: 'Link archived successfully' });
  } catch (error) {
    console.error('Delete link error:', error);
    return res.status(500).json({ error: 'Failed to archive link' });
  }
});

// 8. Individual Link Analytics
linksRouter.get('/:id/analytics', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const linkId = parseInt(req.params.id);

  try {
    const [link] = await db
      .select()
      .from(links)
      .where(and(eq(links.id, linkId), eq(links.userId, userId)))
      .limit(1);

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    // Total clicks and unique visitors
    const [totals] = await db
      .select({
        totalClicks: sql<number>`count(*)`,
        uniqueVisitors: sql<number>`count(distinct ${clickEvents.ipHash})`,
        humanClicks: sql<number>`count(*) filter (where ${clickEvents.isBot} = false)`,
        botClicks: sql<number>`count(*) filter (where ${clickEvents.isBot} = true)`,
      })
      .from(clickEvents)
      .where(eq(clickEvents.linkId, linkId));

    // Devices breakdown
    const devices = await db
      .select({
        name: clickEvents.device,
        value: sql<number>`count(*)`,
      })
      .from(clickEvents)
      .where(eq(clickEvents.linkId, linkId))
      .groupBy(clickEvents.device);

    // Browsers breakdown
    const browsers = await db
      .select({
        name: clickEvents.browser,
        value: sql<number>`count(*)`,
      })
      .from(clickEvents)
      .where(eq(clickEvents.linkId, linkId))
      .groupBy(clickEvents.browser)
      .limit(6);

    // Referrers breakdown
    const referrers = await db
      .select({
        name: clickEvents.referrer,
        value: sql<number>`count(*)`,
      })
      .from(clickEvents)
      .where(eq(clickEvents.linkId, linkId))
      .groupBy(clickEvents.referrer)
      .orderBy(desc(sql`count(*)`))
      .limit(6);

    // Recent click events
    const recentEvents = await db
      .select()
      .from(clickEvents)
      .where(eq(clickEvents.linkId, linkId))
      .orderBy(desc(clickEvents.timestamp))
      .limit(20);

    return res.json({
      link,
      totals: {
        totalClicks: Number(totals?.totalClicks || 0),
        uniqueVisitors: Number(totals?.uniqueVisitors || 0),
        humanClicks: Number(totals?.humanClicks || 0),
        botClicks: Number(totals?.botClicks || 0),
      },
      devices,
      browsers,
      referrers,
      recentEvents,
    });
  } catch (error) {
    console.error('Link analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch link analytics' });
  }
});
