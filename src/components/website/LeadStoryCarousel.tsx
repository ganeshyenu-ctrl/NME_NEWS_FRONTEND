'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Article } from '@/types';
import {
  ChevronLeft,
  ChevronRight,
  Newspaper,
  Pause,
  Play,
  Flame,
  MessageSquare,
} from 'lucide-react';

interface LeadStoryCarouselProps {
  articles: Article[];
}

const ROTATION_INTERVAL_MS = 15000; // 15-second auto-slide timer

export default function LeadStoryCarousel({ articles }: LeadStoryCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const total = articles.length;

  // Bound index safely
  const safeIndex = total > 0 ? ((currentIndex % total) + total) % total : 0;
  const currentArticle = articles[safeIndex] || articles[0];

  const nextSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
    setProgress(0);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
    setProgress(0);
  }, [total]);

  const goToSlide = (idx: number) => {
    if (idx === safeIndex) return;
    setCurrentIndex(idx);
    setProgress(0);
  };

  // 15-second auto-rotation timer with smooth progress bar update
  useEffect(() => {
    if (total <= 1 || isPaused) return;

    const tickMs = 100;
    const increment = (tickMs / ROTATION_INTERVAL_MS) * 100;

    const timer = setInterval(() => {
      setProgress((old) => {
        if (old + increment >= 100) {
          nextSlide();
          return 0;
        }
        return old + increment;
      });
    }, tickMs);

    return () => clearInterval(timer);
  }, [total, isPaused, nextSlide]);

  if (!currentArticle) {
    return (
      <div className="py-16 text-center text-muted">
        Loading today&apos;s maritime lead...
      </div>
    );
  }

  const categorySlug =
    typeof currentArticle.category === 'object' && currentArticle.category
      ? currentArticle.category.slug
      : 'shipping';
  const categoryName = currentArticle.categoryName || 'Maritime';
  const authorName =
    (currentArticle.author as any)?.name ||
    currentArticle.authorName ||
    'Staff';
  const publishedDate = currentArticle.publishedAt
    ? new Date(currentArticle.publishedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Recently';

  return (
    <div
      className="relative border-b border-rule pb-10 group/carousel select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-roledescription="carousel"
      aria-label="Lead Stories 15-Second Slider"
    >
      {/* Top Bar: Slide Badge, Timer Status & Controls */}
      <div className="flex items-center justify-between mb-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 text-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider shadow-xs">
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            <span>
              {total > 1 ? `Lead Story ${safeIndex + 1} of ${total}` : 'Lead Story 1 of 1'}
            </span>
          </span>

          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted">
            <span>&bull;</span>
            <span>
              {total > 1
                ? isPaused
                  ? 'Paused on hover'
                  : 'Auto-sliding every 15s'
                : '15s Carousel Enabled'}
            </span>
          </span>
        </div>

        {/* Top-Right Quick Navigation Arrows and Pause Button */}
        <div className="flex items-center gap-1.5">
          {total > 1 && (
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              title={isPaused ? 'Resume auto-sliding' : 'Pause auto-sliding'}
              className="rounded p-1.5 text-muted hover:text-navy-900 hover:bg-wash transition-colors cursor-pointer"
              aria-label={isPaused ? 'Resume auto-sliding' : 'Pause auto-sliding'}
            >
              {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            </button>
          )}

          <button
            type="button"
            onClick={prevSlide}
            disabled={total <= 1}
            aria-label="Previous lead story"
            className="rounded border border-rule bg-white p-1.5 text-navy-900 hover:bg-navy-900 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-xs"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            disabled={total <= 1}
            aria-label="Next lead story"
            className="rounded border border-rule bg-white p-1.5 text-navy-900 hover:bg-navy-900 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-xs"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Story Content Container */}
      <div className="relative">
        {/* Story Grid */}
        <article
          key={currentArticle._id || currentArticle.slug}
          className="grid gap-6 md:grid-cols-[1.35fr_1fr] md:gap-10 transition-opacity duration-300"
        >
          {/* Story textual details (Left Column) */}
          <div className="flex flex-col justify-between order-last md:order-first">
            <div>
              <div className="mb-2">
                <Link
                  href={`/category/${categorySlug}`}
                  className="text-xs font-bold uppercase tracking-wider text-navy-700 hover:underline"
                >
                  {categoryName}
                </Link>
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight text-navy-900">
                <Link
                  href={`/articles/${currentArticle.slug}`}
                  className="hover:underline transition-colors"
                >
                  {currentArticle.title}
                </Link>
              </h2>

              {currentArticle.subtitle && (
                <p className="mt-3 text-sm sm:text-base text-muted leading-relaxed">
                  {currentArticle.subtitle}
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-rule/50 text-xs text-muted">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-medium text-navy-900">{authorName}</span>
                <span>&bull;</span>
                <span>{publishedDate}</span>
                <span>&bull;</span>
                <span>
                  {currentArticle.readTime
                    ? currentArticle.readTime.includes('min')
                      ? currentArticle.readTime
                      : `${currentArticle.readTime} min read`
                    : '3 min read'}
                </span>
                <span>&bull;</span>
                <span className="inline-flex items-center gap-1 font-semibold text-amber-700" title={`${currentArticle.views || 0} views`}>
                  <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <span>{currentArticle.views || 0}</span>
                </span>
                <span>&bull;</span>
                <Link
                  href={`/articles/${currentArticle.slug}#comments`}
                  className="inline-flex items-center gap-1 font-semibold text-navy-800 hover:text-navy-950 transition-colors"
                  title={`${currentArticle.commentCount || 0} comments`}
                >
                  <MessageSquare className="h-3.5 w-3.5 text-navy-600" />
                  <span>{currentArticle.commentCount || 0}</span>
                </Link>
              </div>

              <Link
                href={`/articles/${currentArticle.slug}`}
                className="font-semibold text-navy-900 hover:underline text-xs inline-flex items-center gap-1 group/link"
              >
                <span>Read Full Story</span>
                <span className="transition-transform group-hover/link:translate-x-1">&rarr;</span>
              </Link>
            </div>
          </div>

          {/* Media image (Right Column) */}
          <Link
            href={`/articles/${currentArticle.slug}`}
            className="order-first md:order-last block overflow-hidden rounded-md bg-wash group/img relative"
          >
            {currentArticle.featuredImage?.url ? (
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <img
                  src={currentArticle.featuredImage.url}
                  alt={currentArticle.featuredImage.alt || currentArticle.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                />
              </div>
            ) : (
              <div className="aspect-[16/10] w-full bg-navy-50 flex items-center justify-center text-navy-700">
                <Newspaper className="h-16 w-16 opacity-30" />
              </div>
            )}

            {currentArticle.featuredImage?.caption && (
              <p className="mt-1.5 text-[11px] text-muted italic line-clamp-1">
                {currentArticle.featuredImage.caption}
              </p>
            )}
          </Link>
        </article>
      </div>

      {/* Slide Indicators: Dots and 15-Second Progress Bar (Diagram in wireframe) */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-rule/60">
        {/* Centered Slide Indicator Dots */}
        <div className="flex items-center gap-2">
          {articles.length > 0 ? (
            articles.map((art, idx) => {
              const isActive = idx === safeIndex;
              return (
                <button
                  key={art._id || idx}
                  type="button"
                  onClick={() => goToSlide(idx)}
                  title={`Story ${idx + 1}: ${art.title}`}
                  aria-label={`Go to slide ${idx + 1}: ${art.title}`}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    isActive
                      ? 'w-8 bg-navy-900'
                      : 'w-2.5 bg-rule hover:bg-navy-900/60'
                  }`}
                />
              );
            })
          ) : (
            <div className="h-2.5 w-8 rounded-full bg-navy-900" />
          )}
        </div>

        {/* 15-Second Timer Bar */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <span className="text-[11px] text-muted font-mono whitespace-nowrap">
            {total > 1
              ? `${Math.ceil(((100 - progress) / 100) * (ROTATION_INTERVAL_MS / 1000))}s`
              : '15s'}
          </span>
          <div
            className="w-28 sm:w-36 h-2 rounded-full bg-rule/80 overflow-hidden"
            title="Auto-rotates to next story every 15 seconds"
          >
            <div
              className="h-full bg-navy-900 transition-all duration-100 ease-linear"
              style={{ width: `${total > 1 ? progress : 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
