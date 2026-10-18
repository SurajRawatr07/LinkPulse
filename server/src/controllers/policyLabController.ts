import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.ts';
import { Link, ILink } from '../models/index.ts';
import { RedirectService, RedirectClientContext } from '../services/redirectService.ts';

export class PolicyLabController {
  /**
   * Evaluates redirect policies using the exact same RedirectService engine.
   * Can accept either an existing link ID or a hypothetical link configuration.
   */
  public static async simulate(req: AuthRequest, res: Response) {
    const {
      linkId,
      hypotheticalLink,
      device = 'desktop',
      country = 'US',
      simulatedTime,
      providedPassword,
      simulatedClicksCount,
      simulatedIsActive,
    } = req.body;

    let targetLink: ILink | null = null;

    if (linkId) {
      targetLink = await Link.findById(linkId);
    } else if (hypotheticalLink) {
      targetLink = new Link({
        shortCode: hypotheticalLink.shortCode || 'sim_link',
        destinationUrl: hypotheticalLink.destinationUrl || 'https://example.com/target',
        title: hypotheticalLink.title || 'Simulation Link',
        isActive: simulatedIsActive !== undefined ? simulatedIsActive : hypotheticalLink.isActive ?? true,
        status: hypotheticalLink.status || 'active',
        expiresAt: hypotheticalLink.expiresAt ? new Date(hypotheticalLink.expiresAt) : undefined,
        clickLimit: hypotheticalLink.clickLimit,
        clicksCount: simulatedClicksCount ?? hypotheticalLink.clicksCount ?? 0,
        passwordHash: hypotheticalLink.passwordHash || (hypotheticalLink.password ? '$2a$10$fakehash' : undefined),
        deviceTargeting: hypotheticalLink.deviceTargeting,
        countryTargeting: hypotheticalLink.countryTargeting,
        aBTesting: hypotheticalLink.aBTesting,
      });
    }

    if (!targetLink && linkId) {
      return res.status(404).json({ error: 'Referenced link not found.' });
    }

    // Map simulated device to appropriate User-Agent
    const uaMap: Record<string, string> = {
      ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
      android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/123.0.0.0 Mobile Safari/537.36',
      mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
      tablet: 'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
      desktop: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      bot: 'Googlebot/2.1 (+http://www.google.com/bot.html)',
    };

    const userAgent = uaMap[device] || uaMap.desktop;

    const context: RedirectClientContext = {
      userAgent,
      referrer: 'https://twitter.com/simulated',
      ip: '198.51.100.42',
      country: String(country).toUpperCase(),
      simulatedTime: simulatedTime ? new Date(simulatedTime) : new Date(),
      providedPassword,
    };

    // Override link properties if requested for scenario testing
    if (targetLink && simulatedClicksCount !== undefined) {
      targetLink.clicksCount = simulatedClicksCount;
    }
    if (targetLink && simulatedIsActive !== undefined) {
      targetLink.isActive = simulatedIsActive;
      targetLink.status = simulatedIsActive ? 'active' : 'disabled';
    }

    const evaluation = await RedirectService.evaluateRedirectRules(targetLink, context);

    return res.json({
      scenarioInput: {
        shortCode: targetLink?.shortCode || 'unknown',
        device,
        country,
        simulatedTime: context.simulatedTime?.toISOString(),
        providedPassword: providedPassword ? '••••••••' : '(none)',
        clicksCount: targetLink?.clicksCount || 0,
        clickLimit: targetLink?.clickLimit,
      },
      evaluation: {
        status: evaluation.status,
        finalDecision: evaluation.status === 'success' ? 'PERMIT_REDIRECT' : 'BLOCK_OR_CHALLENGE',
        destinationUrl: evaluation.destinationUrl,
        selectedVariant: evaluation.selectedVariant,
        reason: evaluation.reason,
        trace: evaluation.trace,
      },
    });
  }
}
