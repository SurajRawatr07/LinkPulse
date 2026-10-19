import { linkService } from '../links/linkService';

export const lifecycleService = {
  async getSummary(): Promise<any> {
    const allLinks = await linkService.getLinks();
    const now = new Date();
    const in48Hours = new Date(Date.now() + 48 * 60 * 60 * 1000);

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
      } else if (l.rules?.expiresAt && now > new Date(l.rules.expiresAt)) {
        expiredCount++;
        isCritical = true;
        warningReason = 'Expired by schedule';
      } else if (l.rules?.clickLimit && l.clicksCount >= l.rules.clickLimit) {
        limitReachedCount++;
        isCritical = true;
        warningReason = 'Click cap 100% reached';
      } else if (l.rules?.clickLimit && l.clicksCount >= l.rules.clickLimit * 0.8) {
        activeCount++;
        isCritical = true;
        warningReason = `Click cap ${Math.round((l.clicksCount / l.rules.clickLimit) * 100)}% utilized`;
      } else if (l.rules?.expiresAt && new Date(l.rules.expiresAt) <= in48Hours) {
        expiringSoonCount++;
        activeCount++;
        isCritical = true;
        warningReason = 'Expiring within 48 hours';
      } else {
        activeCount++;
      }

      if (isCritical) {
        criticalLinks.push({
          id: l.id,
          shortCode: l.shortCode,
          destinationUrl: l.originalUrl,
          title: l.title || l.shortCode,
          clicksCount: l.clicksCount,
          clickLimit: l.rules?.clickLimit,
          expiresAt: l.rules?.expiresAt,
          status: l.isActive ? 'active' : 'disabled',
          isActive: l.isActive,
          warningReason,
        });
      }
    }

    const countsData = {
      total: allLinks.length,
      active: activeCount,
      expiringSoon: expiringSoonCount,
      expired: expiredCount,
      limitReached: limitReachedCount,
      disabled: disabledCount,
    };

    return {
      counts: countsData,
      stats: countsData,
      criticalLinks,
      timeline: [],
    };
  },

  async extendExpiry(id: string, days: number): Promise<any> {
    const link = await linkService.getLink(id);
    if (!link) throw new Error('Link not found');

    const currentExpiry =
      link.rules?.expiresAt && new Date(link.rules.expiresAt) > new Date()
        ? new Date(link.rules.expiresAt)
        : new Date();
    const newExpiry = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

    return linkService.updateLink(id, {
      rules: { ...link.rules, expiresAt: newExpiry },
      isActive: true,
    });
  },

  async increaseLimit(id: string, additionalClicks: number): Promise<any> {
    const link = await linkService.getLink(id);
    if (!link) throw new Error('Link not found');

    const currentLimit = link.rules?.clickLimit || link.clicksCount || 0;
    const newLimit = currentLimit + additionalClicks;

    return linkService.updateLink(id, {
      rules: { ...link.rules, clickLimit: newLimit },
      isActive: true,
    });
  },

  async toggleStatus(id: string): Promise<any> {
    const link = await linkService.getLink(id);
    if (!link) throw new Error('Link not found');
    return linkService.updateLink(id, { isActive: !link.isActive });
  },
};
