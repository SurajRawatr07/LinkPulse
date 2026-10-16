import { db } from './mockDb';
import {
  Link,
  User,
  Campaign,
  Tag,
  BlocklistEntry,
  TimeRange,
  DashboardAnalytics,
  ClickEvent,
  BioPage,
} from '../../types';

// Helper to get stored auth token
function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('lp_token') || sessionStorage.getItem('lp_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string; status: number }> {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(options.headers || {}),
    };

    const res = await fetch(endpoint, {
      ...options,
      headers,
      credentials: 'include',
    });

    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const json = await res.json();
      if (!res.ok) {
        return { error: json.error || `HTTP error ${res.status}`, status: res.status };
      }
      return { data: json as T, status: res.status };
    }

    if (!res.ok) {
      return { error: `Server returned ${res.status}`, status: res.status };
    }
    return { status: res.status };
  } catch (err: any) {
    return { error: err.message || 'Network request failed', status: 500 };
  }
}

// Transform backend link record to frontend Link model
function transformBackendLink(item: any): Link {
  return {
    id: String(item.id),
    userId: String(item.userId),
    originalUrl: item.destinationUrl || item.originalUrl || '',
    shortCode: item.shortCode,
    title: item.title || item.shortCode,
    domain: 'linkpulse.io',
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : new Date().toISOString(),
    isActive: Boolean(item.isActive),
    isDeleted: Boolean(item.isArchived),
    tags: Array.isArray(item.tags)
      ? item.tags.map((t: any) => (typeof t === 'string' ? t : t.name))
      : [],
    campaignId: item.campaignId ? String(item.campaignId) : undefined,
    clicksCount: Number(item.clicksCount || 0),
    uniqueClicksCount: Number(item.uniqueClicksCount || Math.round((item.clicksCount || 0) * 0.75)),
    qrScansCount: Number(item.qrScansCount || 0),
    rules: {
      expiresAt: item.expiresAt ? new Date(item.expiresAt).toISOString() : undefined,
      clickLimit: item.clickLimit || undefined,
      mobileUrl: item.mobileUrl || undefined,
    },
    abuseFlag: Boolean(item.isBlocked),
    abuseStatus: item.isBlocked ? 'disabled' : 'clean',
    abuseReason: item.blockReason || undefined,
  };
}

