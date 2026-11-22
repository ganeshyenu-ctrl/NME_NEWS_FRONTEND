'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import { api } from '@/lib/api';
import { Article } from '@/types';
import { useAppSelector } from '@/store/hooks';
import { Plus, Search, Edit2, Trash2, Eye, ExternalLink } from 'lucide-react';

export default function AdminArticlesPage() {
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const [articles, setArticles] = useState<Article[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/articles/admin/list', {
        params: {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: search.trim() || undefined,
        },
      });
      if (res.data?.success) {
        setArticles(res.data.articles);
        setTotal(res.data.total);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchArticles();
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      try {
        await api.delete(`/articles/admin/${id}`);
        fetchArticles();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete article');
      }
    }
  };

  return (
    <>
      <AdminHeader
        title="Articles"
        actions={
          <Link
            href="/admin/articles/create"
            className="inline-flex items-center gap-1.5 rounded-md bg-navy-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-navy-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Article</span>
          </Link>
        }
      />

      <main className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-lg border border-rule">
          {/* Status Tabs */}
          <div className="flex items-center gap-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'published', label: 'Published' },
              { id: 'draft', label: 'Draft' },
              { id: 'scheduled', label: 'Scheduled' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-navy-900 text-white'
                    : 'text-muted hover:bg-wash hover:text-navy-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles..."
                className="w-56 rounded-md border border-rule bg-white py-1.5 pl-3 pr-8 text-xs focus:border-navy-900 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-md border border-rule bg-wash px-3 py-1.5 text-xs font-semibold text-navy-900 hover:bg-rule transition-colors"
            >
              Filter
            </button>
          </form>
        </div>

        {/* Articles Table */}
        <div className="rounded-lg border border-rule bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-rule bg-wash text-muted font-semibold">
                <tr>
                  <th className="px-5 py-3">Article</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Author</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Published / Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted">
                      Loading articles...
                    </td>
                  </tr>
                ) : articles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted italic">
                      No articles match the current filter.
                    </td>
                  </tr>
                ) : (
                  articles.map((art) => {
                    const catName =
                      typeof art.category === 'object' && art.category
                        ? art.category.name
                        : art.categoryName || 'Maritime';
                    const authorName =
                      typeof art.author === 'object' && art.author
                        ? art.author.name
                        : art.authorName || 'Staff';

                    return (
                      <tr key={art._id} className="hover:bg-wash/50 transition-colors">
                        <td className="px-5 py-3 max-w-sm">
                          <Link
                            href={`/admin/articles/${art._id}/edit`}
                            className="font-medium text-navy-900 hover:underline block line-clamp-2"
                          >
                            {art.title}
                          </Link>
                          {art.subtitle && (
                            <p className="text-[11px] text-muted truncate mt-0.5">{art.subtitle}</p>
                          )}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span className="rounded bg-navy-50 border border-navy-100 px-2 py-0.5 text-[11px] font-medium text-navy-700">
                            {catName}
                          </span>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-muted">{authorName}</td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          {art.status === 'published' ? (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-medium text-emerald-900">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                              Published
                            </span>
                          ) : art.status === 'scheduled' ? (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-medium text-amber-900">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-600"></span>
                              Scheduled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-rule/50 px-2 py-0.5 text-[11px] font-medium text-ink">
                              <span className="h-1.5 w-1.5 rounded-full bg-muted"></span>
                              Draft
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-muted text-[11px]">
                          {art.publishedAt
                            ? new Date(art.publishedAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : art.scheduledAt
                            ? `Queue: ${new Date(art.scheduledAt).toLocaleDateString('en-GB')}`
                            : 'Unpublished'}
                        </td>
                        <td className="px-5 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {art.status === 'published' && (
                              <Link
                                href={`/articles/${art.slug}`}
                                target="_blank"
                                className="p-1 text-muted hover:text-navy-900"
                                title="View live"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>
                            )}
                            <Link
                              href={`/admin/articles/${art._id}/edit`}
                              className="p-1 text-navy-700 hover:text-navy-900"
                              title="Edit article"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Link>

                            {currentUser?.role !== 'contributor' && (
                              <button
                                onClick={() => handleDelete(art._id, art.title)}
                                className="p-1 text-muted hover:text-signal"
                                title="Delete article"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
