'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { CommentItem } from '@/types';
import { MessageSquare, Send, CheckCircle2 } from 'lucide-react';

interface Props {
  articleId: string;
  articleSlug: string;
}

export default function CommentSection({ articleId, articleSlug }: Props) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch initial comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await api.get(`/comments/${articleId}`);
        if (res.data?.comments) {
          setComments(res.data.comments);
        }
      } catch (err) {}
    };

    fetchComments();

    // Listen for live socket comments on this article
    const socket = getSocket();
    const handleNewComment = (data: { articleSlug: string; comment: CommentItem }) => {
      if (data.articleSlug === articleSlug) {
        setComments((prev) => {
          // Prevent duplicates
          if (prev.some((c) => c._id === data.comment._id)) return prev;
          return [data.comment, ...prev];
        });
      }
    };

    socket.on('new_comment', handleNewComment);

    return () => {
      socket.off('new_comment', handleNewComment);
    };
  }, [articleId, articleSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg(false);

    if (!authorName.trim() || !authorEmail.trim() || !content.trim()) {
      setErrorMsg('Please complete all comment fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/comments/${articleId}`, {
        authorName,
        authorEmail,
        content,
      });

      if (res.data?.comment) {
        setContent('');
        setSuccessMsg(true);
        setTimeout(() => setSuccessMsg(false), 5000);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-12 border-t border-rule pt-8">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5 text-navy-900" />
        <h2 className="text-xl font-bold font-serif text-navy-900">
          Reader Discussion ({comments.length})
        </h2>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="mb-8 rounded-lg border border-rule bg-wash p-4 sm:p-6 space-y-4">
        <h3 className="text-sm font-semibold text-navy-900">Add to the Conversation</h3>

        {errorMsg && (
          <div className="rounded border border-red-200 bg-red-50 p-2.5 text-xs text-red-900">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-1.5 rounded border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-900">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Your comment has been broadcast in real time to all current readers!</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-navy-900 mb-1">Your Name</label>
            <input
              type="text"
              required
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="e.g. Chief Engineer David"
              className="w-full rounded-md border border-rule bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-navy-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-navy-900 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={authorEmail}
              onChange={(e) => setAuthorEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full rounded-md border border-rule bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-navy-700 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-navy-900 mb-1">Comment</label>
          <textarea
            required
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share professional maritime analysis, observations, or queries..."
            className="w-full rounded-md border border-rule bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-navy-700 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-md bg-navy-900 px-4 py-2 text-xs font-semibold text-white hover:bg-navy-800 disabled:opacity-50 transition-colors"
        >
          <Send className="h-3.5 w-3.5" />
          {submitting ? 'Broadcasting...' : 'Post Comment'}
        </button>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-muted italic">No comments yet. Be the first to share an informed perspective.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="border-b border-rule pb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-xs text-navy-900">{comment.authorName}</span>
                <span className="text-[11px] text-muted">
                  {new Date(comment.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <p className="text-sm text-ink leading-relaxed">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
