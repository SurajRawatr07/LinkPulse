import { Router, Request, Response } from 'express';
import { db } from '../../src/db/index.ts';
import {
  users,
  links,
  clickEvents,
  domainBlocklist,
  abuseReports,
  auditLogs,
} from '../../src/db/schema.ts';
import { eq, sql, desc, ilike } from 'drizzle-orm';
import { AuthRequest, requireAdmin } from '../middleware/auth.ts';

export const adminRouter = Router();

// Public link reporting endpoint
export const reportsRouter = Router();
reportsRouter.post('/', async (req: Request, res: Response) => {
  const { shortCode, linkId, reporterEmail, reason, details } = req.body;

  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'Report reason is required' });
  }

  try {
    let targetLinkId = linkId ? parseInt(linkId) : null;
    if (!targetLinkId && shortCode) {
      const [found] = await db
        .select({ id: links.id })
        .from(links)
        .where(eq(links.shortCode, shortCode.trim()))
        .limit(1);
      if (found) targetLinkId = found.id;
    }

    const [report] = await db
      .insert(abuseReports)
      .values({
        linkId: targetLinkId,
        reporterEmail: reporterEmail?.trim() || null,
        reason: reason.trim(),
        details: details?.trim() || null,
      })
      .returning();

    return res.status(201).json({ success: true, message: 'Report submitted for review', report });
  } catch (error) {
    console.error('Submit report error:', error);
    return res.status(500).json({ error: 'Failed to submit abuse report' });
  }
});

// All routes below require Admin role
adminRouter.use(requireAdmin);

// 1. Platform-wide Overview
adminRouter.get('/overview', async (_req: AuthRequest, res: Response) => {
  try {
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [linkCount] = await db.select({ count: sql<number>`count(*)` }).from(links);
    const [disabledCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(links)
      .where(eq(links.isActive, false));
    const [clickCount] = await db.select({ count: sql<number>`count(*)` }).from(clickEvents);
    const [blockedCount] = await db.select({ count: sql<number>`count(*)` }).from(domainBlocklist);
    const [pendingReports] = await db
      .select({ count: sql<number>`count(*)` })
      .from(abuseReports)
      .where(eq(abuseReports.status, 'pending'));

    return res.json({
      stats: {
        totalUsers: Number(userCount?.count || 0),
        totalLinks: Number(linkCount?.count || 0),
        disabledLinks: Number(disabledCount?.count || 0),
        totalClicks: Number(clickCount?.count || 0),
        blockedDomains: Number(blockedCount?.count || 0),
        pendingReports: Number(pendingReports?.count || 0),
      },
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    return res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// 2. Users Management
adminRouter.get('/users', async (req: AuthRequest, res: Response) => {
  const { search, limit = '50', page = '1' } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit) || 50));
  const offset = (pageNum - 1) * pageSize;

  try {
    let whereClause = undefined;
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      whereClause = sql`(${users.name} ILIKE ${term} OR ${users.email} ILIKE ${term})`;
    }

    const allUsers = await db
      .select({
        id: users.id,
        uid: users.uid,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(pageSize)
      .offset(offset);

    // Get link counts for each user
    const linkCounts = await db
      .select({
        userId: links.userId,
        count: sql<number>`count(*)`,
        totalClicks: sql<number>`coalesce(sum(${links.clicksCount}), 0)`,
      })
      .from(links)
      .groupBy(links.userId);

    const countsMap: Record<number, { links: number; clicks: number }> = {};
    linkCounts.forEach((c) => {
      countsMap[c.userId] = { links: Number(c.count), clicks: Number(c.totalClicks) };
    });

    const items = allUsers.map((u) => ({
      ...u,
      linksCount: countsMap[u.id]?.links || 0,
      totalClicks: countsMap[u.id]?.clicks || 0,
    }));

    return res.json({ items });
  } catch (error) {
    console.error('Admin users error:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Promote/Demote user
adminRouter.patch('/users/:id/role', async (req: AuthRequest, res: Response) => {
  const targetId = parseInt(req.params.id);
  const { role } = req.body;

  if (role !== 'admin' && role !== 'user') {
    return res.status(400).json({ error: 'Role must be admin or user' });
  }

  try {
    const [updated] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, targetId))
      .returning();

    await db.insert(auditLogs).values({
      actor: req.user!.email,
      action: 'UPDATE_USER_ROLE',
      targetType: 'user',
      targetId: String(targetId),
      reason: `Changed role to ${role}`,
    });

    return res.json({ success: true, user: updated });
  } catch (error) {
    console.error('Update user role error:', error);
    return res.status(500).json({ error: 'Failed to update user role' });
  }
});

// 3. Platform Links Moderation
adminRouter.get('/links', async (req: AuthRequest, res: Response) => {
  const { search, limit = '50', page = '1' } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit) || 50));
  const offset = (pageNum - 1) * pageSize;

  try {
    let whereClause = undefined;
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      whereClause = sql`(${links.title} ILIKE ${term} OR ${links.shortCode} ILIKE ${term} OR ${links.destinationUrl} ILIKE ${term})`;
    }

    const platformLinks = await db
      .select({
        id: links.id,
        shortCode: links.shortCode,
        destinationUrl: links.destinationUrl,
        title: links.title,
        clicksCount: links.clicksCount,
        isActive: links.isActive,
        isBlocked: links.isBlocked,
        blockReason: links.blockReason,
        createdAt: links.createdAt,
        userEmail: users.email,
        userName: users.name,
      })
      .from(links)
      .innerJoin(users, eq(links.userId, users.id))
      .where(whereClause)
      .orderBy(desc(links.createdAt))
      .limit(pageSize)
      .offset(offset);

    return res.json({ items: platformLinks });
  } catch (error) {
    console.error('Admin links error:', error);
    return res.status(500).json({ error: 'Failed to fetch platform links' });
  }
});

// Admin disable link
adminRouter.post('/links/:id/disable', async (req: AuthRequest, res: Response) => {
  const linkId = parseInt(req.params.id);
  const { reason = 'Administrative safety action' } = req.body;

  try {
    const [updated] = await db
      .update(links)
      .set({
        isActive: false,
        isBlocked: true,
        blockReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(links.id, linkId))
      .returning();

    await db.insert(auditLogs).values({
      actor: req.user!.email,
      action: 'DISABLE_LINK',
      targetType: 'link',
      targetId: String(linkId),
      reason,
    });

    return res.json({ success: true, link: updated });
  } catch (error) {
    console.error('Admin disable link error:', error);
    return res.status(500).json({ error: 'Failed to disable link' });
  }
});

// Admin enable link
adminRouter.post('/links/:id/enable', async (req: AuthRequest, res: Response) => {
  const linkId = parseInt(req.params.id);

  try {
    const [updated] = await db
      .update(links)
      .set({
        isActive: true,
        isBlocked: false,
        blockReason: null,
        updatedAt: new Date(),
      })
      .where(eq(links.id, linkId))
      .returning();

    await db.insert(auditLogs).values({
      actor: req.user!.email,
      action: 'ENABLE_LINK',
      targetType: 'link',
      targetId: String(linkId),
      reason: 'Administrative review cleared',
    });

    return res.json({ success: true, link: updated });
  } catch (error) {
    console.error('Admin enable link error:', error);
    return res.status(500).json({ error: 'Failed to enable link' });
  }
});

// 4. Domain Blocklist Management
adminRouter.get('/blocklist', async (_req: AuthRequest, res: Response) => {
  try {
    const list = await db
      .select()
      .from(domainBlocklist)
      .orderBy(desc(domainBlocklist.createdAt));
    return res.json({ items: list });
  } catch (error) {
    console.error('Fetch blocklist error:', error);
    return res.status(500).json({ error: 'Failed to fetch blocklist' });
  }
});

adminRouter.post('/blocklist', async (req: AuthRequest, res: Response) => {
  const { domain, reason } = req.body;

  if (!domain || !domain.trim()) {
    return res.status(400).json({ error: 'Domain is required' });
  }
  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'Reason is required' });
  }

  const cleanDomain = domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .split('/')[0];

  try {
    const [newItem] = await db
      .insert(domainBlocklist)
      .values({
        domain: cleanDomain,
        reason: reason.trim(),
        blockedBy: req.user!.email,
      })
      .returning();

    await db.insert(auditLogs).values({
      actor: req.user!.email,
      action: 'ADD_BLOCKED_DOMAIN',
      targetType: 'domain',
      targetId: cleanDomain,
      reason: reason.trim(),
    });

    return res.status(201).json({ item: newItem });
  } catch (error: any) {
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'Domain is already in the blocklist' });
    }
    console.error('Add blocklist error:', error);
    return res.status(500).json({ error: 'Failed to add blocked domain' });
  }
});