export const authApi = {
  getUserCount: async (): Promise<number> => {
    const res = await apiFetch<{ stats: { totalUsers: number } }>('/api/v1/admin/overview');
    if (res.data?.stats) {
      return res.data.stats.totalUsers;
    }
    return db.getUserCount();
  },

  getCurrentUser: async (): Promise<User | null> => {
    const res = await apiFetch<{ user: any }>('/api/v1/auth/me');
    if (res.data?.user) {
      const u = res.data.user;
      return {
        id: String(u.id),
        name: u.name,
        email: u.email,
        passwordHash: '',
        salt: '',
        role: u.role as 'admin' | 'user',
        createdAt: u.createdAt || new Date().toISOString(),
        avatar: u.avatarUrl || undefined,
      };
    }
    return db.getCurrentSession();
  },

  login: async (email: string, passwordPlain: string): Promise<User> => {
    const res = await apiFetch<{ user: any; token: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: passwordPlain }),
    });

    if (res.data?.user && res.data?.token) {
      localStorage.setItem('lp_token', res.data.token);
      const u = res.data.user;
      const userObj: User = {
        id: String(u.id),
        name: u.name,
        email: u.email,
        passwordHash: '',
        salt: '',
        role: u.role as 'admin' | 'user',
        createdAt: u.createdAt || new Date().toISOString(),
        avatar: u.avatarUrl || undefined,
      };
      await db.setSession(userObj);
      return userObj;
    }

    if (res.error) {
      throw new Error(res.error);
    }

    // Fallback to local DB
    return db.login(email, passwordPlain);
  },

  register: async (name: string, email: string, passwordPlain: string): Promise<User> => {
    const res = await apiFetch<{ user: any; token: string }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password: passwordPlain }),
    });

    if (res.data?.user && res.data?.token) {
      localStorage.setItem('lp_token', res.data.token);
      const u = res.data.user;
      const userObj: User = {
        id: String(u.id),
        name: u.name,
        email: u.email,
        passwordHash: '',
        salt: '',
        role: u.role as 'admin' | 'user',
        createdAt: u.createdAt || new Date().toISOString(),
        avatar: u.avatarUrl || undefined,
      };
      await db.setSession(userObj);
      return userObj;
    }

    if (res.error) {
      throw new Error(res.error);
    }

    return db.register(name, email, passwordPlain);
  },

  logout: async (): Promise<void> => {
    await apiFetch('/api/v1/auth/logout', { method: 'POST' });
    localStorage.removeItem('lp_token');
    sessionStorage.removeItem('lp_token');
    await db.setSession(null);
  },

  demoLogin: async (role: 'admin' | 'user' = 'user'): Promise<User> => {
    const res = await apiFetch<{ user: any; token: string }>('/api/v1/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });

    if (res.data?.user && res.data?.token) {
      localStorage.setItem('lp_token', res.data.token);
      const u = res.data.user;
      const userObj: User = {
        id: String(u.id),
        name: u.name,
        email: u.email,
        passwordHash: '',
        salt: '',
        role: u.role as 'admin' | 'user',
        createdAt: u.createdAt || new Date().toISOString(),
      };
      await db.setSession(userObj);
      return userObj;
    }

    // Local fallback
    const email = role === 'admin' ? 'admin@linkpulse.io' : 'alex@linkpulse.io';
    return db.login(email, 'Password123!');
  },
};

