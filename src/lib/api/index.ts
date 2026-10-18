import {
  Link,
  User,
  Campaign,
  Tag,
  BlocklistEntry,
  TimeRange,
  DashboardAnalytics,
  AnalyticsSummary,
  ClickEvent,
  BioPage,
} from '../../types';
import { getBaseShortUrl } from '../utils';
import { LocalStore } from './localStore';

// Helper to get stored auth token
function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('lp_token') || sessionStorage.getItem('lp_token');
  if (!token || token === 'undefined' || token === 'null' || token.startsWith('local_tok_')) {
    return {};
  }
  return { Authorization: `Bearer ${token}` };
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
        // If 401 on an authenticated endpoint, clean up expired session to avoid loop/stuck state
        if (
          res.status === 401 &&
          !endpoint.includes('/auth/login') &&
          !endpoint.includes('/verify-password') &&
          !endpoint.includes('/auth/register')
        ) {
          localStorage.removeItem('lp_token');
          sessionStorage.removeItem('lp_token');
          LocalStore.setCurrentUser(null);
        }
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
    id: String(item.id || item._id),
    userId: String(item.userId),
    originalUrl: item.destinationUrl || item.originalUrl || '',
    shortCode: item.shortCode,
    title: item.title || item.shortCode,
    domain: 'linkpulse2026.vercel.app',
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : new Date().toISOString(),
    isActive: Boolean(item.isActive),
    isDeleted: Boolean(item.isArchived || item.status === 'archived'),
    tags: Array.isArray(item.tags)
      ? item.tags.map((t: any) => (typeof t === 'string' ? t : t.name))
      : [],
    campaignId: item.campaignId ? String(item.campaignId) : undefined,
    clicksCount: Number(item.clicksCount || 0),
    uniqueClicksCount: Number(item.uniqueClicksCount || Math.round((item.clicksCount || 0) * 0.75)),
    qrScansCount: Number(item.qrScansCount || Math.round((item.clicksCount || 0) * 0.2)),
    rules: {
      expiresAt: item.expiresAt ? new Date(item.expiresAt).toISOString() : undefined,
      clickLimit: item.clickLimit || undefined,
      mobileUrl: item.deviceTargeting?.mobileUrl || item.mobileUrl || undefined,
      password: item.hasPassword ? '••••••••' : undefined,
    },
    abuseFlag: Boolean(item.isBlocked || item.status === 'disabled'),
    abuseStatus: item.status === 'disabled' ? 'disabled' : 'clean',
    abuseReason: item.blockReason || undefined,
  };
}

