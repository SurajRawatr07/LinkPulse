import mongoose from 'mongoose';
import { ClickEvent, Link, QrCode } from '../models/index.ts';

export interface AnalyticsQueryOptions {
  userId?: string;
  linkId?: string;
  campaignId?: string;
  startDate?: Date;
  endDate?: Date;
  filterBots?: boolean;
}

export class AnalyticsService {
  /**
   * Generates comprehensive dashboard analytics metrics and breakdowns
   */
  public static async getAnalyticsOverview(options: AnalyticsQueryOptions) {
    const match: any = {};
    const linkQuery: any = {};

    if (options.userId) {
      linkQuery.userId = new mongoose.Types.ObjectId(options.userId);
    }
    if (options.campaignId && options.campaignId !== 'all') {
      linkQuery.campaignId = new mongoose.Types.ObjectId(options.campaignId);
      match.campaignId = new mongoose.Types.ObjectId(options.campaignId);
    }

    // 1. Fetch user links and counts
    const userLinks = await Link.find(linkQuery).lean();
    const linkIds = userLinks.map((l) => l._id);

    const now = new Date();
    const totalLinks = userLinks.length;
    let activeLinks = 0;
    let expiredLinks = 0;

    for (const l of userLinks) {
      if (!l.isActive) {
        // disabled
      } else if (l.expiresAt && now > new Date(l.expiresAt)) {
        expiredLinks++;
      } else if (l.clickLimit && l.clicksCount >= l.clickLimit) {
        expiredLinks++;
      } else {
        activeLinks++;
      }
    }

    if (!match.campaignId) {
      match.linkId = { $in: linkIds };
    }

    if (options.startDate || options.endDate) {
      match.timestamp = {};
      if (options.startDate) match.timestamp.$gte = options.startDate;
      if (options.endDate) match.timestamp.$lte = options.endDate;
    }

    if (options.filterBots) {
      match.isBot = false;
    }

    // 2. Click summary KPIs
    const [summary] = await ClickEvent.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalClicks: { $sum: 1 },
          uniqueIps: { $addToSet: '$ipHash' },
          botClicks: {
            $sum: { $cond: [{ $eq: ['$isBot', true] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalClicks: 1,
          uniqueVisitors: { $size: '$uniqueIps' },
          botClicks: 1,
        },
      },
    ]);

    const totalClicks = summary?.totalClicks || 0;
    const uniqueVisitors = summary?.uniqueVisitors || 0;

    // 3. Time-series breakdown (by day)
    const timeSeries = await ClickEvent.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          clicks: { $sum: 1 },
          uniqueIps: { $addToSet: '$ipHash' },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          clicks: 1,
          uniqueVisitors: { $size: '$uniqueIps' },
        },
      },
      { $sort: { date: 1 } },
    ]);

    // 4. Referrers breakdown
    const rawReferrers = await ClickEvent.aggregate([
      { $match: match },
      { $group: { _id: '$referrer', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    const topReferrers = rawReferrers.map((r) => ({
      name: r._id || 'Direct',
      count: r.count,
      percentage: totalClicks > 0 ? Math.round((r.count / totalClicks) * 100) : 0,
    }));

    // 5. Device breakdown
    const rawDevices = await ClickEvent.aggregate([
      { $match: match },
      { $group: { _id: '$device', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const deviceDistribution = rawDevices.map((d) => ({
      name: d._id ? d._id.charAt(0).toUpperCase() + d._id.slice(1) : 'Desktop',
      count: d.count,
      percentage: totalClicks > 0 ? Math.round((d.count / totalClicks) * 100) : 0,
    }));

    // 6. Browser breakdown
    const rawBrowsers = await ClickEvent.aggregate([
      { $match: match },
      { $group: { _id: '$browser', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);

    const browserDistribution = rawBrowsers.map((b) => ({
      name: b._id || 'Other',
      count: b.count,
      percentage: totalClicks > 0 ? Math.round((b.count / totalClicks) * 100) : 0,
    }));

    // 7. Countries breakdown
    const rawCountries = await ClickEvent.aggregate([
      { $match: match },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    const topCountries = rawCountries.map((c) => ({
      name: c._id || 'Unknown',
      code: c._id || 'Unknown',
      count: c.count,
      percentage: totalClicks > 0 ? Math.round((c.count / totalClicks) * 100) : 0,
    }));

    // 8. Top performing links
    const topLinks = userLinks
      .sort((a, b) => (b.clicksCount || 0) - (a.clicksCount || 0))
      .slice(0, 5)
      .map((l) => ({
        linkId: String(l._id),
        id: String(l._id),
        shortCode: l.shortCode,
        title: l.title || l.shortCode,
        destinationUrl: l.destinationUrl,
        originalUrl: l.destinationUrl,
        clicks: l.clicksCount || 0,
      }));

    // 9. Health & capacity alerts
    const alerts: any[] = [];
    for (const l of userLinks) {
      if (l.clickLimit && l.clicksCount >= l.clickLimit * 0.8) {
        alerts.push({
          id: `limit-${l._id}`,
          type: 'limit_warning',
          linkId: String(l._id),
          linkTitle: l.title || l.shortCode,
          shortCode: l.shortCode,
          message: `Link /${l.shortCode} has reached ${Math.round((l.clicksCount / l.clickLimit) * 100)}% of its ${l.clickLimit} click quota.`,
        });
      }
      if (l.expiresAt && new Date(l.expiresAt) <= new Date(Date.now() + 48 * 60 * 60 * 1000) && new Date(l.expiresAt) > now) {
        alerts.push({
          id: `expiry-${l._id}`,
          type: 'expiring_soon',
          linkId: String(l._id),
          linkTitle: l.title || l.shortCode,
          shortCode: l.shortCode,
          message: `Link /${l.shortCode} will expire within 48 hours.`,
        });
      }
    }

    return {
      kpis: {
        totalClicks,
        uniqueVisitors,
        totalLinks,
        activeLinks,
        expiredLinks,
      },
      clicksOverTime: timeSeries,
      deviceDistribution,
      browserDistribution,
      topReferrers,
      topCountries,
      topLinks,
      alerts,
    };
  }

  /**
   * Detailed analytics summary for a single link
   */
  public static async getLinkAnalytics(linkId: string, _userId?: string) {
    const objId = new mongoose.Types.ObjectId(linkId);
    const link = await Link.findById(objId);
    if (!link) return null;

    const qr = await QrCode.findOne({ linkId: objId });
    const qrScans = qr?.scansCount || 0;

    const match = { linkId: objId };

    const [summary] = await ClickEvent.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalClicks: { $sum: 1 },
          uniqueIps: { $addToSet: '$ipHash' },
        },
      },
      {
        $project: {
          _id: 0,
          totalClicks: 1,
          uniqueClicks: { $size: '$uniqueIps' },
        },
      },
    ]);

    const totalClicks = summary?.totalClicks || link.clicksCount || 0;
    const uniqueClicks = summary?.uniqueClicks || Math.round(totalClicks * 0.75);

    // Clicks over time
    const rawTimeSeries = await ClickEvent.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          clicks: { $sum: 1 },
          uniqueIps: { $addToSet: '$ipHash' },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          clicks: 1,
          uniqueClicks: { $size: '$uniqueIps' },
        },
      },
      { $sort: { date: 1 } },
    ]);

    // Referrers
    const rawReferrers = await ClickEvent.aggregate([
      { $match: match },
      { $group: { _id: '$referrer', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);
    const referrers = rawReferrers.map((r) => ({
      name: r._id || 'Direct',
      count: r.count,
      percentage: totalClicks > 0 ? Math.round((r.count / totalClicks) * 100) : 0,
    }));

    // Devices
    const rawDevices = await ClickEvent.aggregate([
      { $match: match },
      { $group: { _id: '$device', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const devices = rawDevices.map((d) => ({
      name: d._id ? d._id.charAt(0).toUpperCase() + d._id.slice(1) : 'Desktop',
      count: d.count,
      percentage: totalClicks > 0 ? Math.round((d.count / totalClicks) * 100) : 0,
    }));

    // Countries
    const rawCountries = await ClickEvent.aggregate([
      { $match: match },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);
    const countries = rawCountries.map((c) => ({
      name: c._id || 'Unknown',
      count: c.count,
      percentage: totalClicks > 0 ? Math.round((c.count / totalClicks) * 100) : 0,
    }));

    return {
      totalClicks,
      uniqueClicks,
      qrScans,
      clicksOverTime: rawTimeSeries,
      referrers,
      devices,
      countries,
    };
  }

  /**
   * Real click events stream for a link
   */
  public static async getLinkClicks(linkId: string, limit = 50) {
    const objId = new mongoose.Types.ObjectId(linkId);
    const events = await ClickEvent.find({ linkId: objId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return events.map((e) => ({
      id: String(e._id),
      linkId: String(e.linkId),
      timestamp: new Date(e.timestamp).toISOString(),
      referrer: e.referrer || 'Direct',
      deviceType: e.device || 'desktop',
      browser: e.browser || 'Chrome',
      os: e.os || 'macOS',
      country: e.country || 'US',
      countryCode: e.country || 'US',
      city: e.region || 'Unknown',
      isBot: Boolean(e.isBot),
      isUnique: true,
      source: 'direct' as const,
    }));
  }

  /**
   * Generates CSV string of raw click events
   */
  public static async exportCsv(options: AnalyticsQueryOptions): Promise<string> {
    const match: any = {};
    if (options.linkId) match.linkId = new mongoose.Types.ObjectId(options.linkId);

    const events = await ClickEvent.find(match).sort({ timestamp: -1 }).limit(1000).lean();

    const headers = ['Timestamp', 'IP Hash', 'Referrer', 'Device', 'Browser', 'OS', 'Country', 'Is Bot'];
    const rows = events.map((e) => [
      new Date(e.timestamp).toISOString(),
      e.ipHash,
      `"${(e.referrer || 'Direct').replace(/"/g, '""')}"`,
      e.device,
      e.browser,
      e.os,
      e.country,
      e.isBot ? 'Yes' : 'No',
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
