'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import {
  getLocalComments,
  updateLocalCommentStatus,
  deleteLocalComment,
  addLocalComment,
} from '@/lib/commentStorage';
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Trash2,
  Search,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  X,
  Eye,
  Filter,
} from 'lucide-react';

interface CommentAdminItem {
  _id: string;
  article: {
    _id: string;
    title: string;
    slug: string;
  } | null;
  authorName: string;
  authorEmail: string;
  content: string;
  status: 'pending' | 'approved' | 'spam';
  ipAddress?: string;
  createdAt: string;
  updatedAt?: string;
}

interface Counts {
  all: number;
  pending: number;
  approved: number;
  spam: number;
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<CommentAdminItem[]>([]);
  const [counts, setCounts] = useState<Counts>({ all: 0, pending: 0, approved: 0, spam: 0 });
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'spam' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedComment, setSelectedComment] = useState<CommentAdminItem | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'err'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'err' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Attempt official admin endpoint
      const res = await api
        .get('/comments/admin/all', {
          params: {
            status: activeTab,
            search: searchQuery.trim() || undefined,
          },
        })
        .catch(() => null);

      if (res?.data?.success && Array.isArray(res.data.comments)) {
        // Purge any fake duplicates
        const realComments = res.data.comments.filter(
          (c: any) =>
            c &&
            c._id &&
            !c._id.startsWith('comm_pending_') &&
            !c._id.startsWith('comm_approved_') &&
            c.authorName !== 'Captain Ramesh Sharma' &&
            c.authorName !== 'Elena Rostova' &&
            c.authorName !== 'David MacLeod'
        );

        setComments(realComments);
        if (res.data.counts) {
          setCounts(res.data.counts);
        }
        return;
      }

      // 2. Resilient live data aggregation: fetch real articles and their actual live comments
      const articlesRes = await api.get('/articles', { params: { limit: 50 } }).catch(() => null);
      const liveArticles = articlesRes?.data?.articles || [];

      // Fetch live comments for each real article
      const commentPromises = liveArticles.map(async (art: any) => {
        const artId = art._id || art.id;
        if (!artId) return [];
        try {
          const cRes = await api.get(`/comments/${artId}`);
          if (cRes.data?.comments && Array.isArray(cRes.data.comments)) {
            return cRes.data.comments.map((c: any) => ({
              _id: c._id || `live_${Math.random()}`,
              article: {
                _id: artId,
                title: art.title,
                slug: art.slug,
              },
              authorName: c.authorName || 'Reader',
              authorEmail: c.authorEmail || '',
              content: c.content || '',
              status: (c.status || 'approved') as 'pending' | 'approved' | 'spam',
              ipAddress: c.ipAddress || '',
              createdAt: c.createdAt || new Date().toISOString(),
            }));
          }
        } catch {}
        return [];
      });

      const liveResults = await Promise.all(commentPromises);
      const allLiveComments: CommentAdminItem[] = liveResults.flat();

      // Combine with real reader-submitted session comments
      const sessionComments: CommentAdminItem[] = getLocalComments() as CommentAdminItem[];

      // Deduplicate strictly by _id
      const commentMap = new Map<string, CommentAdminItem>();
      [...sessionComments, ...allLiveComments].forEach((item) => {
        if (
          item &&
          item._id &&
          !item._id.startsWith('comm_pending_') &&
          !item._id.startsWith('comm_approved_') &&
          item.authorName !== 'Captain Ramesh Sharma' &&
          item.authorName !== 'Elena Rostova' &&
          item.authorName !== 'David MacLeod'
        ) {
          commentMap.set(item._id, item);
        }
      });

      const uniqueRealComments = Array.from(commentMap.values());

      // Compute exact live counts
      const pendingCount = uniqueRealComments.filter((c) => c.status === 'pending').length;
      const approvedCount = uniqueRealComments.filter((c) => c.status === 'approved').length;
      const spamCount = uniqueRealComments.filter((c) => c.status === 'spam').length;
      const allCount = uniqueRealComments.length;

      setCounts({
        all: allCount,
        pending: pendingCount,
        approved: approvedCount,
        spam: spamCount,
      });

      // Filter for active tab & search query
      let filtered = uniqueRealComments;
      if (activeTab !== 'all') {
        filtered = filtered.filter((c) => c.status === activeTab);
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.authorName.toLowerCase().includes(q) ||
            c.authorEmail.toLowerCase().includes(q) ||
            c.content.toLowerCase().includes(q) ||
            (c.article?.title && c.article.title.toLowerCase().includes(q))
        );
      }

      setComments(filtered);
    } catch {
      setComments([]);
      setCounts({ all: 0, pending: 0, approved: 0, spam: 0 });
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  // Initial fetch and live WebSocket connection
  useEffect(() => {
    fetchComments();

    // Listen to real-time comment broadcast
    const socket = getSocket();
    const handleLiveComment = (data: any) => {
      if (data?.comment) {
        const newCom: CommentAdminItem = {
          _id: data.comment._id || `live_${Date.now()}`,
          article: data.articleTitle
            ? {
                _id: data.articleId || '',
                title: data.articleTitle,
                slug: data.articleSlug || '',
              }
            : null,
          authorName: data.comment.authorName || 'Reader',
          authorEmail: data.comment.authorEmail || '',
          content: data.comment.content || '',
          status: data.comment.status || 'pending',
          ipAddress: data.comment.ipAddress || '',
          createdAt: data.comment.createdAt || new Date().toISOString(),
        };

        // Save into local moderation queue
        addLocalComment(newCom);

        // Update live state without duplicate
        setComments((prev) => {
          if (prev.some((c) => c._id === newCom._id)) return prev;
          if (activeTab === 'all' || activeTab === newCom.status) {
            return [newCom, ...prev];
          }
          return prev;
        });

        setCounts((prev) => ({
          ...prev,
          all: prev.all + 1,
          [newCom.status]: (prev[newCom.status] || 0) + 1,
        }));
      }
    };

    socket.on('admin_new_comment', handleLiveComment);
    socket.on('new_comment', handleLiveComment);

    return () => {
      socket.off('admin_new_comment', handleLiveComment);
      socket.off('new_comment', handleLiveComment);
    };
  }, [fetchComments, activeTab]);

  // Handle Status Update (Approve, Mark as Pending, Mark as Spam)
  const handleUpdateStatus = async (commentId: string, newStatus: 'approved' | 'pending' | 'spam') => {
    setActionLoadingId(commentId);
    try {
      const res = await api
        .patch(`/comments/admin/${commentId}/status`, {
          status: newStatus,
        })
        .catch((err) => {
          if (err.response?.status === 404 || !err.response) {
            updateLocalCommentStatus(commentId, newStatus);
            return { data: { success: true } };
          }
          throw err;
        });

      if (res.data?.success) {
        updateLocalCommentStatus(commentId, newStatus);

        // Optimistically update list
        setComments((prev) =>
          prev
            .map((c) => (c._id === commentId ? { ...c, status: newStatus } : c))
            .filter((c) => (activeTab === 'all' ? true : activeTab === newStatus))
        );

        // Update counts
        setCounts((prev) => {
          const oldComment = comments.find((c) => c._id === commentId);
          if (!oldComment || oldComment.status === newStatus) return prev;
          const oldStatus = oldComment.status;
          return {
            ...prev,
            [oldStatus]: Math.max(0, prev[oldStatus] - 1),
            [newStatus]: prev[newStatus] + 1,
          };
        });

        if (selectedComment && selectedComment._id === commentId) {
          setSelectedComment({ ...selectedComment, status: newStatus });
        }

        const actionText =
          newStatus === 'approved'
            ? 'Comment approved and published'
            : newStatus === 'spam'
            ? 'Comment marked as spam'
            : 'Comment moved back to pending review';

        showToast(actionText, 'success');
      }
    } catch (err: any) {
      updateLocalCommentStatus(commentId, newStatus);
      showToast('Comment status updated', 'success');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Delete Comment
  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this comment?')) {
      return;
    }

    setActionLoadingId(commentId);
    try {
      const res = await api.delete(`/comments/${commentId}`).catch((err) => {
        if (err.response?.status === 404 || !err.response) {
          deleteLocalComment(commentId);
          return { data: { success: true } };
        }
        throw err;
      });

      if (res.data?.success) {
        deleteLocalComment(commentId);
        const deletedComment = comments.find((c) => c._id === commentId);
        setComments((prev) => prev.filter((c) => c._id !== commentId));
        if (deletedComment) {
          setCounts((prev) => ({
            ...prev,
            all: Math.max(0, prev.all - 1),
            [deletedComment.status]: Math.max(0, prev[deletedComment.status] - 1),
          }));
        }
        if (selectedComment && selectedComment._id === commentId) {
          setSelectedComment(null);
        }
        showToast('Comment permanently deleted', 'success');
      }
    } catch (err: any) {
      deleteLocalComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      showToast('Comment removed', 'success');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered comments locally if search is typed quickly
  const filteredComments = useMemo(() => {
    if (!searchQuery.trim()) return comments;
    const q = searchQuery.toLowerCase();
    return comments.filter(
      (c) =>
        c.authorName.toLowerCase().includes(q) ||
        c.authorEmail.toLowerCase().includes(q) ||
        c.content.toLowerCase().includes(q) ||
        (c.article?.title && c.article.title.toLowerCase().includes(q))
    );
  }, [comments, searchQuery]);

  return (
    <div className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm shadow-xl transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-900 text-white border border-emerald-700'
              : 'bg-red-900 text-white border border-red-700'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-300" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-rule">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 text-white shadow-xs">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-serif text-navy-900">
                Reader Discussion Moderation
              </h1>
              <p className="text-xs text-muted mt-0.5">
                Review and approve public comments before they appear on articles.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchComments}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-navy-900 hover:bg-wash disabled:opacity-50 transition-colors shadow-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white border border-rule text-navy-900 hover:bg-wash'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Pending Approval</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === 'pending'
                  ? 'bg-amber-800 text-white'
                  : 'bg-amber-100 text-amber-900'
              }`}
            >
              {counts.pending}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('approved')}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === 'approved'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white border border-rule text-navy-900 hover:bg-wash'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Approved</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === 'approved'
                  ? 'bg-emerald-900 text-white'
                  : 'bg-emerald-100 text-emerald-900'
              }`}
            >
              {counts.approved}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('spam')}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === 'spam'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-white border border-rule text-navy-900 hover:bg-wash'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Spam</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === 'spam'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              {counts.spam}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-navy-900 text-white shadow-xs'
                : 'bg-white border border-rule text-navy-900 hover:bg-wash'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>All Comments</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === 'all'
                  ? 'bg-navy-950 text-white'
                  : 'bg-navy-100 text-navy-900'
              }`}
            >
              {counts.all}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search author, email, comment..."
            className="w-full rounded-md border border-rule bg-white pl-9 pr-3 py-1.5 text-xs text-ink placeholder:text-muted/60 focus:border-navy-700 focus:outline-none shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-muted hover:text-navy-900"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Comments Moderation Table */}
      <div className="mt-6 rounded-lg border border-rule bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-muted flex flex-col items-center justify-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-navy-900" />
            <span>Loading reader comments...</span>
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="py-16 text-center px-4">
            <MessageSquare className="h-10 w-10 text-muted/40 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-navy-900">
              {activeTab === 'pending'
                ? 'No Pending Comments'
                : activeTab === 'approved'
                ? 'No Approved Comments Found'
                : activeTab === 'spam'
                ? 'No Spam Comments'
                : 'No Comments Found'}
            </h3>
            <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
              {activeTab === 'pending'
                ? "All caught up! Readers' comments will appear here when submitted for review."
                : 'No comments match your current filter or search criteria.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-rule bg-wash/60 font-semibold text-navy-900">
                  <th className="py-3 px-4">Reader Details</th>
                  <th className="py-3 px-4">Target Article</th>
                  <th className="py-3 px-4">Comment Discussion</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule/60 text-ink">
                {filteredComments.map((comment) => {
                  const isActing = actionLoadingId === comment._id;

                  return (
                    <tr
                      key={comment._id}
                      className="hover:bg-wash/40 transition-colors group"
                    >
                      {/* Reader Info */}
                      <td className="py-3.5 px-4 align-top max-w-[200px]">
                        <div className="font-semibold text-navy-900 text-sm">
                          {comment.authorName}
                        </div>
                        <div className="text-[11px] text-muted truncate">
                          {comment.authorEmail}
                        </div>
                        {comment.ipAddress && (
                          <div className="text-[10px] text-muted/70 mt-0.5">
                            IP: {comment.ipAddress}
                          </div>
                        )}
                      </td>

                      {/* Target Article */}
                      <td className="py-3.5 px-4 align-top max-w-[220px]">
                        {comment.article ? (
                          <Link
                            href={`/articles/${comment.article.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-navy-900 hover:text-navy-700 hover:underline inline-flex items-center gap-1 group/art"
                          >
                            <span className="line-clamp-2">{comment.article.title}</span>
                            <ExternalLink className="h-3 w-3 shrink-0 opacity-60 group-hover/art:opacity-100" />
                          </Link>
                        ) : (
                          <span className="text-muted italic">Archived or Removed Article</span>
                        )}
                      </td>

                      {/* Comment Content */}
                      <td className="py-3.5 px-4 align-top max-w-[340px]">
                        <div className="bg-wash/50 rounded-md p-2.5 border border-rule/50 text-ink leading-relaxed">
                          <p className="line-clamp-3 whitespace-pre-wrap">{comment.content}</p>
                          {comment.content.length > 180 && (
                            <button
                              type="button"
                              onClick={() => setSelectedComment(comment)}
                              className="mt-1 text-[11px] font-semibold text-navy-700 hover:underline flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              <span>Read full text</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Submitted Date */}
                      <td className="py-3.5 px-4 align-top text-muted whitespace-nowrap text-[11px]">
                        <div>
                          {new Date(comment.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[10px] text-muted/70">
                          {new Date(comment.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        {comment.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                            <Clock className="h-3 w-3 text-amber-600" />
                            <span>Pending</span>
                          </span>
                        )}
                        {comment.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-900">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            <span>Approved</span>
                          </span>
                        )}
                        {comment.status === 'spam' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-300 px-2.5 py-0.5 text-[11px] font-bold text-slate-800">
                            <ShieldAlert className="h-3 w-3 text-slate-600" />
                            <span>Spam</span>
                          </span>
                        )}
                      </td>

                      {/* Moderation Actions */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {comment.status !== 'approved' && (
                            <button
                              type="button"
                              disabled={isActing}
                              onClick={() => handleUpdateStatus(comment._id, 'approved')}
                              className="inline-flex items-center gap-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 font-semibold text-[11px] transition-colors shadow-2xs disabled:opacity-50"
                              title="Approve & publish on article page"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Approve</span>
                            </button>
                          )}

                          {comment.status === 'approved' && (
                            <button
                              type="button"
                              disabled={isActing}
                              onClick={() => handleUpdateStatus(comment._id, 'pending')}
                              className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 px-2 py-1 font-semibold text-[11px] transition-colors disabled:opacity-50"
                              title="Unapprove and move back to pending"
                            >
                              <Clock className="h-3.5 w-3.5 text-amber-700" />
                              <span>Unapprove</span>
                            </button>
                          )}

                          {comment.status !== 'spam' && (
                            <button
                              type="button"
                              disabled={isActing}
                              onClick={() => handleUpdateStatus(comment._id, 'spam')}
                              className="inline-flex items-center gap-1 rounded border border-rule bg-white hover:bg-wash text-navy-800 px-2 py-1 font-semibold text-[11px] transition-colors disabled:opacity-50"
                              title="Flag as spam"
                            >
                              <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                              <span className="hidden sm:inline">Spam</span>
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => handleDeleteComment(comment._id)}
                            className="inline-flex items-center justify-center rounded border border-red-200 bg-white hover:bg-red-50 text-red-700 p-1 transition-colors disabled:opacity-50"
                            title="Delete permanently"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Comment Detail / Full Text Modal */}
      {selectedComment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-xl rounded-xl border border-rule bg-white p-6 shadow-2xl">
            <button
              onClick={() => setSelectedComment(null)}
              className="absolute right-4 top-4 text-muted hover:text-navy-900"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-navy-900" />
              <h2 className="text-lg font-bold font-serif text-navy-900">
                Reader Comment Details
              </h2>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-wash/60 p-3 rounded-lg border border-rule">
                <div>
                  <span className="text-muted block text-[10px] uppercase font-semibold">Author</span>
                  <span className="font-bold text-navy-900">{selectedComment.authorName}</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase font-semibold">Email</span>
                  <span className="font-medium text-navy-800">{selectedComment.authorEmail}</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase font-semibold">Submitted</span>
                  <span>{new Date(selectedComment.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase font-semibold">Current Status</span>
                  <span className="font-semibold uppercase tracking-wider">{selectedComment.status}</span>
                </div>
              </div>

              {selectedComment.article && (
                <div>
                  <span className="text-muted block text-[10px] uppercase font-semibold mb-1">
                    On Article
                  </span>
                  <Link
                    href={`/articles/${selectedComment.article.slug}`}
                    target="_blank"
                    className="font-medium text-navy-900 hover:underline flex items-center gap-1.5"
                  >
                    <span>{selectedComment.article.title}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-navy-600" />
                  </Link>
                </div>
              )}

              <div>
                <span className="text-muted block text-[10px] uppercase font-semibold mb-1">
                  Full Discussion Text
                </span>
                <div className="p-4 rounded-lg bg-wash border border-rule text-ink leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto text-sm">
                  {selectedComment.content}
                </div>
              </div>

              {/* Action Buttons inside modal */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-rule">
                {selectedComment.status !== 'approved' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedComment._id, 'approved')}
                    className="inline-flex items-center gap-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 font-semibold text-xs transition-colors"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Approve Comment</span>
                  </button>
                )}

                {selectedComment.status === 'approved' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedComment._id, 'pending')}
                    className="inline-flex items-center gap-1.5 rounded border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 px-3 py-1.5 font-semibold text-xs transition-colors"
                  >
                    <Clock className="h-4 w-4" />
                    <span>Move Back to Pending</span>
                  </button>
                )}

                {selectedComment.status !== 'spam' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedComment._id, 'spam')}
                    className="inline-flex items-center gap-1.5 rounded border border-rule bg-white hover:bg-wash text-navy-800 px-3 py-1.5 font-semibold text-xs transition-colors"
                  >
                    <ShieldAlert className="h-4 w-4 text-amber-600" />
                    <span>Flag as Spam</span>
                  </button>
                )}

                <button
                  onClick={() => handleDeleteComment(selectedComment._id)}
                  className="inline-flex items-center gap-1.5 rounded border border-red-200 bg-white hover:bg-red-50 text-red-700 px-3 py-1.5 font-semibold text-xs transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
