import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '@/components/website/Header';
import Footer from '@/components/website/Footer';
import LiveReaderBadge from '@/components/website/LiveReaderBadge';
import CommentSection from '@/components/website/CommentSection';
import ArticleShareButton from '@/components/website/ArticleShareButton';
import { Article } from '@/types';
import { ArrowLeft } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

// Fetch article data on the server during SSR (for users and search/social crawlers)
async function getArticleData(slug: string): Promise<{ article: Article; relatedArticles: Article[] } | null> {
  const apiUrl =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'https://nmepublications.com/api';

  try {
    const res = await fetch(`${apiUrl}/articles/public/${encodeURIComponent(slug)}`, {
      next: { revalidate: 30 },
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.success && data.article ? data : null;
  } catch (err) {
    console.error('[SSR] Failed to fetch article:', err);
    return null;
  }
}

// Dynamic Open Graph & Twitter Card Metadata Generation for LinkedIn, Facebook, Twitter, WhatsApp
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getArticleData(slug);
  const article = data?.article;

  if (!article) {
    return {
      title: 'Article Not Found | NME',
      description: 'The requested maritime wire story could not be found.',
    };
  }

  const cleanDescription =
    article.subtitle ||
    article.content?.replace(/<[^>]*>?/gm, '').trim().slice(0, 180) ||
    'Independent Perspectives. Informed Maritime Decisions.';
  const articleUrl = `https://nmepublications.com/articles/${article.slug}`;
  const ogImageUrl =
    article.featuredImage?.url || 'https://nmepublications.com/og-default.jpg';

  return {
    title: `${article.title} | NME`,
    description: cleanDescription,
    alternates: {
      canonical: articleUrl,
    },
    openGraph: {
      title: article.title,
      description: cleanDescription,
      url: articleUrl,
      siteName: 'NME | Navigating Marine Excellence',
      type: 'article',
      publishedTime: article.publishedAt || undefined,
      authors: [article.authorName || 'NME Editorial Team'],
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: cleanDescription,
      images: [ogImageUrl],
    },
  };
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params;
  const data = await getArticleData(slug);

  if (!data || !data.article) {
    return (
      <>
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-5 py-20 text-center">
          <h1 className="font-serif text-2xl font-bold text-navy-900 mb-2">Article Not Found</h1>
          <p className="text-sm text-muted mb-6">
            The article you are looking for may have been moved or archived.
          </p>
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 rounded-md bg-navy-900 px-4 py-2 text-xs font-semibold text-white hover:bg-navy-800 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to News Wire</span>
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const { article: currentArticle, relatedArticles = [] } = data;

  const catObj = typeof currentArticle.category === 'object' ? currentArticle.category : null;
  const categorySlug = catObj?.slug || 'maritime-news';
  const categoryName = catObj?.name || currentArticle.categoryName || 'Maritime News';
  const authorName = (currentArticle.author as any)?.name || currentArticle.authorName || 'Staff Correspondent';
  const authorAvatar = (currentArticle.author as any)?.avatar || '';

  const articleFullUrl = `https://nmepublications.com/articles/${currentArticle.slug}`;

  return (
    <>
      <Header />
      <main className="flex-1 bg-white py-8 sm:py-10">
        <article className="mx-auto max-w-4xl px-5">
          {/* Breadcrumbs & Live Readers */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-4 mb-6">
            <nav aria-label="Breadcrumb" className="text-xs text-muted">
              <Link href="/" className="hover:text-navy-900 hover:underline">
                Home
              </Link>
              <span className="mx-2">/</span>
              <Link
                href={`/category/${categorySlug}`}
                className="font-semibold text-navy-900 hover:underline"
              >
                {categoryName}
              </Link>
            </nav>

            {/* Socket.io Live Reader Counter */}
            <LiveReaderBadge articleSlug={currentArticle.slug} />
          </div>

          {/* Headline & Subtitle */}
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-navy-900">
            {currentArticle.title}
          </h1>

          {currentArticle.subtitle && (
            <p className="mt-4 font-serif text-lg sm:text-xl text-muted leading-relaxed italic">
              {currentArticle.subtitle}
            </p>
          )}

          {/* Author Metadata & Actions */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-rule py-3 text-xs text-muted">
            <div className="flex items-center gap-3">
              {authorAvatar ? (
                <img
                  src={authorAvatar}
                  alt={authorName}
                  className="h-8 w-8 rounded-full object-cover border border-navy-100"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-navy-100 flex items-center justify-center font-bold text-navy-900 text-xs">
                  {authorName[0]?.toUpperCase() || 'E'}
                </div>
              )}
              <div>
                <p className="font-semibold text-navy-900">{authorName}</p>
                <div className="flex items-center gap-2 text-[11px] mt-0.5">
                  <span>
                    {currentArticle.publishedAt
                      ? new Date(currentArticle.publishedAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'Editorial Dispatch'}
                  </span>
                  <span>•</span>
                  <span>{currentArticle.readTime || '3 min read'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ArticleShareButton title={currentArticle.title} url={articleFullUrl} />
            </div>
          </div>

          {/* Featured Image */}
          {currentArticle.featuredImage?.url && (
            <figure className="my-8">
              <div className="overflow-hidden rounded-md bg-wash">
                <img
                  src={currentArticle.featuredImage.url}
                  alt={currentArticle.featuredImage.alt || currentArticle.title}
                  className="w-full h-auto object-cover max-h-[500px]"
                />
              </div>
              {currentArticle.featuredImage.caption && (
                <figcaption className="mt-2 text-xs text-muted text-center italic">
                  {currentArticle.featuredImage.caption}
                </figcaption>
              )}
            </figure>
          )}

          {/* Article Body Content */}
          <div
            className="prose prose-navy max-w-none text-base sm:text-lg leading-relaxed text-ink space-y-4"
            dangerouslySetInnerHTML={{ __html: currentArticle.content }}
          />

          {/* Tags */}
          {currentArticle.tags && currentArticle.tags.length > 0 && (
            <div className="mt-8 pt-4 border-t border-rule flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted">Topics:</span>
              {currentArticle.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-wash border border-rule px-3 py-0.5 text-xs text-navy-900"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <section className="mt-12 border-t-2 border-navy-900 pt-6">
              <h3 className="font-serif text-xl font-bold text-navy-900 mb-4">Related Intelligence</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {relatedArticles.map((rel) => (
                  <div key={rel._id} className="border-b sm:border-b-0 border-rule pb-4 sm:pb-0">
                    <h4 className="font-serif text-sm font-bold text-navy-900 hover:underline">
                      <Link href={`/articles/${rel.slug}`}>{rel.title}</Link>
                    </h4>
                    <p className="mt-1 text-xs text-muted line-clamp-2">{rel.subtitle}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Real-time Socket.io Reader Discussion */}
          <CommentSection articleId={currentArticle._id} articleSlug={currentArticle.slug} />
        </article>
      </main>
      <Footer />
    </>
  );
}
