import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { UAParser } from 'ua-parser-js';
import { Link, ClickEvent, DomainBlocklist, ILink } from '../models/index.ts';

export interface RedirectClientContext {
  userAgent: string;
  referrer: string;
  ip: string;
  country?: string;
  simulatedTime?: Date;
  providedPassword?: string;
  verifiedToken?: string;
}

export interface RuleTraceStep {
  step: number;
  phase: string;
  matched: boolean;
  action: 'proceed' | 'terminate' | 'divert' | 'challenge';
  explanation: string;
}

export interface RedirectEvaluationResult {
  status:
    | 'success'
    | 'not_found'
    | 'disabled'
    | 'blocked'
    | 'expired'
    | 'limit_reached'
    | 'password_required'
    | 'password_invalid';
  destinationUrl?: string;
  linkId?: string;
  title?: string;
  reason?: string;
  trace: RuleTraceStep[];
  selectedVariant?: string;
}

export class RedirectService {
  /**
   * Hashes IP with daily salt for privacy-conscious fingerprinting
   */
  public static hashIp(ip: string): string {
    const salt = new Date().toISOString().slice(0, 10);
    return crypto.createHash('sha256').update(`${ip}-${salt}`).digest('hex').substring(0, 16);
  }

  /**
   * Parses User-Agent string to extract device, browser, OS, and bot classification
   */
  public static parseUserAgent(uaString: string) {
    const parser = new UAParser(uaString || '');
    const result = parser.getResult();

    const isBot = /bot|googlebot|crawler|spider|robot|crawling|lighthouse|headless/i.test(uaString || '');
    const rawDevice = result.device.type; // 'mobile', 'tablet', etc.

    const device: 'desktop' | 'mobile' | 'tablet' | 'bot' = isBot
      ? 'bot'
      : rawDevice === 'mobile'
      ? 'mobile'
      : rawDevice === 'tablet'
      ? 'tablet'
      : 'desktop';

    const osName = (result.os.name || '').toLowerCase();
    const isIos = /ios|iphone|ipad|ipod/i.test(osName);
    const isAndroid = /android/i.test(osName);
    const isMobile = device === 'mobile' || isIos || isAndroid;

    return {
      device,
      isMobile,
      browser: result.browser.name || 'Unknown',
      os: result.os.name || 'Unknown',
      isBot,
      isIos,
      isAndroid,
    };
  }