export const linksApi = {
  getLinks: async (options?: {
    userId?: string;
    campaignId?: string;
    status?: 'all' | 'active' | 'expired' | 'disabled';
    search?: string;
    includeDeleted?: boolean;
    page?: number;
    limit?: number;
  }): Promise<Link[]> => {
    const query = new URLSearchParams();
    if (options?.search) query.set('search', options.search);
    if (options?.status) query.set('status', options.status);
    if (options?.campaignId) query.set('campaignId', options.campaignId);
    if (options?.page) query.set('page', String(options.page));
    if (options?.limit) query.set('limit', String(options.limit));

    const res = await apiFetch<{ items: any[]; total: number }>(`/api/v1/links?${query.toString()}`);
    if (res.data?.items) {
      return res.data.items.map(transformBackendLink);
    }

    return db.getLinks(options);
  },

  getLinkById: async (id: string): Promise<Link | null> => {
    const res = await apiFetch<{ link: any }>(`/api/v1/links/${id}`);
    if (res.data?.link) {
      return transformBackendLink(res.data.link);
    }
    return db.getLinkById(id);
  },

  getLinkByCode: async (code: string): Promise<Link | null> => {
    const res = await apiFetch<{ items: any[] }>(`/api/v1/links?search=${encodeURIComponent(code)}`);
    if (res.data?.items && res.data.items.length > 0) {
      const match = res.data.items.find((item) => item.shortCode === code);
      if (match) return transformBackendLink(match);
    }
    return db.getLinkByCode(code);
  },

  createLink: async (data: {
    userId: string;
    originalUrl: string;
    shortCode: string;
    title: string;
    campaignId?: string;
    tags?: string[];
    rules?: Link['rules'];
  }): Promise<Link> => {
    const payload = {
      destinationUrl: data.originalUrl,
      customAlias: data.shortCode,
      title: data.title,
      campaignId: data.campaignId ? parseInt(data.campaignId) : undefined,
      password: data.rules?.password,
      expiresAt: data.rules?.expiresAt,
      clickLimit: data.rules?.clickLimit,
      mobileUrl: data.rules?.mobileUrl,
    };

    const res = await apiFetch<{ link: any; shortUrl: string }>('/api/v1/links', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.data?.link) {
      return transformBackendLink(res.data.link);
    }

    if (res.error) {
      throw new Error(res.error);
    }

    return db.createLink(data);
  },

  updateLink: async (id: string, updates: Partial<Link>): Promise<Link> => {
    const payload: any = {};
    if (updates.title) payload.title = updates.title;
    if (updates.originalUrl) payload.destinationUrl = updates.originalUrl;
    if (updates.campaignId !== undefined) payload.campaignId = updates.campaignId;
    if (updates.rules?.expiresAt !== undefined) payload.expiresAt = updates.rules.expiresAt;
    if (updates.rules?.clickLimit !== undefined) payload.clickLimit = updates.rules.clickLimit;
    if (updates.rules?.mobileUrl !== undefined) payload.mobileUrl = updates.rules.mobileUrl;
    if (updates.rules?.password !== undefined) payload.password = updates.rules.password;

    const res = await apiFetch<{ link: any }>(`/api/v1/links/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    if (res.data?.link) {
      return transformBackendLink(res.data.link);
    }

    return db.updateLink(id, updates);
  },

  softDeleteLink: async (id: string): Promise<boolean> => {
    const res = await apiFetch(`/api/v1/links/${id}`, { method: 'DELETE' });
    if (res.status === 200) return true;
    return db.softDeleteLink(id);
  },

  deleteLink: async (id: string): Promise<boolean> => {
    const res = await apiFetch(`/api/v1/links/${id}`, { method: 'DELETE' });
    if (res.status === 200) return true;
    return db.deleteLink(id);
  },

  bulkDeleteLinks: async (ids: string[]): Promise<void> => {
    await Promise.all(ids.map((id) => apiFetch(`/api/v1/links/${id}`, { method: 'DELETE' })));
    await db.bulkDeleteLinks(ids);
  },

  bulkSetStatus: async (ids: string[], isActive: boolean): Promise<void> => {
    await Promise.all(
      ids.map((id) =>
        apiFetch(`/api/v1/links/${id}/${isActive ? 'enable' : 'disable'}`, { method: 'POST' })
      )
    );
    await db.bulkSetStatus(ids, isActive);
  },

  checkAliasAvailable: async (alias: string): Promise<{ available: boolean; error?: string }> => {
    const res = await apiFetch<{ available: boolean; error?: string }>('/api/v1/links/check-alias', {
      method: 'POST',
      body: JSON.stringify({ alias }),
    });

    if (res.data) {
      return res.data;
    }

    // Fallback to local check
    const allLinks = await db.getLinks({ includeDeleted: false });
    const exists = allLinks.some((l) => l.shortCode.toLowerCase() === alias.toLowerCase());
    return { available: !exists, error: exists ? 'Alias already in use' : undefined };
  },
};

export const clicksApi = {
  recordClick: async (params: {
    linkId: string;
    referrer?: string;
    userAgent?: string;
    source?: 'direct' | 'qr';
  }): Promise<void> => {
    // Redirects automatically record clicks in Cloud SQL backend
    await db.recordClick(params);
  },

  getClicksForLink: (linkId: string, limit = 50) => db.getClicksForLink(linkId, limit),
  getLinkClicks: (linkId: string, limit = 50) => db.getLinkClicks(linkId, limit),
  getAnalytics: (options: { range?: string; linkId?: string; userId?: string }) =>
    db.getAnalytics(options),

  getDashboardAnalytics: async (options: {
    range: TimeRange;
    campaignId?: string;
    userId?: string;
    isAdmin?: boolean;
  }): Promise<DashboardAnalytics> => {
    const query = new URLSearchParams({ range: options.range });
    if (options.campaignId && options.campaignId !== 'all') {
      query.set('campaignId', options.campaignId);
    }

    const res = await apiFetch<any>(`/api/v1/analytics/overview?${query.toString()}`);
    if (res.data?.kpis) {
      const d = res.data;
      return {
        totalClicks: d.kpis.totalClicks,
        uniqueVisitors: d.kpis.uniqueVisitors,
        totalLinks: d.kpis.totalLinks,
        activeLinks: d.kpis.activeLinks,
        expiredLinks: d.kpis.expiredLinks,
        clicksOverTime: d.clicksOverTime || [],
        deviceBreakdown: d.deviceDistribution || [],
        browserBreakdown: d.browserDistribution || [],
        osBreakdown: [],
        topReferrers: d.topReferrers || [],
        topCountries: [],
        topLinks: (d.topLinks || []).map((l: any) => ({
          linkId: String(l.id),
          shortCode: l.shortCode,
          title: l.title,
          originalUrl: l.destinationUrl,
          clicks: l.clicks,
        })),
        recentClicks: [],
        alerts: (d.alerts || []).map((a: any) => ({
          id: String(a.id),
          type: a.type,
          linkId: String(a.id),
          linkTitle: a.title,
          shortCode: a.shortCode,
          message: a.message,
        })),
      };
    }

    return db.getDashboardAnalytics(options);
  },
};

export const campaignsApi = {
  getCampaigns: async (userId?: string): Promise<Campaign[]> => {
    const res = await apiFetch<{ items: any[] }>('/api/v1/campaigns');
    if (res.data?.items) {
      return res.data.items.map((c) => ({
        id: String(c.id),
        userId: String(c.userId),
        name: c.name,
        description: c.description || undefined,
        color: '#0F9D8A',
        createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
        linksCount: c.linkCount || 0,
        totalClicks: c.totalClicks || 0,
      }));
    }
    return db.getCampaigns(userId);
  },

  createCampaign: async (data: {
    userId: string;
    name: string;
    description?: string;
    color: string;
  }): Promise<Campaign> => {
    const res = await apiFetch<{ campaign: any }>('/api/v1/campaigns', {
      method: 'POST',
      body: JSON.stringify({ name: data.name, description: data.description }),
    });

    if (res.data?.campaign) {
      const c = res.data.campaign;
      return {
        id: String(c.id),
        userId: String(c.userId),
        name: c.name,
        description: c.description || undefined,
        color: data.color || '#0F9D8A',
        createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
        linksCount: 0,
        clicksCount: 0,
      };
    }

    return db.createCampaign(data);
  },

  updateCampaign: async (id: string, updates: Partial<Campaign>): Promise<Campaign> => {
    const res = await apiFetch<{ campaign: any }>(`/api/v1/campaigns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    if (res.data?.campaign) {
      const c = res.data.campaign;
      return {
        id: String(c.id),
        userId: String(c.userId),
        name: c.name,
        description: c.description || undefined,
        color: updates.color || '#0F9D8A',
        createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
      };
    }

    return db.updateCampaign(id, updates);
  },

  deleteCampaign: async (id: string): Promise<boolean> => {
    const res = await apiFetch(`/api/v1/campaigns/${id}`, { method: 'DELETE' });
    if (res.status === 200) return true;
    await db.deleteCampaign(id);
    return true;
  },
};

export const tagsApi = {
  getTags: async (userId?: string): Promise<Tag[]> => {
    const res = await apiFetch<{ items: any[] }>('/api/v1/tags');
    if (res.data?.items) {
      return res.data.items.map((t) => ({
        id: String(t.id),
        userId: String(t.userId),
        name: t.name,
        color: t.color || '#0F9D8A',
        createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
        linksCount: t.linkCount || 0,
      }));
    }
    return db.getTags(userId);
  },

  createTag: async (arg1: string, arg2?: string, arg3?: string): Promise<Tag> => {
    let name = arg1;
    let color = '#0F9D8A';
    if (arg2 && arg3) {
      name = arg2;
      color = arg3;
    } else if (arg2) {
      color = arg2;
    }

    const res = await apiFetch<{ tag: any }>('/api/v1/tags', {
      method: 'POST',
      body: JSON.stringify({ name, color }),
    });

    if (res.data?.tag) {
      const t = res.data.tag;
      return {
        id: String(t.id),
        userId: String(t.userId),
        name: t.name,
        color: t.color || color,
        createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
        linksCount: 0,
      };
    }

    return db.createTag(arg1, arg2, arg3);
  },

  deleteTag: async (id: string): Promise<boolean> => {
    const res = await apiFetch(`/api/v1/tags/${id}`, { method: 'DELETE' });
    if (res.status === 200) return true;
    await db.deleteTag(id);
    return true;
  },
};

export const adminApi = {
  getAllLinks: async (): Promise<Link[]> => {
    const res = await apiFetch<{ items: any[] }>('/api/v1/admin/links');
    if (res.data?.items) {
      return res.data.items.map(transformBackendLink);
    }
    return db.getLinks({ includeDeleted: false });
  },

  getUsers: async (): Promise<User[]> => {
    const res = await apiFetch<{ items: any[] }>('/api/v1/admin/users');
    if (res.data?.items) {
      return res.data.items.map((u) => ({
        id: String(u.id),
        name: u.name,
        email: u.email,
        passwordHash: '',
        salt: '',
        role: u.role as 'admin' | 'user',
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
      }));
    }
    return db.getUsers();
  },

  getBlocklist: async (): Promise<BlocklistEntry[]> => {
    const res = await apiFetch<{ items: any[] }>('/api/v1/admin/blocklist');
    if (res.data?.items) {
      return res.data.items.map((b) => ({
        id: String(b.id),
        domain: b.domain,
        reason: b.reason,
        addedAt: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
        addedBy: b.blockedBy || 'Admin',
      }));
    }
    return db.getBlocklist();
  },

  addBlocklist: async (domain: string, reason: string, addedBy: string): Promise<BlocklistEntry> => {
    const res = await apiFetch<{ item: any }>('/api/v1/admin/blocklist', {
      method: 'POST',
      body: JSON.stringify({ domain, reason }),
    });

    if (res.data?.item) {
      const b = res.data.item;
      return {
        id: String(b.id),
        domain: b.domain,
        reason: b.reason,
        addedAt: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
        addedBy: b.blockedBy || addedBy,
      };
    }

    return db.addBlocklist(domain, reason, addedBy);
  },

  removeBlocklist: async (id: string): Promise<boolean> => {
    const res = await apiFetch(`/api/v1/admin/blocklist/${id}`, { method: 'DELETE' });
    if (res.status === 200) return true;
    await db.removeBlocklist(id);
    return true;
  },

  addToBlocklist: (domain: string, reason: string, addedBy: string) =>
    adminApi.addBlocklist(domain, reason, addedBy),

  removeFromBlocklist: (id: string) => adminApi.removeBlocklist(id),

  getAbuseReports: async () => {
    const res = await apiFetch<{ items: any[] }>('/api/v1/admin/abuse-reports');
    if (res.data?.items) return res.data.items;
    return db.getAbuseReports();
  },

  resolveAbuseReport: async (reportId: string, status: 'resolved' | 'dismissed', action?: 'disable_link') => {
    return db.resolveAbuseReport(reportId, status, action);
  },

  getPlatformStats: async () => {
    const res = await apiFetch<{ stats: any }>('/api/v1/admin/overview');
    if (res.data?.stats) return res.data.stats;
    return db.getPlatformStats();
  },
};

export const settingsApi = {
  resetUserData: (userId: string) => db.resetUserData(userId),
};

export const bioApi = {
  getBioBySlug: (slug: string) => db.getBioBySlug(slug),
  getBioByUserId: (userId: string) => db.getBioByUserId(userId),
  saveBioPage: (userId: string, data: Partial<BioPage>) => db.saveBioPage(userId, data),
  trackBioClick: (slug: string, linkId: string) => db.trackBioClick(slug, linkId),
};

export const systemApi = {
  resetDemoData: () => db.resetDemoData(),
};
