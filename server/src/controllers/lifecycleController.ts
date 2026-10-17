import { Response } from 'express';
import { Link, ClickEvent, AuditLog } from '../models/index.ts';
import { AuthRequest } from '../middleware/auth.ts';

export class LifecycleController {
  public static async getSummary(req: AuthRequest, res: Response) {
    const userId = req.user!._id;
    const now = new Date();
    const in48Hours = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const query: any = req.user!.role === 'admin' ? {} : { userId };

    try {
      const allLinks = await Link.find(query).lean();

      let activeCount = 0;
      let expiringSoonCount = 0;
      let expiredCount = 0;
      let limitReachedCount = 0;
      let disabledCount = 0;

      const criticalLinks: any[] = [];

      for (const l of allLinks) {
        let isCritical = false;
        let warningReason = '';

        if (!l.isActive) {
          disabledCount++;
        } else if (l.expiresAt && now > new Date(l.expiresAt)) {
          expiredCount++;
          isCritical = true;
          warningReason = 'Expired by schedule';
        } else if (l.clickLimit && l.clicksCount >= l.clickLimit) {
          limitReachedCount++;
          isCritical = true;
          warningReason = 'Click cap 100% reached';
        } else if (l.clickLimit && l.clicksCount >= l.clickLimit * 0.8) {
          activeCount++;
          isCritical = true;
          warningReason = `Click cap ${Math.round((l.clicksCount / l.clickLimit) * 100)}% utilized`;
        } else if (l.expiresAt && new Date(l.expiresAt) <= in48Hours) {
          expiringSoonCount++;
          activeCount++;
          isCritical = true;
          warningReason = 'Expiring within 48 hours';
        } else {
          activeCount++;
        }

        if (isCritical) {
          criticalLinks.push({
            id: String(l._id),
            shortCode: l.shortCode,
            destinationUrl: l.destinationUrl,
            title: l.title || l.shortCode,
            clicksCount: l.clicksCount,
            clickLimit: l.clickLimit,
            expiresAt: l.expiresAt,
            status: l.status,
            isActive: l.isActive,
            warningReason,
          });
        }
      }

      // Recent lifecycle events from AuditLog
      const recentEvents = await AuditLog.find({
        action: { $in: ['link.created', 'link.updated', 'link.deleted', 'link.takedown'] },
        ...(req.user!.role === 'admin' ? {} : { userId }),
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      return res.json({
        stats: {
          total: allLinks.length,
          active: activeCount,
          expiringSoon: expiringSoonCount,
          expired: expiredCount,
          limitReached: limitReachedCount,
          disabled: disabledCount,
        },
        criticalLinks: criticalLinks.slice(0, 10),
        timeline: recentEvents.map((e) => ({
          id: String(e._id),
          action: e.action,
          resourceId: e.resourceId,
          details: e.details,
          timestamp: new Date(e.createdAt).toISOString(),
        })),
      });
    } catch (error) {
      console.error('Lifecycle summary error:', error);
      return res.status(500).json({ error: 'Failed to retrieve link lifecycle summary.' });
    }
  }

  public static async toggleStatus(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const userId = req.user!._id;

    try {
      const link = await Link.findById(id);
      if (!link) {
        return res.status(404).json({ error: 'Link not found' });
      }

      if (req.user!.role !== 'admin' && String(link.userId) !== String(userId)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      link.isActive = !link.isActive;
      link.status = link.isActive ? 'active' : 'disabled';
      await link.save();

      AuditLog.create({
        userId,
        userEmail: req.user!.email,
        action: link.isActive ? 'link.resumed' : 'link.suspended',
        resourceType: 'link',
        resourceId: String(link._id),
        details: { shortCode: link.shortCode, isActive: link.isActive },
      }).catch(() => {});

      return res.json({
        message: `Link /${link.shortCode} is now ${link.isActive ? 'Active' : 'Suspended'}.`,
        link: {
          id: String(link._id),
          shortCode: link.shortCode,
          isActive: link.isActive,
          status: link.status,
        },
      });
    } catch (error) {
      console.error('Toggle status error:', error);
      return res.status(500).json({ error: 'Failed to toggle link status.' });
    }
  }
}
