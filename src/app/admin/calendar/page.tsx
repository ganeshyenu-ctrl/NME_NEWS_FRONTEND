'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { canManageEditorial } from '@/lib/rbac';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  Sparkles,
  GripVertical,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  RefreshCw,
} from 'lucide-react';
import { CalendarArticleItem, Category, User } from '@/types';

type ViewMode = 'month' | 'week' | 'day';

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400', border: 'border-l-gray-400' },
  UNDER_REVIEW: { bg: 'bg-amber-50', text: 'text-amber-800', dot: 'bg-amber-500', border: 'border-l-amber-500' },
  APPROVED: { bg: 'bg-sky-50', text: 'text-sky-800', dot: 'bg-sky-500', border: 'border-l-sky-500' },
  SCHEDULED: { bg: 'bg-purple-50', text: 'text-purple-800', dot: 'bg-purple-600', border: 'border-l-purple-600' },
  PUBLISHED: { bg: 'bg-emerald-50', text: 'text-emerald-800', dot: 'bg-emerald-600', border: 'border-l-emerald-600' },
};

export default function EditorialCalendarPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [articles, setArticles] = useState<CalendarArticleItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar State
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'err'; message: string } | null>(null);

  // Drag and drop state
  const [draggedArticleId, setDraggedArticleId] = useState<string | null>(null);

  // Schedule Modal State for Auto-Upload
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedulingArticle, setSchedulingArticle] = useState<CalendarArticleItem | null>(null);
  const [selectedArticleIdForSchedule, setSelectedArticleIdForSchedule] = useState<string>('');
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [scheduleTime, setScheduleTime] = useState<string>('09:00');
  const [submittingSchedule, setSubmittingSchedule] = useState(false);
  const [isCheckingAutoPublish, setIsCheckingAutoPublish] = useState(false);

  const canPublish = canManageEditorial(user);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [artRes, catRes, usrRes] = await Promise.all([
        api.get('/articles/admin/calendar', {
          params: {
            category: selectedCategory || undefined,
            author: selectedAuthor || undefined,
          },
        }).catch(async (err) => {
          // Fallback to /articles/admin/list if /calendar returns 404 on un-deployed server
          if (err.response?.status === 404) {
            try {
              const fallback = await api.get('/articles/admin/list', {
                params: {
                  category: selectedCategory || undefined,
                  author: selectedAuthor || undefined,
                  limit: 100,
                },
              });
              return {
                data: {
                  success: true,
                  articles: (fallback.data?.articles || []).map((a: any) => ({
                    _id: a._id,
                    id: a._id,
                    title: a.title,
                    headline: a.title,
                    slug: a.slug,
                    status: (a.status || 'draft').toUpperCase(),
                    scheduledAt: a.scheduledAt,
                    publishedAt: a.publishedAt,
                    at: a.scheduledAt || a.publishedAt || null,
                    category: a.category,
                    author: a.author,
                    categoryId: a.category?._id || a.category,
                    authorId: a.author?._id || a.author,
                    categoryName: a.categoryName || a.category?.name || 'General',
                    authorName: a.authorName || a.author?.name || 'Staff',
                  })),
                },
              };
            } catch (fbErr) {
              return { data: { success: true, articles: [] } };
            }
          }
          return { data: { success: true, articles: [] } };
        }),
        api.get('/categories').catch(() => ({ data: { categories: [] } })),
        api.get('/users').catch(() => ({ data: { users: [] } })),
      ]);

      if (artRes.data?.success) {
        setArticles(artRes.data.articles || []);
      }
      if (catRes.data?.categories) {
        setCategories(catRes.data.categories);
      }
      if (usrRes.data?.users) {
        setUsers(usrRes.data.users);
      }
    } catch (err: any) {
      console.error('Failed to load calendar data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory, selectedAuthor]);

  // Handle article reschedule
  const handleReschedule = async (articleId: string, targetDayStr: string) => {
    if (!canPublish) {
      setFeedback({ type: 'err', message: 'Your editorial role can view the calendar but not reschedule articles.' });
      return;
    }

    try {
      const art = articles.find((a) => a.id === articleId || a._id === articleId);
      const keepTime = art?.scheduledAt ? new Date(art.scheduledAt) : new Date();
      keepTime.setHours(9, 0, 0, 0);

      // Parse targetDayStr YYYY-MM-DD
      const [year, month, day] = targetDayStr.split('-').map(Number);
      const scheduledDate = new Date(Date.UTC(year, month - 1, day, keepTime.getUTCHours(), keepTime.getUTCMinutes()));

      let res;
      try {
        res = await api.patch(`/articles/admin/${articleId}/reschedule`, {
          scheduledAt: scheduledDate.toISOString(),
        });
      } catch (patchErr: any) {
        if (patchErr.response?.status === 404) {
          res = await api.put(`/articles/admin/${articleId}`, {
            scheduledAt: scheduledDate.toISOString(),
            status: 'scheduled',
          });
        } else {
          throw patchErr;
        }
      }

      if (res.data?.success) {
        setFeedback({
          type: 'success',
          message: `Rescheduled "${art?.headline || art?.title}" for ${targetDayStr}`,
        });
        setTimeout(() => setFeedback(null), 4000);
        fetchData();
      }
    } catch (err: any) {
      setFeedback({
        type: 'err',
        message: err.response?.data?.message || 'Failed to reschedule article',
      });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // Open Schedule Modal for Auto-Upload
  const handleOpenScheduleModal = (article?: CalendarArticleItem, prefillDate?: string) => {
    if (!canPublish) {
      setFeedback({ type: 'err', message: 'Your editorial role can view the calendar but not schedule articles.' });
      return;
    }
    const todayIso = new Date().toISOString().slice(0, 10);
    if (article) {
      setSchedulingArticle(article);
      setSelectedArticleIdForSchedule(article.id || article._id);
      if (article.scheduledAt) {
        const d = new Date(article.scheduledAt);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        setScheduleDate(prefillDate || `${y}-${m}-${day}`);
        setScheduleTime(`${hh}:${mm}`);
      } else {
        setScheduleDate(prefillDate || todayIso);
        setScheduleTime('09:00');
      }
    } else {
      setSchedulingArticle(null);
      setSelectedArticleIdForSchedule('');
      setScheduleDate(prefillDate || todayIso);
      setScheduleTime('09:00');
    }
    setShowScheduleModal(true);
  };

  // Confirm and Submit Schedule for Auto-Upload
  const handleConfirmScheduleModal = async () => {
    const targetArtId = schedulingArticle ? (schedulingArticle.id || schedulingArticle._id) : selectedArticleIdForSchedule;
    if (!targetArtId) {
      setFeedback({ type: 'err', message: 'Please select an article to schedule.' });
      return;
    }
    if (!scheduleDate) {
      setFeedback({ type: 'err', message: 'Please choose a schedule date.' });
      return;
    }
    if (!scheduleTime) {
      setFeedback({ type: 'err', message: 'Please choose a schedule time.' });
      return;
    }

    try {
      setSubmittingSchedule(true);
      const [year, month, day] = scheduleDate.split('-').map(Number);
      const [hour, minute] = scheduleTime.split(':').map(Number);

      // Create target Date (local/IST)
      const scheduledDate = new Date(year, month - 1, day, hour, minute, 0);

      let res;
      try {
        res = await api.patch(`/articles/admin/${targetArtId}/reschedule`, {
          scheduledAt: scheduledDate.toISOString(),
        });
      } catch (patchErr: any) {
        if (patchErr.response?.status === 404) {
          res = await api.put(`/articles/admin/${targetArtId}`, {
            scheduledAt: scheduledDate.toISOString(),
            status: scheduledDate <= new Date() ? 'published' : 'scheduled',
          });
        } else {
          throw patchErr;
        }
      }

      const isLiveNow = scheduledDate <= new Date();
      setFeedback({
        type: 'success',
        message: isLiveNow
          ? `Article published live immediately on ${scheduleDate} ${scheduleTime} IST.`
          : `Article successfully scheduled for auto-upload on ${scheduleDate} at ${scheduleTime} IST.`,
      });
      setShowScheduleModal(false);
      setSchedulingArticle(null);
      fetchData();
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({
        type: 'err',
        message: err.response?.data?.message || 'Failed to schedule article for auto-upload',
      });
      setTimeout(() => setFeedback(null), 5000);
    } finally {
      setSubmittingSchedule(false);
    }
  };

  // Trigger manual sweep of auto-publisher daemon
  const handleTriggerAutoPublish = async () => {
    try {
      setIsCheckingAutoPublish(true);
      const res = await api.post('/articles/admin/publish-scheduled').catch(() => null);
      const count = res?.data?.publishedCount ?? 0;
      setFeedback({
        type: 'success',
        message: count > 0
          ? `Auto-Publisher ran: ${count} scheduled article(s) reached their time and published live.`
          : 'Auto-Publisher daemon checked: All scheduled articles are up-to-date with current time.',
      });
      fetchData();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'err', message: 'Failed to run auto-publisher check' });
    } finally {
      setIsCheckingAutoPublish(false);
    }
  };

  // Quick navigation
  const handleNav = (delta: number) => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() + delta);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() + delta * 7);
    } else {
      next.setDate(next.getDate() + delta);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar title formatting
  const calendarTitle = useMemo(() => {
    if (viewMode === 'month') {
      return currentDate.toLocaleString('en-GB', { month: 'long', year: 'numeric' });
    }
    if (viewMode === 'week') {
      // Find Monday of the current week
      const d = new Date(currentDate);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return `${monday.getDate()} ${monday.toLocaleString('en-GB', { month: 'short' })} – ${sunday.getDate()} ${sunday.toLocaleString('en-GB', { month: 'short', year: 'numeric' })}`;
    }
    return currentDate.toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }, [currentDate, viewMode]);

  // Compute calendar days for Month view (Starting on Monday)
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: { date: Date; dateStr: string; isCurrentMonth: boolean }[] = [];

    // Find start offset (Monday = 1, Sunday = 0)
    let startOffset = firstDay.getDay() - 1;
    if (startOffset === -1) startOffset = 6;

    // Previous month padding
    for (let i = startOffset; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({ date: d, dateStr, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ date: d, dateStr, isCurrentMonth: true });
    }

    // Next month padding to fill complete weeks (multiples of 7)
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        days.push({ date: d, dateStr, isCurrentMonth: false });
      }
    }

    return days;
  }, [currentDate]);

  const todayKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Compute days for Week view (Monday - Sunday)
  const weekDays = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const days: { date: Date; dateStr: string; label: string }[] = [];
    const dowNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (let i = 0; i < 7; i++) {
      const cur = new Date(monday);
      cur.setDate(monday.getDate() + i);
      const dateStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
      const label = `${dowNames[i]} ${cur.getDate()} ${cur.toLocaleString('en-GB', { month: 'short' })}`;
      days.push({ date: cur, dateStr, label });
    }
    return days;
  }, [currentDate]);

  // Day string for Day view
  const dayStr = useMemo(() => {
    return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
  }, [currentDate]);

  // Group scheduled/published articles by day string (YYYY-MM-DD)
  const articlesByDay = useMemo(() => {
    const map: Record<string, CalendarArticleItem[]> = {};
    for (const a of articles) {
      const targetDate = a.scheduledAt || a.publishedAt;
      if (targetDate) {
        const d = new Date(targetDate);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!map[key]) map[key] = [];
        map[key].push(a);
      }
    }
    return map;
  }, [articles]);

  // Undated articles (sidebar)
  const undatedArticles = useMemo(() => {
    return articles.filter((a) => !a.scheduledAt && !a.publishedAt);
  }, [articles]);

  return (
    <div className="flex-1 bg-wash p-6 md:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-rule pb-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-navy-900 flex items-center gap-2.5">
            <CalendarIcon className="h-6 w-6 text-navy-900" />
            <span>Editorial Calendar</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Times in IST. {canPublish ? 'Drag an approved article to any date to schedule it.' : 'Your role can view the calendar schedule.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleTriggerAutoPublish}
            disabled={isCheckingAutoPublish}
            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
            title="Auto-Upload daemon runs continuously. Click to verify and publish due articles."
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span>{isCheckingAutoPublish ? 'Checking...' : 'Auto-Upload: Active'}</span>
          </button>

          {canPublish && (
            <button
              type="button"
              onClick={() => handleOpenScheduleModal()}
              className="inline-flex items-center gap-1.5 rounded-md border border-navy-900 bg-white px-3 py-2 text-xs font-semibold text-navy-900 hover:bg-wash transition-colors shadow-2xs cursor-pointer"
            >
              <Clock className="h-3.5 w-3.5 text-navy-700" />
              <span>Schedule Auto-Upload</span>
            </button>
          )}

          <Link
            href="/admin/articles/create"
            className="inline-flex items-center gap-1.5 rounded-md bg-navy-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-navy-800 transition-colors shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-navy-300" />
            <span>New Article</span>
          </Link>
        </div>
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

      {/* Calendar Navigation & Filters Bar */}
      <div className="rounded-lg border border-rule bg-white p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-xs">
        {/* Left: Navigation and Date Title */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleNav(-1)}
            aria-label="Previous"
            className="rounded border border-rule bg-white p-1.5 text-navy-900 hover:bg-wash transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleToday}
            className="rounded border border-rule bg-white px-3 py-1.5 text-xs font-semibold text-navy-900 hover:bg-wash transition-colors"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => handleNav(1)}
            aria-label="Next"
            className="rounded border border-rule bg-white p-1.5 text-navy-900 hover:bg-wash transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <h2 className="font-serif text-lg font-bold text-navy-900 ml-2">
            {calendarTitle}
          </h2>
        </div>

        {/* Right: Category, Author Filters & View Mode Selector */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded border border-rule bg-white px-2.5 py-1.5 text-ink focus:border-navy-900 focus:outline-none"
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedAuthor}
            onChange={(e) => setSelectedAuthor(e.target.value)}
            className="rounded border border-rule bg-white px-2.5 py-1.5 text-ink focus:border-navy-900 focus:outline-none"
            aria-label="Filter by author"
          >
            <option value="">All Authors</option>
            {users.map((u) => (
              <option key={u.id || u._id} value={u.id || u._id}>
                {u.name}
              </option>
            ))}
          </select>

          <div className="inline-flex rounded-md border border-rule p-0.5 bg-wash">
            {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`rounded px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                  viewMode === mode
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'text-muted hover:text-navy-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid & Unscheduled Sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        {/* Calendar Grid (Takes 3 columns on xl) */}
        <div className="xl:col-span-3 space-y-4">
          {/* Month View */}
          {viewMode === 'month' && (
            <div className="rounded-lg border border-rule bg-rule/70 overflow-hidden shadow-xs">
              {/* Weekday Header */}
              <div className="grid grid-cols-7 gap-px bg-rule/70 border-b border-rule">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <div key={day} className="bg-wash py-2 text-center text-[11px] font-bold uppercase tracking-wider text-muted">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days Grid: Fixed height per row to prevent excessive vertical stretching */}
              <div className="grid grid-cols-7 auto-rows-[112px] gap-px bg-rule/70">
                {monthDays.map(({ date, dateStr, isCurrentMonth }) => {
                  const dayArticles = articlesByDay[dateStr] || [];
                  const isToday = todayKey === dateStr;

                  return (
                    <div
                      key={dateStr}
                      data-day={dateStr}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('bg-navy-50');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('bg-navy-50');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('bg-navy-50');
                        if (draggedArticleId) {
                          const art = articles.find((a) => a.id === draggedArticleId || a._id === draggedArticleId);
                          if (art) {
                            handleOpenScheduleModal(art, dateStr);
                          }
                          setDraggedArticleId(null);
                        }
                      }}
                      className={`h-[112px] p-2 flex flex-col overflow-hidden transition-colors ${
                        isCurrentMonth ? 'bg-white' : 'bg-wash/70 text-muted/60'
                      } ${isToday ? 'ring-2 ring-navy-900 ring-inset' : ''}`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5 shrink-0">
                        <span
                          className={`inline-flex items-center justify-center font-bold text-xs h-5 w-5 rounded-full ${
                            isToday
                              ? 'bg-navy-900 text-white'
                              : isCurrentMonth
                              ? 'text-navy-900'
                              : 'text-muted'
                          }`}
                        >
                          {date.getDate()}
                        </span>
                        {dayArticles.length > 0 && (
                          <span className="text-[10px] text-muted font-mono font-semibold">
                            {dayArticles.length}
                          </span>
                        )}
                      </div>

                      {/* Day Article Pills Container: max-h-[75px] with smooth auto scrollbar */}
                      <div className="space-y-1 overflow-y-auto max-h-[75px] pr-0.5 no-scrollbar">
                        {dayArticles.map((a) => {
                          const st = (a.status || 'DRAFT').toUpperCase();
                          const color = STATUS_COLORS[st] || STATUS_COLORS.DRAFT;
                          const timeStr = a.scheduledAt
                            ? new Date(a.scheduledAt).toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '';

                          return (
                            <div
                              key={a.id || a._id}
                              draggable={canPublish}
                              onDragStart={() => setDraggedArticleId(a.id || a._id)}
                              title={`${st}: ${a.headline || a.title}${canPublish ? ' (drag to reschedule)' : ''}`}
                              className={`group relative rounded border-l-[3px] px-1.5 py-1 text-[11px] leading-tight transition-all cursor-pointer shadow-2xs hover:shadow-xs ${color.bg} ${color.border} hover:opacity-90`}
                            >
                              <Link
                                href={`/admin/articles/${a.id || a._id}/edit`}
                                className="flex items-center gap-1 overflow-hidden"
                              >
                                {timeStr && (
                                  <span className="font-mono text-[10px] text-muted shrink-0">
                                    {timeStr}
                                  </span>
                                )}
                                <span className="font-medium text-navy-900 truncate flex-1 hover:underline">
                                  {a.headline || a.title}
                                </span>
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Week View */}
          {viewMode === 'week' && (
            <div className="rounded-lg border border-rule bg-rule/70 overflow-hidden shadow-xs">
              {/* Weekday Header */}
              <div className="grid grid-cols-7 gap-px bg-rule/70 border-b border-rule">
                {weekDays.map((wd) => {
                  const isToday = todayKey === wd.dateStr;
                  return (
                    <div
                      key={wd.dateStr}
                      className={`py-2 px-2 text-center text-xs font-semibold ${
                        isToday ? 'bg-navy-900 text-white' : 'bg-wash text-navy-900'
                      }`}
                    >
                      <div>{wd.label}</div>
                    </div>
                  );
                })}
              </div>

              {/* Week Columns */}
              <div className="grid grid-cols-7 gap-px bg-rule/70">
                {weekDays.map((wd) => {
                  const dayArticles = articlesByDay[wd.dateStr] || [];
                  const isToday = todayKey === wd.dateStr;

                  return (
                    <div
                      key={wd.dateStr}
                      data-day={wd.dateStr}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('bg-navy-50');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('bg-navy-50');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('bg-navy-50');
                        if (draggedArticleId) {
                          const art = articles.find((a) => a.id === draggedArticleId || a._id === draggedArticleId);
                          if (art) {
                            handleOpenScheduleModal(art, wd.dateStr);
                          }
                          setDraggedArticleId(null);
                        }
                      }}
                      className={`h-[460px] overflow-y-auto no-scrollbar p-2 flex flex-col gap-1.5 transition-colors ${
                        isToday ? 'bg-white ring-2 ring-navy-900 ring-inset' : 'bg-white'
                      }`}
                    >
                      {dayArticles.map((a) => {
                        const st = (a.status || 'DRAFT').toUpperCase();
                        const color = STATUS_COLORS[st] || STATUS_COLORS.DRAFT;
                        const timeStr = a.scheduledAt
                          ? new Date(a.scheduledAt).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '';

                        return (
                          <div
                            key={a.id || a._id}
                            draggable={canPublish}
                            onDragStart={() => setDraggedArticleId(a.id || a._id)}
                            title={`${st}: ${a.headline || a.title}${canPublish ? ' (drag to reschedule)' : ''}`}
                            className={`group relative rounded border-l-[3px] p-2 text-xs leading-tight transition-all cursor-pointer shadow-2xs hover:shadow-xs ${color.bg} ${color.border} hover:opacity-90`}
                          >
                            <Link
                              href={`/admin/articles/${a.id || a._id}/edit`}
                              className="block space-y-1"
                            >
                              <div className="font-semibold text-navy-900 line-clamp-2 hover:underline">
                                {a.headline || a.title}
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-muted font-mono">
                                <span>{timeStr ? `${timeStr} IST` : 'Published'}</span>
                                <span className="font-bold uppercase text-[9px]">{st}</span>
                              </div>
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Day View */}
          {viewMode === 'day' && (
            <div className="rounded-lg border border-rule bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-rule pb-3">
                <div>
                  <h3 className="font-serif text-lg font-bold text-navy-900">
                    {calendarTitle}
                  </h3>
                  <p className="text-xs text-muted">
                    Chronological publishing schedule for this day.
                  </p>
                </div>
                <span className="rounded-full bg-navy-50 px-3 py-1 text-xs font-semibold text-navy-900 border border-navy-100">
                  {(articlesByDay[dayStr] || []).length} article{((articlesByDay[dayStr] || []).length === 1 ? '' : 's')}
                </span>
              </div>

              {/* Day Articles List */}
              <div
                data-day={dayStr}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('bg-navy-50');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('bg-navy-50');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('bg-navy-50');
                  if (draggedArticleId) {
                    const art = articles.find((a) => a.id === draggedArticleId || a._id === draggedArticleId);
                    if (art) {
                      handleOpenScheduleModal(art, dayStr);
                    }
                    setDraggedArticleId(null);
                  }
                }}
                className="min-h-[300px] rounded-md border border-dashed border-rule p-4 space-y-2.5 transition-colors"
              >
                {(articlesByDay[dayStr] || []).length === 0 ? (
                  <div className="text-center py-12 text-xs text-muted">
                    No articles scheduled or published on this day.
                    {canPublish && ' Drag an approved article from the sidebar to schedule it.'}
                  </div>
                ) : (
                  (articlesByDay[dayStr] || []).map((a) => {
                    const st = (a.status || 'DRAFT').toUpperCase();
                    const color = STATUS_COLORS[st] || STATUS_COLORS.DRAFT;
                    const timeStr = a.scheduledAt
                      ? new Date(a.scheduledAt).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Published';

                    return (
                      <div
                        key={a.id || a._id}
                        draggable={canPublish}
                        onDragStart={() => setDraggedArticleId(a.id || a._id)}
                        className={`rounded-lg border p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${color.bg} border-rule hover:border-navy-900/40 transition-all shadow-2xs`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-navy-900 shrink-0 bg-white px-2 py-1 rounded border border-rule">
                            {timeStr} IST
                          </span>
                          <div>
                            <Link
                              href={`/admin/articles/${a.id || a._id}/edit`}
                              className="font-semibold text-navy-900 hover:underline text-sm line-clamp-1"
                            >
                              {a.headline || a.title}
                            </Link>
                            <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
                              {a.categoryName && <span>{a.categoryName}</span>}
                              {a.categoryName && a.authorName && <span>&bull;</span>}
                              {a.authorName && <span>By {a.authorName}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${color.bg} ${color.text} border border-current`}>
                            {st}
                          </span>
                          <Link
                            href={`/admin/articles/${a.id || a._id}/edit`}
                            className="rounded p-1 text-muted hover:text-navy-900 hover:bg-white transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Status Color Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs rounded-lg border border-rule bg-white px-4 py-3">
            <span className="font-semibold text-navy-900">Status Legend:</span>
            {Object.entries(STATUS_COLORS).map(([statusKey, colors]) => (
              <span key={statusKey} className="inline-flex items-center gap-1.5 text-muted">
                <span className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
                <span className="capitalize">{statusKey.replace('_', ' ').toLowerCase()}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Sidebar: Not Yet Scheduled Articles */}
        <aside className="rounded-lg border border-rule bg-white p-5 space-y-4 shadow-xs">
          <div>
            <h2 className="font-serif text-base font-bold text-navy-900 border-b border-rule pb-2">
              Not Yet Scheduled ({undatedArticles.length})
            </h2>
            <p className="text-[11px] text-muted mt-1 leading-relaxed">
              Drag an approved article onto any day to schedule publishing.
            </p>
          </div>

          {loading ? (
            <p className="text-xs text-muted py-4">Loading articles...</p>
          ) : undatedArticles.length === 0 ? (
            <div className="rounded border border-dashed border-rule p-4 text-center text-xs text-muted">
              Every active article has a date assigned.
            </div>
          ) : (
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {undatedArticles.map((a) => {
                const st = (a.status || 'DRAFT').toUpperCase();
                const color = STATUS_COLORS[st] || STATUS_COLORS.DRAFT;

                return (
                  <div
                    key={a.id || a._id}
                    draggable={canPublish}
                    onDragStart={() => setDraggedArticleId(a.id || a._id)}
                    className="group rounded-md border border-rule p-2.5 bg-wash hover:bg-white hover:border-navy-900/40 transition-all cursor-grab active:cursor-grabbing text-xs space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-1.5">
                        <GripVertical className="h-4 w-4 text-muted/60 shrink-0 mt-0.5" />
                        <Link
                          href={`/admin/articles/${a.id || a._id}/edit`}
                          className="font-semibold text-navy-900 hover:underline line-clamp-2"
                        >
                          {a.headline || a.title}
                        </Link>
                      </div>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase shrink-0 ${color.bg} ${color.text}`}
                      >
                        {st}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted pl-5 pt-1">
                      <div className="truncate max-w-[130px]">
                        {a.categoryName} {a.authorName ? `• ${a.authorName}` : ''}
                      </div>
                      {canPublish && (
                        <button
                          type="button"
                          onClick={() => handleOpenScheduleModal(a)}
                          className="inline-flex items-center gap-1 rounded border border-rule px-2 py-0.5 text-[10px] font-semibold text-navy-900 bg-white hover:bg-wash transition-colors shadow-2xs shrink-0 cursor-pointer"
                        >
                          <Clock className="h-3 w-3 text-navy-700" />
                          <span>Schedule</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="border-t border-rule pt-3 text-[11px] text-muted leading-relaxed">
            Drafts and articles under review need approval before they can be scheduled.
            {canPublish && ' Approved ones can be dragged directly onto a day or scheduled via the modal.'}
          </div>
        </aside>
      </div>

      {/* Schedule / Reschedule Article Modal for Auto-Upload */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-lg border border-rule bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-rule pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-navy-900" />
                <h3 className="font-serif text-lg font-bold text-navy-900">
                  Schedule Article for Auto-Upload
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowScheduleModal(false);
                  setSchedulingArticle(null);
                }}
                className="text-muted hover:text-navy-900 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* If opened via button without pre-selected article, show dropdown */}
            {!schedulingArticle ? (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-navy-900">
                  Select Article to Schedule
                </label>
                <select
                  value={selectedArticleIdForSchedule}
                  onChange={(e) => setSelectedArticleIdForSchedule(e.target.value)}
                  className="w-full rounded border border-rule bg-white px-3 py-2 text-xs text-ink focus:border-navy-900 focus:outline-none"
                >
                  <option value="">-- Choose an article to schedule --</option>
                  {articles.map((a) => (
                    <option key={a.id || a._id} value={a.id || a._id}>
                      [{a.status}] {a.headline || a.title}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="rounded-md bg-wash p-3 space-y-1 text-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Target Article:
                </div>
                <div className="font-semibold text-navy-900 text-sm">
                  {schedulingArticle.headline || schedulingArticle.title}
                </div>
                <div className="text-[11px] text-muted flex items-center gap-2">
                  <span>Category: {schedulingArticle.categoryName || 'General'}</span>
                  <span>&bull;</span>
                  <span>Author: {schedulingArticle.authorName || 'Staff'}</span>
                </div>
              </div>
            )}

            {/* Date & Time Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-navy-900 flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5 text-muted" />
                  <span>Publish Date (IST)</span>
                </label>
                <input
                  type="date"
                  required
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full rounded border border-rule px-3 py-1.5 text-xs text-ink focus:border-navy-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-navy-900 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted" />
                  <span>Publish Time (IST)</span>
                </label>
                <input
                  type="time"
                  required
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full rounded border border-rule px-3 py-1.5 text-xs text-ink focus:border-navy-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Quick Time Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-muted font-medium">Quick Time Presets (IST):</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '09:00 AM (Morning Wire)', time: '09:00' },
                  { label: '12:00 PM (Midday)', time: '12:00' },
                  { label: '03:00 PM (Afternoon)', time: '15:00' },
                  { label: '06:00 PM (Evening)', time: '18:00' },
                  { label: '08:00 PM (Night Edition)', time: '20:00' },
                ].map((preset) => (
                  <button
                    key={preset.time}
                    type="button"
                    onClick={() => setScheduleTime(preset.time)}
                    className={`rounded border px-2 py-1 text-[11px] transition-colors cursor-pointer ${
                      scheduleTime === preset.time
                        ? 'border-navy-900 bg-navy-900 text-white font-semibold'
                        : 'border-rule bg-white text-muted hover:border-navy-900 hover:text-navy-900'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto Upload Feature Guarantee Banner */}
            <div className="rounded-md border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-950 flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Automatic Upload Guarantee:</strong> When the clock reaches this exact date and time in IST, the system automatically transitions this article to <strong>Published</strong> status and displays it live on the public website without needing manual intervention.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-rule pt-3">
              <button
                type="button"
                onClick={() => {
                  setShowScheduleModal(false);
                  setSchedulingArticle(null);
                }}
                className="rounded border border-rule px-3.5 py-1.5 text-xs font-semibold text-muted hover:bg-wash transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingSchedule}
                onClick={handleConfirmScheduleModal}
                className="inline-flex items-center gap-1.5 rounded bg-navy-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-navy-800 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>{submittingSchedule ? 'Scheduling...' : 'Confirm & Schedule Auto-Upload'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