  /**
   * Core deterministic rule evaluation engine.
   * Shared between the live redirect route AND the Policy Lab Simulator.
   */
  public static async evaluateRedirectRules(
    link: ILink | null,
    ctx: RedirectClientContext
  ): Promise<RedirectEvaluationResult> {
    const trace: RuleTraceStep[] = [];
    const now = ctx.simulatedTime || new Date();

    // 1. Link Resolution Phase
    if (!link) {
      trace.push({
        step: 1,
        phase: 'Short Code Resolution',
        matched: false,
        action: 'terminate',
        explanation: 'Short code not found in registry. Target link does not exist.',
      });
      return {
        status: 'not_found',
        reason: 'Link not found',
        trace,
      };
    }

    trace.push({
      step: 1,
      phase: 'Short Code Resolution',
      matched: true,
      action: 'proceed',
      explanation: `Successfully resolved short code "${link.shortCode}" to link record ID ${link._id}.`,
    });

    // 2. Administrative & Lifecycle Active Check
    if (!link.isActive || link.status === 'disabled') {
      trace.push({
        step: 2,
        phase: 'Lifecycle Status Check',
        matched: true,
        action: 'terminate',
        explanation: 'Link has been deactivated or disabled by the owner/admin.',
      });
      return {
        status: 'disabled',
        reason: 'This link has been disabled by its owner.',
        trace,
      };
    }

    trace.push({
      step: 2,
      phase: 'Lifecycle Status Check',
      matched: false,
      action: 'proceed',
      explanation: 'Link is active and allowed to process traffic.',
    });

    // 3. Domain Blocklist & Trust Security Check
    let targetDomain = '';
    try {
      targetDomain = new URL(link.destinationUrl).hostname.toLowerCase();
    } catch {
      targetDomain = link.destinationUrl;
    }

    const isBlocklisted = await DomainBlocklist.findOne({ domain: targetDomain });
    if (isBlocklisted) {
      trace.push({
        step: 3,
        phase: 'Domain Safety & Trust Center Blocklist',
        matched: true,
        action: 'terminate',
        explanation: `Destination domain "${targetDomain}" is actively blocklisted (${isBlocklisted.reason}).`,
      });
      return {
        status: 'blocked',
        reason: `Destination blocked by Trust Center: ${isBlocklisted.reason}`,
        trace,
      };
    }

    trace.push({
      step: 3,
      phase: 'Domain Safety & Trust Center Blocklist',
      matched: false,
      action: 'proceed',
      explanation: `Destination domain "${targetDomain}" cleared security check.`,
    });

    // 4. Temporal Expiration Check
    if (link.expiresAt && now > new Date(link.expiresAt)) {
      trace.push({
        step: 4,
        phase: 'Temporal Expiration Window',
        matched: true,
        action: 'terminate',
        explanation: `Link expired at ${new Date(link.expiresAt).toISOString()}. Current time is ${now.toISOString()}.`,
      });
      return {
        status: 'expired',
        reason: 'This link has expired and is no longer accepting redirects.',
        trace,
      };
    }

    trace.push({
      step: 4,
      phase: 'Temporal Expiration Window',
      matched: false,
      action: 'proceed',
      explanation: link.expiresAt
        ? `Link within validity window (expires at ${new Date(link.expiresAt).toISOString()}).`
        : 'Link has no expiration date configured (permanent).',
    });

    // 5. Volume Limit Check
    if (link.clickLimit && link.clicksCount >= link.clickLimit) {
      trace.push({
        step: 5,
        phase: 'Click Volume Capacity',
        matched: true,
        action: 'terminate',
        explanation: `Click limit reached (${link.clicksCount} of ${link.clickLimit} clicks consumed).`,
      });
      return {
        status: 'limit_reached',
        reason: 'This short link has reached its maximum authorized redirect limit.',
        trace,
      };
    }

    trace.push({
      step: 5,
      phase: 'Click Volume Capacity',
      matched: false,
      action: 'proceed',
      explanation: link.clickLimit
        ? `Click quota available (${link.clicksCount} of ${link.clickLimit} used).`
        : 'Unlimited click capacity.',
    });

    // 6. Security Gate: Password Protection Check
    if (link.passwordHash) {
      if (!ctx.providedPassword && !ctx.verifiedToken) {
        trace.push({
          step: 6,
          phase: 'Security Gate: Password Verification',
          matched: true,
          action: 'challenge',
          explanation: 'Destination is password-protected. Client must provide an access password.',
        });
        return {
          status: 'password_required',
          reason: 'Access password required to open destination',
          trace,
        };
      }

      if (ctx.providedPassword) {
        const isMatch = await bcrypt.compare(ctx.providedPassword, link.passwordHash);
        if (!isMatch) {
          trace.push({
            step: 6,
            phase: 'Security Gate: Password Verification',
            matched: true,
            action: 'terminate',
            explanation: 'Provided password did not match the hashed security secret.',
          });
          return {
            status: 'password_invalid',
            reason: 'Incorrect password provided',
            trace,
          };
        }
      }

      trace.push({
        step: 6,
        phase: 'Security Gate: Password Verification',
        matched: false,
        action: 'proceed',
        explanation: 'Password verification passed successfully.',
      });
    } else {
      trace.push({
        step: 6,
        phase: 'Security Gate: Password Verification',
        matched: false,
        action: 'proceed',
        explanation: 'No password challenge configured on this link.',
      });
    }

    // 7. Policy Routing: Device Targeting, Country Rules & A/B Split Experiments
    const client = this.parseUserAgent(ctx.userAgent);
    let finalUrl = link.destinationUrl;
    let variantSelected: string | undefined;

    // A/B Experiment policy
    if (link.aBTesting?.enabled && link.aBTesting.variants?.length) {
      const variants = link.aBTesting.variants;
      const totalWeight = variants.reduce((sum, v) => sum + (v.weight || 0), 0) || 100;
      let rand = Math.random() * totalWeight;
      let chosen = variants[0];

      for (const v of variants) {
        if (rand < (v.weight || 0)) {
          chosen = v;
          break;
        }
        rand -= v.weight || 0;
      }

      finalUrl = chosen.destinationUrl;
      variantSelected = chosen.label || chosen.destinationUrl;

      trace.push({
        step: 7,
        phase: 'A/B Experiment Policy',
        matched: true,
        action: 'divert',
        explanation: `A/B Split Test active: Assigned to "${chosen.label}" (${chosen.weight}% weight) -> ${chosen.destinationUrl}`,
      });
    }
    // Device targeting policy
    else if (link.deviceTargeting) {
      if ((client.isIos || client.isMobile) && link.deviceTargeting.iosUrl) {
        finalUrl = link.deviceTargeting.iosUrl;
        trace.push({
          step: 7,
          phase: 'Device Policy Engine',
          matched: true,
          action: 'divert',
          explanation: `iOS client detected. Diverting traffic to iOS destination: ${finalUrl}`,
        });
      } else if ((client.isAndroid || client.isMobile) && link.deviceTargeting.androidUrl) {
        finalUrl = link.deviceTargeting.androidUrl;
        trace.push({
          step: 7,
          phase: 'Device Policy Engine',
          matched: true,
          action: 'divert',
          explanation: `Android client detected. Diverting traffic to Android destination: ${finalUrl}`,
        });
      } else if ((client.isMobile || client.isIos || client.isAndroid) && (link.deviceTargeting as any).mobileUrl) {
        finalUrl = (link.deviceTargeting as any).mobileUrl;
        trace.push({
          step: 7,
          phase: 'Device Policy Engine',
          matched: true,
          action: 'divert',
          explanation: `Mobile client detected. Diverting traffic to Mobile destination: ${finalUrl}`,
        });
      } else if (client.device === 'desktop' && link.deviceTargeting.desktopUrl) {
        finalUrl = link.deviceTargeting.desktopUrl;
        trace.push({
          step: 7,
          phase: 'Device Policy Engine',
          matched: true,
          action: 'divert',
          explanation: `Desktop client detected. Diverting traffic to Desktop destination: ${finalUrl}`,
        });
      } else {
        trace.push({
          step: 7,
          phase: 'Device Policy Engine',
          matched: false,
          action: 'proceed',
          explanation: `Device type "${client.device}" has no dedicated override. Falling back to default URL.`,
        });
      }
    } else {
      trace.push({
        step: 7,
        phase: 'Policy Routing Engine',
        matched: false,
        action: 'proceed',
        explanation: 'No conditional targeting overrides matched. Using primary destination.',
      });
    }

    // Country targeting policy (if not already diverted by A/B test)
    if (!variantSelected && link.countryTargeting?.length && ctx.country) {
      const match = link.countryTargeting.find(
        (c) => c.countryCode.toUpperCase() === ctx.country?.toUpperCase()
      );
      if (match) {
        finalUrl = match.destinationUrl;
        trace.push({
          step: 8,
          phase: 'Geo-Targeting Engine',
          matched: true,
          action: 'divert',
          explanation: `Visitor country "${ctx.country}" matched targeting rule. Diverting to: ${finalUrl}`,
        });
      }
    }

    return {
      status: 'success',
      destinationUrl: finalUrl,
      linkId: String(link._id),
      title: link.title || link.shortCode,
      selectedVariant: variantSelected,
      trace,
    };
  }

