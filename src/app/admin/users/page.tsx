'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import { api } from '@/lib/api';
import { User } from '@/types';
import { useAppSelector } from '@/store/hooks';
import CustomSelect from '@/components/ui/CustomSelect';
import { Plus, UserPlus, Shield, X, Trash2, Edit2, Lock } from 'lucide-react';

export default function AdminUsersPage() {
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'editor' | 'contributor'>('contributor');
  const [canPublish, setCanPublish] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      if (res.data?.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateModal = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('contributor');
    setCanPublish(false);
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleRoleChange = (newRole: 'admin' | 'editor' | 'contributor') => {
    setRole(newRole);
    if (newRole === 'admin' || newRole === 'editor') {
      setCanPublish(true);
    } else {
      setCanPublish(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !email.trim() || !password) {
      setErrorMsg('All fields are required.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/users', {
        name,
        email,
        password,
        role,
        canPublish,
      });

      setModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (id: string, userEmail: string) => {
    if (confirm(`Revoke and permanently delete user account ${userEmail}?`)) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  if (currentUser && currentUser.role !== 'admin') {
    return (
      <>
        <AdminHeader title="Staff & RBAC" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <div className="max-w-md w-full rounded-lg border border-rule bg-white p-8 text-center space-y-4 shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="font-serif text-xl font-bold text-navy-900">Access Restricted</h2>
            <p className="text-xs text-muted leading-relaxed">
              This staff administration portal requires Administrator privileges. Your current role is{' '}
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
      <AdminHeader
        title="Users & Roles"
        actions={
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 rounded-md bg-navy-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-navy-800 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Staff Member</span>
          </button>
        }
      />

      <main className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div className="rounded-lg border border-rule bg-white overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-rule bg-wash text-muted font-semibold">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Can publish</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Last sign-in</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted">
                    Loading staff directory...
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrent = u.email === currentUser?.email;
                  return (
                    <tr key={u._id || u.id} className="hover:bg-wash/50 transition-colors">
                      <td className="px-5 py-3 font-semibold text-navy-900 flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-navy-100 flex items-center justify-center font-bold text-navy-900 text-[10px]">
                          {u.name[0]}
                        </div>
                        <span>{u.name}</span>
                        {isCurrent && (
                          <span className="rounded bg-navy-100 px-1.5 py-0.2 text-[10px] text-navy-900 font-normal">
                            You
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 font-mono text-muted">{u.email}</td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className="rounded bg-navy-50 border border-navy-100 px-2 py-0.5 text-[11px] font-medium text-navy-700 capitalize">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        {u.canPublish ? (
                          <span className="text-emerald-700 font-semibold">Yes</span>
                        ) : (
                          <span className="text-muted">No</span>
                        )}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium ${
                            u.status === 'active'
                              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                              : 'bg-red-50 text-red-900 border border-red-200'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              u.status === 'active' ? 'bg-emerald-600' : 'bg-red-600'
                            }`}
                          ></span>
                          <span className="capitalize">{u.status}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted text-[11px]">
                        {u.lastLogin
                          ? new Date(u.lastLogin).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Never'}
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        {!isCurrent && (
                          <button
                            onClick={() => handleDeleteUser(u._id || u.id, u.email)}
                            className="p-1 text-muted hover:text-signal"
                            title="Delete user"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/40 p-4">
            <div className="w-full max-w-md rounded-lg border border-rule bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-rule pb-3">
                <h3 className="font-serif text-lg font-bold text-navy-900">Add Staff Account</h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-muted hover:text-navy-900 p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {errorMsg && (
                <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-900">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-navy-900 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. David Sterling"
                    className="w-full rounded border border-rule px-3 py-2 text-xs text-ink focus:border-navy-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-navy-900 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="david@nme.local"
                    className="w-full rounded border border-rule px-3 py-2 text-xs text-ink focus:border-navy-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-navy-900 mb-1">Temporary Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full rounded border border-rule px-3 py-2 text-xs text-ink focus:border-navy-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-navy-900 mb-1">Role (RBAC)</label>
                  <CustomSelect
                    value={role}
                    onChange={(val) => handleRoleChange(val as any)}
                    options={[
                      {
                        value: 'contributor',
                        label: 'Contributor',
                        description: 'Can draft articles; submits for editorial approval',
                        badge: 'Draft only',
                        badgeColor: 'bg-rule/60 text-ink',
                      },
                      {
                        value: 'editor',
                        label: 'Editor',
                        description: 'Can create, edit, approve, publish articles & manage media',
                        badge: 'Editorial',
                        badgeColor: 'bg-navy-100 text-navy-900',
                      },
                      {
                        value: 'admin',
                        label: 'Administrator',
                        description: 'Full system control, staff management, settings & audit logs',
                        badge: 'Full Access',
                        badgeColor: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
                      },
                    ]}
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-rule">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded border border-rule px-3 py-1.5 text-xs font-semibold text-muted hover:bg-wash"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded bg-navy-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
                  >
                    {saving ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