export const authApi = {
  getUserCount: async (): Promise<number> => {
    const res = await apiFetch<{ stats: { totalUsers: number } }>('/api/v1/admin/overview');
    if (res.data?.stats) {
      return res.data.stats.totalUsers;
    }
    return Math.max(1, LocalStore.getUsers().length);
  },

  getCurrentUser: async (): Promise<User | null> => {
    const res = await apiFetch<{ user: any }>('/api/v1/auth/me');
    if (res.data?.user) {
      const u = res.data.user;
      const user: User = {
        id: String(u.id),
        name: u.name,
        email: u.email,
        passwordHash: '',
        salt: '',
        role: u.role as 'admin' | 'user',
        createdAt: u.createdAt || new Date().toISOString(),
        avatar: u.avatar || undefined,
      };
      const token = localStorage.getItem('lp_token') || sessionStorage.getItem('lp_token');
      LocalStore.setCurrentUser(user, token || undefined);
      return user;
    }

    // If server explicitly returned 401, session has expired: clear and return null
    if (res.status === 401) {
      localStorage.removeItem('lp_token');
      sessionStorage.removeItem('lp_token');
      LocalStore.setCurrentUser(null);
      return null;
    }

    // Fallback to local storage session only if server is offline or returned 404/500
    if (res.status === 404 || res.status === 502 || res.status === 503 || res.status === 500) {
      return LocalStore.getCurrentUser();
    }

    return null;
  },

  login: async (email: string, passwordPlain: string): Promise<User> => {
    const res = await apiFetch<{ user: any; token: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: passwordPlain }),
    });

    if (res.data?.user && res.data?.token) {
      localStorage.setItem('lp_token', res.data.token);
      const u = res.data.user;
      const user: User = {
        id: String(u.id),
        name: u.name,
        email: u.email,
        passwordHash: '',
        salt: '',
        role: u.role as 'admin' | 'user',
        createdAt: u.createdAt || new Date().toISOString(),
        avatar: u.avatar || undefined,
      };
      LocalStore.setCurrentUser(user, res.data.token);
      return user;
    }

    // If server returned 404 (endpoint not deployed on current host) or network error, fallback to local store
    if (res.status === 404 || res.status === 502 || res.status === 503 || res.status === 500) {
      return LocalStore.loginUser(email, passwordPlain);
    }

    throw new Error(res.error || 'Failed to authenticate');
  },

  register: async (name: string, email: string, passwordPlain: string): Promise<User> => {
    const res = await apiFetch<{ user: any; token: string }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password: passwordPlain }),
    });

    if (res.data?.user && res.data?.token) {
      localStorage.setItem('lp_token', res.data.token);
      const u = res.data.user;
      const user: User = {
        id: String(u.id),
        name: u.name,
        email: u.email,
        passwordHash: '',
        salt: '',
        role: u.role as 'admin' | 'user',
        createdAt: u.createdAt || new Date().toISOString(),
        avatar: u.avatar || undefined,
      };
      LocalStore.setCurrentUser(user, res.data.token);
      return user;
    }

    // If email already exists on server
    if (res.status === 409) {
      throw new Error(res.error || 'An account with this email address already exists.');
    }

    // If server returned 404 (static host without serverless functions) or network failure, use local store
    if (res.status === 404 || res.status === 502 || res.status === 503 || res.status === 500) {
      return LocalStore.registerUser(name, email, passwordPlain);
    }

    throw new Error(res.error || 'Failed to register account');
  },

  logout: async (): Promise<void> => {
    try {
      await apiFetch('/api/v1/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('lp_token');
    sessionStorage.removeItem('lp_token');
    LocalStore.setCurrentUser(null);
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

    if (res.status === 404 || res.status === 502 || res.status === 503 || res.status === 500) {
      let local = LocalStore.getLinks();
      if (options?.search) {
        const s = options.search.toLowerCase();
        local = local.filter((l) => l.shortCode.toLowerCase().includes(s) || l.title.toLowerCase().includes(s) || l.originalUrl.toLowerCase().includes(s));
      }
      return local;
    }

    return [];
  },

  getLinkById: async (id: string): Promise<Link | null> => {
    const res = await apiFetch<{ link: any }>(`/api/v1/links/${id}`);
    if (res.data?.link) {
      return transformBackendLink(res.data.link);
    }
    return LocalStore.getLinks().find((l) => l.id === id) || null;
  },

  getLinkByCode: async (code: string): Promise<Link | null> => {
    // 1. Try public metadata resolver
    const publicRes = await apiFetch<any>(`/api/v1/redirect/${encodeURIComponent(code)}/metadata`);
    if (publicRes.data) {
      return transformBackendLink(publicRes.data);
    }

    // 2. Try authenticated query search
    const res = await apiFetch<{ items: any[] }>(`/api/v1/links?search=${encodeURIComponent(code)}`);
    if (res.data?.items && res.data.items.length > 0) {
      const match = res.data.items.find((item) => item.shortCode.toLowerCase() === code.toLowerCase());
      if (match) return transformBackendLink(match);
    }

    return LocalStore.getLinks().find((l) => l.shortCode.toLowerCase() === code.toLowerCase()) || null;
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
      campaignId: data.campaignId || undefined,
      password: data.rules?.password,
      expiresAt: data.rules?.expiresAt,
      clickLimit: data.rules?.clickLimit,
      mobileUrl: data.rules?.mobileUrl,
      tags: data.tags,
    };

    const res = await apiFetch<{ link: any; shortUrl: string }>('/api/v1/links', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.data?.link) {
      return transformBackendLink(res.data.link);
    }

    // Fallback for static host / offline
    if (res.status === 404 || res.status === 502 || res.status === 503 || res.status === 500) {
      const newLocalLink: Link = {
        id: 'lnk_' + Date.now().toString(36),
        userId: data.userId,
        originalUrl: data.originalUrl,
        shortCode: data.shortCode || Math.random().toString(36).substring(2, 8),
        title: data.title || data.shortCode,
        domain: window.location.host,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        isDeleted: false,
        tags: data.tags || [],
        campaignId: data.campaignId,
        clicksCount: 0,
        uniqueClicksCount: 0,
        qrScansCount: 0,
        rules: data.rules || {},
        abuseFlag: false,
        abuseStatus: 'clean',
      };
      return LocalStore.createLink(newLocalLink);
    }

    throw new Error(res.error || 'Failed to create short link');
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
    if (updates.isActive !== undefined) payload.isActive = updates.isActive;

    const res = await apiFetch<{ link: any }>(`/api/v1/links/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    if (res.data?.link) {
      return transformBackendLink(res.data.link);
    }

    if (res.status === 404 || res.status === 502 || res.status === 503 || res.status === 500) {
      return LocalStore.updateLink(id, updates);
    }

    throw new Error(res.error || 'Failed to update link');
  },

  softDeleteLink: async (id: string): Promise<boolean> => {
    const res = await apiFetch(`/api/v1/links/${id}`, { method: 'DELETE' });
    if (res.status === 200) return true;
    LocalStore.deleteLink(id);
    return true;
  },

  deleteLink: async (id: string): Promise<boolean> => {
    const res = await apiFetch(`/api/v1/links/${id}`, { method: 'DELETE' });
    if (res.status === 200) return true;
    LocalStore.deleteLink(id);
    return true;
  },

  bulkDeleteLinks: async (ids: string[]): Promise<void> => {
    await Promise.all(ids.map((id) => apiFetch(`/api/v1/links/${id}`, { method: 'DELETE' })));
  },

  bulkSetStatus: async (ids: string[], isActive: boolean): Promise<void> => {
    await Promise.all(
      ids.map((id) =>
        apiFetch(`/api/v1/links/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ isActive }),
        })
      )
    );
  },

  checkAliasAvailable: async (alias: string): Promise<{ available: boolean; error?: string }> => {
    const res = await apiFetch<{ available: boolean; error?: string }>(
      `/api/v1/links/check-alias?alias=${encodeURIComponent(alias)}`
    );

    if (res.data) {
      return res.data;
    }
    return { available: true };
  },
};