  /**
   * Executes a real live redirect with atomic concurrency-safe click increment
   * and durable ClickEvent persistence.
   */
  public static async executeLiveRedirect(
    shortCode: string,
    ctx: RedirectClientContext
  ): Promise<RedirectEvaluationResult> {
    const link = await Link.findOne({ shortCode: shortCode.toLowerCase() });

    const evaluation = await this.evaluateRedirectRules(link, ctx);

    if (evaluation.status !== 'success' || !link) {
      return evaluation;
    }

    // Atomic increment with concurrency check on click limit
    let updateFilter: any = { _id: link._id };
    if (link.clickLimit) {
      updateFilter.clicksCount = { $lt: link.clickLimit };
    }

    const updated = await Link.findOneAndUpdate(
      updateFilter,
      { $inc: { clicksCount: 1 } },
      { new: true }
    );

    // If update failed because clickLimit was reached concurrently
    if (!updated && link.clickLimit) {
      return {
        status: 'limit_reached',
        reason: 'Click limit reached concurrently by another visitor.',
        trace: evaluation.trace,
      };
    }

    // Asynchronous durable click tracking
    const client = this.parseUserAgent(ctx.userAgent);
    const ipHash = this.hashIp(ctx.ip);

    ClickEvent.create({
      linkId: link._id,
      campaignId: link.campaignId,
      timestamp: new Date(),
      ipHash,
      referrer: ctx.referrer || 'Direct',
      userAgent: ctx.userAgent || '',
      device: client.device,
      browser: client.browser,
      os: client.os,
      country: ctx.country || 'US',
      isBot: client.isBot,
      variantDestination: evaluation.selectedVariant || undefined,
    }).catch((err) => {
      console.error('Failed to persist click event:', err);
    });

    return evaluation;
  }
}
