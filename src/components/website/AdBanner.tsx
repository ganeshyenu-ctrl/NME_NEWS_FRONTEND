'use client';

import React, { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { AdCampaignItem } from '@/types';
import {
  getLocalAdsByPlacement,
  recordLocalAdImpression,
  recordLocalAdClick,
} from '@/lib/adStorage';
import { Megaphone, ArrowRight, ArrowUpRight, X } from 'lucide-react';

interface AdBannerProps {
  placement: 'homepage_top' | 'homepage_mid' | 'article_sidebar' | 'article_inline';
  className?: string;
}

export default function AdBanner({ placement, className = '' }: AdBannerProps) {
  const [ad, setAd] = useState<AdCampaignItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClosed, setIsClosed] = useState(false);
  const impressionRecorded = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const fetchAd = async () => {
      try {
        const res = await api
          .get('/ads/public', {
            params: { placement },
          })
          .catch(() => {
            const local = getLocalAdsByPlacement(placement);
            return { data: { success: true, ads: local } };
          });

        const adsList: AdCampaignItem[] =
          res.data?.success && Array.isArray(res.data.ads) && res.data.ads.length > 0
            ? res.data.ads
            : getLocalAdsByPlacement(placement);

        // Filter out ads dismissed in this session
        const notDismissed = adsList.filter((a) => {
          if (typeof window !== 'undefined' && (a._id || a.id)) {
            const targetId = a._id || a.id;
            return sessionStorage.getItem(`nme_ad_dismissed_${targetId}`) !== 'true';
          }
          return true;
        });

        if (notDismissed.length === 0) {
          if (isMounted) setLoading(false);
          return;
        }

        if (isMounted && notDismissed.length > 0) {
          const randomIndex = Math.floor(Math.random() * notDismissed.length);
          const chosenAd = notDismissed[randomIndex];
          setAd(chosenAd);

          const adId = chosenAd._id || chosenAd.id;
          if (!impressionRecorded.current && adId) {
            impressionRecorded.current = true;
            recordLocalAdImpression(adId);
            api.post(`/ads/public/${adId}/impression`).catch(() => {});
          }
        }
      } catch (err) {
        if (isMounted) {
          const local = getLocalAdsByPlacement(placement);
          if (local.length > 0) {
            setAd(local[0]);
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAd();

    return () => {
      isMounted = false;
    };
  }, [placement]);

  const handleAdClick = () => {
    if (!ad) return;
    const adId = ad._id || ad.id;
    if (adId) {
      try {
        recordLocalAdClick(adId);
        api.post(`/ads/public/${adId}/click`).catch(() => {});
      } catch {}
    }
    window.open(ad.targetUrl, '_blank', 'noopener,noreferrer,sponsored');
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsClosed(true);
    const adId = ad?._id || ad?.id;
    if (adId && typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(`nme_ad_dismissed_${adId}`, 'true');
      } catch {}
    }
  };

  const getBadgeText = (badge?: string) => {
    if (!badge || badge === 'SPONSORED') return 'AD';
    return badge;
  };

  if (loading || !ad || isClosed) {
    return null;
  }

  // =========================================================================
  // 1. HOMEPAGE TOP LEADERBOARD: 100% NME EDITORIAL LIGHT THEME (STATIC, NO HOVER ANIMATION)
  // =========================================================================
  if (placement === 'homepage_top') {
    return (
      <aside
        aria-label="Commercial Advertisement"
        className={`w-full my-6 rounded-lg border border-rule bg-white shadow-xs overflow-hidden ${className}`}
      >
        {/* Editorial Light Top Header Strip */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-2 bg-wash border-b border-rule text-xs text-muted">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded bg-navy-900 text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              {getBadgeText(ad.badgeText)}
            </span>
            <span className="text-muted/60">•</span>
            <span className="text-xs font-semibold text-navy-900">
              Presented by {ad.advertiser}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-semibold text-muted/70 tracking-wider">
              Commercial Feature
            </span>
            <button
              type="button"
              onClick={handleClose}
              title="Close Ad"
              aria-label="Close Ad"
              className="flex items-center justify-center h-6 w-6 rounded-full hover:bg-neutral-200 text-muted hover:text-navy-900 transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div
          onClick={handleAdClick}
          className="cursor-pointer p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
        >
          {/* Left: Thumbnail & Details */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 flex-1 min-w-0">
            {ad.imageUrl && (
              <div className="aspect-[16/9] w-full sm:w-44 md:w-52 shrink-0 rounded-md overflow-hidden bg-wash border border-rule/80 relative">
                <img
                  src={ad.imageUrl}
                  alt={ad.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-navy-700 block mb-1">
                {ad.advertiser}
              </span>

              <h3 className="font-serif text-lg sm:text-xl font-bold text-navy-900 leading-snug">
                {ad.headline || ad.title}
              </h3>

              {ad.description && (
                <p className="mt-1 text-xs sm:text-sm text-muted leading-relaxed line-clamp-2">
                  {ad.description}
                </p>
              )}
            </div>
          </div>

          {/* Right: NME Style Navy Button */}
          <div className="shrink-0 self-stretch sm:self-auto flex items-center justify-end">
            <button
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-md bg-navy-900 hover:bg-navy-800 text-white px-4 py-2 text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <span>{ad.callToAction || 'Register Delegate Pass'}</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // =========================================================================
  // 2. HOMEPAGE MID-PAGE: EDITORIAL SPONSOR SPOTLIGHT (STATIC, NO HOVER ANIMATION)
  // =========================================================================
  if (placement === 'homepage_mid') {
    return (
      <aside
        aria-label="Partner Spotlight"
        className={`my-12 rounded-lg border border-rule bg-white p-6 sm:p-8 shadow-xs overflow-hidden ${className}`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-rule mb-5 text-xs text-muted">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded bg-navy-900 text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              {getBadgeText(ad.badgeText)}
            </span>
            <span className="text-muted/60">•</span>
            <span className="font-semibold text-navy-900">{ad.advertiser}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-semibold text-muted/70 tracking-wider">
              Advertisement
            </span>
            <button
              type="button"
              onClick={handleClose}
              title="Close Ad"
              aria-label="Close Ad"
              className="flex items-center justify-center h-6 w-6 rounded-full hover:bg-neutral-200 text-muted hover:text-navy-900 transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div
          onClick={handleAdClick}
          className="cursor-pointer grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-6 md:gap-8 items-center"
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-navy-700 block mb-1.5">
              {ad.advertiser}
            </span>

            <h3 className="font-serif text-xl sm:text-2xl font-bold text-navy-900 leading-tight">
              {ad.headline || ad.title}
            </h3>

            {ad.description && (
              <p className="mt-2.5 text-xs sm:text-sm text-muted leading-relaxed">
                {ad.description}
              </p>
            )}

            <div className="mt-5">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-navy-900 hover:bg-navy-800 text-white px-4 py-2 text-xs font-semibold transition-colors shadow-xs">
                <span>{ad.callToAction || 'Explore Specifications'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>

          {ad.imageUrl && (
            <div className="aspect-[16/10] w-full rounded-md overflow-hidden bg-wash border border-rule">
              <img
                src={ad.imageUrl}
                alt={ad.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>
      </aside>
    );
  }

  // =========================================================================
  // 3. IN-ARTICLE INLINE: EDITORIAL CALLOUT (STATIC, NO HOVER ANIMATION)
  // =========================================================================
  if (placement === 'article_inline') {
    return (
      <aside
        aria-label="Partner Insight"
        className={`my-8 rounded-r-lg border-y border-r border-rule border-l-4 border-l-navy-900 bg-wash p-4 sm:p-5 shadow-xs ${className}`}
      >
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted pb-2 border-b border-rule/60 mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded bg-navy-900 text-white px-1.5 py-0.5 text-[9px] font-bold">
              {getBadgeText(ad.badgeText)}
            </span>
            <span>•</span>
            <span className="text-navy-800 normal-case font-semibold">{ad.advertiser}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span>Advertisement</span>
            <button
              type="button"
              onClick={handleClose}
              title="Close Ad"
              aria-label="Close Ad"
              className="flex items-center justify-center h-5 w-5 rounded-full hover:bg-neutral-200 text-muted hover:text-navy-900 transition-colors cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div
          onClick={handleAdClick}
          className="cursor-pointer flex flex-col sm:flex-row items-start sm:items-center gap-4"
        >
          {ad.imageUrl && (
            <div className="aspect-[16/10] h-20 w-32 shrink-0 rounded overflow-hidden bg-white border border-rule">
              <img
                src={ad.imageUrl}
                alt={ad.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h4 className="font-serif text-base font-bold text-navy-900 leading-snug">
              {ad.headline || ad.title}
            </h4>
            {ad.description && (
              <p className="mt-1 text-xs text-muted leading-relaxed line-clamp-2">
                {ad.description}
              </p>
            )}
          </div>

          <div className="shrink-0 self-stretch sm:self-center">
            <span className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-md bg-navy-900 hover:bg-navy-800 text-white px-3.5 py-1.5 text-xs font-semibold transition-colors shadow-xs cursor-pointer">
              <span>{ad.callToAction || 'Learn More'}</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </aside>
    );
  }

  // =========================================================================
  // 4. SIDEBAR CARD (STATIC, NO HOVER ANIMATION)
  // =========================================================================
  return (
    <aside
      aria-label="Commercial Advertisement"
      className={`rounded-lg border border-rule bg-white p-4 shadow-xs ${className}`}
    >
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-rule text-[10px] font-bold uppercase tracking-wider text-muted">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center rounded bg-navy-900 text-white px-1.5 py-0.5 text-[9px] font-bold">
            {getBadgeText(ad.badgeText)}
          </span>
          <span className="truncate max-w-[110px] normal-case text-navy-900 font-semibold">{ad.advertiser}</span>
        </div>
        <button
          type="button"
          onClick={handleClose}
          title="Close Ad"
          aria-label="Close Ad"
          className="flex items-center justify-center h-5 w-5 rounded-full hover:bg-neutral-200 text-muted hover:text-navy-900 transition-colors cursor-pointer"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      <div onClick={handleAdClick} className="cursor-pointer">
        {ad.imageUrl && (
          <div className="aspect-[16/9] w-full rounded overflow-hidden bg-wash mb-3 border border-rule">
            <img
              src={ad.imageUrl}
              alt={ad.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <h4 className="font-serif text-sm font-bold text-navy-900 leading-snug">
          {ad.headline || ad.title}
        </h4>
        {ad.description && (
          <p className="mt-1.5 text-xs text-muted line-clamp-2 leading-relaxed">
            {ad.description}
          </p>
        )}
        <div className="mt-3">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-navy-900">
            <span>{ad.callToAction || 'Learn More'}</span>
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </aside>
  );
}