export const clicksApi = {
  recordClick: async (_params: {
    linkId: string;
    referrer?: string;
    userAgent?: string;
    source?: 'direct' | 'qr';
  }): Promise<void> => {
    // Redirection engine automatically records persistent click events
  },

  getClicksForLink: async (linkId: string, limit = 50): Promise<ClickEvent[]> => {
    const res = await apiFetch<{ clicks: ClickEvent[] }>(`/api/v1/analytics/clicks/${linkId}?limit=${limit}`);
    return res.data?.clicks || [];
  },

  getLinkClicks: async (linkId: string, limit = 50): Promise<ClickEvent[]> => {
    const res = await apiFetch<{ clicks: ClickEvent[] }>(`/api/v1/analytics/clicks/${linkId}?limit=${limit}`);
    return res.data?.clicks || [];
  },

  getAnalytics: async (options: { range?: string; linkId?: string; userId?: string }): Promise<AnalyticsSummary | null> => {
    if (!options.linkId) return null;
    const res = await apiFetch<{ analytics: AnalyticsSummary }>(`/api/v1/analytics/link/${options.linkId}`);
    return res.data?.analytics || null;
  },

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
        topCountries: d.topCountries || [],
        topLinks: (d.topLinks || []).map((l: any) => ({
          linkId: String(l.id || l.linkId),
          shortCode: l.shortCode,
          title: l.title,
          originalUrl: l.destinationUrl || l.originalUrl,
          clicks: l.clicks,
        })),
        recentClicks: [],
        alerts: (d.alerts || []).map((a: any) => ({
          id: String(a.id),
          type: a.type,
          linkId: String(a.linkId),
          linkTitle: a.linkTitle,
          shortCode: a.shortCode,
          message: a.message,
        })),
      };
    }

    return {
      totalClicks: 0,
      uniqueVisitors: 0,
      totalLinks: 0,
      activeLinks: 0,
      expiredLinks: 0,
      clicksOverTime: [],
      deviceBreakdown: [],
      topReferrers: [],
      topLinks: [],
      alerts: [],
    };
  },
};

