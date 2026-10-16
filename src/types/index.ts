export type UserRole = 'visitor' | 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: 'admin' | 'user';
  createdAt: string;
  workspaceName?: string;
  avatar?: string;
}

export interface BioLinkItem {
  id: string;
  title: string;
  url: string;
  active: boolean;
  clicks: number;
}

export interface BioSocialLink {
  platform: 'twitter' | 'github' | 'linkedin' | 'instagram' | 'youtube' | 'website';
  url: string;
}

export interface BioPage {
  id: string;
  userId: string;
  slug: string;
  title: string;
  bio?: string;
  avatarUrl?: string;
  theme: 'teal' | 'slate' | 'minimal' | 'dark' | 'gradient';
  socials: BioSocialLink[];
  links: BioLinkItem[];
  updatedAt: string;
}

export type DeviceType = 'desktop' | 'mobile' | 'tablet';
export type BrowserType = 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Other';
export type OsType = 'Windows' | 'macOS' | 'iOS' | 'Android' | 'Linux' | 'Other';

export interface RedirectRules {
  expiresAt?: string;
  clickLimit?: number;
  password?: string;
  mobileUrl?: string;
  deviceTargeting?: {
    ios?: string;
    android?: string;
    desktop?: string;
  };
}

export interface Link {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  originalUrl: string;
  shortCode: string;
  title: string;
  domain: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  isDeleted?: boolean;
  tags: string[];
  campaignId?: string;
  clicksCount: number;
  uniqueClicksCount: number;
  qrScansCount: number;
  rules: RedirectRules;
  abuseFlag?: boolean;
  abuseStatus?: 'clean' | 'flagged' | 'disabled';
  abuseReason?: string;
}

export interface ClickEvent {
  id: string;
  linkId: string;
  timestamp: string;
  referrer: string;
  deviceType: DeviceType;
  browser: BrowserType;
  os: OsType;
  country: string;
  countryCode: string;
  city?: string;
  isBot: boolean;
  isUnique: boolean;
  source: 'direct' | 'qr';
}

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
  linksCount?: number;
  clicksCount?: number;
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color?: string;
  createdAt: string;
  linksCount?: number;
}

export interface BlocklistEntry {
  id: string;
  domain: string;
  reason: string;
  addedAt: string;
  addedBy: string;
}

export interface AbuseReport {
  id: string;
  linkId: string;
  shortCode: string;
  originalUrl: string;
  targetUrl?: string;
  reason: string;
  reporterIp?: string;
  reporterEmail?: string;
  reportedAt: string;
  status: 'pending' | 'resolved' | 'dismissed';
}

export type TimeRange = '7d' | '30d' | '90d';

export interface DashboardAnalytics {
  totalLinks: number;
  activeLinks: number;
  expiredLinks?: number;
  totalClicks: number;
  uniqueVisitors: number;
  clicksOverTime: Array<{ date: string; clicks: number; uniqueClicks?: number; uniqueVisitors?: number }>;
  deviceBreakdown: Array<{ name: string; count?: number; percentage?: number; value?: number }>;
  browserBreakdown?: Array<{ name: string; count?: number; percentage?: number; value?: number }>;
  osBreakdown?: Array<{ name: string; count?: number; percentage?: number; value?: number }>;
  topReferrers: Array<{ name: string; count?: number; percentage?: number; value?: number }>;
  topCountries?: Array<{ name: string; count?: number; percentage?: number; value?: number }>;
  topLinks?: Array<{ linkId: string; shortCode: string; title: string; originalUrl: string; clicks: number }>;
  recentClicks?: any[];
  alerts?: Array<{ id: string; type: string; linkId: string; linkTitle: string; shortCode: string; message: string }>;
}

export interface AnalyticsSummary {
  totalClicks: number;
  uniqueClicks: number;
  qrScans: number;
  clicksOverTime: Array<{ date: string; clicks: number; uniqueClicks: number }>;
  referrers: Array<{ name: string; count: number; percentage: number }>;
  devices: Array<{ name: string; count: number; percentage: number }>;
  countries: Array<{ name: string; count: number; percentage: number }>;
}
