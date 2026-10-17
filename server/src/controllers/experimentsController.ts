import { Response } from 'express';
import { Link, ClickEvent } from '../models/index.ts';
import { AuthRequest } from '../middleware/auth.ts';

export class ExperimentsController {
  public static async getExperiments(req: AuthRequest, res: Response) {
    const userId = req.user!._id;
    const query: any = {
      'aBTesting.enabled': true,
      ...(req.user!.role === 'admin' ? {} : { userId }),
    };

    try {
      const links = await Link.find(query).lean();

      // Aggregate variant traffic
      const results = await Promise.all(
        links.map(async (l) => {
          const variantClicks = await ClickEvent.aggregate([
            { $match: { linkId: l._id, variantDestination: { $exists: true } } },
            { $group: { _id: '$variantDestination', count: { $sum: 1 } } },
          ]);

          const variantStatsMap = new Map<string, number>();
          variantClicks.forEach((vc) => variantStatsMap.set(vc._id, vc.count));

          const variantsWithTraffic = (l.aBTesting?.variants || []).map((v) => ({
            label: v.label,
            destinationUrl: v.destinationUrl,
            weight: v.weight,
            clicks: variantStatsMap.get(v.label) || variantStatsMap.get(v.destinationUrl) || 0,
          }));

          const totalExperimentClicks = variantsWithTraffic.reduce((sum, v) => sum + v.clicks, 0);

          return {
            linkId: String(l._id),
            shortCode: l.shortCode,
            title: l.title || l.shortCode,
            totalClicks: l.clicksCount,
            experimentClicks: totalExperimentClicks,
            variants: variantsWithTraffic,
            sampleSizeAdequate: totalExperimentClicks >= 50,
            recommendation:
              totalExperimentClicks < 50
                ? 'Sample size under 50 clicks; continue running before drawing statistical conclusions.'
                : variantsWithTraffic[0]?.clicks > (variantsWithTraffic[1]?.clicks || 0) * 1.3
                ? `Variant "${variantsWithTraffic[0].label}" is outperforming with higher engagement.`
                : 'Performance between variants is currently balanced.',
          };
        })
      );

      return res.json({ experiments: results });
    } catch (error) {
      console.error('Get experiments error:', error);
      return res.status(500).json({ error: 'Failed to retrieve experiments.' });
    }
  }

  public static async configureExperiment(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { enabled, variants } = req.body;
    const userId = req.user!._id;

    try {
      const link = await Link.findById(id);
      if (!link) {
        return res.status(404).json({ error: 'Link not found' });
      }

      if (req.user!.role !== 'admin' && String(link.userId) !== String(userId)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (enabled && (!variants || !Array.isArray(variants) || variants.length < 2)) {
        return res.status(400).json({ error: 'A/B testing requires at least two destination variants.' });
      }

      link.aBTesting = {
        enabled: Boolean(enabled),
        variants: (variants || []).map((v: any, idx: number) => ({
          label: v.label || `Variant ${String.fromCharCode(65 + idx)}`,
          destinationUrl: v.destinationUrl.trim(),
          weight: Math.max(1, parseInt(v.weight, 10) || 50),
          clicksCount: 0,
        })),
      };

      await link.save();

      return res.json({
        message: 'A/B experiment configuration saved.',
        aBTesting: link.aBTesting,
      });
    } catch (error) {
      console.error('Configure experiment error:', error);
      return res.status(500).json({ error: 'Failed to configure A/B experiment.' });
    }
  }
}
