'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { NewsletterStats } from '@/types';
import {
  Mail,
  Users,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';

export default function NewsletterOverviewPage() {
  const [stats, setStats] = useState<NewsletterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [suppressInput, setSuppressInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'err'; message: string } | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/newsletter/stats').catch(async (err) => {
        if (err.response?.status === 404) {
          try {
            const subsRes = await api.get('/newsletter/subscribers').catch(() => ({ data: { subscribers: [] } }));
            const subs = subsRes.data?.subscribers || [];
            return {
              data: {
                success: true,
                stats: {
                  total: subs.length,
                  subscribed: subs.filter((s: any) => ['SUBSCRIBED', 'active'].includes((s.status || '').toUpperCase())).length,
                  unsubscribed: subs.filter((s: any) => ['UNSUBSCRIBED', 'unsubscribed'].includes((s.status || '').toUpperCase())).length,
                  suppressed: subs.filter((s: any) => ['SUPPRESSED', 'suppressed'].includes((s.status || '').toUpperCase())).length,
                  sources: { website: subs.length },
                  growth: [],
                  suppressedList: subs.filter((s: any) => ['SUPPRESSED', 'suppressed'].includes((s.status || '').toUpperCase())),
                  recentCampaigns: [],
                },
              },
            };
          } catch (fbErr) {
            return {
              data: {
                success: true,
                stats: {
                  total: 0,
                  subscribed: 0,
                  unsubscribed: 0,
                  suppressed: 0,
                  sources: { website: 0 },
                  growth: [],
                  suppressedList: [],
                  recentCampaigns: [],
                },
              },
            };
          }
        }
        return { data: { success: false } };
      });
      if (res.data?.success && res.data.stats) {
        setStats(res.data.stats);
      } else {
        setStats({
          total: 0,
          subscribed: 0,
          unsubscribed: 0,
          suppressed: 0,
          sources: { website: 0 },
          growth: [],
          suppressedList: [],
          recentCampaigns: [],
        });
      }
    } catch (err: any) {
      console.error('Failed to load newsletter stats', err);
      setStats({
        total: 0,
        subscribed: 0,
        unsubscribed: 0,
        suppressed: 0,
        sources: { website: 0 },
        growth: [],
        suppressedList: [],
        recentCampaigns: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSuppress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suppressInput.trim()) return;

    try {
      const res = await api.post('/newsletter/suppress', {
        email: suppressInput.trim(),
        reason: 'Suppressed manually via overview',
      });

      if (res.data?.success) {
        setFeedback({
          type: 'success',
          message: `${suppressInput.trim()} has been added to the suppression list and will never be emailed.`,
        });
        setSuppressInput('');
        fetchStats();
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (err: any) {
      setFeedback({
        type: 'err',
        message: err.response?.data?.message || 'Failed to suppress address',
      });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleUnsuppress = async (id: string, email: string) => {
    try {
      const res = await api.patch(`/newsletter/subscribers/${id}/unsuppress`);
      if (res.data?.success) {
        setFeedback({
          type: 'success',
          message: `${email} removed from suppression list (now unsubscribed).`,
        });
        fetchStats();
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (err: any) {
      setFeedback({
        type: 'err',
        message: err.response?.data?.message || 'Failed to remove from suppression list',
      });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const maxGrowth = Math.max(1, ...(stats?.growth || []).map((g) => g.count));
  const totalSubscribers = stats?.total || 1;

  return (
    <div className="flex-1 bg-wash p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-rule pb-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-navy-900 flex items-center gap-2.5">
            <Mail className="h-6 w-6 text-navy-900" />
            <span>Newsletter Overview</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Subscriber list, audience sign-ups, delivery and suppression management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/subscribers"
            className="inline-flex items-center gap-1.5 rounded-md border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-navy-900 hover:bg-wash transition-colors shadow-xs"
          >
            <Users className="h-3.5 w-3.5 text-muted" />
            <span>Manage Subscribers</span>
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


      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/admin/subscribers?status=SUBSCRIBED"
          className="rounded-lg border border-rule bg-white p-5 space-y-1 hover:border-navy-900/40 transition-all shadow-xs group"
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            Subscribed
          </p>
          <p className="font-serif text-3xl font-bold text-navy-900 group-hover:text-navy-800">
            {loading ? '...' : stats?.subscribed ?? 0}
          </p>
          <p className="text-[11px] text-emerald-600 flex items-center gap-1">
            <span>Active & receiving briefings</span>
          </p>
        </Link>

        <Link
          href="/admin/subscribers?status=UNSUBSCRIBED"
          className="rounded-lg border border-rule bg-white p-5 space-y-1 hover:border-navy-900/40 transition-all shadow-xs group"
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            Unsubscribed
          </p>
          <p className="font-serif text-3xl font-bold text-navy-900 group-hover:text-navy-800">
            {loading ? '...' : stats?.unsubscribed ?? 0}
          </p>
          <p className="text-[11px] text-muted">
            Opted out of future briefings
          </p>
        </Link>

        <Link
          href="/admin/subscribers?status=SUPPRESSED"
          className="rounded-lg border border-rule bg-white p-5 space-y-1 hover:border-navy-900/40 transition-all shadow-xs group"
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            Suppressed (Never Emailed)
          </p>
          <p className="font-serif text-3xl font-bold text-navy-900 group-hover:text-navy-800">
            {loading ? '...' : stats?.suppressed ?? 0}
          </p>
          <p className="text-[11px] text-amber-700">
            Hard bounces, spam complaints, manual locks
          </p>
        </Link>
      </div>

      {/* 2x2 Analytics & Control Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: New subscribers by month */}
        <section className="rounded-lg border border-rule bg-white p-5 space-y-4 shadow-xs">
          <h2 className="font-serif text-base font-bold text-navy-900 border-b border-rule pb-2">
            New Subscribers by Month
          </h2>
          <div className="space-y-3 pt-1">
            {(stats?.growth || []).map((g) => (
              <div key={g.label} className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-muted">
                  <span className="font-medium text-navy-900">{g.label}</span>
                  <span className="font-bold text-navy-900">{g.count}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-wash overflow-hidden">
                  <div
                    className="h-full bg-navy-900 rounded-full transition-all duration-500"
                    style={{ width: `${(g.count / maxGrowth) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Where subscribers came from */}
        <section className="rounded-lg border border-rule bg-white p-5 space-y-4 shadow-xs">
          <h2 className="font-serif text-base font-bold text-navy-900 border-b border-rule pb-2">
            Where Subscribers Came From
          </h2>
          <div className="space-y-3 pt-1">
            {Object.entries(stats?.sources || {}).length === 0 ? (
              <p className="text-xs text-muted py-4">No subscriber sources recorded yet.</p>
            ) : (
              Object.entries(stats?.sources || {})
                .sort((a, b) => b[1] - a[1])
                .map(([src, count]) => (
                  <div key={src} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between text-muted">
                      <span className="font-medium capitalize text-navy-900">{src}</span>
                      <span className="font-bold text-navy-900">{count}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-wash overflow-hidden">
                      <div
                        className="h-full bg-navy-800 rounded-full transition-all duration-500"
                        style={{ width: `${(count / totalSubscribers) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
            )}
          </div>
        </section>

        {/* Section 3: Suppression list */}
        <section className="rounded-lg border border-rule bg-white p-5 space-y-4 shadow-xs">
          <div className="border-b border-rule pb-2">
            <h2 className="font-serif text-base font-bold text-navy-900 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-navy-900" />
              <span>Suppression List</span>
            </h2>
            <p className="text-[11px] text-muted mt-1 leading-relaxed">
              Addresses that must never be emailed: hard bounces, complaints, or unsubscribe requests. Re-subscribing on the public site does not remove them.
            </p>
          </div>

          <form onSubmit={handleSuppress} className="flex gap-2">
            <input
              type="email"
              required
              placeholder="email@example.com"
              value={suppressInput}
              onChange={(e) => setSuppressInput(e.target.value)}
              className="flex-1 rounded border border-rule px-3 py-1.5 text-xs text-ink placeholder:text-muted focus:border-navy-900 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded bg-navy-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-navy-800 transition-colors shadow-xs"
            >
              Suppress
            </button>
          </form>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {!stats?.suppressedList?.length ? (
              <p className="text-xs text-muted py-2">No suppressed addresses recorded.</p>
            ) : (
              stats.suppressedList.map((item) => (
                <div
                  key={item._id || item.id}
                  className="flex items-center justify-between p-2 rounded border border-rule/70 bg-wash/30 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-navy-900 truncate">{item.email}</p>
                    <p className="text-[10px] text-muted">{item.suppressReason}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnsuppress(item._id || item.id || '', item.email)}
                    className="rounded border border-rule px-2 py-0.5 text-[11px] font-medium text-navy-900 hover:bg-wash transition-colors shrink-0"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
