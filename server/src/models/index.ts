import mongoose, { Schema, Document, Model } from 'mongoose';

// ==========================================
// 1. User Model
// ==========================================
export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: 'admin' | 'user';
  avatar?: string;
  apiKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user', required: true, index: true },
    avatar: { type: String },
    apiKey: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

// ==========================================
// 2. Workspace Model
// ==========================================
export interface IWorkspace extends Document {
  name: string;
  slug: string;
  ownerId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const WorkspaceSchema = new Schema<IWorkspace>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

export const Workspace: Model<IWorkspace> =
  mongoose.models.Workspace || mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);

// ==========================================
// 3. Campaign Model
// ==========================================
export interface ICampaign extends Document {
  name: string;
  description?: string;
  color: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    color: { type: String, default: '#18181B' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

export const Campaign: Model<ICampaign> =
  mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);

// ==========================================
// 4. Tag Model
// ==========================================
export interface ITag extends Document {
  name: string;
  color: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const TagSchema = new Schema<ITag>(
  {
    name: { type: String, required: true, trim: true },
    color: { type: String, default: '#18181B' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

TagSchema.index({ userId: 1, name: 1 }, { unique: true });

export const Tag: Model<ITag> = mongoose.models.Tag || mongoose.model<ITag>('Tag', TagSchema);

// ==========================================
// 5. Folder Model
// ==========================================
export interface IFolder extends Document {
  name: string;
  color: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const FolderSchema = new Schema<IFolder>(
  {
    name: { type: String, required: true, trim: true },
    color: { type: String, default: '#18181B' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

FolderSchema.index({ userId: 1, name: 1 }, { unique: true });

export const Folder: Model<IFolder> =
  mongoose.models.Folder || mongoose.model<IFolder>('Folder', FolderSchema);

// ==========================================
// 6. Link Model
// ==========================================
export interface IABVariant {
  destinationUrl: string;
  weight: number; // percentage, e.g. 50
  clicksCount: number;
  label: string;
}

export interface ILink extends Document {
  shortCode: string;
  destinationUrl: string;
  title?: string;
  userId: mongoose.Types.ObjectId;
  campaignId?: mongoose.Types.ObjectId;
  folderId?: mongoose.Types.ObjectId;
  passwordHash?: string;
  expiresAt?: Date;
  clickLimit?: number;
  clicksCount: number;
  isActive: boolean;
  status: 'draft' | 'active' | 'expiring' | 'expired' | 'disabled' | 'limit_reached';
  deviceTargeting?: {
    iosUrl?: string;
    androidUrl?: string;
    mobileUrl?: string;
    desktopUrl?: string;
  };
  countryTargeting?: Array<{
    countryCode: string;
    destinationUrl: string;
  }>;
  aBTesting?: {
    enabled: boolean;
    variants: IABVariant[];
  };
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const LinkSchema = new Schema<ILink>(
  {
    shortCode: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    destinationUrl: { type: String, required: true, trim: true },
    title: { type: String, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', index: true },
    folderId: { type: Schema.Types.ObjectId, ref: 'Folder', index: true },
    passwordHash: { type: String },
    expiresAt: { type: Date, index: true },
    clickLimit: { type: Number },
    clicksCount: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
    status: {
      type: String,
      enum: ['draft', 'active', 'expiring', 'expired', 'disabled', 'limit_reached'],
      default: 'active',
      index: true,
    },
    deviceTargeting: {
      iosUrl: { type: String, trim: true },
      androidUrl: { type: String, trim: true },
      mobileUrl: { type: String, trim: true },
      desktopUrl: { type: String, trim: true },
    },
    countryTargeting: [
      {
        countryCode: { type: String, uppercase: true, trim: true },
        destinationUrl: { type: String, trim: true },
      },
    ],
    aBTesting: {
      enabled: { type: Boolean, default: false },
      variants: [
        {
          destinationUrl: { type: String, required: true },
          weight: { type: Number, default: 50 },
          clicksCount: { type: Number, default: 0 },
          label: { type: String, default: 'Variant' },
        },
      ],
    },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

// Compound indexes for high-speed queries & analytics
LinkSchema.index({ userId: 1, createdAt: -1 });
LinkSchema.index({ userId: 1, campaignId: 1 });
LinkSchema.index({ shortCode: 1, isActive: 1 });

export const Link: Model<ILink> = mongoose.models.Link || mongoose.model<ILink>('Link', LinkSchema);

// ==========================================
// 7. ClickEvent Model
// ==========================================
export interface IClickEvent extends Document {
  linkId: mongoose.Types.ObjectId;
  campaignId?: mongoose.Types.ObjectId;
  timestamp: Date;
  ipHash: string;
  referrer: string;
  userAgent: string;
  device: 'desktop' | 'mobile' | 'tablet' | 'bot';
  browser: string;
  os: string;
  country: string;
  region: string;
  isBot: boolean;
  variantDestination?: string;
}

const ClickEventSchema = new Schema<IClickEvent>({
  linkId: { type: Schema.Types.ObjectId, ref: 'Link', required: true, index: true },
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  ipHash: { type: String, required: true, index: true },
  referrer: { type: String, default: 'Direct' },
  userAgent: { type: String, default: '' },
  device: { type: String, enum: ['desktop', 'mobile', 'tablet', 'bot'], default: 'desktop', index: true },
  browser: { type: String, default: 'Other' },
  os: { type: String, default: 'Other' },
  country: { type: String, default: 'US', uppercase: true, index: true },
  region: { type: String, default: 'Unknown' },
  isBot: { type: Boolean, default: false, index: true },
  variantDestination: { type: String },
});

ClickEventSchema.index({ linkId: 1, timestamp: -1 });
ClickEventSchema.index({ campaignId: 1, timestamp: -1 });

export const ClickEvent: Model<IClickEvent> =
  mongoose.models.ClickEvent || mongoose.model<IClickEvent>('ClickEvent', ClickEventSchema);

// ==========================================
// 8. QrCode Model
// ==========================================
export interface IQrCode extends Document {
  linkId: mongoose.Types.ObjectId;
  foregroundColor: string;
  backgroundColor: string;
  style: 'squares' | 'dots' | 'rounded';
  scansCount: number;
  createdAt: Date;
}

const QrCodeSchema = new Schema<IQrCode>({
  linkId: { type: Schema.Types.ObjectId, ref: 'Link', required: true, unique: true, index: true },
  foregroundColor: { type: String, default: '#171717' },
  backgroundColor: { type: String, default: '#FFFFFF' },
  style: { type: String, enum: ['squares', 'dots', 'rounded'], default: 'squares' },
  scansCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export const QrCode: Model<IQrCode> =
  mongoose.models.QrCode || mongoose.model<IQrCode>('QrCode', QrCodeSchema);

// ==========================================
// 9. DomainBlocklist Model
// ==========================================
export interface IDomainBlocklist extends Document {
  domain: string;
  reason: string;
  blockedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const DomainBlocklistSchema = new Schema<IDomainBlocklist>({
  domain: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  reason: { type: String, required: true, trim: true },
  blockedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

export const DomainBlocklist: Model<IDomainBlocklist> =
  mongoose.models.DomainBlocklist ||
  mongoose.model<IDomainBlocklist>('DomainBlocklist', DomainBlocklistSchema);

// ==========================================
// 10. AbuseReport Model
// ==========================================
export interface IAbuseReport extends Document {
  shortCode: string;
  targetUrl: string;
  reason: string;
  reporterEmail?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const AbuseReportSchema = new Schema<IAbuseReport>({
  shortCode: { type: String, required: true, index: true },
  targetUrl: { type: String, required: true },
  reason: { type: String, required: true },
  reporterEmail: { type: String, lowercase: true, trim: true },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending',
    index: true,
  },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

export const AbuseReport: Model<IAbuseReport> =
  mongoose.models.AbuseReport || mongoose.model<IAbuseReport>('AbuseReport', AbuseReportSchema);

// ==========================================
// 11. AuditLog Model
// ==========================================
export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  userEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipHash: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  userEmail: { type: String },
  action: { type: String, required: true, index: true },
  resourceType: { type: String, required: true, index: true },
  resourceId: { type: String },
  details: { type: Schema.Types.Mixed },
  ipHash: { type: String, default: 'system' },
  createdAt: { type: Date, default: Date.now, index: true },
});

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

// ==========================================
// 12. BioPage Model
// ==========================================
export interface IBioLinkItem {
  id: string;
  title: string;
  url: string;
  isActive: boolean;
  clicksCount: number;
}

export interface IBioSocialLink {
  platform: 'twitter' | 'github' | 'linkedin' | 'instagram' | 'youtube' | 'website';
  url: string;
}

export interface IBioPage extends Document {
  userId: mongoose.Types.ObjectId;
  slug: string;
  title: string;
  bio?: string;
  avatar?: string;
  theme: string;
  socialLinks: IBioSocialLink[];
  links: IBioLinkItem[];
  clicksCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const BioPageSchema = new Schema<IBioPage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    bio: { type: String, trim: true },
    avatar: { type: String },
    theme: { type: String, default: 'default' },
    socialLinks: [
      {
        platform: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    links: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        url: { type: String, required: true },
        isActive: { type: Boolean, default: true },
        clicksCount: { type: Number, default: 0 },
      },
    ],
    clicksCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const BioPage: Model<IBioPage> =
  mongoose.models.BioPage || mongoose.model<IBioPage>('BioPage', BioPageSchema);

