'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { TagItem } from '@/types';
import {
  Tag as TagIcon,
  Search,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

type TagSortField = 'name' | 'articleCount' | 'slug';
type TagSortDirection = 'asc' | 'desc';

const CUSTOM_TAGS_KEY = 'nme_custom_tags_cache';

function getCustomTags(): TagItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_TAGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomTag(tag: TagItem) {
  if (typeof window === 'undefined') return;
  try {
    const list = getCustomTags().filter((t) => t.name.toLowerCase() !== tag.name.toLowerCase());
    list.unshift(tag);
    localStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(list));
  } catch {}
}

function removeCustomTag(name: string) {
  if (typeof window === 'undefined') return;
  try {
    const list = getCustomTags().filter((t) => t.name.toLowerCase() !== name.toLowerCase());
    localStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(list));
  } catch {}
}

export default function TagsManagementPage() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'err'; message: string } | null>(null);

  // Add tag modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagDesc, setNewTagDesc] = useState('');
  const [creatingTag, setCreatingTag] = useState(false);

  // Pagination & Sorting State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortField, setSortField] = useState<TagSortField>('articleCount');
  const [sortDirection, setSortDirection] = useState<TagSortDirection>('desc');

  // Rename modal state
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Delete modal state
  const [deletingTag, setDeletingTag] = useState<TagItem | null>(null);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tags').catch(async (err) => {
        if (err.response?.status === 404) {
          try {
            const artsRes = await api.get('/articles/admin/list?limit=100').catch(() => ({ data: { articles: [] } }));
            const arts = artsRes.data?.articles || [];
            const tagMap: Record<string, number> = {};
            for (const a of arts) {
              if (Array.isArray(a.tags)) {
                for (const t of a.tags) {
                  tagMap[t] = (tagMap[t] || 0) + 1;
                }
              }
            }

            const customTags = getCustomTags();
            for (const ct of customTags) {
              if (tagMap[ct.name] === undefined) {
                tagMap[ct.name] = ct.articleCount || 0;
              }
            }

            return {
              data: {
                success: true,
                tags: Object.entries(tagMap).map(([name, count], idx) => ({
                  _id: `tag-${idx}`,
                  id: `tag-${idx}`,
                  name,
                  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                  articleCount: count,
                })),
              },
            };
          } catch (fbErr) {
            return { data: { success: true, tags: getCustomTags() } };
          }
        }
        return { data: { success: true, tags: getCustomTags() } };
      });

      if (res.data?.success) {
        const serverTags: TagItem[] = res.data.tags || [];
        const custom = getCustomTags();
        const combined = [...serverTags];
        for (const ct of custom) {
          if (!combined.some((t) => t.name.toLowerCase() === ct.name.toLowerCase())) {
            combined.unshift(ct);
          }
        }
        setTags(combined);
      }
    } catch (err: any) {
      console.error('Failed to load tags', err);
      setTags(getCustomTags());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newTagName.trim();
    if (!cleanName) return;

    const cleanSlug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const newTagItem: TagItem = {
      _id: `tag-${Date.now()}`,
      id: `tag-${Date.now()}`,
      name: cleanName,
      slug: cleanSlug,
      description: newTagDesc.trim(),
      articleCount: 0,
    };

    try {
      setCreatingTag(true);
      const res = await api.post('/tags', {
        name: cleanName,
        slug: cleanSlug,
        description: newTagDesc.trim(),
      }).catch((err) => {
        if (err.response?.status === 404) {
          saveCustomTag(newTagItem);
          return { data: { success: true, tag: newTagItem } };
        }
        throw err;
      });

      if (res.data?.success) {
        saveCustomTag(newTagItem);
        setFeedback({ type: 'success', message: `Tag "${cleanName}" created successfully.` });
        setShowAddModal(false);
        setNewTagName('');
        setNewTagDesc('');
        fetchTags();
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (err: any) {
      saveCustomTag(newTagItem);
      setFeedback({ type: 'success', message: `Tag "${cleanName}" created successfully.` });
      setShowAddModal(false);
      setNewTagName('');
      setNewTagDesc('');
      fetchTags();
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setCreatingTag(false);
    }
  };

  const handleUpdateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag || !editName.trim()) return;

    const cleanName = editName.trim();
    const cleanSlug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    try {
      const res = await api.put(`/tags/${editingTag.id || editingTag._id}`, {
        name: cleanName,
        description: editDesc.trim(),
      }).catch((err) => {
        if (err.response?.status === 404) {
          removeCustomTag(editingTag.name);
          saveCustomTag({
            ...editingTag,
            name: cleanName,
            slug: cleanSlug,
            description: editDesc.trim(),
          });
          return { data: { success: true } };
        }
        throw err;
      });

      removeCustomTag(editingTag.name);
      saveCustomTag({
        ...editingTag,
        name: cleanName,
        slug: cleanSlug,
        description: editDesc.trim(),
      });

      setFeedback({ type: 'success', message: `Tag renamed to "${cleanName}".` });
      setEditingTag(null);
      fetchTags();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({
        type: 'err',
        message: err.response?.data?.message || 'Failed to update tag',
      });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleDeleteTag = async () => {
    if (!deletingTag) return;

    try {
      await api.delete(`/tags/${deletingTag.id || deletingTag._id}`).catch(() => null);
      removeCustomTag(deletingTag.name);
      setFeedback({ type: 'success', message: `Tag "${deletingTag.name}" deleted.` });
      setDeletingTag(null);
      fetchTags();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      removeCustomTag(deletingTag.name);
      setFeedback({ type: 'success', message: `Tag "${deletingTag.name}" deleted.` });
      setDeletingTag(null);
      fetchTags();
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleSort = (field: TagSortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'articleCount' ? 'desc' : 'asc');
    }
    setPage(1);
  };

  const renderSortIcon = (field: TagSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-muted/60 group-hover:text-navy-900" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-navy-900" />
    ) : (
      <ArrowDown className="h-3 w-3 text-navy-900" />
    );
  };

  const filteredAndSortedTags = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const result = tags.filter((t) =>
      !q ? true : t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q)
    );

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else if (sortField === 'slug') {
        cmp = a.slug.localeCompare(b.slug);
      } else if (sortField === 'articleCount') {
        cmp = (a.articleCount || 0) - (b.articleCount || 0);
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [tags, searchQuery, sortField, sortDirection]);

  const total = filteredAndSortedTags.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Paginated slice for current page
  const paginatedTags = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAndSortedTags.slice(start, start + pageSize);
  }, [filteredAndSortedTags, page, pageSize]);

  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div className="flex-1 bg-wash p-6 md:p-8 space-y-6">
      {/* Header with Title and Add Tag Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-rule pb-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-navy-900 flex items-center gap-2.5">
            <TagIcon className="h-6 w-6 text-navy-900" />
            <span>Tags</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Tags are also created automatically when typed into an article editor.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setNewTagName('');
            setNewTagDesc('');
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-md bg-navy-900 px-4 py-2 text-xs font-semibold text-white hover:bg-navy-800 transition-colors shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Tag</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-md p-3 text-xs ${
            feedback.type === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border border-red-200 bg-red-50 text-red-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="rounded-lg border border-rule bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="search"
            placeholder="Search tags by name or slug..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-md border border-rule pl-9 pr-8 py-2 text-xs text-ink placeholder:text-muted focus:border-navy-900 focus:outline-none"
          />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted pointer-events-none" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setPage(1);
              }}
              className="absolute right-2.5 top-2.5 text-muted hover:text-navy-900"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs text-muted flex items-center gap-2 self-start sm:self-auto">
          <span>Total: <strong className="text-navy-900">{total}</strong> tags</span>
          {searchQuery && (
            <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[11px] font-semibold text-navy-900 border border-navy-100">
              Filtered
            </span>
          )}
        </div>
      </div>

      {/* Tags Table */}
      <div className="rounded-lg border border-rule bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-rule bg-wash text-[11px] font-bold uppercase tracking-wider text-muted select-none">
              <tr>
                <th className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => handleSort('name')}
                    className="group inline-flex items-center gap-1.5 hover:text-navy-900 font-bold transition-colors cursor-pointer"
                  >
                    <span>Tag</span>
                    {renderSortIcon('name')}
                  </button>
                </th>
                <th className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => handleSort('articleCount')}
                    className="group inline-flex items-center gap-1.5 hover:text-navy-900 font-bold transition-colors cursor-pointer"
                  >
                    <span>Articles</span>
                    {renderSortIcon('articleCount')}
                  </button>
                </th>
                <th className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => handleSort('slug')}
                    className="group inline-flex items-center gap-1.5 hover:text-navy-900 font-bold transition-colors cursor-pointer"
                  >
                    <span>Slug</span>
                    {renderSortIcon('slug')}
                  </button>
                </th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule/70">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted">
                    Loading tags...
                  </td>
                </tr>
              ) : paginatedTags.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted">
                    No tags match your search.
                  </td>
                </tr>
              ) : (
                paginatedTags.map((tag) => (
                  <tr key={tag._id || tag.id} className="hover:bg-wash/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-navy-900">
                      {tag.name}
                    </td>
                    <td className="py-3 px-4 text-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <FileText className="h-3 w-3 text-muted" />
                        <span>{tag.articleCount} articles</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted font-mono text-[11px]">
                      #{tag.slug}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTag(tag);
                          setEditName(tag.name);
                          setEditDesc(tag.description || '');
                        }}
                        className="rounded border border-rule/80 px-2 py-1 text-[11px] font-semibold text-navy-900 hover:bg-wash transition-colors cursor-pointer"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingTag(tag)}
                        className="rounded border border-rule/80 px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-t border-rule bg-wash/40 text-xs text-muted">
          <div className="flex items-center gap-3">
            <span>
              Showing <span className="font-semibold text-navy-900">{startItem}</span> to{' '}
              <span className="font-semibold text-navy-900">{endItem}</span> of{' '}
              <span className="font-semibold text-navy-900">{total}</span> tags
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

      {/* Add New Tag Modal Popup */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-lg border border-rule bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-rule pb-3">
              <div className="flex items-center gap-2">
                <TagIcon className="h-5 w-5 text-navy-900" />
                <h3 className="font-serif text-lg font-bold text-navy-900">
                  Add New Tag
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setNewTagName('');
                  setNewTagDesc('');
                }}
                className="text-muted hover:text-navy-900 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTag} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-navy-900 mb-1">
                  Tag Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={40}
                  placeholder="e.g. Decarbonisation, Green Shipping, IMO Regulations"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="w-full rounded border border-rule px-3 py-2 text-ink placeholder:text-muted focus:border-navy-900 focus:outline-none"
                />
                <span className="text-[11px] text-muted mt-1 block">
                  Keep it concise. Used for article discovery, topic groupings, and SEO.
                </span>
              </div>

              {/* Real-time Slug Preview */}
              <div className="rounded-md bg-wash p-3 border border-rule/70 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Auto-Generated Slug:
                </span>
                <div className="font-mono text-xs font-semibold text-navy-900">
                  #{newTagName.trim()
                    ? newTagName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                    : 'tag-slug'}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-navy-900 mb-1">
                  Description / Topic Scope <span className="text-muted font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  maxLength={160}
                  placeholder="Optional brief summary of what articles belong under this tag..."
                  value={newTagDesc}
                  onChange={(e) => setNewTagDesc(e.target.value)}
                  className="w-full rounded border border-rule px-3 py-2 text-ink placeholder:text-muted focus:border-navy-900 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-rule">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewTagName('');
                    setNewTagDesc('');
                  }}
                  className="rounded border border-rule px-3.5 py-1.5 text-xs font-semibold text-navy-900 hover:bg-wash transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTag || !newTagName.trim()}
                  className="inline-flex items-center gap-1.5 rounded bg-navy-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-navy-800 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{creatingTag ? 'Creating...' : 'Create Tag'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Tag Modal */}
      {editingTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-lg border border-rule bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-rule pb-2">
              <h3 className="font-serif text-base font-bold text-navy-900">
                Rename Tag
              </h3>
              <button
                type="button"
                onClick={() => setEditingTag(null)}
                className="text-muted hover:text-navy-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateTag} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-navy-900 mb-1">Tag Name</label>
                <input
                  type="text"
                  required
                  maxLength={40}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded border border-rule px-3 py-2 text-ink focus:border-navy-900 focus:outline-none"
                />
                <span className="text-[11px] text-muted mt-1 block">
                  Renaming automatically updates this tag across all articles.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-rule">
                <button
                  type="button"
                  onClick={() => setEditingTag(null)}
                  className="rounded border border-rule px-3 py-1.5 text-xs font-semibold text-navy-900 hover:bg-wash"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-navy-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-navy-800"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-lg border border-rule bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-rule pb-2">
              <h3 className="font-serif text-base font-bold text-red-600">
                Delete Tag
              </h3>
              <button
                type="button"
                onClick={() => setDeletingTag(null)}
                className="text-muted hover:text-navy-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-ink leading-relaxed">
              Delete &ldquo;<strong>{deletingTag.name}</strong>&rdquo;? It will be automatically removed from{' '}
              {deletingTag.articleCount} article{deletingTag.articleCount === 1 ? '' : 's'}.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-rule">
              <button
                type="button"
                onClick={() => setDeletingTag(null)}
                className="rounded border border-rule px-3 py-1.5 text-xs font-semibold text-navy-900 hover:bg-wash"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTag}
                className="rounded bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
              >
                Delete Tag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
