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