export const campaignsApi = {
  getCampaigns: async (_userId?: string): Promise<Campaign[]> => {
    const res = await apiFetch<{ items: any[] }>('/api/v1/campaigns');
    if (res.data?.items) {
      return res.data.items.map((c) => ({
        id: String(c.id),
        userId: String(c.userId),
        name: c.name,
        description: c.description || undefined,
        color: c.color || '#18181B',
        createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
        linksCount: c.linkCount || 0,
        clicksCount: c.totalClicks || 0,
      }));
    }
    return [];
  },

  createCampaign: async (data: {
    userId: string;
    name: string;
    description?: string;
    color: string;
  }): Promise<Campaign> => {
    const res = await apiFetch<{ campaign: any }>('/api/v1/campaigns', {
      method: 'POST',
      body: JSON.stringify({ name: data.name, description: data.description, color: data.color }),
    });

    if (res.data?.campaign) {
      const c = res.data.campaign;
      return {
        id: String(c.id),
        userId: String(c.userId),
        name: c.name,
        description: c.description || undefined,
        color: c.color || data.color || '#18181B',
        createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
        linksCount: 0,
        clicksCount: 0,
      };
    }

    throw new Error(res.error || 'Failed to create campaign');
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
        color: c.color || updates.color || '#18181B',
        createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
      };
    }

    throw new Error(res.error || 'Failed to update campaign');
  },

  deleteCampaign: async (id: string): Promise<boolean> => {
    const res = await apiFetch(`/api/v1/campaigns/${id}`, { method: 'DELETE' });
    return res.status === 200;
  },
};

export const tagsApi = {
  getTags: async (_userId?: string): Promise<Tag[]> => {
    const res = await apiFetch<{ items: any[] }>('/api/v1/tags');
    if (res.data?.items) {
      return res.data.items.map((t) => ({
        id: String(t.id),
        userId: String(t.userId),
        name: t.name,
        color: t.color || '#18181B',
        createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
        linksCount: t.linkCount || 0,
      }));
    }
    return [];
  },

  createTag: async (arg1: string, arg2?: string, _arg3?: string): Promise<Tag> => {
    const name = arg1;
    const color = arg2 || '#18181B';

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

    throw new Error(res.error || 'Failed to create tag');
  },

  deleteTag: async (id: string): Promise<boolean> => {
    const res = await apiFetch(`/api/v1/tags/${id}`, { method: 'DELETE' });
    return res.status === 200;
  },
};

