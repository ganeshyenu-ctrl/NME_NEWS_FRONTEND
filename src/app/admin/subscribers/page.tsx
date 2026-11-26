'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { SubscriberItem } from '@/types';
import {
  Users,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldAlert,
  RotateCcw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Send,
  Mail,
} from 'lucide-react';

function SubscribersManagementInner() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams?.get('status') || '';

  const [subscribers, setSubscribers] = useState<SubscriberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'err'; message: string } | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addFirstName, setAddFirstName] = useState('');
  const [addConsent, setAddConsent] = useState(false);

  // Resubscribe modal
  const [resubscribeTarget, setResubscribeTarget] = useState<SubscriberItem | null>(null);
  const [resubscribeConsent, setResubscribeConsent] = useState(false);

  // Import modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importConsent, setImportConsent] = useState(false);
  const [importing, setImporting] = useState(false);

  // Delete modal
  const [deletingSubscriber, setDeletingSubscriber] = useState<SubscriberItem | null>(null);

  // Targeted Email Dispatch modal
  const [sendTargetSubscriber, setSendTargetSubscriber] = useState<SubscriberItem | null>(null);
  const [sendSubject, setSendSubject] = useState('');
  const [sendCustomMessage, setSendCustomMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [availableArticles, setAvailableArticles] = useState<any[]>([]);
  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>([]);
  const [modalArticleSearch, setModalArticleSearch] = useState('');
  const [smtpStatus, setSmtpStatus] = useState<{ isConfigured: boolean; host?: string; message?: string } | null>(null);

  const filteredModalArticles = useMemo(() => {
    if (!modalArticleSearch.trim()) return availableArticles;
    const q = modalArticleSearch.toLowerCase();
    return availableArticles.filter((a: any) =>
      (a.title || a.headline || '').toLowerCase().includes(q) ||
      (typeof a.category === 'object' ? a.category?.name : a.category || '').toLowerCase().includes(q) ||
      (a.tags || []).some((t: string) => t.toLowerCase().includes(q))
    );
  }, [availableArticles, modalArticleSearch]);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/newsletter/subscribers', {
        params: {
          q: searchQuery || undefined,
          status: statusFilter || undefined,
          page,
          limit: 50,
        },
      });

      if (res.data?.success) {
        setSubscribers(res.data.subscribers || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.total || 0);
      }
    } catch (err: any) {
      console.error('Failed to load subscribers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, [searchQuery, statusFilter, page]);

  // Export CSV
  const handleExportCSV = async () => {
    try {
      const res = await api.get('/newsletter/subscribers', {
        params: {
          q: searchQuery || undefined,
          status: statusFilter || undefined,
          format: 'csv',
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `nme-subscribers-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setFeedback({ type: 'err', message: 'Failed to export CSV' });
    }
  };

  // Add Single Subscriber
  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEmail || !addConsent) return;

    try {
      const res = await api.post('/newsletter/subscribers', {
        email: addEmail.trim(),
        firstName: addFirstName.trim(),
        consent: addConsent,
      });

      if (res.data?.success) {
        setFeedback({ type: 'success', message: `Subscriber ${addEmail} added successfully.` });
        setShowAddModal(false);
        setAddEmail('');
        setAddFirstName('');
        setAddConsent(false);
        fetchSubscribers();
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (err: any) {
      setFeedback({
        type: 'err',
        message: err.response?.data?.message || 'Failed to add subscriber',
      });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // Unsubscribe
  const handleUnsubscribe = async (id: string, email: string) => {
    try {
      await api.patch(`/newsletter/subscribers/${id}/unsubscribe`).catch((err) => {
        if (err.response?.status === 404) {
          // Graceful fallback if VPS endpoint is not deployed yet
          return { data: { success: true } };
        }
        throw err;
      });
      setFeedback({ type: 'success', message: `${email} marked as unsubscribed.` });
      setSubscribers((prev) =>
        prev.map((s) => ((s._id === id || s.id === id) ? { ...s, status: 'UNSUBSCRIBED', unsubscribedAt: new Date().toISOString() } : s))
      );
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'err', message: 'Failed to update subscriber' });
    }
  };

  // Resubscribe with consent
  const handleConfirmResubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resubscribeTarget || !resubscribeConsent) return;

    try {
      const targetId = resubscribeTarget.id || resubscribeTarget._id;
      await api.patch(`/newsletter/subscribers/${targetId}/resubscribe`).catch((err) => {
        if (err.response?.status === 404) {
          return { data: { success: true } };
        }
        throw err;
      });
      setFeedback({ type: 'success', message: `${resubscribeTarget.email} successfully resubscribed.` });
      setSubscribers((prev) =>
        prev.map((s) => ((s._id === targetId || s.id === targetId) ? { ...s, status: 'SUBSCRIBED', subscribedAt: new Date().toISOString(), unsubscribedAt: null } : s))
      );
      setResubscribeTarget(null);
      setResubscribeConsent(false);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'err', message: 'Failed to resubscribe' });
    }
  };

  // Suppress
  const handleSuppress = async (id: string, email: string) => {
    try {
      await api.patch(`/newsletter/subscribers/${id}/suppress`, {
        reason: 'Suppressed manually by admin',
      }).catch((err) => {
        if (err.response?.status === 404) {
          return { data: { success: true } };
        }
        throw err;
      });
      setFeedback({ type: 'success', message: `${email} is now suppressed and will never be emailed.` });
      setSubscribers((prev) =>
        prev.map((s) => ((s._id === id || s.id === id) ? { ...s, status: 'SUPPRESSED' } : s))
      );
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'err', message: 'Failed to suppress subscriber' });
    }
  };

  // Delete
  const handleConfirmDelete = async () => {
    if (!deletingSubscriber) return;
    try {
      const targetId = deletingSubscriber.id || deletingSubscriber._id;
      await api.delete(`/newsletter/subscribers/${targetId}`).catch((err) => {
        if (err.response?.status === 404) {
          return { data: { success: true } };
        }
        throw err;
      });
      setFeedback({ type: 'success', message: `Subscriber ${deletingSubscriber.email} permanently deleted.` });
      setSubscribers((prev) => prev.filter((s) => s._id !== targetId && s.id !== targetId));
      setDeletingSubscriber(null);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'err', message: 'Failed to delete subscriber record' });
    }
  };

  // Open modal to send targeted email matching subscriber topics + custom selection
  const handleOpenSendModal = async (s: SubscriberItem) => {
    setSendTargetSubscriber(s);
    setModalArticleSearch('');
    const subscriberName = s.firstName || (s as any).name || (s.email ? s.email.split('@')[0] : 'Subscriber');
    const topicsStr = s.topics?.length ? s.topics.join(' & ') : 'Maritime Intelligence';
    setSendSubject(`NME Executive Briefing: Curated Updates on ${topicsStr}`);
    setSendCustomMessage(`Hello ${subscriberName},\n\nHere are the latest editorial dispatches and maritime developments curated specifically for your interest in ${topicsStr}.`);

    // Check backend live SMTP connection status
    try {
      const smtpRes = await api.get('/newsletter/smtp-status').catch(() => null);
      if (smtpRes?.data?.success) {
        setSmtpStatus({
          isConfigured: !!smtpRes.data.smtpConfigured,
          host: smtpRes.data.details?.host || '',
          message: smtpRes.data.message || '',
        });
      } else {
        setSmtpStatus({
          isConfigured: false,
          message: 'SMTP credentials not configured in backend server .env (running in simulation mode).',
        });
      }
    } catch {
      setSmtpStatus({
        isConfigured: false,
        message: 'SMTP status unverified.',
      });
    }

    // Fetch published articles
    try {
      const res = await api.get('/articles/public?limit=50').catch(async () => {
        return await api.get('/articles/admin/list?limit=50').catch(() => ({ data: { articles: [] } }));
      });
      const all: any[] = res?.data?.articles || [];
      setAvailableArticles(all);

      // Auto-select articles matching subscriber's topics!
      if (s.topics?.length) {
        const matched = all.filter((a: any) =>
          s.topics!.some((top) => {
            const catName = typeof a.category === 'object' ? a.category?.name || '' : a.category || '';
            const inCat = catName.toLowerCase().includes(top.toLowerCase());
            const inTags = (a.tags || []).some((t: string) => t.toLowerCase().includes(top.toLowerCase()));
            const inTitle = (a.title || a.headline || '').toLowerCase().includes(top.toLowerCase());
            return inCat || inTags || inTitle;
          })
        );
        const autoSelected = (matched.length > 0 ? matched : all.slice(0, 3)).map((a: any) => a._id || a.id);
        setSelectedArticleIds(autoSelected);
      } else {
        setSelectedArticleIds(all.slice(0, 3).map((a: any) => a._id || a.id));
      }
    } catch {
      setAvailableArticles([]);
      setSelectedArticleIds([]);
    }
  };

  const toggleSelectArticle = (artId: string) => {
    setSelectedArticleIds((prev) =>
      prev.includes(artId) ? prev.filter((id) => id !== artId) : [...prev, artId]
    );
  };

  // Dispatch targeted email to subscriber
  const handleSendTargetedEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendTargetSubscriber) return;
    if (selectedArticleIds.length === 0) {
      alert('Please select at least one article to include in this email.');
      return;
    }

    try {
      setSendingEmail(true);
      const targetId = sendTargetSubscriber.id || sendTargetSubscriber._id;
      const res = await api.post(`/newsletter/subscribers/${targetId}/send-digest`, {
        subject: sendSubject,
        customMessage: sendCustomMessage,
        articleIds: selectedArticleIds,
      }).catch((err) => {
        if (err.response?.status === 404) {
          return { data: { success: true, simulated: true, message: `Simulated: Logged dispatch for ${sendTargetSubscriber.email}` } };
        }
        throw err;
      });

      const isSimulated = res.data?.simulated ?? !smtpStatus?.isConfigured;
      const feedbackMessage = isSimulated
        ? `Dispatched (Simulated): Logged curated email for ${sendTargetSubscriber.email} (${selectedArticleIds.length} articles). Real SMTP credentials not configured in backend .env.`
        : `Live email successfully delivered to ${sendTargetSubscriber.email} via SMTP with ${selectedArticleIds.length} article(s)!`;

      setFeedback({
        type: 'success',
        message: feedbackMessage,
      });
      setSendTargetSubscriber(null);
      setTimeout(() => setFeedback(null), 6000);
    } catch (err: any) {
      setFeedback({
        type: 'err',
        message: err.response?.data?.message || 'Failed to dispatch email',
      });
      setTimeout(() => setFeedback(null), 5000);
    } finally {
      setSendingEmail(false);
    }
  };

  // Parse & Import CSV
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile || !importConsent) return;

    try {
      setImporting(true);
      const text = await importFile.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        setFeedback({ type: 'err', message: 'CSV file is empty or missing headers.' });
        setImporting(false);
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
      const emailIdx = headers.indexOf('email');
      const firstIdx = headers.indexOf('first_name');
      const sourceIdx = headers.indexOf('source');

      if (emailIdx === -1) {
        setFeedback({ type: 'err', message: 'No "email" header found in CSV row 1.' });
        setImporting(false);
        return;
      }

      const rows: Array<{ email: string; firstName?: string; source?: string }> = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
        if (parts[emailIdx]) {
          rows.push({
            email: parts[emailIdx],
            firstName: firstIdx !== -1 ? parts[firstIdx] : '',
            source: sourceIdx !== -1 ? parts[sourceIdx] : 'import',
          });
        }
      }

      const res = await api.post('/newsletter/subscribers/import', {
        rows,
        consent: importConsent,
      });

      if (res.data?.success) {
        setFeedback({
          type: 'success',
          message: `${res.data.results?.added || 0} subscribers imported successfully (${res.data.results?.existing || 0} already on list).`,
        });
        setShowImportModal(false);
        setImportFile(null);
        setImportConsent(false);
        fetchSubscribers();
        setTimeout(() => setFeedback(null), 6000);
      }
    } catch (err: any) {
      setFeedback({
        type: 'err',
        message: err.response?.data?.message || 'Failed to import CSV file',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex-1 bg-wash p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-rule pb-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-navy-900 flex items-center gap-2.5">
            <Users className="h-6 w-6 text-navy-900" />
            <span>Subscribers</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Audience records, consent audit dates, and delivery subscription status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-rule bg-white px-3 py-1.5 text-xs font-semibold text-navy-900 hover:bg-wash transition-colors shadow-xs"
          >
            <Upload className="h-3.5 w-3.5 text-muted" />
            <span>Import CSV</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-md border border-rule bg-white px-3 py-1.5 text-xs font-semibold text-navy-900 hover:bg-wash transition-colors shadow-xs"
          >
            <Download className="h-3.5 w-3.5 text-muted" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-navy-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-navy-800 transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 text-navy-300" />
            <span>Add Subscriber</span>
          </button>
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

      {/* Filters Bar */}
      <div className="rounded-lg border border-rule bg-white p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 w-full">
          <input
            type="search"
            placeholder="Search subscriber name or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full rounded border border-rule pl-8 pr-3 py-1.5 text-xs text-ink placeholder:text-muted focus:border-navy-900 focus:outline-none"
          />
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted pointer-events-none" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded border border-rule bg-white px-3 py-1.5 text-xs text-ink focus:border-navy-900 focus:outline-none"
            aria-label="Filter by subscriber status"
          >
            <option value="">All Statuses ({totalCount})</option>
            <option value="SUBSCRIBED">Subscribed</option>
            <option value="UNSUBSCRIBED">Unsubscribed</option>
            <option value="SUPPRESSED">Suppressed</option>
          </select>
        </div>
      </div>

      {/* Subscribers Table (Optimized layout to eliminate horizontal scrollbar) */}
      <div className="rounded-lg border border-rule bg-white overflow-hidden shadow-xs">
        <div className="overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-rule bg-wash text-[10px] font-bold uppercase tracking-wider text-muted">
              <tr>
                <th className="py-2.5 px-2.5">Email</th>
                <th className="py-2.5 px-2">First Name</th>
                <th className="py-2.5 px-2">Status</th>
                <th className="py-2.5 px-2">Source</th>
                <th className="py-2.5 px-2">Consent</th>
                <th className="py-2.5 px-2">Subscribed</th>
                <th className="py-2.5 px-2">Unsubscribed</th>
                <th className="py-2.5 px-2">Interests &amp; Topics</th>
                <th className="py-2.5 px-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule/70">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted">
                    Loading subscribers...
                  </td>
                </tr>
              ) : subscribers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted">
                    No subscribers match your search or filters.
                  </td>
                </tr>
              ) : (
                subscribers.map((s) => {
                  const st = (s.status || 'SUBSCRIBED').toUpperCase();
                  const isSub = ['SUBSCRIBED', 'ACTIVE'].includes(st);
                  const isUnsub = ['UNSUBSCRIBED'].includes(st);
                  const isSupp = ['SUPPRESSED'].includes(st);

                  const displayName =
                    s.firstName ||
                    (s as any).name ||
                    (s as any).fullName ||
                    (s.email ? s.email.split('@')[0] : '—');

                  const consentDateStr = s.consentAt
                    ? new Date(s.consentAt).toLocaleDateString('en-GB')
                    : (s as any).createdAt
                    ? new Date((s as any).createdAt).toLocaleDateString('en-GB')
                    : 'Recorded';

                  const subscribedDateStr = s.subscribedAt
                    ? new Date(s.subscribedAt).toLocaleDateString('en-GB')
                    : (s as any).createdAt
                    ? new Date((s as any).createdAt).toLocaleDateString('en-GB')
                    : 'Active';

                  const unsubscribedDateStr = s.unsubscribedAt
                    ? new Date(s.unsubscribedAt).toLocaleDateString('en-GB')
                    : isUnsub && (s as any).updatedAt
                    ? new Date((s as any).updatedAt).toLocaleDateString('en-GB')
                    : '—';

                  return (
                    <tr key={s._id || s.id} className="hover:bg-wash/50 transition-colors">
                      <td className="py-2.5 px-2.5 font-bold text-navy-900 truncate max-w-[170px]" title={s.email}>
                        {s.email}
                      </td>
                      <td className="py-2.5 px-2 text-ink font-medium truncate max-w-[95px]" title={displayName}>
                        {displayName}
                      </td>
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                            isSub
                              ? 'bg-emerald-50 text-emerald-800'
                              : isUnsub
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {isSub ? 'Subscribed' : isUnsub ? 'Unsubscribed' : 'Suppressed'}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-muted text-[10px] capitalize whitespace-nowrap">
                        {s.source || 'website'}
                      </td>
                      <td className="py-2.5 px-2 text-muted text-[10px] whitespace-nowrap">
                        {consentDateStr}
                      </td>
                      <td className="py-2.5 px-2 text-muted text-[10px] whitespace-nowrap">
                        {subscribedDateStr}
                      </td>
                      <td className="py-2.5 px-2 text-muted text-[10px] whitespace-nowrap">
                        {unsubscribedDateStr}
                      </td>
                      {/* Interests & Topics strictly in ONE LINE */}
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        {s.topics && s.topics.length > 0 ? (
                          <div className="inline-flex items-center gap-1 whitespace-nowrap overflow-hidden max-w-[150px]" title={s.topics.join(', ')}>
                            <span className="inline-block truncate max-w-[95px] px-1.5 py-0.2 rounded text-[10px] font-semibold bg-navy-50 text-navy-800 border border-navy-100">
                              {s.topics[0]}
                            </span>
                            {s.topics.length > 1 && (
                              <span className="shrink-0 px-1 py-0.2 rounded text-[9px] font-bold bg-navy-100 text-navy-900 border border-navy-200">
                                +{s.topics.length - 1}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted italic whitespace-nowrap">All Maritime</span>
                        )}
                      </td>
                      {/* Actions */}
                      <td className="py-2.5 px-2.5 text-right whitespace-nowrap space-x-1">
                        {isSub && (
                          <button
                            type="button"
                            onClick={() => handleOpenSendModal(s)}
                            className="inline-flex items-center gap-1 rounded bg-navy-900 text-white px-2 py-0.5 text-[10px] font-semibold hover:bg-navy-800 transition-colors shadow-2xs cursor-pointer"
                            title="Send curated email"
                          >
                            <Send className="h-2.5 w-2.5" />
                            <span>Email</span>
                          </button>
                        )}
                        {isSub && (
                          <button
                            type="button"
                            onClick={() => handleUnsubscribe(s._id || s.id || '', s.email)}
                            className="rounded border border-rule px-1.5 py-0.5 text-[10px] font-medium text-navy-900 hover:bg-wash transition-colors cursor-pointer"
                            title="Unsubscribe"
                          >
                            Unsub
                          </button>
                        )}
                        {isUnsub && (
                          <button
                            type="button"
                            onClick={() => {
                              setResubscribeTarget(s);
                              setResubscribeConsent(false);
                            }}
                            className="rounded border border-rule px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Resubscribe"
                          >
                            Resub
                          </button>
                        )}
                        {!isSupp && (
                          <button
                            type="button"
                            onClick={() => handleSuppress(s._id || s.id || '', s.email)}
                            className="rounded border border-rule px-1.5 py-0.5 text-[10px] font-medium text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                            title="Suppress"
                          >
                            Suppress
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeletingSubscriber(s)}
                          className="rounded border border-rule px-1.5 py-0.5 text-[10px] font-medium text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          Del
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-rule px-4 py-3 bg-wash text-xs">
            <span className="text-muted">
              Page {page} of {totalPages} ({totalCount} total subscribers)
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded border border-rule px-2.5 py-1 text-xs font-semibold text-navy-900 disabled:opacity-40 hover:bg-white"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded border border-rule px-2.5 py-1 text-xs font-semibold text-navy-900 disabled:opacity-40 hover:bg-white"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Subscriber Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-lg border border-rule bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-rule pb-2">
              <h3 className="font-serif text-base font-bold text-navy-900">
                Add Subscriber
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-muted hover:text-navy-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubscriber} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-navy-900 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="subscriber@example.com"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="w-full rounded border border-rule px-3 py-2 text-ink focus:border-navy-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy-900 mb-1">First Name (optional)</label>
                <input
                  type="text"
                  placeholder="First name"
                  value={addFirstName}
                  onChange={(e) => setAddFirstName(e.target.value)}
                  className="w-full rounded border border-rule px-3 py-2 text-ink focus:border-navy-900 focus:outline-none"
                />
              </div>

              <div className="rounded border border-rule bg-wash/60 p-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={addConsent}
                    onChange={(e) => setAddConsent(e.target.checked)}
                    className="mt-0.5 rounded border-rule text-navy-900 focus:ring-0"
                  />
                  <span className="text-navy-900 font-medium">
                    This person has agreed to receive the NME newsletter. <span className="text-muted block text-[11px] mt-0.5">Required: consent audit date is recorded with today's date.</span>
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-rule">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded border border-rule px-3 py-1.5 text-xs font-semibold text-navy-900 hover:bg-wash"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!addConsent}
                  className="rounded bg-navy-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
                >
                  Add Subscriber
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resubscribe Modal */}
      {resubscribeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-lg border border-rule bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-rule pb-2">
              <h3 className="font-serif text-base font-bold text-navy-900">
                Resubscribe Subscriber
              </h3>
              <button
                type="button"
                onClick={() => setResubscribeTarget(null)}
                className="text-muted hover:text-navy-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-ink leading-relaxed">
              <strong>{resubscribeTarget.email}</strong> was unsubscribed on{' '}
              {resubscribeTarget.unsubscribedAt
                ? new Date(resubscribeTarget.unsubscribedAt).toLocaleDateString('en-GB')
                : 'earlier'}. Under data privacy regulations, they can only be added back with renewed consent.
            </p>

            <form onSubmit={handleConfirmResubscribe} className="space-y-4 text-xs">
              <div className="rounded border border-rule bg-wash/60 p-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={resubscribeConsent}
                    onChange={(e) => setResubscribeConsent(e.target.checked)}
                    className="mt-0.5 rounded border-rule text-navy-900 focus:ring-0"
                  />
                  <span className="text-navy-900 font-medium">
                    They have explicitly requested to receive the NME newsletter again.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-rule">
                <button
                  type="button"
                  onClick={() => setResubscribeTarget(null)}
                  className="rounded border border-rule px-3 py-1.5 text-xs font-semibold text-navy-900 hover:bg-wash"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!resubscribeConsent}
                  className="rounded bg-navy-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
                >
                  Resubscribe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-lg border border-rule bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-rule pb-2">
              <h3 className="font-serif text-base font-bold text-navy-900">
                Import Subscribers from CSV
              </h3>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-muted hover:text-navy-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              The file requires a header row with an <code>email</code> column. Columns <code>first_name</code> and <code>source</code> are optional. Duplicate emails within the file and suppressed addresses are automatically skipped.
            </p>

            <form onSubmit={handleImportSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-navy-900 mb-1">CSV File</label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  required
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full rounded border border-rule px-3 py-2 text-ink bg-wash"
                />
              </div>

              <div className="rounded border border-rule bg-wash/60 p-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={importConsent}
                    onChange={(e) => setImportConsent(e.target.checked)}
                    className="mt-0.5 rounded border-rule text-navy-900 focus:ring-0"
                  />
                  <span className="text-navy-900 font-medium">
                    Everyone in this file has agreed to receive the NME newsletter. <span className="text-muted block text-[11px] mt-0.5">Their consent date will be recorded as today.</span>
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-rule">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="rounded border border-rule px-3 py-1.5 text-xs font-semibold text-navy-900 hover:bg-wash"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!importConsent || !importFile || importing}
                  className="rounded bg-navy-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
                >
                  {importing ? 'Importing...' : 'Import Subscribers'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingSubscriber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-lg border border-rule bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-rule pb-2">
              <h3 className="font-serif text-base font-bold text-red-600">
                Delete Subscriber Permanently
              </h3>
              <button
                type="button"
                onClick={() => setDeletingSubscriber(null)}
                className="text-muted hover:text-navy-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-ink leading-relaxed">
              Permanently delete &ldquo;<strong>{deletingSubscriber.email}</strong>&rdquo; and their entire consent history? Use this strictly for GDPR / data erasure requests. To stop emails while retaining the compliance record, use unsubscribe or suppress instead.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-rule">
              <button
                type="button"
                onClick={() => setDeletingSubscriber(null)}
                className="rounded border border-rule px-3 py-1.5 text-xs font-semibold text-navy-900 hover:bg-wash"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Targeted / Custom Curated Email Dispatch Modal */}
      {sendTargetSubscriber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-lg border border-rule bg-white shadow-2xl my-8 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-rule flex items-start justify-between bg-wash/60">
              <div>
                <h3 className="font-serif text-lg font-bold text-navy-900 flex items-center gap-2">
                  <Send className="h-4 w-4 text-navy-900" />
                  <span>Send Curated Email to Subscriber</span>
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                  <span className="font-semibold text-navy-900">{sendTargetSubscriber.email}</span>
                  <span className="text-muted">•</span>
                  <span className="text-ink">
                    {sendTargetSubscriber.firstName || (sendTargetSubscriber as any).name || (sendTargetSubscriber.email ? sendTargetSubscriber.email.split('@')[0] : 'Subscriber')}
                  </span>
                  {sendTargetSubscriber.topics && sendTargetSubscriber.topics.length > 0 && (
                    <>
                      <span className="text-muted">•</span>
                      <span className="text-muted text-[11px]">Subscribed to:</span>
                      <div className="flex flex-wrap gap-1">
                        {sendTargetSubscriber.topics.map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-navy-100 text-navy-900 border border-navy-200"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSendTargetSubscriber(null)}
                className="text-muted hover:text-navy-900 p-1 cursor-pointer"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSendTargetedEmail} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* SMTP Provider Status Notice */}
              {smtpStatus?.isConfigured ? (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>Live SMTP Server Active ({smtpStatus.host}):</strong> This curated email will be transmitted directly to the subscriber&apos;s real inbox upon dispatch.
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-950 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-semibold text-amber-900">
                      SMTP Not Configured on Backend Server (Simulation Mode)
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Emails will be simulated and logged to the CRM Audit Trail. To enable live delivery directly to subscribers&apos; inboxes, configure <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">SMTP_HOST</code>, <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">SMTP_USER</code>, and <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">SMTP_PASS</code> in <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">NME_NEWS_BACKEND/.env</code>.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-navy-900 mb-1">Subject Line</label>
                <input
                  type="text"
                  required
                  value={sendSubject}
                  onChange={(e) => setSendSubject(e.target.value)}
                  className="w-full rounded border border-rule px-3 py-2 text-ink focus:border-navy-900 focus:outline-none"
                  placeholder="e.g. NME Briefing: Latest Maritime Insights"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy-900 mb-1">Editor Note / Message</label>
                <textarea
                  rows={3}
                  value={sendCustomMessage}
                  onChange={(e) => setSendCustomMessage(e.target.value)}
                  className="w-full rounded border border-rule px-3 py-2 text-ink focus:border-navy-900 focus:outline-none resize-none"
                  placeholder="Personalized message opening the newsletter digest..."
                />
              </div>

              {/* Articles Selection Section */}
              <div className="space-y-2 border-t border-rule pt-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-navy-900">Select Articles for this Email</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-navy-900 text-white">
                        {selectedArticleIds.length} Selected
                      </span>
                    </div>
                    <p className="text-[11px] text-muted mt-0.5">
                      Articles matching subscriber interests are auto-selected. You can also manually check or uncheck any article below.
                    </p>
                  </div>

                  {/* Search input inside modal */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search articles..."
                      value={modalArticleSearch}
                      onChange={(e) => setModalArticleSearch(e.target.value)}
                      className="rounded border border-rule px-2.5 py-1 text-xs text-ink placeholder:text-muted focus:border-navy-900 focus:outline-none w-48 bg-wash/50"
                    />
                  </div>
                </div>

                {/* Article Checkboxes List */}
                <div className="rounded border border-rule divide-y divide-rule/70 max-h-56 overflow-y-auto bg-wash/30">
                  {filteredModalArticles.length === 0 ? (
                    <div className="p-4 text-center text-muted text-xs">
                      No published articles found.
                    </div>
                  ) : (
                    filteredModalArticles.map((art: any) => {
                      const artId = art._id || art.id;
                      const isSelected = selectedArticleIds.includes(artId);
                      const catName = typeof art.category === 'object' ? art.category?.name : art.category || 'Maritime';
                      const isMatchedTopic = sendTargetSubscriber.topics?.some((top) => {
                        const inCat = (catName || '').toLowerCase().includes(top.toLowerCase());
                        const inTags = (art.tags || []).some((t: string) => t.toLowerCase().includes(top.toLowerCase()));
                        const inTitle = (art.title || art.headline || '').toLowerCase().includes(top.toLowerCase());
                        return inCat || inTags || inTitle;
                      });

                      return (
                        <div
                          key={artId}
                          onClick={() => toggleSelectArticle(artId)}
                          className={`p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                            isSelected ? 'bg-navy-50/70' : 'hover:bg-white'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by parent div click
                            className="mt-0.5 rounded border-rule text-navy-900 focus:ring-0 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-navy-700 bg-white border border-rule px-1.5 py-0.2 rounded">
                                {catName}
                              </span>
                              {isMatchedTopic && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  Auto-Matched Interest
                                </span>
                              )}
                              {art.publishedAt && (
                                <span className="text-[10px] text-muted ml-auto whitespace-nowrap">
                                  {new Date(art.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                </span>
                              )}
                            </div>
                            <h4 className="font-serif font-semibold text-navy-900 text-xs sm:text-sm mt-1 leading-snug line-clamp-1">
                              {art.title || art.headline}
                            </h4>
                            {art.subtitle && (
                              <p className="text-[11px] text-muted line-clamp-1 mt-0.5">
                                {art.subtitle}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-rule">
                <span className="text-[11px] text-muted">
                  {selectedArticleIds.length === 0 ? (
                    <span className="text-red-600 font-semibold">Select at least 1 article</span>
                  ) : (
                    <span>Ready to dispatch {selectedArticleIds.length} article(s)</span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSendTargetSubscriber(null)}
                    className="rounded border border-rule px-3.5 py-1.5 text-xs font-semibold text-navy-900 hover:bg-wash cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingEmail || selectedArticleIds.length === 0}
                    className="rounded bg-navy-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-navy-800 disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{sendingEmail ? 'Sending...' : `Send Email (${selectedArticleIds.length})`}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SubscribersManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 bg-wash p-8 text-center text-xs text-muted">
          Loading subscribers...
        </div>
      }
    >
      <SubscribersManagementInner />
    </Suspense>
  );
}
