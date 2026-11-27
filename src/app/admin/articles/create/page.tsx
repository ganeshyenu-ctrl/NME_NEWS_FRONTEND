'use client';

import React from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import ArticleEditorForm from '@/components/admin/ArticleEditorForm';
import { useAppSelector } from '@/store/hooks';
import { isSectionEditor } from '@/lib/rbac';
import { ArrowLeft, Lock } from 'lucide-react';

export default function CreateArticlePage() {
  const { user } = useAppSelector((state) => state.auth);
  const readOnly = isSectionEditor(user);

  return (
    <>
      <AdminHeader
        title={readOnly ? 'Access Restricted' : 'Create Article'}
        actions={
          <Link
            href="/admin/articles"
            className="inline-flex items-center gap-1.5 rounded border border-rule px-3 py-1.5 text-xs font-semibold text-navy-900 hover:bg-wash"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Back to Articles</span>
          </Link>
        }
      />
      <main className="flex-1 p-3 sm:p-6">
        {readOnly ? (
          <div className="max-w-md mx-auto mt-12 rounded-lg border border-rule bg-white p-8 text-center space-y-4 shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-700">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="font-serif text-xl font-bold text-navy-900">View &amp; Analysis Only</h2>
            <p className="text-xs text-muted leading-relaxed">
              Section Editors have read-only access to review articles and analytics, and cannot create or modify articles.
            </p>
            <Link
              href="/admin/articles"
              className="inline-block rounded-md bg-navy-900 px-4 py-2 text-xs font-semibold text-white hover:bg-navy-800 transition-colors"
            >
              View Articles
            </Link>
          </div>
        ) : (
          <ArticleEditorForm />
        )}
      </main>
    </>
  );
}
