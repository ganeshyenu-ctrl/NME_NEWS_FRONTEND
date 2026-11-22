'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '@/components/website/Header';
import Footer from '@/components/website/Footer';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchPublicArticles } from '@/store/slices/articlesSlice';
import { ArrowLeft } from 'lucide-react';

export default function CategoryDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const dispatch = useAppDispatch();

  const { articles, total, loading } = useAppSelector((state) => state.articles);
  const { categories } = useAppSelector((state) => state.categories);

  const category = categories.find((c) => c.slug === slug);

  useEffect(() => {
    if (slug) {
      dispatch(fetchPublicArticles({ category: slug, limit: 15 }));
    }
  }, [slug, dispatch]);

  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        {/* Category Header */}
        <section className="border-b border-rule bg-wash py-10">
          <div className="mx-auto max-w-6xl px-5">
            <div className="mb-2">
              <Link href="/news" className="inline-flex items-center gap-1 text-xs text-muted hover:text-navy-900">
                <ArrowLeft className="h-3 w-3" />
                <span>All Sections</span>
              </Link>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-navy-900 capitalize">
              {category?.name || slug.replace(/-/g, ' ')}
            </h1>
            <p className="mt-2 text-sm text-muted max-w-2xl">
              {category?.description ||
                'Comprehensive reporting, structural trends, and operational analysis within this maritime sector.'}
            </p>
          </div>
        </section>

        {/* Category Articles */}
        <section className="mx-auto max-w-6xl px-5 py-10">
          <div className="text-xs text-muted mb-6">
            Showing <span className="font-semibold text-navy-900">{total}</span> stories in this section
          </div>

          {loading ? (
            <div className="py-20 text-center text-muted">Loading sector dispatches...</div>
          ) : articles.length === 0 ? (
            <div className="rounded-lg border border-dashed border-rule p-12 text-center text-muted text-sm">
              No published dispatches in this category yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((art) => (
                <article key={art._id} className="border border-rule rounded-lg overflow-hidden bg-white flex flex-col justify-between hover:shadow-sm transition-shadow">
                  <div>
                    {art.featuredImage?.url && (
                      <Link href={`/articles/${art.slug}`} className="block overflow-hidden bg-wash">
                        <div className="aspect-[16/9] w-full overflow-hidden">
                          <img
                            src={art.featuredImage.url}
                            alt={art.title}
                            className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      </Link>
                    )}
                    <div className="p-5">
                      <h3 className="font-serif text-lg font-bold text-navy-900 leading-snug">
                        <Link href={`/articles/${art.slug}`} className="hover:underline">
                          {art.title}
                        </Link>
                      </h3>
                      {art.subtitle && (
                        <p className="mt-2 text-xs text-muted line-clamp-3 leading-relaxed">
                          {art.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-rule/60 p-5 pt-3 flex items-center justify-between text-[11px] text-muted">
                    <span>{art.authorName || 'Staff'}</span>
                    <span>{art.readTime}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
