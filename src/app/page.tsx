'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/website/Header';
import Footer from '@/components/website/Footer';
import LeadStoryCarousel from '@/components/website/LeadStoryCarousel';
import AdBanner from '@/components/website/AdBanner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchHomepageHighlights, fetchPublicArticles } from '@/store/slices/articlesSlice';
import { fetchCategories } from '@/store/slices/categoriesSlice';
import { getStoredLeadStoryIds } from '@/lib/leadStoryStorage';
import { api } from '@/lib/api';
import { ArrowRight, Flame, Clock, Newspaper, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import { Article } from '@/types';

export default function HomePage() {
  const dispatch = useAppDispatch();
  const { leadArticle, leadArticles = [], breakingNews, trending, articles, loading } = useAppSelector(
    (state) => state.articles
  );
  const { categories } = useAppSelector((state) => state.categories);

  // Homepage Newsletter Subscription State
  const [nlEmail, setNlEmail] = useState('');
  const [nlName, setNlName] = useState('');
  const [nlConsent, setNlConsent] = useState(true);
  const [nlStatus, setNlStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [nlMessage, setNlMessage] = useState('');

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchHomepageHighlights());
    dispatch(fetchPublicArticles({ limit: 50 }));
  }, [dispatch]);

  // Aggregate ALL articles marked as "Feature as Lead Story" for 15s Carousel
  const allLeadStories = useMemo(() => {
    const list: Article[] = [];
    const seenIds = new Set<string>();

    const addArticle = (a?: Article | null) => {
      if (!a || !a._id || seenIds.has(a._id)) return;
      seenIds.add(a._id);
      list.push(a);
    };

    // 1. Stored Lead Story IDs from localStorage (Admin toggles)
    const storedIds = typeof window !== 'undefined' ? getStoredLeadStoryIds() : [];
    if (storedIds.length > 0 && Array.isArray(articles)) {
      storedIds.forEach((id) => {
        const found = articles.find((a) => a._id === id);
        if (found) addArticle(found);
      });
    }

    // 2. leadArticles from highlights API
    if (Array.isArray(leadArticles)) {
      leadArticles.forEach(addArticle);
    }

    // 3. Any articles in public feed with isLead === true
    if (Array.isArray(articles)) {
      articles.forEach((a) => {
        if (a && a.isLead) addArticle(a);
      });
    }

    // 4. Fallback single leadArticle
    if (leadArticle && leadArticle._id) {
      addArticle(leadArticle);
    }

    // 5. CRITICAL: Pad with top published articles so the 15-second slider with arrows & dots is ALWAYS active!
    if (list.length < 3 && Array.isArray(articles) && articles.length > 0) {
      // Prioritize published stories with images
      const withImages = articles.filter(
        (a) => a && a.status === 'published' && a._id && !seenIds.has(a._id) && a.featuredImage?.url
      );
      for (const cand of withImages) {
        if (list.length >= 4) break;
        addArticle(cand);
      }
      // If still fewer than 3, add any published stories
      if (list.length < 3) {
        for (const a of articles) {
          if (list.length >= 4) break;
          addArticle(a);
        }
      }
    }

    // 6. Also check trending if still fewer than 3
    if (list.length < 3 && Array.isArray(trending) && trending.length > 0) {
      for (const t of trending) {
        if (list.length >= 4) break;
        addArticle(t);
      }
    }

    return list;
  }, [leadArticles, articles, leadArticle, trending]);

  const leadIds = useMemo(() => {
    return new Set(allLeadStories.map((a) => a._id));
  }, [allLeadStories]);

  // Group articles by category slug or name dynamically
  const articlesByCategory = useMemo(() => {
    const map: Record<string, Article[]> = {};

    articles.forEach((art) => {
      let slug = '';
      if (typeof art.category === 'object' && art.category?.slug) {
        slug = art.category.slug;
      } else if (typeof art.category === 'string') {
        const found = categories.find((c) => c._id === art.category || c.slug === art.category);
        if (found) slug = found.slug;
      }

      if (!slug && art.categoryName) {
        const found = categories.find(
          (c) => c.name.toLowerCase() === art.categoryName?.toLowerCase()
        );
        slug = found ? found.slug : art.categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      }

      if (slug) {
        if (!map[slug]) map[slug] = [];
        map[slug].push(art);
      }
    });

    return map;
  }, [articles, categories]);

  // Recent dispatches for the primary wire feed (excluding all lead carousel stories)
  const recentDispatches = useMemo(() => {
    return articles
      .filter((a) => !leadIds.has(a._id))
      .slice(0, 6);
  }, [articles, leadIds]);

  // Filter categories that have published articles
  const activeSectors = useMemo(() => {
    return categories.filter((cat) => {
      const catArticles = articlesByCategory[cat.slug] || [];
      return catArticles.length > 0;
    });
  }, [categories, articlesByCategory]);

  const handleHomeNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlEmail || !nlEmail.includes('@')) {
      setNlStatus('error');
      setNlMessage('Please enter a valid business email address.');
      return;
    }
    setNlStatus('loading');
    try {
      const res = await api.post('/newsletter/subscribe', {
        email: nlEmail,
        frequency: 'weekly',
      });
      if (res.data?.success) {
        setNlStatus('success');
        setNlMessage(res.data.message || 'Thank you for subscribing to the NME Executive Briefing.');
        setNlEmail('');
        setNlName('');
      }
    } catch (err: any) {
      setNlStatus('error');
      setNlMessage(err.response?.data?.message || 'Subscription failed. Please try again.');
    }
  };

  return (
    <>
      <Header />
      <main id="main" className="flex-1">
        <h1 className="sr-only">Navigating Marine Excellence: independent maritime news and analysis</h1>

        {/* Lead Hero Section: 15-second Auto-Sliding Carousel */}
        <section className="mx-auto max-w-6xl px-5 pt-10">
          <LeadStoryCarousel articles={allLeadStories} />

          {/* Sponsored Leaderboard Announcement */}
          <AdBanner placement="homepage_top" />
        </section>

        {/* Recent Dispatches Section & Trending Sidebar */}
        <section className="mx-auto max-w-6xl px-5 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-10">
            {/* Recent Stories Feed */}
            <div>
              <div className="flex items-center justify-between border-b-2 border-navy-900 pb-2 mb-6">
                <h3 className="font-serif text-xl font-bold text-navy-900">Recent Dispatches</h3>
                <Link
                  href="/news"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-navy-700 hover:underline"
                >
                  <span>View All News</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {recentDispatches.map((art) => (
                  <article key={art._id} className="border-b border-rule pb-6 flex flex-col justify-between">
                    <div>
                      {art.featuredImage?.url && (
                        <Link href={`/articles/${art.slug}`} className="block mb-3 overflow-hidden rounded">
                          <div className="aspect-[16/9] w-full overflow-hidden bg-wash">
                            <img
                              src={art.featuredImage.url}
                              alt={art.title}
                              className="h-full w-full object-cover hover:scale-105 transition-transform"
                            />
                          </div>
                        </Link>
                      )}
                      <Link
                        href={`/category/${typeof art.category === 'object' && art.category ? art.category.slug : 'shipping'}`}
                        className="text-[11px] font-bold uppercase tracking-wider text-navy-700 hover:underline"
                      >
                        {art.categoryName || 'Maritime'}
                      </Link>
                      <h4 className="font-serif text-lg font-bold leading-snug text-navy-900 mt-1">
                        <Link href={`/articles/${art.slug}`} className="hover:underline">
                          {art.title}
                        </Link>
                      </h4>
                      {art.subtitle && (
                        <p className="mt-2 text-xs text-muted line-clamp-2 leading-relaxed">
                          {art.subtitle}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between text-[11px] text-muted border-t border-rule/50 pt-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-navy-900">
                          {(art.author as any)?.name || art.authorName || 'Staff'}
                        </span>
                        <span>•</span>
                        <span>
                          {art.readTime
                            ? art.readTime.includes('min')
                              ? art.readTime
                              : `${art.readTime} min`
                            : '3 min'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 font-semibold text-[11px]">
                        <span className="inline-flex items-center gap-1 text-amber-700" title={`${art.views || 0} views`}>
                          <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          <span>{art.views || 0}</span>
                        </span>
                        <Link
                          href={`/articles/${art.slug}#comments`}
                          className="inline-flex items-center gap-1 text-navy-800 hover:text-navy-950 transition-colors"
                          title={`${art.commentCount || 0} comments`}
                        >
                          <MessageSquare className="h-3 w-3 text-navy-600" />
                          <span>{art.commentCount || 0}</span>
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* Trending & Opinions Sidebar */}
            <aside className="space-y-8">
              <div className="rounded-lg border border-rule bg-wash p-6">
                <div className="flex items-center gap-2 border-b border-rule pb-3 mb-4">
                  <Flame className="h-4 w-4 text-signal" />
                  <h3 className="font-serif text-lg font-bold text-navy-900">Most Read Intelligence</h3>
                </div>

                <div className="space-y-4">
                  {trending.map((trend, idx) => (
                    <div key={trend._id} className="flex gap-3 items-start border-b border-rule/60 pb-3 last:border-0 last:pb-0">
                      <span className="font-serif text-2xl font-bold text-navy-100/90 leading-none">
                        0{idx + 1}
                      </span>
                      <div>
                        <Link
                          href={`/articles/${trend.slug}`}
                          className="font-serif text-sm font-semibold text-navy-900 hover:underline leading-snug block"
                        >
                          {trend.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted">
                          <span>{trend.categoryName || 'Shipping'}</span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                            <Flame className="h-3 w-3 text-amber-500 fill-amber-500" />
                            <span>{trend.views || 0}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Newsletter Callout */}
              <div className="rounded-lg border-2 border-navy-900 bg-navy-50 p-6 space-y-3">
                <h4 className="font-serif text-lg font-bold text-navy-900">The NME Executive Briefing</h4>
                <p className="text-xs text-muted leading-relaxed">
                  Join 12,000+ maritime executives receiving concise analysis every Tuesday morning. Zero fluff.
                </p>
                <Link
                  href="/newsletter"
                  className="inline-block rounded-md bg-navy-900 px-4 py-2 text-xs font-semibold text-white hover:bg-navy-800 transition-colors w-full text-center"
                >
                  Configure Topics & Frequency
                </Link>
              </div>

              {/* Sidebar Sponsor Card */}
              <AdBanner placement="article_sidebar" />
            </aside>
          </div>
        </section>

        {/* Mid-Page Sponsor Feature Spotlight */}
        <section className="mx-auto max-w-6xl px-5">
          <AdBanner placement="homepage_mid" />
        </section>

        {/* Dedicated Editorial Sector Sections (Dynamic by Category, matching Image 2 & website-01-homepage.html) */}
        {activeSectors.map((cat) => {
          const catArticles = articlesByCategory[cat.slug] || [];
          if (catArticles.length === 0) return null;

          return (
            <section key={cat._id} className="mx-auto max-w-6xl px-5 mt-14">
              {/* Category Section Header */}
              <div className="mb-6 flex items-baseline justify-between border-t-2 border-navy-900 pt-3">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: cat.color || '#0b1f3a' }}
                  />
                  <h3 className="font-serif text-xl font-bold uppercase tracking-wide text-navy-900">
                    {cat.name}
                  </h3>
                </div>
                <Link
                  href={`/category/${cat.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-navy-700 hover:underline"
                >
                  <span>View All {cat.name}</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Responsive Category Articles Grid (Matching Image 2 article card structure) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {catArticles.slice(0, 4).map((art) => (
                  <article key={art._id} className="flex flex-col justify-between">
                    <div>
                      <Link
                        href={`/articles/${art.slug}`}
                        className="mb-3 block overflow-hidden rounded bg-wash group"
                      >
                        {art.featuredImage?.url ? (
                          <div className="aspect-[3/2] w-full overflow-hidden">
                            <img
                              src={art.featuredImage.url}
                              alt={art.featuredImage.alt || art.title}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                        ) : (
                          <div className="aspect-[3/2] w-full bg-navy-50 flex items-center justify-center text-navy-700">
                            <Newspaper className="h-10 w-10 opacity-30" />
                          </div>
                        )}
                      </Link>

                      <Link
                        href={`/category/${cat.slug}`}
                        className="text-[11px] font-bold uppercase tracking-wider text-navy-700 hover:underline"
                      >
                        {cat.name}
                      </Link>

                      <h4 className="mt-1.5 font-serif font-bold text-base sm:text-lg leading-snug text-navy-900">
                        <Link href={`/articles/${art.slug}`} className="hover:underline">
                          {art.title}
                        </Link>
                      </h4>

                      {art.subtitle && (
                        <p className="mt-2 text-xs text-muted line-clamp-2 leading-relaxed">
                          {art.subtitle}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between text-[11px] text-muted border-t border-rule/40 pt-2">
                      <div className="flex items-center gap-1.5 truncate max-w-[130px]">
                        <span className="font-medium text-navy-900 truncate">
                          {(art.author as any)?.name || art.authorName || 'Staff'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-semibold text-[11px] shrink-0">
                        <span className="inline-flex items-center gap-1 text-amber-700" title={`${art.views || 0} views`}>
                          <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          <span>{art.views || 0}</span>
                        </span>
                        <Link
                          href={`/articles/${art.slug}#comments`}
                          className="inline-flex items-center gap-1 text-navy-800 hover:text-navy-950 transition-colors"
                          title={`${art.commentCount || 0} comments`}
                        >
                          <MessageSquare className="h-3 w-3 text-navy-600" />
                          <span>{art.commentCount || 0}</span>
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}

        {/* Inline Executive Briefing Subscribe Section (matching website-01-homepage.html) */}
        <section className="bg-navy-900 text-white mt-20">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-[1fr_1.3fr] md:items-center">
            <div>
              <h2 className="font-serif text-3xl font-semibold leading-tight">The NME Briefing</h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-navy-100">
                Independent maritime reporting and analysis, sent directly to your inbox every Tuesday morning.
              </p>
            </div>

            <form onSubmit={handleHomeNewsletter} className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr_auto]">
                <input
                  type="text"
                  placeholder="First name"
                  value={nlName}
                  onChange={(e) => setNlName(e.target.value)}
                  className="border px-3 py-2.5 text-sm focus:outline-none border-white/30 bg-white/5 text-white placeholder:text-navy-100/70 focus:border-white rounded"
                />
                <input
                  type="email"
                  required
                  placeholder="Business email address"
                  value={nlEmail}
                  onChange={(e) => setNlEmail(e.target.value)}
                  className="border px-3 py-2.5 text-sm focus:outline-none border-white/30 bg-white/5 text-white placeholder:text-navy-100/70 focus:border-white rounded"
                />
                <button
                  type="submit"
                  disabled={nlStatus === 'loading'}
                  className="px-5 py-2.5 text-sm font-semibold bg-white text-navy-900 hover:bg-navy-50 rounded transition-colors disabled:opacity-60"
                >
                  {nlStatus === 'loading' ? 'Subscribing...' : 'Subscribe'}
                </button>
              </div>

              {nlStatus === 'success' && (
                <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/60 p-2.5 rounded border border-emerald-500/40">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{nlMessage}</span>
                </div>
              )}

              {nlStatus === 'error' && (
                <div className="flex items-center gap-2 text-xs text-rose-300 bg-rose-950/60 p-2.5 rounded border border-rose-500/40">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{nlMessage}</span>
                </div>
              )}

              <label className="flex items-start gap-2 text-xs leading-relaxed text-navy-100 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={nlConsent}
                  onChange={(e) => setNlConsent(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  I agree to receive the NME newsletter by email. See our{' '}
                  <Link href="/privacy" className="underline hover:text-white">
                    privacy policy
                  </Link>
                  . You can unsubscribe at any time.
                </span>
              </label>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
