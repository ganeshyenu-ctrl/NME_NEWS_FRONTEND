'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import { api } from '@/lib/api';
import { PlatformSettings, User } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSettings as setReduxSettings } from '@/store/slices/settingsSlice';
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  UserCheck,
  RefreshCw,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const dispatch = useAppDispatch();
  const { user: currentUser } = useAppSelector((state) => state.auth);

  // General Settings State
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

  // Direct Staff/User Password Reset (Forgot Password Recovery)
  const [usersList, setUsersList] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [targetNewPassword, setTargetNewPassword] = useState('');
  const [showTargetPassword, setShowTargetPassword] = useState(false);
  const [targetPassSaving, setTargetPassSaving] = useState(false);
  const [targetPassFeedback, setTargetPassFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [settingsRes, usersRes] = await Promise.all([
          api.get('/settings').catch(() => null),
          api.get('/users').catch(() => null),
        ]);

        if (settingsRes?.data?.settings) {
          setSettings(settingsRes.data.settings);
        }
        if (usersRes?.data?.users) {
          setUsersList(usersRes.data.users);
          if (usersRes.data.users.length > 0) {
            setSelectedUserId(usersRes.data.users[0]._id || usersRes.data.users[0].id || '');
          }
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Save General Platform Settings
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSaving(true);
    try {
      const res = await api.put('/settings', settings);
      if (res.data?.success) {
        if (res.data.settings) {
          dispatch(setReduxSettings(res.data.settings));
        }
        setFeedback({ type: 'success', message: 'Platform settings saved and applied across all public pages.' });
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


  // Direct Staff/User Password Reset (Forgot Password Recovery)
  const handleDirectUserPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setTargetPassFeedback(null);

    if (!selectedUserId) {
      setTargetPassFeedback({ type: 'error', message: 'Please select a user account to reset.' });
      return;
    }

    if (!targetNewPassword || targetNewPassword.length < 8) {
      setTargetPassFeedback({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }

    setTargetPassSaving(true);
    try {
      const targetUser = usersList.find((u) => (u._id || u.id) === selectedUserId);
      const res = await api.post('/users/reset-password', {
        userId: selectedUserId,
        newPassword: targetNewPassword,
      });

      if (res.data?.success) {
        setTargetPassFeedback({
          type: 'success',
          message: `Password for ${targetUser ? targetUser.email : 'selected user'} has been directly reset.`,
        });
        setTargetNewPassword('');
      }
    } catch (err: any) {
      setTargetPassFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to reset user password',
      });
    } finally {
      setTargetPassSaving(false);
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

      <main className="flex-1 p-3 sm:p-6 max-w-4xl space-y-8">
        {/* ========================================================================= */}
        {/* SECTION 1: DIRECT STAFF PASSWORD RESET (FORGOT PASSWORD RECOVERY)         */}
        {/* ========================================================================= */}
        <section className="rounded-lg border border-navy-200 bg-white p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-rule pb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-navy-900 text-white flex items-center justify-center shrink-0">
                <KeyRound className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-bold text-navy-900 leading-tight">
                  Staff Password Recovery & Reset
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Forgot password recovery: Assign a new password directly to any staff account without email links.
                </p>
              </div>
            </div>

            <Link
              href="/admin/profile"
              className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-md border border-navy-900/20 bg-navy-50/50 hover:bg-navy-100/70 px-3 py-1.5 text-xs font-semibold text-navy-900 transition-colors"
            >
              <span>Change My Password in Profile</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>

          <div className="max-w-xl">
            <div className="rounded-lg border border-rule/80 bg-wash/40 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-navy-900" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900">
                  Direct Reset Any User Password
                </h3>
              </div>

              {targetPassFeedback && (
                <div
                  className={`flex items-start gap-2 rounded-md p-2.5 text-xs ${
                    targetPassFeedback.type === 'success'
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
                      : 'border border-red-200 bg-red-50 text-red-900'
                  }`}
                >
                  {targetPassFeedback.type === 'success' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <span>{targetPassFeedback.message}</span>
                </div>
              )}

              <form onSubmit={handleDirectUserPasswordReset} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-navy-900 mb-1">Select User Account</label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full rounded border border-rule px-3 py-2 text-ink focus:border-navy-900 focus:outline-none bg-white text-xs"
                  >
                    {usersList.map((u) => (
                      <option key={u._id || u.id} value={u._id || u.id}>
                        {u.name} — {u.email} ({u.role.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-navy-900">Assign New Password</label>
                    <button
                      type="button"
                      onClick={() => setShowTargetPassword(!showTargetPassword)}
                      className="text-[11px] text-gray-500 hover:text-navy-900 flex items-center gap-1"
                    >
                      {showTargetPassword ? (
                        <>
                          <EyeOff className="h-3 w-3" />
                          <span>Hide</span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3" />
                          <span>Show</span>
                        </>
                      )}
                    </button>
                  </div>
                  <input
                    type={showTargetPassword ? 'text' : 'password'}
                    required
                    placeholder="Minimum 8 characters"
                    value={targetNewPassword}
                    onChange={(e) => setTargetNewPassword(e.target.value)}
                    className="w-full rounded border border-rule px-3 py-2 text-ink focus:border-navy-900 focus:outline-none bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={targetPassSaving}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-navy-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-navy-800 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>{targetPassSaving ? 'Resetting Password...' : 'Directly Reset User Password'}</span>
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: GENERAL PUBLICATION IDENTITY & EDITORIAL SETTINGS              */}
        {/* ========================================================================= */}
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
            className="inline-flex items-center gap-2 rounded-md bg-navy-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-navy-800 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </form>
      </main>
    </>
  );
}
