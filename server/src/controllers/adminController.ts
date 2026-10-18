import { Response } from 'express';
import { User, Link, DomainBlocklist, ClickEvent, AuditLog } from '../models/index.ts';
import { AuthRequest } from '../middleware/auth.ts';

export class AdminController {
  public static async getOverview(req: AuthRequest, res: Response) {
    try {
      const [totalUsers, totalLinks, activeLinks, totalClicks, blockedDomains] = await Promise.all([
        User.countDocuments(),
        Link.countDocuments(),
        Link.countDocuments({ isActive: true }),
        ClickEvent.countDocuments(),
        DomainBlocklist.countDocuments(),
      ]);

      return res.json({
        stats: {
          totalUsers,
          totalLinks,
          activeLinks,
          totalClicks,
          blockedDomains,
        },
        totalUsers,
        totalLinks,
        activeLinks,
        totalClicks,
        blockedDomains,
      });
    } catch (error) {
      console.error('Admin overview error:', error);
      return res.status(500).json({ error: 'Failed to retrieve admin telemetry.' });
    }
  }

  public static async getUsers(req: AuthRequest, res: Response) {
    try {
      const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean();

      const userStats = await Promise.all(
        users.map(async (u) => {
          const linkCount = await Link.countDocuments({ userId: u._id });
          return {
            id: String(u._id),
            name: u.name,
            email: u.email,
            role: u.role,
            linkCount,
            createdAt: new Date(u.createdAt).toISOString(),
          };
        })
      );

      return res.json({ users: userStats });
    } catch (error) {
      console.error('Admin get users error:', error);
      return res.status(500).json({ error: 'Failed to retrieve user accounts.' });
    }
  }

  public static async getBlocklist(req: AuthRequest, res: Response) {
    try {
      const list = await DomainBlocklist.find().sort({ createdAt: -1 }).lean();
      return res.json({
        items: list.map((b) => ({
          id: String(b._id),
          domain: b.domain,
          reason: b.reason,
          createdAt: new Date(b.createdAt).toISOString(),
        })),
      });
    } catch (error) {
      console.error('Get blocklist error:', error);
      return res.status(500).json({ error: 'Failed to retrieve blocklist.' });
    }
  }

  public static async addBlocklistDomain(req: AuthRequest, res: Response) {
    const { domain, reason } = req.body;

    if (!domain || !reason) {
      return res.status(400).json({ error: 'Domain and reason are required.' });
    }

    const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    try {
      const existing = await DomainBlocklist.findOne({ domain: clean });
      if (existing) {
        return res.status(409).json({ error: `Domain "${clean}" is already blocklisted.` });
      }

      const blocked = await DomainBlocklist.create({
        domain: clean,
        reason: reason.trim(),
        blockedBy: req.user!._id,
      });

      AuditLog.create({
        userId: req.user!._id,
        userEmail: req.user!.email,
        action: 'blocklist.added',
        resourceType: 'domain',
        resourceId: clean,
        details: { reason },
      }).catch(() => {});

      return res.status(201).json({
        domain: {
          id: String(blocked._id),
          domain: blocked.domain,
          reason: blocked.reason,
          createdAt: new Date(blocked.createdAt).toISOString(),
        },
      });
    } catch (error) {
      console.error('Add blocklist error:', error);
      return res.status(500).json({ error: 'Failed to add blocklist domain.' });
    }
  }

  public static async removeBlocklistDomain(req: AuthRequest, res: Response) {
    const { id } = req.params;

    try {
      const item = await DomainBlocklist.findById(id);
      if (!item) {
        return res.status(404).json({ error: 'Blocklist record not found.' });
      }

      await DomainBlocklist.deleteOne({ _id: item._id });

      AuditLog.create({
        userId: req.user!._id,
        userEmail: req.user!.email,
        action: 'blocklist.removed',
        resourceType: 'domain',
        resourceId: item.domain,
      }).catch(() => {});

      return res.json({ message: `Domain "${item.domain}" removed from blocklist.` });
    } catch (error) {
      console.error('Remove blocklist error:', error);
      return res.status(500).json({ error: 'Failed to remove blocklist domain.' });
    }
  }
}
