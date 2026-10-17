import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// 1. Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID or internal unique ID
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull().default('user'), // 'admin' | 'user'
  avatarUrl: text('avatar_url'),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Campaigns table
export const campaigns = pgTable('campaigns', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  description: text('description'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. Folders table
export const folders = pgTable('folders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  color: text('color').default('#18181B'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. Tags table
export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  color: text('color').default('#18181B'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. Links table
export const links = pgTable('links', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  shortCode: text('short_code').notNull().unique(),
  destinationUrl: text('destination_url').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  campaignId: integer('campaign_id').references(() => campaigns.id, {
    onDelete: 'set null',
  }),
  folderId: integer('folder_id').references(() => folders.id, {
    onDelete: 'set null',
  }),
  passwordHash: text('password_hash'),
  expiresAt: timestamp('expires_at'),
  clickLimit: integer('click_limit'),
  clicksCount: integer('clicks_count').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  isArchived: boolean('is_archived').default(false).notNull(),
  isBlocked: boolean('is_blocked').default(false).notNull(),
  blockReason: text('block_reason'),
  mobileUrl: text('mobile_url'),
  tabletUrl: text('tablet_url'),
  desktopUrl: text('desktop_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 6. LinkTags (Many-to-many relationship)
export const linkTags = pgTable('link_tags', {
  id: serial('id').primaryKey(),
  linkId: integer('link_id')
    .references(() => links.id, { onDelete: 'cascade' })
    .notNull(),
  tagId: integer('tag_id')
    .references(() => tags.id, { onDelete: 'cascade' })
    .notNull(),
});

// 7. ClickEvents
export const clickEvents = pgTable('click_events', {
  id: serial('id').primaryKey(),
  linkId: integer('link_id')
    .references(() => links.id, { onDelete: 'cascade' })
    .notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  ipHash: text('ip_hash').notNull(),
  referrer: text('referrer').default('Direct'),
  userAgent: text('user_agent'),
  device: text('device').default('desktop').notNull(), // 'desktop' | 'mobile' | 'tablet' | 'bot' | 'other'
  browser: text('browser').default('Chrome'),
  os: text('os').default('Unknown'),
  country: text('country').default('Unknown'),
  city: text('city'),
  isBot: boolean('is_bot').default(false).notNull(),
  outcome: text('outcome').default('success').notNull(), // 'success' | 'password_prompt' | 'expired' | 'limit_reached' | 'blocked' | 'disabled'
});

// 8. QRCodes
export const qrCodes = pgTable('qr_codes', {
  id: serial('id').primaryKey(),
  linkId: integer('link_id')
    .references(() => links.id, { onDelete: 'cascade' })
    .notNull(),
  foregroundColor: text('foreground_color').default('#171717').notNull(),
  backgroundColor: text('background_color').default('#FFFFFF').notNull(),
  style: text('style').default('squares').notNull(),
  scansCount: integer('scans_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 9. DomainBlocklist
export const domainBlocklist = pgTable('domain_blocklist', {
  id: serial('id').primaryKey(),
  domain: text('domain').notNull().unique(),
  reason: text('reason').notNull(),
  blockedBy: text('blocked_by').default('System'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 10. AbuseReports
export const abuseReports = pgTable('abuse_reports', {
  id: serial('id').primaryKey(),
  linkId: integer('link_id').references(() => links.id, {
    onDelete: 'cascade',
  }),
  reporterEmail: text('reporter_email'),
  reason: text('reason').notNull(),
  details: text('details'),
  status: text('status').default('pending').notNull(), // 'pending' | 'resolved' | 'dismissed'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 11. AuditLogs
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  actor: text('actor').notNull(),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id'),
  reason: text('reason'),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 12. ImportJobs
export const importJobs = pgTable('import_jobs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  filename: text('filename').notNull(),
  totalRows: integer('total_rows').default(0).notNull(),
  successRows: integer('success_rows').default(0).notNull(),
  failedRows: integer('failed_rows').default(0).notNull(),
  status: text('status').default('completed').notNull(),
  errorsJson: text('errors_json'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  links: many(links),
  campaigns: many(campaigns),
  folders: many(folders),
  tags: many(tags),
  importJobs: many(importJobs),
}));

export const linksRelations = relations(links, ({ one, many }) => ({
  user: one(users, {
    fields: [links.userId],
    references: [users.id],
  }),
  campaign: one(campaigns, {
    fields: [links.campaignId],
    references: [campaigns.id],
  }),
  folder: one(folders, {
    fields: [links.folderId],
    references: [folders.id],
  }),
  clickEvents: many(clickEvents),
  qrCode: many(qrCodes),
  linkTags: many(linkTags),
  abuseReports: many(abuseReports),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  user: one(users, {
    fields: [campaigns.userId],
    references: [users.id],
  }),
  links: many(links),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
  user: one(users, {
    fields: [folders.userId],
    references: [users.id],
  }),
  links: many(links),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, {
    fields: [tags.userId],
    references: [users.id],
  }),
  linkTags: many(linkTags),
}));

export const linkTagsRelations = relations(linkTags, ({ one }) => ({
  link: one(links, {
    fields: [linkTags.linkId],
    references: [links.id],
  }),
  tag: one(tags, {
    fields: [linkTags.tagId],
    references: [tags.id],
  }),
}));

export const clickEventsRelations = relations(clickEvents, ({ one }) => ({
  link: one(links, {
    fields: [clickEvents.linkId],
    references: [links.id],
  }),
}));
