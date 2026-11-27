'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Category, Article, MediaItem } from '@/types';
import { useAppSelector } from '@/store/hooks';
import CustomSelect from '@/components/ui/CustomSelect';
import { canCreateOrEditArticles, canManageEditorial } from '@/lib/rbac';
import {
  addStoredLeadStoryId,
  removeStoredLeadStoryId,
  isStoredLeadStory,
} from '@/lib/leadStoryStorage';
import {
  Save,
  Send,
  Eye,
  Calendar,
  Image as ImageIcon,
  Tag,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Upload,
  X,
  XCircle,
  Check,
} from 'lucide-react';

interface Props {
  initialArticle?: Article;
  isEditMode?: boolean;
}

export default function ArticleEditorForm({ initialArticle, isEditMode = false }: Props) {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const readOnly = Boolean(user && !canCreateOrEditArticles(user));
  const editorialManager = canManageEditorial(user);
  const isContributor = user?.role === 'contributor';

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState(initialArticle?.title || '');
  const [slug, setSlug] = useState(initialArticle?.slug || '');
  const [subtitle, setSubtitle] = useState(initialArticle?.subtitle || '');
  const [content, setContent] = useState(initialArticle?.content || '');
  const [categoryId, setCategoryId] = useState<string>(
    typeof initialArticle?.category === 'object'
      ? initialArticle.category._id
      : (initialArticle?.category as string) || ''
  );
  const [status, setStatus] = useState<'draft' | 'under_review' | 'approved' | 'rejected' | 'published' | 'scheduled'>(
    initialArticle?.status || (user?.role === 'contributor' ? 'under_review' : 'draft')
  );
  const [isLead, setIsLead] = useState(
    Boolean(initialArticle?.isLead || (initialArticle?._id && isStoredLeadStory(initialArticle._id)))
  );
  const [isBreaking, setIsBreaking] = useState(initialArticle?.isBreaking || false);
  const [imageUrl, setImageUrl] = useState(initialArticle?.featuredImage?.url || '');
  const [imageCaption, setImageCaption] = useState(initialArticle?.featuredImage?.caption || '');
  const [readTime, setReadTime] = useState(initialArticle?.readTime || '3 min read');
  const [tagsStr, setTagsStr] = useState(initialArticle?.tags?.join(', ') || '');
  const [scheduledAt, setScheduledAt] = useState(
    initialArticle?.scheduledAt ? new Date(initialArticle.scheduledAt).toISOString().slice(0, 16) : ''
  );

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Media Library Picker state
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [uploadingInlineMedia, setUploadingInlineMedia] = useState(false);
  const inlineFileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async () => {
    setLoadingMedia(true);
    try {
      const res = await api.get('/media');
      if (res.data?.success) {
        setMediaItems(res.data.media);
      }
    } catch (err) {
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleOpenMediaModal = () => {
    setMediaModalOpen(true);
    fetchMedia();
  };

  const handleSelectMedia = (item: MediaItem) => {
    setImageUrl(item.url);
    if (!imageCaption) {
      setImageCaption(item.altText || item.originalName);
    }
    setMediaModalOpen(false);
  };

  const handleInlineUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingInlineMedia(true);
    try {
      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.media) {
        setImageUrl(res.data.media.url);
        setImageCaption(res.data.media.originalName);
        setMediaModalOpen(false);
        setFeedback({ type: 'success', message: 'Asset uploaded and attached to article!' });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload media');
    } finally {
      setUploadingInlineMedia(false);
    }
  };

  // Fetch categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data?.categories) {
          setCategories(res.data.categories);
          if (!categoryId && res.data.categories.length > 0) {
            setCategoryId(res.data.categories[0]._id);
          }
        }
      } catch (err) {}
    };
    loadCategories();
  }, []);

  const handleSave = async (targetStatus?: 'draft' | 'under_review' | 'approved' | 'rejected' | 'published' | 'scheduled') => {
    if (readOnly) return;
    setFeedback(null);
    const finalStatus = targetStatus || status;

    if (!title.trim() || !content.trim() || !categoryId) {
      setFeedback({ type: 'error', message: 'Please provide Title, Content, and select a Category.' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title,
        slug: slug.trim() || undefined,
        subtitle,
        content,
        category: categoryId,
        status: finalStatus,
        isLead,
        isBreaking,
        featuredImage: {
          url: imageUrl,
          alt: title,
          caption: imageCaption,
        },
        readTime,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        tags: tagsStr.split(',').map((t) => t.trim()).filter(Boolean),
      };

      if (isEditMode && initialArticle?._id) {
        await api.put(`/articles/admin/${initialArticle._id}`, payload);
        if (isLead) {
          addStoredLeadStoryId(initialArticle._id);
        } else {
          removeStoredLeadStoryId(initialArticle._id);
        }
        setStatus(finalStatus);
        setFeedback({
          type: 'success',
          message:
            finalStatus === 'under_review'
              ? 'Article submitted to Senior Editor for approval!'
              : finalStatus === 'published'
              ? 'Article approved and published to live wire!'
              : 'Article updated successfully!',
        });
      } else {
        const res = await api.post('/articles/admin', payload);
        const createdId = res.data?.article?._id;
        if (createdId && isLead) {
          addStoredLeadStoryId(createdId);
        }
        setFeedback({
          type: 'success',
          message:
            finalStatus === 'under_review'
              ? 'Article submitted to Senior Editor for approval!'
              : 'Article created successfully!',
        });
        setTimeout(() => {
          router.push(`/admin/articles/${res.data.article._id}/edit`);
        }, 1000);
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save article.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {readOnly && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-900">
          <Eye className="h-4 w-4 text-blue-700 shrink-0" />
          <span>
            Section Editor View-Only Mode: You can inspect full article content and metrics for analysis, but editing and publishing are disabled.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_20rem] gap-8">
      {/* Left Column: Content Canvas */}
      <div className="space-y-6">
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

        <div className="rounded-lg border border-rule bg-white p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              Article Title
            </label>
            <input
              type="text"
              required
              disabled={readOnly}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter comprehensive editorial headline..."
              className="w-full font-serif text-2xl font-bold text-navy-900 border-b border-rule pb-2 focus:border-navy-900 focus:outline-none placeholder:text-muted/40 disabled:bg-transparent disabled:opacity-80"
            />
          </div>

          {/* Subtitle / Deck */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              Deck / Subtitle
            </label>
            <textarea
              rows={2}
              disabled={readOnly}
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="A three-line deck expanding on the headline with factual context and operational consequence..."
              className="w-full text-sm text-ink border-b border-rule pb-2 focus:border-navy-900 focus:outline-none placeholder:text-muted/40 resize-none disabled:bg-transparent disabled:opacity-80"
            />
          </div>

          {/* Custom Slug */}
          <div>
            <label className="block text-[11px] font-semibold text-muted mb-1">
              URL Slug (Auto-generated if blank)
            </label>
            <div className="flex items-center text-xs text-muted font-mono">
              <span className="bg-wash px-2 py-1.5 border border-r-0 border-rule rounded-l">/articles/</span>
              <input
                type="text"
                disabled={readOnly}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="sample-headline-url"
                className="flex-1 rounded-r border border-rule px-2 py-1.5 text-xs text-ink focus:border-navy-900 focus:outline-none font-mono disabled:bg-wash/40"
              />
            </div>
          </div>

          {/* Content Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                Body Content (HTML & Prose)
              </label>
              <span className="text-[11px] text-muted font-mono">Accepts HTML paragraphs & blockquotes</span>
            </div>
            <textarea
              rows={16}
              required
              disabled={readOnly}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="<p>Write your detailed maritime analysis here...</p>"
              className="w-full rounded-md border border-rule bg-white p-4 font-mono text-xs leading-relaxed text-ink focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-100 disabled:bg-wash/40"
            />
          </div>
        </div>
      </div>

      {/* Right Column: Publishing & Metadata Panel */}
      <aside className="space-y-6">
        <div className="rounded-lg border border-rule bg-white p-5 space-y-5">
          <h2 className="font-serif text-lg font-bold text-navy-900 border-b border-rule pb-3">
            Publishing Controls
          </h2>

          {/* Status selector */}
          <div>
            <label className="block text-xs font-semibold text-navy-900 mb-1.5">Status</label>
            <CustomSelect
              value={status}
              onChange={(val) => setStatus(val as any)}
              disabled={readOnly}
              options={[
                {
                  value: 'draft',
                  label: 'Draft',
                  description: 'Work in progress / private draft',
                  badge: 'Draft',
                  badgeColor: 'bg-rule/60 text-ink',
                },
                {
                  value: 'under_review',
                  label: 'Pending Approval',
                  description: 'Submitted to Senior Editor for review & approval',
                  badge: 'Approval',
                  badgeColor: 'bg-blue-100 text-blue-900 border border-blue-200',
                },
                ...(!isContributor
                  ? [
                      {
                        value: 'rejected',
                        label: 'Rejected',
                        description: 'Declined during editorial review',
                        badge: 'Rejected',
                        badgeColor: 'bg-rose-100 text-rose-900 border border-rose-200',
                      },
                      {
                        value: 'scheduled',
                        label: 'Scheduled',
                        description: 'Queued release date & time',
                        badge: 'Queued',
                        badgeColor: 'bg-amber-100 text-amber-900 border border-amber-200',
                      },
                      {
                        value: 'published',
                        label: 'Published',
                        description: 'Live immediately on public wire',
                        badge: 'Live',
                        badgeColor: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
                      },
                    ]
                  : []),
              ]}
            />
            {isContributor && (
              <p className="mt-1.5 text-[11px] text-muted italic">
                Articles submitted for approval appear in the Senior Editor&rsquo;s Article Approval tab.
              </p>
            )}
          </div>

          {/* Scheduled Date picker */}
          {status === 'scheduled' && (
            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1.5">
                Release Date & Time
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded border border-rule bg-white px-3 py-1.5 text-xs text-ink focus:outline-none"
              />
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-navy-900 mb-1.5">Category</label>
            <CustomSelect
              value={categoryId}
              onChange={(val) => setCategoryId(val)}
              disabled={readOnly}
              showColorDot={true}
              placeholder="Select Sector / Category..."
              options={categories.map((cat) => ({
                value: cat._id,
                label: cat.name,
                color: cat.color || '#0b1f3a',
                description: cat.slug ? `/category/${cat.slug}` : undefined,
              }))}
            />
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2 border-t border-rule text-xs">
            <div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  disabled={readOnly || isContributor}
                  checked={isLead}
                  onChange={(e) => setIsLead(e.target.checked)}
                  className="h-4 w-4 rounded border-rule text-navy-900 focus:ring-navy-700 disabled:opacity-50"
                />
                <span className="font-semibold text-navy-900">Feature as Lead Story</span>
              </label>
              <p className="text-[11px] text-muted pl-6 mt-0.5">
                Rotates in the public homepage 15-second lead carousel. You can select multiple lead stories.
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                disabled={readOnly || isContributor}
                checked={isBreaking}
                onChange={(e) => setIsBreaking(e.target.checked)}
                className="h-4 w-4 rounded border-rule text-signal focus:ring-signal disabled:opacity-50"
              />
              <span className="font-semibold text-signal">Broadcast as Breaking Alert</span>
            </label>
          </div>

          {/* Featured Image */}
          <div className="pt-2 border-t border-rule space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-navy-900">Featured Image</label>
              {!readOnly && (
                <button
                  type="button"
                  onClick={handleOpenMediaModal}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-navy-700 hover:text-navy-900 hover:underline"
                >
                  <ImageIcon className="h-3 w-3" />
                  <span>Media Library</span>
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                disabled={readOnly}
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="/uploads/... or https://..."
                className="flex-1 rounded border border-rule px-3 py-1.5 text-xs text-ink focus:outline-none disabled:bg-wash/40"
              />
              {!readOnly && (
                <button
                  type="button"
                  onClick={handleOpenMediaModal}
                  className="rounded border border-rule bg-wash px-2.5 py-1 text-xs font-semibold text-navy-900 hover:bg-rule/50"
                  title="Browse Media Library"
                >
                  Browse
                </button>
              )}
            </div>

            {imageUrl && (
              <div className="relative aspect-[16/9] w-full rounded overflow-hidden bg-wash border border-rule">
                <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
              </div>
            )}
            <input
              type="text"
              disabled={readOnly}
              value={imageCaption}
              onChange={(e) => setImageCaption(e.target.value)}
              placeholder="Image caption / attribution..."
              className="w-full rounded border border-rule px-3 py-1 text-[11px] text-muted focus:outline-none disabled:bg-wash/40"
            />
          </div>

          {/* Read Time & Tags */}
          <div className="pt-2 border-t border-rule space-y-2">
            <label className="block text-xs font-semibold text-navy-900">Estimated Read Time</label>
            <input
              type="text"
              disabled={readOnly}
              value={readTime}
              onChange={(e) => setReadTime(e.target.value)}
              placeholder="e.g. 4 min read"
              className="w-full rounded border border-rule px-3 py-1.5 text-xs text-ink focus:outline-none disabled:bg-wash/40"
            />

            <label className="block text-xs font-semibold text-navy-900 pt-2">Tags (Comma-separated)</label>
            <input
              type="text"
              disabled={readOnly}
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="Decarbonisation, IMO, Shipping"
              className="w-full rounded border border-rule px-3 py-1.5 text-xs text-ink focus:outline-none disabled:bg-wash/40"
            />
          </div>

          {/* Action Buttons */}
          {!readOnly && (
            <div className="pt-4 border-t border-rule space-y-2">
              {isContributor ? (
                <>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSave('under_review')}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-navy-900 px-4 py-2 text-xs font-semibold text-white hover:bg-navy-800 disabled:opacity-50 transition-colors"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{saving ? 'Submitting...' : 'Submit to Senior Editor for Approval'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSave('draft')}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-rule bg-wash px-4 py-2 text-xs font-semibold text-navy-900 hover:bg-rule/60 disabled:opacity-50 transition-colors"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Save as Draft</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSave('published')}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-navy-900 px-4 py-2 text-xs font-semibold text-white hover:bg-navy-800 disabled:opacity-50 transition-colors"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>
                      {saving
                        ? 'Publishing...'
                        : status === 'under_review'
                        ? 'Approve & Publish to Live Wire'
                        : 'Publish to Live Wire'}
                    </span>
                  </button>

                  {editorialManager && status === 'under_review' && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleSave('rejected')}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-900 hover:bg-rose-100 disabled:opacity-50 transition-colors"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Reject Article</span>
                    </button>
                  )}

                  {status !== 'under_review' && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleSave('draft')}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-rule bg-wash px-4 py-2 text-xs font-semibold text-navy-900 hover:bg-rule/60 disabled:opacity-50 transition-colors"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>Save as Draft</span>
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </aside>
      </div>

      {/* Media Library Selector Modal */}
      {mediaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 p-4">
          <div className="w-full max-w-3xl rounded-lg border border-rule bg-white p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-rule pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-navy-900" />
                <h3 className="font-serif text-lg font-bold text-navy-900">
                  Select Featured Asset from Media Library
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={inlineFileInputRef}
                  onChange={handleInlineUpload}
                  className="hidden"
                  accept="image/*"
                />
                <button
                  type="button"
                  onClick={() => inlineFileInputRef.current?.click()}
                  disabled={uploadingInlineMedia}
                  className="inline-flex items-center gap-1 rounded bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>{uploadingInlineMedia ? 'Uploading...' : 'Upload New'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMediaModalOpen(false)}
                  className="text-muted hover:text-navy-900 p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[300px]">
              {loadingMedia ? (
                <div className="py-20 text-center text-muted">Loading assets...</div>
              ) : mediaItems.length === 0 ? (
                <div className="py-20 text-center text-muted">
                  <p className="mb-3">No images found in Media Library.</p>
                  <button
                    type="button"
                    onClick={() => inlineFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded bg-navy-900 px-3.5 py-1.5 text-xs font-semibold text-white"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload your first asset</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {mediaItems.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => handleSelectMedia(item)}
                      className={`group relative aspect-square rounded-md border overflow-hidden cursor-pointer bg-wash hover:border-navy-900 hover:shadow-md transition-all ${
                        imageUrl === item.url ? 'ring-2 ring-navy-900 border-navy-900' : 'border-rule'
                      }`}
                    >
                      <img
                        src={item.url}
                        alt={item.originalName}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-navy-950/80 p-1.5 text-[10px] text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.originalName}
                      </div>
                      {imageUrl === item.url && (
                        <div className="absolute top-1.5 right-1.5 rounded-full bg-navy-900 text-white p-0.5">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-rule pt-3 flex justify-between items-center text-xs text-muted">
              <span>Click on any image to attach it to this article.</span>
              <button
                type="button"
                onClick={() => setMediaModalOpen(false)}
                className="rounded border border-rule px-3 py-1.5 font-semibold text-navy-900 hover:bg-wash"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