adminRouter.delete('/blocklist/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);

  try {
    const [deleted] = await db
      .delete(domainBlocklist)
      .where(eq(domainBlocklist.id, id))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: 'Blocklist item not found' });
    }

    await db.insert(auditLogs).values({
      actor: req.user!.email,
      action: 'REMOVE_BLOCKED_DOMAIN',
      targetType: 'domain',
      targetId: deleted.domain,
      reason: 'Domain unblocked by admin',
    });

    return res.json({ success: true, message: 'Domain removed from blocklist' });
  } catch (error) {
    console.error('Delete blocklist error:', error);
    return res.status(500).json({ error: 'Failed to remove blocked domain' });
  }
});

// 5. Audit Logs
adminRouter.get('/audit-logs', async (_req: AuthRequest, res: Response) => {
  try {
    const logs = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(50);
    return res.json({ items: logs });
  } catch (error) {
    console.error('Fetch audit logs error:', error);
    return res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// 6. Abuse Reports
adminRouter.get('/abuse-reports', async (_req: AuthRequest, res: Response) => {
  try {
    const reports = await db
      .select({
        id: abuseReports.id,
        linkId: abuseReports.linkId,
        reporterEmail: abuseReports.reporterEmail,
        reason: abuseReports.reason,
        details: abuseReports.details,
        status: abuseReports.status,
        createdAt: abuseReports.createdAt,
        shortCode: links.shortCode,
        destinationUrl: links.destinationUrl,
      })
      .from(abuseReports)
      .leftJoin(links, eq(abuseReports.linkId, links.id))
      .orderBy(desc(abuseReports.createdAt))
      .limit(50);

    return res.json({ items: reports });
  } catch (error) {
    console.error('Fetch abuse reports error:', error);
    return res.status(500).json({ error: 'Failed to fetch abuse reports' });
  }
});
