import mongoose from 'mongoose';
import { ClickEvent, Link } from '../models/index.ts';

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
   * Generates comprehensive analytics metrics and breakdowns
   */
  public static async getAnalyticsOverview(options: AnalyticsQueryOptions) {
    const match: any = {};

    if (options.linkId) {
      match.linkId = new mongoose.Types.ObjectId(options.linkId);
    } else if (options.campaignId) {
      match.campaignId = new mongoose.Types.ObjectId(options.campaignId);
    } else if (options.userId) {
      // Find all links owned by this user
      const userLinks = await Link.find({ userId: options.userId }).select('_id');
      const linkIds = userLinks.map((l) => l._id);
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
    const botClicks = summary?.botClicks || 0;

    // Time-series breakdown (by day)
    const timeSeries = await ClickEvent.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          clicks: { $sum: 1 },
          uniqueVisitors: { $addToSet: '$ipHash' },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          clicks: 1,
          uniqueVisitors: { $size: '$uniqueVisitors' },
        },
      },
      { $sort: { date: 1 } },
    ]);

    // Referrers breakdown
    const referrers = await ClickEvent.aggregate([
      { $match: match },
      { $group: { _id: '$referrer', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
      { $project: { _id: 0, name: '$_id', count: 1 } },
    ]);

    // Device breakdown
    const devices = await ClickEvent.aggregate([
      { $match: match },
      { $group: { _id: '$device', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, name: '$_id', count: 1 } },
    ]);

    // Browser breakdown
    const browsers = await ClickEvent.aggregate([
      { $match: match },
      { $group: { _id: '$browser', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
      { $project: { _id: 0, name: '$_id', count: 1 } },
    ]);

    // Countries breakdown
    const countries = await ClickEvent.aggregate([
      { $match: match },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
      { $project: { _id: 0, code: '$_id', count: 1 } },
    ]);

    return {
      totalClicks,
      uniqueVisitors,
      botClicks,
      timeSeries,
      referrers,
      devices,
      browsers,
      countries,
    };
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
