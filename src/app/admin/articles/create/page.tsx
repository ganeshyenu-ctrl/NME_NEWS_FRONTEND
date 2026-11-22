'use client';

import React from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import ArticleEditorForm from '@/components/admin/ArticleEditorForm';
import { ArrowLeft } from 'lucide-react';

export default function CreateArticlePage() {
  return (
    <>
      <AdminHeader
        title="Create Article"
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
        <ArticleEditorForm />
      </main>
    </>
  );
}
