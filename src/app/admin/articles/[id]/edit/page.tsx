'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AdminHeader from '@/components/admin/AdminHeader';
import ArticleEditorForm from '@/components/admin/ArticleEditorForm';
import { api } from '@/lib/api';
import { Article } from '@/types';
import { ArrowLeft, ExternalLink } from 'lucide-react';

export default function EditArticlePage() {
  const params = useParams();
  const id = params.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        // Fetch from admin articles list
        const res = await api.get('/articles/admin/list');
        if (res.data?.articles) {
          const found = res.data.articles.find((a: Article) => a._id === id);
          if (found) {
            setArticle(found);
          }
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchArticle();
    }
  }, [id]);

  return (
    <>
      <AdminHeader
        title="Edit Article"
        actions={
          <div className="flex items-center gap-2">
            {article?.status === 'published' && (
              <Link
                href={`/articles/${article.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded border border-rule px-3 py-1.5 text-xs font-semibold text-navy-900 hover:bg-wash"
              >
                <ExternalLink className="h-3 w-3" />
                <span>View Live</span>
              </Link>
            )}
            <Link
              href="/admin/articles"
              className="inline-flex items-center gap-1.5 rounded border border-rule px-3 py-1.5 text-xs font-semibold text-navy-900 hover:bg-wash"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Back</span>
            </Link>
          </div>
        }
      />
      <main className="flex-1 p-3 sm:p-6">
        {loading ? (
          <div className="py-20 text-center text-muted">Loading article data...</div>
        ) : article ? (
          <ArticleEditorForm initialArticle={article} isEditMode={true} />
        ) : (
          <div className="py-20 text-center text-muted">Article not found.</div>
        )}
      </main>
    </>
  );
}
