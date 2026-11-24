'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/website/Header';
import Footer from '@/components/website/Footer';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchPublicArticles } from '@/store/slices/articlesSlice';
import CustomSelect from '@/components/ui/CustomSelect';
import { Search, SlidersHorizontal, ArrowLeft, ArrowRight } from 'lucide-react';

function NewsListingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const queryCategory = searchParams.get('category') || '';
  const querySearch = searchParams.get('q') || '';
  const querySort = searchParams.get('sort') || 'newest';
  const queryPage = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(querySearch);
  const { articles, total, page, totalPages, loading } = useAppSelector((state) => state.articles);
  const { categories } = useAppSelector((state) => state.categories);

  useEffect(() => {
    dispatch(
      fetchPublicArticles({
        category: queryCategory,
        search: querySearch,
        sort: querySort,
        page: queryPage,
        limit: 12,
      })
    );
  }, [queryCategory, querySearch, querySort, queryPage, dispatch]);

  const updateFilters = (newParams: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([k, v]) => {
      if (v) {
        params.set(k, v.toString());
      } else {
        params.delete(k);
      }
    });
    router.push(`/news?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchInput, page: 1 });
  };

  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        {/* Page Title & Search Bar */}
        <section className="border-b border-rule bg-wash py-8">
          <div className="mx-auto max-w-6xl px-5">
            <h1 className="font-serif text-3xl font-bold text-navy-900 mb-2">Latest Maritime Wire</h1>
            <p className="text-sm text-muted mb-6">
              Search comprehensive fleet intelligence, decarbonisation dispatches, and regulatory updates.
            </p>

            <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-xl">
              <div className="relative flex-1">
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search articles, keywords, topics..."
                  className="w-full rounded-md border border-rule bg-white py-2 pl-3 pr-8 text-sm focus:border-navy-900 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="rounded-md bg-navy-900 px-4 py-2 text-xs font-semibold text-white hover:bg-navy-800 transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        </section>

        {/* Filter Controls Bar */}
        <section className="border-b border-rule">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-3">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <button
                onClick={() => updateFilters({ category: '', page: 1 })}
                className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                  !queryCategory
                    ? 'bg-navy-900 text-white'
                    : 'bg-wash text-navy-900 hover:bg-navy-100'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => updateFilters({ category: cat.slug, page: 1 })}
                  className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                    queryCategory === cat.slug
                      ? 'bg-navy-900 text-white'
                      : 'bg-wash text-navy-900 hover:bg-navy-100'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center gap-2 text-xs text-muted">
              <span>Sort by:</span>
              <div className="w-36">
                <CustomSelect
                  value={querySort}
                  onChange={(val) => updateFilters({ sort: val, page: 1 })}
                  options={[
                    { value: 'newest', label: 'Newest First' },
                    { value: 'popular', label: 'Most Read' },
                  ]}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Articles Feed */}
        <section className="mx-auto max-w-6xl px-5 py-10">
          <div className="text-xs text-muted mb-6">
            Showing <span className="font-semibold text-navy-900">{total}</span> articles
            {queryCategory && (
              <span>
                {' '}
                in category <strong className="text-navy-900">{queryCategory}</strong>
              </span>
            )}
            {querySearch && (
              <span>
                {' '}
                matching &quot;<strong className="text-navy-900">{querySearch}</strong>&quot;
              </span>
            )}
          </div>

          {loading ? (
            <div className="py-20 text-center text-muted">Loading articles...</div>
          ) : articles.length === 0 ? (
            <div className="rounded-lg border border-dashed border-rule p-12 text-center">
              <p className="text-muted text-sm">No articles match your criteria.</p>
              <button
                onClick={() => router.push('/news')}
                className="mt-3 text-xs font-semibold text-navy-700 hover:underline"
              >
                Clear all filters
              </button>
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
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-navy-700">
                        {art.categoryName || 'Maritime'}
                      </span>
                      <h3 className="font-serif text-lg font-bold text-navy-900 mt-1 leading-snug">
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
                    <span>{(art.author as any)?.name || art.authorName || 'Staff'}</span>
                    <div className="flex items-center gap-2">
                      <span>
                        {art.publishedAt
                          ? new Date(art.publishedAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                            })
                          : ''}
                      </span>
                      <span>•</span>
                      <span>{art.readTime}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => updateFilters({ page: page - 1 })}
                className="inline-flex items-center gap-1 rounded border border-rule px-3 py-1.5 text-xs font-semibold text-navy-900 hover:bg-wash disabled:opacity-40 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Previous
              </button>
              <span className="text-xs text-muted px-2">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => updateFilters({ page: page + 1 })}
                className="inline-flex items-center gap-1 rounded border border-rule px-3 py-1.5 text-xs font-semibold text-navy-900 hover:bg-wash disabled:opacity-40 transition-colors"
              >
                Next
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

export default function NewsListingPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-muted">Loading News Wire...</div>}>
      <NewsListingContent />
    </Suspense>
  );
}
