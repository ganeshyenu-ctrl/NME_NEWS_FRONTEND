'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import { api } from '@/lib/api';
import { AuditLogItem } from '@/types';
import { useAppSelector } from '@/store/hooks';
import CustomSelect from '@/components/ui/CustomSelect';
import { ShieldAlert, Filter, CheckCircle2, AlertTriangle, XCircle, Lock } from 'lucide-react';

export default function AdminAuditLogPage() {
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit', {
        params: {
          action: actionFilter.trim() || undefined,
          status: statusFilter || undefined,
          limit: 30,
        },
      });
      if (res.data?.success) {
        setLogs(res.data.logs);
        setTotal(res.data.total);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [statusFilter]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  if (currentUser && currentUser.role !== 'admin') {
    return (
      <>
        <AdminHeader title="Security & Audit Logs" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <div className="max-w-md w-full rounded-lg border border-rule bg-white p-8 text-center space-y-4 shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="font-serif text-xl font-bold text-navy-900">Access Restricted</h2>
            <p className="text-xs text-muted leading-relaxed">
              Viewing cybersecurity audit logs requires Administrator privileges. Your current role is{' '}
              <span className="font-semibold uppercase text-navy-900">{currentUser.role}</span>.
            </p>
            <Link
              href="/admin"
              className="inline-block rounded-md bg-navy-900 px-4 py-2 text-xs font-semibold text-white hover:bg-navy-800 transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AdminHeader title="Security & Audit Logs" />

      <main className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-lg border border-rule">
          <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              placeholder="Filter by action (e.g. auth, article, security)..."
              className="w-64 rounded border border-rule px-3 py-1.5 text-xs text-ink focus:border-navy-900 focus:outline-none"
            />

            <div className="w-48">
              <CustomSelect
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                placeholder="All Statuses"
                options={[
                  { value: '', label: 'All Statuses' },
                  {
                    value: 'success',
                    label: 'Success',
                    badge: 'Normal',
                    badgeColor: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
                  },
                  {
                    value: 'failure',
                    label: 'Failure / Attack Blocked',
                    badge: 'Security',
                    badgeColor: 'bg-rose-100 text-rose-900 border border-rose-200',
                  },
                  {
                    value: 'warning',
                    label: 'Warning',
                    badge: 'Alert',
                    badgeColor: 'bg-amber-100 text-amber-900 border border-amber-200',
                  },
                ]}
              />
            </div>

            <button
              type="submit"
              className="rounded-md bg-navy-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-navy-800"
            >
              Apply Filter
            </button>
          </form>

          <div className="text-xs text-muted">
            Total Recorded Events: <span className="font-semibold text-navy-900">{total}</span>
          </div>
        </div>

        {/* Logs Table */}
        <div className="rounded-lg border border-rule bg-white overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-rule bg-wash text-muted font-semibold">
              <tr>
                <th className="px-5 py-3 whitespace-nowrap">When</th>
                <th className="px-5 py-3">Who</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3 whitespace-nowrap">IP address</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted font-sans text-xs">
                    Loading security audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted italic font-sans text-xs">
                    No audit records matching your criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-wash/50 transition-colors">
                    <td className="px-5 py-3 text-muted whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3 font-semibold text-navy-900">{log.userEmail}</td>
                    <td className="px-5 py-3 text-navy-700 font-bold">{log.action}</td>
                    <td className="px-5 py-3 font-sans text-xs text-ink max-w-md">{log.description}</td>
                    <td className="px-5 py-3 text-muted">{log.ipAddress}</td>
                    <td className="px-5 py-3 whitespace-nowrap font-sans">
                      {log.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-medium text-emerald-900">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Success
                        </span>
                      ) : log.status === 'failure' ? (
                        <span className="inline-flex items-center gap-1 rounded bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-medium text-red-900">
                          <XCircle className="h-3 w-3 text-red-600" />
                          Blocked / Fail
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-medium text-amber-900">
                          <AlertTriangle className="h-3 w-3 text-amber-600" />
                          Warning
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
