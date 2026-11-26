'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { AnalyticsOverview } from '@/types';
import {
  BarChart3,
  Eye,
  FileText,
  Users,
  TrendingUp,
  FolderTree,
  UserCheck,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics/overview').catch(async (err) => {
        if (err.response?.status === 404) {
          // Graceful fallback to existing production endpoints if /analytics/overview is not yet deployed
          try {
            const [statsRes, listRes, subsRes] = await Promise.all([
              api.get('/articles/admin/stats').catch(() => ({ data: { stats: {} } })),
              api.get('/articles/admin/list', { params: { limit: 100 } }).catch(() => ({ data: { articles: [] } })),
              api.get('/newsletter/stats').catch(() => ({ data: { stats: {} } })),
            ]);
            const stats = statsRes.data?.stats || {};
            const articles: any[] = listRes.data?.articles || [];
            const subStats = subsRes.data?.stats || {};

            const publishedArticles = articles.filter((a) => a.status === 'published');
            const totalViews = articles.reduce((sum, a) => sum + (Number(a.views) || 0), 0);

            const mostRead = [...publishedArticles]
              .sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0))
              .slice(0, 10)
              .map((a) => ({
                id: a._id || a.id,
                _id: a._id || a.id,
                headline: a.title || a.headline,
                slug: a.slug,
                views: Number(a.views) || 0,
                publishedAt: a.publishedAt,
                categoryName: typeof a.category === 'object' ? a.category?.name : a.category,
              }));

            const catMap = new Map<string, { id: string; name: string; slug: string; articleCount: number; views: number }>();
            articles.forEach((a) => {
              const catName = typeof a.category === 'object' ? a.category?.name || 'Uncategorized' : a.category || 'Uncategorized';
              const catSlug = typeof a.category === 'object' ? a.category?.slug || 'uncategorized' : 'uncategorized';
              const catId = typeof a.category === 'object' ? a.category?._id || catSlug : catSlug;
              if (!catMap.has(catName)) {
                catMap.set(catName, { id: catId, name: catName, slug: catSlug, articleCount: 0, views: 0 });
              }
              const entry = catMap.get(catName)!;
              entry.articleCount += 1;
              entry.views += Number(a.views) || 0;
            });
            const viewsByCategory = Array.from(catMap.values()).sort((a, b) => b.views - a.views);

            const authorMap = new Map<string, { id: string; name: string; role?: string; count: number }>();
            articles.forEach((a) => {
              const authorName = typeof a.author === 'object' ? a.author?.name || 'Unknown' : a.author || 'Unknown';
              const authorRole = typeof a.author === 'object' ? a.author?.role : undefined;
              const authorId = typeof a.author === 'object' ? a.author?._id || authorName : authorName;
              if (!authorMap.has(authorName)) {
                authorMap.set(authorName, { id: authorId, name: authorName, role: authorRole, count: 0 });
              }
              authorMap.get(authorName)!.count += 1;
            });
            const articlesByAuthor = Array.from(authorMap.values()).sort((a, b) => b.count - a.count);

            return {
              data: {
                success: true,
                data: {
                  publishedCount: stats.published || publishedArticles.length,
                  totalArticles: stats.total || articles.length,
                  totalViews: totalViews,
                  activeSubscribers: subStats.subscribed || 0,
                  mostRead,
                  viewsByCategory,
                  articlesByAuthor,
                  statusCounts: {
                    DRAFT: stats.draft || 0,
                    UNDER_REVIEW: stats.under_review || 0,
                    APPROVED: stats.approved || 0,
                    SCHEDULED: stats.scheduled || 0,
                    PUBLISHED: stats.published || 0,
                  },
                  dailyTraffic: [],
                },
              },
            };
          } catch (innerErr) {
            return { data: { success: false } };
          }
        }
        return { data: { success: false } };
      });

      if (res.data?.success && res.data.data) {
        setData(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const maxViews = Math.max(1, ...(data?.mostRead || []).map((a) => a.views));
  const maxCatViews = Math.max(1, ...(data?.viewsByCategory || []).map((c) => c.views));
  const maxAuthorArticles = Math.max(1, ...(data?.articlesByAuthor || []).map((u) => u.count));
  const totalArticles = data?.totalArticles || 1;

  return (
    <div className="flex-1 bg-wash p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="border-b border-rule pb-4">
        <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-navy-900 flex items-center gap-2.5">
          <BarChart3 className="h-6 w-6 text-navy-900" />
          <span>Analytics &amp; Intelligence</span>
        </h1>
        <p className="text-xs text-muted mt-1">
          From the site&rsquo;s own real data: article readership views, editorial output, and subscriber engagement.
        </p>
      </div>


      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-rule bg-white p-5 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Published Articles
            </span>
            <FileText className="h-4 w-4 text-navy-900" />
          </div>
          <p className="font-serif text-3xl font-bold text-navy-900">
            {loading ? '...' : data?.publishedCount ?? 0}
          </p>
          <p className="text-[11px] text-muted">
            Live on the public wire
          </p>
        </div>

        <div className="rounded-lg border border-rule bg-white p-5 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Article Views (Site Counter)
            </span>
            <Eye className="h-4 w-4 text-navy-900" />
          </div>
          <p className="font-serif text-3xl font-bold text-navy-900">
            {loading ? '...' : (data?.totalViews ?? 0).toLocaleString('en-GB')}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium">
            Directly recorded database reads
          </p>
        </div>

        <div className="rounded-lg border border-rule bg-white p-5 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Active Subscribers
            </span>
            <Users className="h-4 w-4 text-navy-900" />
          </div>
          <p className="font-serif text-3xl font-bold text-navy-900">
            {loading ? '...' : data?.activeSubscribers ?? 0}
          </p>
          <p className="text-[11px] text-muted">
            Opted in with recorded consent
          </p>
        </div>
      </div>

      {/* 2x2 Grid of Intelligence Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most-Read Articles */}
        <section className="rounded-lg border border-rule bg-white p-5 space-y-4 shadow-xs">
          <h2 className="font-serif text-base font-bold text-navy-900 border-b border-rule pb-2">
            Most-Read Articles (Top 10)
          </h2>
          <div className="space-y-3 pt-1">
            {!data?.mostRead?.length ? (
              <p className="text-xs text-muted py-4">No published article views recorded yet.</p>
            ) : (
              data.mostRead.map((a) => (
                <div key={a.id || a._id} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-muted gap-2">
                    <Link
                      href={`/admin/articles/${a.id || a._id}/edit`}
                      className="font-semibold text-navy-900 hover:underline truncate max-w-[340px]"
                    >
                      {a.headline}
                    </Link>
                    <span className="font-bold text-navy-900 font-mono shrink-0">
                      {a.views}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-wash overflow-hidden">
                    <div
                      className="h-full bg-navy-900 rounded-full transition-all duration-500"
                      style={{ width: `${(a.views / maxViews) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Views by Category */}
        <section className="rounded-lg border border-rule bg-white p-5 space-y-4 shadow-xs">
          <h2 className="font-serif text-base font-bold text-navy-900 border-b border-rule pb-2">
            Readership by Category
          </h2>
          <div className="space-y-3 pt-1">
            {!data?.viewsByCategory?.length ? (
              <p className="text-xs text-muted py-4">No category views recorded yet.</p>
            ) : (
              data.viewsByCategory.map((c) => (
                <div key={c.id} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-muted">
                    <span className="font-medium text-navy-900">
                      {c.name} <span className="text-muted font-normal">({c.articleCount} articles)</span>
                    </span>
                    <span className="font-bold text-navy-900 font-mono">
                      {c.views} views
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-wash overflow-hidden">
                    <div
                      className="h-full bg-navy-800 rounded-full transition-all duration-500"
                      style={{ width: `${(c.views / maxCatViews) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Published Articles by Author */}
        <section className="rounded-lg border border-rule bg-white p-5 space-y-4 shadow-xs">
          <h2 className="font-serif text-base font-bold text-navy-900 border-b border-rule pb-2">
            Published Articles by Author
          </h2>
          <div className="space-y-3 pt-1">
            {!data?.articlesByAuthor?.length ? (
              <p className="text-xs text-muted py-4">No authors have published articles yet.</p>
            ) : (
              data.articlesByAuthor.map((u) => (
                <div key={u.id} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-muted">
                    <span className="font-medium text-navy-900">
                      {u.name} <span className="text-[10px] uppercase font-bold text-muted">({u.role})</span>
                    </span>
                    <span className="font-bold text-navy-900 font-mono">
                      {u.count}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-wash overflow-hidden">
                    <div
                      className="h-full bg-navy-700 rounded-full transition-all duration-500"
                      style={{ width: `${(u.count / maxAuthorArticles) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Workflow Right Now */}
        <section className="rounded-lg border border-rule bg-white p-5 space-y-4 shadow-xs">
          <h2 className="font-serif text-base font-bold text-navy-900 border-b border-rule pb-2">
            Workflow Right Now
          </h2>
          <div className="space-y-3 pt-1">
            {Object.entries(data?.statusCounts || {}).map(([statusKey, count]) => {
              const label = statusKey.replace('_', ' ');
              return (
                <div key={statusKey} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-muted">
                    <span className="font-medium uppercase tracking-wider text-[11px] text-navy-900">
                      {label}
                    </span>
                    <span className="font-bold text-navy-900 font-mono">
                      {count}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-wash overflow-hidden">
                    <div
                      className="h-full bg-navy-900 rounded-full transition-all duration-500"
                      style={{ width: `${(count / totalArticles) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
