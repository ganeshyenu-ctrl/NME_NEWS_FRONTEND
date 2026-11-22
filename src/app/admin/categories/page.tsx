'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import { api } from '@/lib/api';
import { Category } from '@/types';
import { useAppSelector } from '@/store/hooks';
import { Plus, Edit2, Trash2, ExternalLink, X, Check, Lock } from 'lucide-react';

export default function AdminCategoriesPage() {
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#0b1f3a');
  const [order, setOrder] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      if (res.data?.categories) {
        setCategories(res.data.categories);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setColor('#0b1f3a');
    setOrder(categories.length);
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setColor(cat.color || '#0b1f3a');
    setOrder(cat.order || 0);
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Category name is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        slug: slug.trim() || undefined,
        description,
        color,
        order: Number(order),
      };

      if (editingCategory) {
        await api.put(`/categories/${editingCategory._id}`, payload);
      } else {
        await api.post('/categories', payload);
      }

      setModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (confirm(`Delete category "${catName}"?`)) {
      try {
        await api.delete(`/categories/${id}`);
        fetchCategories();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete category');
      }
    }
  };

  if (currentUser && currentUser.role === 'contributor') {
    return (
      <>
        <AdminHeader title="Categories" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <div className="max-w-md w-full rounded-lg border border-rule bg-white p-8 text-center space-y-4 shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="font-serif text-xl font-bold text-navy-900">Access Restricted</h2>
            <p className="text-xs text-muted leading-relaxed">
              Managing news sectors and categories requires Editor or Administrator privileges. Your current role is{' '}
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
        title="Categories"
        actions={
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 rounded-md bg-navy-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-navy-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New Category</span>
          </button>
        }
      />

      <main className="flex-1 p-3 sm:p-6">
        <div className="rounded-lg border border-rule bg-white overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-rule bg-wash text-muted font-semibold">
              <tr>
                <th className="px-5 py-3 w-16">Order</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Public URL</th>
                <th className="px-5 py-3">Articles</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted">
                    Loading categories...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted italic">
                    No categories found.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat._id} className="hover:bg-wash/50 transition-colors">
                    <td className="px-5 py-3 font-mono font-medium text-navy-700">{cat.order}</td>
                    <td className="px-5 py-3 font-semibold text-navy-900">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        ></span>
                        <span>{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-muted">
                      <Link
                        href={`/category/${cat.slug}`}
                        target="_blank"
                        className="hover:underline hover:text-navy-900 inline-flex items-center gap-1"
                      >
                        <span>/category/{cat.slug}</span>
                        <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                      </Link>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap font-medium text-navy-900">
                      {cat.articleCount ?? 0}
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-1 text-navy-700 hover:text-navy-900"
                          title="Edit category"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat._id, cat.name)}
                          className="p-1 text-muted hover:text-signal"
                          title="Delete category"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/40 p-4">
            <div className="w-full max-w-md rounded-lg border border-rule bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-rule pb-3">
                <h3 className="font-serif text-lg font-bold text-navy-900">
                  {editingCategory ? 'Edit Category' : 'Create Category'}
                </h3>
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

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-navy-900 mb-1">Category Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Maritime Cybersecurity"
                    className="w-full rounded border border-rule px-3 py-2 text-xs text-ink focus:border-navy-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-navy-900 mb-1">
                    Slug (Auto-generated if empty)
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="maritime-cybersecurity"
                    className="w-full rounded border border-rule px-3 py-2 text-xs text-ink focus:border-navy-900 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-navy-900 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this editorial section..."
                    className="w-full rounded border border-rule px-3 py-2 text-xs text-ink focus:border-navy-900 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-navy-900 mb-1">Theme Color</label>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="h-8 w-full rounded border border-rule cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-navy-900 mb-1">Sort Order</label>
                    <input
                      type="number"
                      value={order}
                      onChange={(e) => setOrder(Number(e.target.value))}
                      className="w-full rounded border border-rule px-3 py-1.5 text-xs text-ink focus:border-navy-900 focus:outline-none"
                    />
                  </div>
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
                    {saving ? 'Saving...' : 'Save Category'}
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
