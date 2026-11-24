'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import { api } from '@/lib/api';
import { Article } from '@/types';
import { useAppSelector } from '@/store/hooks';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  X,
} from 'lucide-react';

type SortField = 'title' | 'category' | 'author' | 'status' | 'date';
type SortDirection = 'asc' | 'desc';

export default function AdminArticlesPage() {
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const { categories } = useAppSelector((state) => state.categories);

  const [articles, setArticles] = useState<Article[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, { role: string; name: string }>>({});
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filters State
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [authorFilter, setAuthorFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Pagination State (Default 50 per user request)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Sorting State (Up / Down Arrow Sorting)
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Fetch users so we always have staff editorial roles / ranks
  useEffect(() => {
    api
      .get('/users')
      .then((res) => {
        if (res.data?.users) {
          const map: Record<string, { role: string; name: string }> = {};
          res.data.users.forEach((u: any) => {
            if (u._id) map[u._id] = { role: u.role, name: u.name };
            if (u.id) map[u.id] = { role: u.role, name: u.name };
            if (u.name) map[u.name.toLowerCase().trim()] = { role: u.role, name: u.name };
          });
          setUsersMap(map);
        }
      })
      .catch(() => {});
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/articles/admin/list', {
        params: {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          author: authorFilter !== 'all' ? authorFilter : undefined,
          search: search.trim() || undefined,
          page,
          limit: pageSize,
          sortBy:
            sortField === 'title'
              ? 'title'
              : sortField === 'status'
              ? 'status'
              : sortField === 'category'
              ? 'categoryName'
              : sortField === 'author'
              ? 'authorName'
              : 'publishedAt',
          sortOrder: sortDirection,
        },
      });
      if (res.data?.success) {
        setArticles(res.data.articles || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [statusFilter, categoryFilter, authorFilter, page, pageSize, sortField, sortDirection]);

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchArticles();
  };

  // Reset All Filters
  const handleResetFilters = () => {
    setStatusFilter('all');
    setCategoryFilter('all');
    setAuthorFilter('all');
    setSearch('');
    setPage(1);
    setSortField('date');
    setSortDirection('desc');
  };

  const hasActiveFilters =
    statusFilter !== 'all' ||
    categoryFilter !== 'all' ||
    authorFilter !== 'all' ||
    Boolean(search.trim());

  // Toggle Column Sort (Up / Down Arrow Filter)
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'date' ? 'desc' : 'asc');
    }
    setPage(1);
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

  // Unique authors from usersMap & articles for filter dropdown
  const authorOptions = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    const seen = new Set<string>();

    Object.values(usersMap).forEach((u) => {
      if (u.name && !seen.has(u.name.toLowerCase())) {
        seen.add(u.name.toLowerCase());
        list.push({ id: u.name, name: u.name });
      }
    });

    articles.forEach((art) => {
      const aName =
        typeof art.author === 'object' && art.author ? art.author.name : art.authorName;
      if (aName && !seen.has(aName.toLowerCase())) {
        seen.add(aName.toLowerCase());
        list.push({ id: aName, name: aName });
      }
    });

    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [usersMap, articles]);

  // Client-sorted articles for guaranteed immediate visual sorting response
  const sortedArticles = useMemo(() => {
    const copy = [...articles];
    return copy.sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      if (sortField === 'title') {
        valA = a.title?.toLowerCase() || '';
        valB = b.title?.toLowerCase() || '';
      } else if (sortField === 'category') {
        valA = (typeof a.category === 'object' && a.category ? a.category.name : a.categoryName || '').toLowerCase();
        valB = (typeof b.category === 'object' && b.category ? b.category.name : b.categoryName || '').toLowerCase();
      } else if (sortField === 'author') {
        valA = (typeof a.author === 'object' && a.author ? a.author.name : a.authorName || '').toLowerCase();
        valB = (typeof b.author === 'object' && b.author ? b.author.name : b.authorName || '').toLowerCase();
      } else if (sortField === 'status') {
        valA = a.status || '';
        valB = b.status || '';
      } else if (sortField === 'date') {
        valA = new Date(a.publishedAt || a.scheduledAt || (a as any).createdAt || 0).getTime();
        valB = new Date(b.publishedAt || b.scheduledAt || (b as any).createdAt || 0).getTime();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [articles, sortField, sortDirection]);

  // Pagination bounds calculation
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  // Render Up / Down Arrow icon based on active sort
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <ChevronsUpDown className="h-3 w-3 text-gray-400 group-hover:text-navy-900 transition-colors shrink-0" />
      );
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-3.5 w-3.5 text-navy-900 font-bold shrink-0" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5 text-navy-900 font-bold shrink-0" />
    );
  };

  return (
    <>
      <AdminHeader
        title="Articles"
        actions={
          <Link
            href="/admin/articles/create"
            className="inline-flex items-center gap-1.5 rounded-md bg-navy-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-navy-800 transition-colors shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Create Article</span>
          </Link>
        }
      />

      <main className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* ========================================================================= */}
        {/* COMPREHENSIVE FILTER CONTROLS BAR                                         */}
        {/* ========================================================================= */}
        <div className="bg-white p-4 rounded-lg border border-rule shadow-xs space-y-3.5">
          {/* Row 1: Status Tabs & Search Input */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-wash p-1 rounded-lg border border-rule/60">
              {[
                { id: 'all', label: 'All' },
                { id: 'published', label: 'Published' },
                { id: 'draft', label: 'Draft' },
                { id: 'scheduled', label: 'Scheduled' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setPage(1);
                  }}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-navy-900 text-white shadow-xs'
                      : 'text-muted hover:text-navy-900 hover:bg-white/60'
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
                  placeholder="Search articles by title, topic..."
                  className="w-56 sm:w-64 rounded-md border border-rule bg-white py-1.5 pl-3 pr-8 text-xs focus:border-navy-900 focus:outline-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy-900 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="rounded-md border border-navy-900 bg-navy-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-navy-800 transition-colors cursor-pointer"
              >
                Search
              </button>
            </form>
          </div>

          {/* Row 2: Secondary Dropdown Filters (Category & Author/Rank & Reset) */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-rule/60 text-xs">
            <div className="flex items-center gap-1.5 text-muted font-medium">
              <Filter className="h-3.5 w-3.5 text-navy-700" />
              <span>Filters:</span>
            </div>

            {/* Category Filter Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-rule bg-white px-3 py-1.5 text-xs text-navy-900 font-medium focus:border-navy-900 focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Author / Staff Filter Dropdown */}
            <select
              value={authorFilter}
              onChange={(e) => {
                setAuthorFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-rule bg-white px-3 py-1.5 text-xs text-navy-900 font-medium focus:border-navy-900 focus:outline-none cursor-pointer"
            >
              <option value="all">All Authors &amp; Ranks</option>
              {authorOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            {/* Reset Filters Shortcut */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-xs text-muted hover:text-signal ml-auto font-medium transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ARTICLES TABLE WITH SORTABLE HEADERS                                      */}
        {/* ========================================================================= */}
        <div className="rounded-lg border border-rule bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-rule bg-wash text-muted font-semibold select-none">
                <tr>
                  {/* Article Title Sort */}
                  <th className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => handleSort('title')}
                      className="group inline-flex items-center gap-1.5 hover:text-navy-900 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      <span>Article</span>
                      {renderSortIcon('title')}
                    </button>
                  </th>

                  {/* Category Sort */}
                  <th className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => handleSort('category')}
                      className="group inline-flex items-center gap-1.5 hover:text-navy-900 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      <span>Category</span>
                      {renderSortIcon('category')}
                    </button>
                  </th>

                  {/* Author & Rank Sort */}
                  <th className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => handleSort('author')}
                      className="group inline-flex items-center gap-1.5 hover:text-navy-900 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      <span>Author &amp; Rank</span>
                      {renderSortIcon('author')}
                    </button>
                  </th>

                  {/* Status Sort */}
                  <th className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => handleSort('status')}
                      className="group inline-flex items-center gap-1.5 hover:text-navy-900 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      <span>Status</span>
                      {renderSortIcon('status')}
                    </button>
                  </th>

                  {/* Date Sort */}
                  <th className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => handleSort('date')}
                      className="group inline-flex items-center gap-1.5 hover:text-navy-900 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      <span>Published / Date</span>
                      {renderSortIcon('date')}
                    </button>
                  </th>

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
                ) : sortedArticles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted italic">
                      No articles match the current filter.
                    </td>
                  </tr>
                ) : (
                  sortedArticles.map((art) => {
                    const catName =
                      typeof art.category === 'object' && art.category
                        ? art.category.name
                        : art.categoryName || 'Maritime';
                    const authorObj =
                      typeof art.author === 'object' && art.author ? art.author : null;
                    const authorName = authorObj?.name || art.authorName || 'Staff';
                    const authorId =
                      typeof art.author === 'string' ? art.author : authorObj?._id || authorObj?.id;
                    const authorRole = (
                      authorObj?.role ||
                      (authorId && usersMap[authorId]?.role) ||
                      usersMap[authorName.toLowerCase().trim()]?.role ||
                      (currentUser?.name &&
                      authorName.toLowerCase().trim() === currentUser.name.toLowerCase().trim()
                        ? currentUser.role
                        : null) ||
                      'Editor'
                    ).toLowerCase();

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
                        <td className="px-5 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-navy-900">{authorName}</span>
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                authorRole === 'admin'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : authorRole === 'editor'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {authorRole === 'admin'
                                ? 'Admin'
                                : authorRole === 'editor'
                                ? 'Editor'
                                : 'Contributor'}
                            </span>
                          </div>
                        </td>
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
                                className="p-1 text-muted hover:text-signal cursor-pointer"
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

          {/* ========================================================================= */}
          {/* PAGINATION CONTROLS BAR (DEFAULT 50 ROWS)                                 */}
          {/* ========================================================================= */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-t border-rule bg-wash/30 text-xs text-muted">
            <div className="flex items-center gap-3">
              <span>
                Showing <span className="font-semibold text-navy-900">{startItem}</span> to{' '}
                <span className="font-semibold text-navy-900">{endItem}</span> of{' '}
                <span className="font-semibold text-navy-900">{total}</span> articles
              </span>

              <div className="flex items-center gap-1.5 ml-2 border-l border-rule pl-3">
                <span>Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="rounded border border-rule bg-white px-2 py-1 text-xs text-navy-900 font-semibold focus:border-navy-900 focus:outline-none cursor-pointer"
                >
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50 (Default)</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="inline-flex items-center gap-1 rounded-md border border-rule bg-white px-2.5 py-1.5 font-semibold text-navy-900 hover:bg-navy-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Previous</span>
              </button>

              <span className="px-2 font-medium">
                Page <span className="font-semibold text-navy-900">{page}</span> of{' '}
                <span className="font-semibold text-navy-900">{totalPages}</span>
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="inline-flex items-center gap-1 rounded-md border border-rule bg-white px-2.5 py-1.5 font-semibold text-navy-900 hover:bg-navy-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
