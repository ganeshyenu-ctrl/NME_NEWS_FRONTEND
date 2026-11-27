'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useAppSelector } from '@/store/hooks';
import { isSectionEditor } from '@/lib/rbac';
import {
  FileText,
  Clock,
  CheckCircle,
  Eye,
  Users,
  Activity,
  Plus,
  Flame,
  ArrowRight,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [mostRead, setMostRead] = useState<any[]>([]);
  const [upcomingScheduled, setUpcomingScheduled] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { liveEditorialEvents } = useAppSelector((state) => state.socket);
  const { user } = useAppSelector((state) => state.auth);
  const readOnlySectionEditor = isSectionEditor(user);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/articles/admin/stats');
        if (res.data?.success) {
          setStats(res.data.stats);
          setMostRead(res.data.mostRead || []);
          setUpcomingScheduled(res.data.upcomingScheduled || []);
          setRecentActivity(res.data.recentActivity || []);
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();

    // Join CRM socket room for real-time editorial updates
    const socket = getSocket();
    socket.emit('join_crm');

    socket.on('live_visitors_update', (data: { liveVisitors: number }) => {
      setStats((prev: any) => (prev ? { ...prev, liveVisitors: data.liveVisitors } : prev));
    });

    return () => {
      socket.off('live_visitors_update');
    };
  }, []);

  return (
    <>
      <AdminHeader
        title="Dashboard"
        actions={
          !readOnlySectionEditor ? (
            <Link
              href="/admin/articles/create"
              className="inline-flex items-center gap-1.5 rounded-md bg-navy-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-navy-800 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create Article</span>
            </Link>
          ) : undefined
        }
      />

      <main className="flex-1 p-3 sm:p-6 space-y-6 sm:space-y-8">
        {/* KPI Metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-lg border border-rule bg-white p-5">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Articles</span>
              <FileText className="h-4 w-4 text-navy-700" />
            </div>
            <div className="font-serif text-3xl font-bold text-navy-900">
              {stats?.totalArticles ?? '-'}
            </div>
            <p className="mt-1 text-[11px] text-muted">Across all news sections</p>
          </div>

          <div className="rounded-lg border border-rule bg-white p-5">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Published</span>
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="font-serif text-3xl font-bold text-emerald-900">
              {stats?.publishedCount ?? '-'}
            </div>
            <p className="mt-1 text-[11px] text-muted">Active on live wire</p>
          </div>

          <div className="rounded-lg border border-rule bg-white p-5">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Drafts & Scheduled</span>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div className="font-serif text-3xl font-bold text-navy-900">
              {(stats?.draftCount ?? 0) + (stats?.scheduledCount ?? 0)}
            </div>
            <p className="mt-1 text-[11px] text-muted">
              {stats?.draftCount ?? 0} in progress, {stats?.scheduledCount ?? 0} queued
            </p>
          </div>

          {/* Website Live Visitors & Real Reads */}
          {(() => {
            // Filter out old backend dummy numbers (142900, 38400) and compute real database views
            const calculatedViews = mostRead.reduce((acc, art) => acc + (art.views || 0), 0);
            const totalReads =
              stats?.pageViews && stats.pageViews !== 142900 && stats.pageViews !== 38400
                ? stats.pageViews
                : calculatedViews;

            return (
              <div className="rounded-lg border border-rule bg-white p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-muted mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Live Website Visitors</span>
                    <Users className="h-4 w-4 text-navy-700" />
                  </div>
                  <div className="flex items-baseline gap-2.5">
                    <div className="font-serif text-3xl font-bold text-navy-900">
                      {stats?.liveVisitors ?? 1}
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                      <span>Active Now</span>
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-rule/60 flex items-center justify-between text-[11px] text-muted">
                  <span className="font-medium text-navy-900">
                    {totalReads.toLocaleString()} total reads
                  </span>
                  <span>
                    {stats?.todayViews ?? 0} active today
                  </span>
                </div>
              </div>
            );
          })()}
        </section>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Most-Read Articles */}
          <section className="rounded-lg border border-rule bg-white p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-rule">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-signal" />
                <h2 className="font-serif text-lg font-bold text-navy-900">Most-Read Articles</h2>
              </div>
              <Link href="/admin/articles" className="text-xs font-semibold text-navy-700 hover:underline">
                View all
              </Link>
            </div>

            <div className="divide-y divide-rule">
              {mostRead.map((art, idx) => (
                <div key={art._id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-serif font-bold text-sm text-navy-100">0{idx + 1}</span>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/articles/${art._id}/edit`}
                        className="text-xs font-semibold text-navy-900 hover:underline truncate block"
                      >
                        {art.title}
                      </Link>
                      <span className="text-[11px] text-muted">
                        {art.category?.name || 'Maritime'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-navy-900">{art.views.toLocaleString()}</span>
                    <span className="block text-[10px] text-muted">reads</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Upcoming Scheduled Publications */}
          <section className="rounded-lg border border-rule bg-white p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-rule">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-navy-700" />
                <h2 className="font-serif text-lg font-bold text-navy-900">
                  Upcoming Scheduled Publications
                </h2>
              </div>
            </div>

            {upcomingScheduled.length === 0 ? (
              <p className="text-xs text-muted italic py-6 text-center">
                No articles queued for automated release.
              </p>
            ) : (
              <div className="divide-y divide-rule">
                {upcomingScheduled.map((art) => (
                  <div key={art._id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/articles/${art._id}/edit`}
                        className="text-xs font-semibold text-navy-900 hover:underline truncate block"
                      >
                        {art.title}
                      </Link>
                      <span className="text-[11px] text-muted">
                        Author: {art.author?.name || 'Staff'}
                      </span>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="inline-flex rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-medium text-amber-900">
                        {art.scheduledAt
                          ? new Date(art.scheduledAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Queued'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Live Editorial Activity Stream */}
        <section className="rounded-lg border border-rule bg-white p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-rule">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-navy-700 animate-pulse" />
              <h2 className="font-serif text-lg font-bold text-navy-900">
                Live Editorial Activity & Audit Stream
              </h2>
            </div>
            <Link href="/admin/audit-log" className="text-xs font-semibold text-navy-700 hover:underline">
              Full Audit Trail
            </Link>
          </div>

          <div className="space-y-3">
            {/* Live Socket Events First */}
            {liveEditorialEvents.map((evt, idx) => (
              <div
                key={`live-${idx}`}
                className="flex items-center justify-between gap-4 rounded-md bg-navy-50/70 p-3 text-xs border border-navy-100"
              >
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="font-semibold text-navy-900">{evt.user}</span>
                  <span className="text-muted">modified &quot;{evt.title}&quot;</span>
                </div>
                <span className="text-[11px] text-muted font-mono">Just now (Live Socket)</span>
              </div>
            ))}

            {recentActivity.map((act) => (
              <div
                key={act._id}
                className="flex items-center justify-between gap-4 p-2 text-xs border-b border-rule/50 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-[11px] text-navy-700">
                    [{act.action}]
                  </span>
                  <span className="text-ink">{act.description}</span>
                </div>
                <span className="text-[11px] text-muted shrink-0">
                  {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