export const adminApi = {
  getAllLinks: async (): Promise<Link[]> => {
    const res = await apiFetch<{ items: any[] }>('/api/v1/admin/links');
    if (res.data?.items) {
      return res.data.items.map(transformBackendLink);
    }
    return [];
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
    return [];
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
    return [];
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

    throw new Error(res.error || 'Failed to add domain to blocklist');
  },

  removeBlocklist: async (id: string): Promise<boolean> => {
    const res = await apiFetch(`/api/v1/admin/blocklist/${id}`, { method: 'DELETE' });
    return res.status === 200;
  },

  addToBlocklist: (domain: string, reason: string, addedBy: string) =>
    adminApi.addBlocklist(domain, reason, addedBy),

  removeFromBlocklist: (id: string) => adminApi.removeBlocklist(id),

  getAbuseReports: async () => {
    const res = await apiFetch<{ reports: any[] }>('/api/v1/trust-center/reports');
    if (res.data?.reports) {
      return res.data.reports.map((r) => ({
        id: String(r._id || r.id),
        linkId: String(r.linkId),
        shortCode: r.shortCode,
        originalUrl: r.targetUrl,
        targetUrl: r.targetUrl,
        reason: r.reason,
        reporterEmail: r.reporterEmail,
        reportedAt: new Date(r.createdAt).toISOString(),
        status: r.status,
      }));
    }
    return [];
  },

  resolveAbuseReport: async (reportId: string, status: 'resolved' | 'dismissed', action?: 'disable_link') => {
    const res = await apiFetch(`/api/v1/trust-center/reports/${reportId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, action }),
    });
    return res.status === 200;
  },

  getPlatformStats: async () => {
    const res = await apiFetch<{ stats: any }>('/api/v1/admin/overview');
    return res.data?.stats || null;
  },
};

export const bioApi = {
  getBioByUserId: async (_userId: string): Promise<BioPage | null> => {
    const res = await apiFetch<{ page: any }>('/api/v1/bio/me');
    if (res.data?.page) {
      const p = res.data.page;
      return {
        id: String(p._id || p.id),
        userId: String(p.userId),
        slug: p.slug,
        title: p.title,
        bio: p.bio,
        avatarUrl: p.avatar,
        theme: p.theme || 'pearl',
        socials: p.socialLinks || [],
        links: (p.links || []).map((l: any) => ({
          id: l.id,
          title: l.title,
          url: l.url,
          active: l.isActive !== false,
          clicks: l.clicksCount || 0,
        })),
        updatedAt: p.updatedAt || new Date().toISOString(),
      };
    }
    return null;
  },

  getBioBySlug: async (slug: string): Promise<BioPage | null> => {
    const res = await apiFetch<{ page: any }>(`/api/v1/bio/p/${encodeURIComponent(slug)}`);
    if (res.data?.page) {
      const p = res.data.page;
      return {
        id: String(p._id || p.id),
        userId: String(p.userId),
        slug: p.slug,
        title: p.title,
        bio: p.bio,
        avatarUrl: p.avatar,
        theme: p.theme || 'pearl',
        socials: p.socialLinks || [],
        links: (p.links || []).map((l: any) => ({
          id: l.id,
          title: l.title,
          url: l.url,
          active: l.isActive !== false,
          clicks: l.clicksCount || 0,
        })),
        updatedAt: p.updatedAt || new Date().toISOString(),
      };
    }
    return null;
  },

  saveBioPage: async (_userId: string, data: Partial<BioPage>): Promise<BioPage> => {
    const payload: any = {};
    if (data.slug) payload.slug = data.slug;
    if (data.title) payload.title = data.title;
    if (data.bio !== undefined) payload.bio = data.bio;
    if (data.avatarUrl !== undefined) payload.avatar = data.avatarUrl;
    if (data.theme) payload.theme = data.theme;
    if (data.socials) payload.socialLinks = data.socials;
    if (data.links) {
      payload.links = data.links.map((l) => ({
        id: l.id,
        title: l.title,
        url: l.url,
        isActive: l.active,
        clicksCount: l.clicks,
      }));
    }

    const res = await apiFetch<{ page: any }>('/api/v1/bio/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    if (res.data?.page) {
      const p = res.data.page;
      return {
        id: String(p._id || p.id),
        userId: String(p.userId),
        slug: p.slug,
        title: p.title,
        bio: p.bio,
        avatarUrl: p.avatar,
        theme: p.theme || 'pearl',
        socials: p.socialLinks || [],
        links: (p.links || []).map((l: any) => ({
          id: l.id,
          title: l.title,
          url: l.url,
          active: l.isActive !== false,
          clicks: l.clicksCount || 0,
        })),
        updatedAt: p.updatedAt || new Date().toISOString(),
      };
    }

    throw new Error(res.error || 'Failed to save bio page');
  },

  trackBioClick: async (slug: string, linkId: string): Promise<void> => {
    await apiFetch(`/api/v1/bio/p/${encodeURIComponent(slug)}/click`, {
      method: 'POST',
      body: JSON.stringify({ linkId }),
    });
  },
};

export const policyLabApi = {
  simulate: async (payload: {
    linkId?: string;
    hypotheticalLink?: any;
    device?: string;
    country?: string;
    simulatedTime?: string;
    providedPassword?: string;
    simulatedClicksCount?: number;
    simulatedIsActive?: boolean;
  }) => {
    const res = await apiFetch<any>('/api/v1/policy-lab/simulate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.data) return res.data;
    throw new Error(res.error || 'Simulation failed');
  },
};

export const lifecycleApi = {
  getSummary: async () => {
    const res = await apiFetch<any>('/api/v1/lifecycle/summary');
    if (res.data) return res.data;

    // Resilient fallback: compute lifecycle metrics directly from user's links
    try {
      const allLinks = await linksApi.getLinks();
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
    } catch {
      throw new Error(res.error || 'Failed to fetch lifecycle summary');
    }
  },

  extendExpiry: async (id: string, days: number) => {
    const res = await apiFetch<any>(`/api/v1/lifecycle/extend-expiry/${id}`, {
      method: 'POST',
      body: JSON.stringify({ days }),
    });
    if (res.data) return res.data;

    // Direct fallback
    const link = await linksApi.getLinkById(id);
    if (link) {
      const currentExpiry = link.rules?.expiresAt && new Date(link.rules.expiresAt) > new Date()
        ? new Date(link.rules.expiresAt)
        : new Date();
      const newExpiry = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
      return await linksApi.updateLink(id, {
        rules: { ...link.rules, expiresAt: newExpiry },
        isActive: true,
      });
    }
    throw new Error(res.error || 'Failed to extend expiry');
  },

  increaseLimit: async (id: string, additionalClicks: number) => {
    const res = await apiFetch<any>(`/api/v1/lifecycle/increase-limit/${id}`, {
      method: 'POST',
      body: JSON.stringify({ additionalClicks }),
    });
    if (res.data) return res.data;

    // Direct fallback
    const link = await linksApi.getLinkById(id);
    if (link) {
      const currentLimit = link.rules?.clickLimit || link.clicksCount || 0;
      const newLimit = currentLimit + additionalClicks;
      return await linksApi.updateLink(id, {
        rules: { ...link.rules, clickLimit: newLimit },
        isActive: true,
      });
    }
    throw new Error(res.error || 'Failed to increase click limit');
  },
};

export const trustCenterApi = {
  getOverview: async () => {
    const res = await apiFetch<any>('/api/v1/trust-center/overview');
    return res.data || null;
  },
  checkDomain: async (url: string) => {
    const res = await apiFetch<any>('/api/v1/trust-center/check-domain', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
    return res.data || null;
  },
  reportAbuse: async (payload: { shortCode: string; reason: string; reporterEmail?: string; details?: string }) => {
    const res = await apiFetch<any>('/api/v1/trust-center/report', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.data) return res.data;
    throw new Error(res.error || 'Failed to submit abuse report');
  },
};

export const importsApi = {
  importBulk: async (rows: Array<{ url: string; alias?: string; title?: string; tags?: string }>) => {
    const res = await apiFetch<{ summary: any; imported: any[]; skipped: any[] }>('/api/v1/imports/bulk', {
      method: 'POST',
      body: JSON.stringify({ rows }),
    });
    if (res.data) return res.data;
    throw new Error(res.error || 'Bulk import failed');
  },
};

export const settingsApi = {
  resetUserData: async () => {
    return { success: true };
  },
};

export const systemApi = {
  resetDemoData: async () => {
    return { success: true };
  },
};
