export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'contributor';
  canPublish: boolean;
  status: 'active' | 'inactive';
  avatar?: string;
  bio?: string;
  lastLogin?: string;
  createdAt?: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  order: number;
  articleCount: number;
  createdAt?: string;
}

export interface Article {
  _id: string;
  id?: string;
  title: string;
  slug: string;
  subtitle?: string;
  content: string;
  category: Category | string;
  categoryName?: string;
  author: User | string;
  authorName?: string;
  status: 'draft' | 'published' | 'scheduled';
  isLead: boolean;
  isBreaking: boolean;
  featuredImage?: {
    url: string;
    alt: string;
    caption?: string;
  };
  readTime: string;
  views: number;
  commentCount?: number;
  commentsCount?: number;
  publishedAt?: string;
  scheduledAt?: string;
  tags: string[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface MediaItem {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  altText?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  publicId?: string;
  storageType?: 'cloudinary' | 'local';
  createdAt: string;
}

export interface CommentItem {
  _id: string;
  article: string;
  authorName: string;
  authorEmail: string;
  content: string;
  status: 'approved' | 'pending' | 'spam';
  createdAt: string;
}

export interface AuditLogItem {
  _id: string;
  timestamp: string;
  userEmail: string;
  action: string;
  description: string;
  ipAddress: string;
  status: 'success' | 'failure' | 'warning';
}

export interface PlatformSettings {
  publicationName: string;
  tagline: string;
  contactEmail: string;
  linkedinUrl: string;
  aboutText: string;
  termsText: string;
  privacyText: string;
  maintenanceMode: boolean;
}

export interface DashboardStats {
  totalArticles: number;
  publishedCount: number;
  draftCount: number;
  scheduledCount: number;
  monthlyVisitors: number;
  pageViews: number;
  todayViews?: number;
  todayVisitors?: number;
  liveVisitors?: number;
}

export interface TagItem {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  description?: string;
  articleCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscriberItem {
  _id: string;
  id?: string;
  email: string;
  firstName?: string;
  status: 'SUBSCRIBED' | 'UNSUBSCRIBED' | 'SUPPRESSED' | 'active' | 'unsubscribed';
  source: string;
  topics?: string[];
  frequency?: string;
  consentAt: string;
  subscribedAt: string;
  unsubscribedAt?: string | null;
  suppressReason?: string;
  createdAt?: string;
}

export interface NewsletterStats {
  total: number;
  subscribed: number;
  unsubscribed: number;
  suppressed: number;
  sources: Record<string, number>;
  growth: Array<{ label: string; count: number; year?: number; month?: number }>;
  suppressedList: Array<{ _id: string; id?: string; email: string; suppressReason?: string; unsubscribedAt?: string }>;
  recentCampaigns: CampaignItem[];
}

export interface CampaignItem {
  _id: string;
  id?: string;
  subject: string;
  preview?: string;
  intro?: string;
  articleIds: any[];
  status: 'DRAFT' | 'SCHEDULED' | 'SENT';
  scheduledAt?: string | null;
  sentAt?: string | null;
  report?: {
    recipients: number;
    excluded: number;
    simulated?: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CalendarArticleItem {
  _id: string;
  id: string;
  title: string;
  headline: string;
  slug: string;
  status: string;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  at?: string | null;
  category?: any;
  author?: any;
  categoryId?: string;
  authorId?: string;
  categoryName?: string;
  authorName?: string;
}

export interface AnalyticsOverview {
  publishedCount: number;
  totalArticles: number;
  totalViews: number;
  activeSubscribers: number;
  mostRead: Array<{
    id: string;
    _id?: string;
    headline: string;
    slug: string;
    views: number;
    publishedAt?: string;
    categoryName?: string;
  }>;
  viewsByCategory: Array<{
    id: string;
    name: string;
    slug: string;
    articleCount: number;
    views: number;
  }>;
  articlesByAuthor: Array<{
    id: string;
    name: string;
    role?: string;
    count: number;
  }>;
  statusCounts: {
    DRAFT: number;
    UNDER_REVIEW: number;
    APPROVED: number;
    SCHEDULED: number;
    PUBLISHED: number;
    [key: string]: number;
  };
  dailyTraffic: Array<{
    date: string;
    pageViews: number;
    uniqueVisitors: number;
  }>;
}

export interface AdCampaignItem {
  _id: string;
  id?: string;
  title: string;
  advertiser: string;
  placement: 'homepage_top' | 'homepage_mid' | 'article_sidebar' | 'article_inline' | 'all';
  imageUrl: string;
  targetUrl: string;
  callToAction: string;
  headline?: string;
  description?: string;
  badgeText: 'AD' | 'SPONSORED' | 'ADVERTISEMENT' | 'PARTNER CONTENT';
  status: 'ACTIVE' | 'PAUSED' | 'DRAFT' | 'EXPIRED';
  startDate?: string;
  endDate?: string;
  impressions: number;
  clicks: number;
  ctr?: number;
  createdAt?: string;
  updatedAt?: string;
}

