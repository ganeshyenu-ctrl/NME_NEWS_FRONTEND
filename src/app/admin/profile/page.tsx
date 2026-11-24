'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateUserSession } from '@/store/slices/authSlice';
import { api } from '@/lib/api';
import {
  User,
  Mail,
  Shield,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
  Upload,
  Calendar,
  Clock,
  FileText,
  SquarePen,
  Camera,
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
];

export default function AdminProfilePage() {
  const dispatch = useAppDispatch();
  const { user: currentUser } = useAppSelector((state) => state.auth);

  // Profile Form State
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Image Upload State
  const [uploadingImage, setUploadingImage] = useState(false);

  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Article Count State
  const [authoredCount, setAuthoredCount] = useState<number | null>(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setAvatar(currentUser.avatar || '');
      setBio(currentUser.bio || '');
    }

    // Fetch user's authored articles count
    const fetchUserStats = async () => {
      try {
        const res = await api.get('/articles', { params: { limit: 1 } });
        if (res.data?.total !== undefined) {
          setAuthoredCount(res.data.total);
        }
      } catch {}
    };
    fetchUserStats();
  }, [currentUser]);

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileFeedback(null);

    if (!name.trim()) {
      setProfileFeedback({ type: 'error', message: 'Name cannot be empty.' });
      return;
    }

    setProfileSaving(true);
    try {
      const res = await api.put('/auth/profile', {
        name,
        avatar,
        bio,
      });

      if (res.data?.success) {
        dispatch(updateUserSession(res.data.user));
        setProfileFeedback({
          type: 'success',
          message: 'Profile details updated successfully.',
        });
      }
    } catch (err: any) {
      setProfileFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update profile.',
      });
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle Avatar Image File Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingImage(true);
    setProfileFeedback(null);
    try {
      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.media?.url) {
        setAvatar(res.data.media.url);
        setProfileFeedback({
          type: 'success',
          message: 'Avatar uploaded to Cloudinary! Click "Save Profile Changes" to apply.',
        });
      }
    } catch (err: any) {
      setProfileFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to upload image.',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle Direct Password Update
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (!newPassword || newPassword.length < 8) {
      setPasswordFeedback({ type: 'error', message: 'Password must be at least 8 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await api.post('/auth/change-password', {
        newPassword,
      });

      if (res.data?.success) {
        setPasswordFeedback({
          type: 'success',
          message: 'Your password has been successfully updated.',
        });
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPasswordFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update password.',
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  const roleBadgeColors: Record<string, string> = {
    admin: 'bg-navy-900 text-white',
    editor: 'bg-blue-800 text-white',
    contributor: 'bg-gray-800 text-white',
  };

  return (
    <>
      <AdminHeader title="My Profile & Staff Credentials" />

      <main className="flex-1 p-3 sm:p-6 max-w-4xl space-y-6">
        {/* ========================================================================= */}
        {/* TOP IDENTITY HERO CARD                                                    */}
        {/* ========================================================================= */}
        <section className="rounded-lg border border-rule bg-white p-6 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar Display */}
          <div className="relative group shrink-0">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-2 border-navy-900 overflow-hidden bg-navy-950 flex items-center justify-center text-white text-3xl font-bold font-serif shadow-sm">
              {avatar ? (
                <img src={avatar} alt={name || 'Avatar'} className="h-full w-full object-cover" />
              ) : (
                <span>{(name || currentUser?.name || 'A')[0]}</span>
              )}
            </div>
            <label
              htmlFor="avatar-file-upload"
              className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-navy-900 text-white flex items-center justify-center cursor-pointer shadow hover:bg-navy-800 transition-colors"
              title="Upload profile picture"
            >
              <Camera className="h-3.5 w-3.5" />
            </label>
            <input
              id="avatar-file-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Details */}
          <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="font-serif text-2xl font-bold text-navy-900 truncate">
                {name || currentUser?.name || 'Staff Member'}
              </h2>
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                  roleBadgeColors[currentUser?.role || 'contributor']
                }`}
              >
                {currentUser?.role || 'contributor'}
              </span>
              {currentUser?.canPublish ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Wire Authorized</span>
                </span>
              ) : (
                <span className="text-[10px] font-medium text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded">
                  Drafting Contributor
                </span>
              )}
            </div>

            <p className="text-xs text-muted flex items-center justify-center sm:justify-start gap-1.5 font-mono">
              <Mail className="h-3.5 w-3.5" />
              <span>{currentUser?.email}</span>
            </p>

            {bio && <p className="text-xs text-ink/80 italic max-w-xl">{bio}</p>}

            {/* Account meta */}
            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-[11px] text-muted border-t border-rule/60">
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-navy-700" />
                <span>
                  Last Login:{' '}
                  {currentUser?.lastLogin
                    ? new Date(currentUser.lastLogin).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Active Session'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 text-navy-700" />
                <span>Wire Stories: {authoredCount !== null ? authoredCount : 'Active'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* EDIT PROFILE DETAILS FORM                                                 */}
        {/* ========================================================================= */}
        <section className="rounded-lg border border-rule bg-white p-6 shadow-xs space-y-4">
          <div className="border-b border-rule pb-2">
            <h3 className="font-serif text-lg font-bold text-navy-900">Personal Information</h3>
            <p className="text-xs text-muted">Update your display name, editorial beat, and profile avatar.</p>
          </div>

          {profileFeedback && (
            <div
              className={`flex items-start gap-2 rounded-md p-3 text-xs ${
                profileFeedback.type === 'success'
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border border-red-200 bg-red-50 text-red-900'
              }`}
            >
              {profileFeedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <span>{profileFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-navy-900 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Captain Marcus Vance"
                  className="w-full rounded border border-rule px-3 py-2 text-ink focus:border-navy-900 focus:outline-none bg-white text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy-900 mb-1">Account Email Address</label>
                <input
                  type="email"
                  disabled
                  value={currentUser?.email || ''}
                  className="w-full rounded border border-rule/70 px-3 py-2 text-muted bg-wash cursor-not-allowed text-xs font-mono"
                />
                <span className="text-[10px] text-muted mt-0.5 block">Managed via Staff Accounts.</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-navy-900 mb-1">Editorial Beat / Bio</label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. Senior Offshore Energy & Maritime Decarbonisation Analyst. Reporting on clean maritime fuels and fleet sustainability."
                className="w-full rounded border border-rule p-3 text-ink focus:border-navy-900 focus:outline-none text-xs"
              />
            </div>

            {/* Avatar URL & Presets */}
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Avatar Image URL or Cloudinary Upload</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://images.unsplash.com/... or upload via camera icon"
                  className="flex-1 rounded border border-rule px-3 py-2 text-ink focus:border-navy-900 focus:outline-none text-xs font-mono"
                />
                <label
                  htmlFor="avatar-file-upload-button"
                  className="inline-flex items-center gap-1.5 rounded border border-rule bg-wash px-3 py-2 text-xs font-semibold text-navy-900 hover:bg-white transition-colors cursor-pointer shrink-0"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>{uploadingImage ? 'Uploading...' : 'Upload File'}</span>
                </label>
                <input
                  id="avatar-file-upload-button"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Preset quick avatars */}
              <div className="mt-2.5 flex items-center gap-2">
                <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Presets:</span>
                <div className="flex items-center gap-2">
                  {PRESET_AVATARS.map((presetUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(presetUrl)}
                      className={`h-7 w-7 rounded-full overflow-hidden border-2 transition-transform hover:scale-105 ${
                        avatar === presetUrl ? 'border-navy-900 ring-2 ring-navy-900/20' : 'border-rule'
                      }`}
                      title={`Select Preset Avatar ${idx + 1}`}
                    >
                      <img src={presetUrl} alt="Preset" className="h-full w-full object-cover" />
                    </button>
                  ))}
                  {avatar && (
                    <button
                      type="button"
                      onClick={() => setAvatar('')}
                      className="text-[10px] text-red-600 hover:underline ml-1"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              className="inline-flex items-center gap-2 rounded-md bg-navy-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-navy-800 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        </section>

        {/* ========================================================================= */}
        {/* DIRECT PASSWORD CHANGE PANEL                                              */}
        {/* ========================================================================= */}
        <section className="rounded-lg border border-rule bg-white p-6 shadow-xs space-y-4">
          <div className="border-b border-rule pb-2 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-navy-900" />
            <div>
              <h3 className="font-serif text-lg font-bold text-navy-900">Change Account Password</h3>
              <p className="text-xs text-muted">Directly update your account login credentials without email OTP.</p>
            </div>
          </div>

          {passwordFeedback && (
            <div
              className={`flex items-start gap-2 rounded-md p-3 text-xs ${
                passwordFeedback.type === 'success'
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border border-red-200 bg-red-50 text-red-900'
              }`}
            >
              {passwordFeedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <span>{passwordFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs max-w-lg">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-navy-900">New Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-gray-500 hover:text-navy-900 flex items-center gap-1"
                >
                  {showPassword ? (
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
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Minimum 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded border border-rule px-3 py-2 text-ink focus:border-navy-900 focus:outline-none bg-white text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-navy-900 mb-1">Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded border border-rule px-3 py-2 text-ink focus:border-navy-900 focus:outline-none bg-white text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={passwordSaving}
              className="inline-flex items-center gap-2 rounded-md bg-navy-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-navy-800 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>{passwordSaving ? 'Updating Password...' : 'Update Password'}</span>
            </button>
          </form>
        </section>

        {/* ========================================================================= */}
        {/* QUICK NAVIGATION / SHORTCUTS                                              */}
        {/* ========================================================================= */}
        <section className="rounded-lg border border-rule bg-wash/30 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-semibold text-navy-900 text-xs">Editorial Quick Actions</h4>
            <p className="text-[11px] text-muted">Draft a new dispatch or review all wire stories.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/articles/create"
              className="inline-flex items-center gap-1.5 rounded-md bg-navy-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-navy-800 transition-colors"
            >
              <SquarePen className="h-3.5 w-3.5" />
              <span>Create Article</span>
            </Link>
            <Link
              href="/admin/articles"
              className="inline-flex items-center gap-1.5 rounded-md border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-navy-900 hover:bg-wash transition-colors"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Articles Manager</span>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
