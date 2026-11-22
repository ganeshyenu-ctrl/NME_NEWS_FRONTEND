'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import { api } from '@/lib/api';
import { PlatformSettings } from '@/types';
import { useAppSelector } from '@/store/hooks';
import { Save, CheckCircle2, AlertCircle, Lock } from 'lucide-react';

export default function AdminSettingsPage() {
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const [settings, setSettings] = useState<PlatformSettings>({
    publicationName: 'NME',
    tagline: 'Independent Perspectives. Informed Maritime Decisions.',
    contactEmail: 'editor@nme.local',
    linkedinUrl: 'https://www.linkedin.com/company/navigating-marine-excellence',
    aboutText: '',
    termsText: '',
    privacyText: '',
    maintenanceMode: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data?.settings) {
          setSettings(res.data.settings);
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSaving(true);
    try {
      const res = await api.put('/settings', settings);
      if (res.data?.success) {
        setFeedback({ type: 'success', message: 'Platform settings saved and applied.' });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update settings',
      });
    } finally {
      setSaving(false);
    }
  };

  if (currentUser && currentUser.role !== 'admin') {
    return (
      <>
        <AdminHeader title="Platform Settings" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <div className="max-w-md w-full rounded-lg border border-rule bg-white p-8 text-center space-y-4 shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="font-serif text-xl font-bold text-navy-900">Access Restricted</h2>
            <p className="text-xs text-muted leading-relaxed">
              Platform settings management requires Administrator privileges. Your current role is{' '}
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
      <AdminHeader title="Platform Settings" />

      <main className="flex-1 p-3 sm:p-6 max-w-4xl">
        {feedback && (
          <div
            className={`flex items-center gap-2 rounded-md p-3 text-xs mb-6 ${
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

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Publication Identity */}
          <section className="rounded-lg border border-rule bg-white p-6 space-y-4">
            <h2 className="font-serif text-lg font-bold text-navy-900 border-b border-rule pb-2">
              Publication Identity
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-navy-900 mb-1">Publication Name</label>
                <input
                  type="text"
                  required
                  value={settings.publicationName}
                  onChange={(e) => setSettings({ ...settings, publicationName: e.target.value })}
                  className="w-full rounded border border-rule px-3 py-2 text-ink focus:border-navy-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy-900 mb-1">Contact Email</label>
                <input
                  type="email"
                  required
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  className="w-full rounded border border-rule px-3 py-2 text-ink focus:border-navy-900 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-navy-900 mb-1">Publication Tagline</label>
                <input
                  type="text"
                  value={settings.tagline}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  className="w-full rounded border border-rule px-3 py-2 text-ink focus:border-navy-900 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-navy-900 mb-1">LinkedIn Company URL</label>
                <input
                  type="url"
                  value={settings.linkedinUrl}
                  onChange={(e) => setSettings({ ...settings, linkedinUrl: e.target.value })}
                  className="w-full rounded border border-rule px-3 py-2 text-ink focus:border-navy-900 focus:outline-none font-mono"
                />
              </div>
            </div>
          </section>

          {/* Static Pages Content */}
          <section className="rounded-lg border border-rule bg-white p-6 space-y-4 text-xs">
            <h2 className="font-serif text-lg font-bold text-navy-900 border-b border-rule pb-2">
              Editorial Policy & Statements
            </h2>

            <div>
              <label className="block font-semibold text-navy-900 mb-1">About the Publication</label>
              <textarea
                rows={4}
                value={settings.aboutText}
                onChange={(e) => setSettings({ ...settings, aboutText: e.target.value })}
                className="w-full rounded border border-rule p-3 text-ink focus:border-navy-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-navy-900 mb-1">Terms of Service</label>
              <textarea
                rows={3}
                value={settings.termsText}
                onChange={(e) => setSettings({ ...settings, termsText: e.target.value })}
                className="w-full rounded border border-rule p-3 text-ink focus:border-navy-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-navy-900 mb-1">Privacy Notice</label>
              <textarea
                rows={3}
                value={settings.privacyText}
                onChange={(e) => setSettings({ ...settings, privacyText: e.target.value })}
                className="w-full rounded border border-rule p-3 text-ink focus:border-navy-900 focus:outline-none"
              />
            </div>
          </section>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-navy-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-navy-800 disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </form>
      </main>
    </>
  );
}
