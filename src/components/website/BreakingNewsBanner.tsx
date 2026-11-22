'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { dismissBreakingAlert } from '@/store/slices/socketSlice';
import { AlertCircle, X } from 'lucide-react';

export default function BreakingNewsBanner() {
  const dispatch = useAppDispatch();
  const { breakingAlert } = useAppSelector((state) => state.socket);
  const { breakingNews } = useAppSelector((state) => state.articles);
  const [dismissed, setDismissed] = useState(false);

  // Active alert: live socket alert takes priority, otherwise use latest breaking story from database
  const activeAlert = breakingAlert || (!dismissed && breakingNews && breakingNews.length > 0 ? breakingNews[0] : null);

  if (!activeAlert) return null;

  const handleDismiss = () => {
    dispatch(dismissBreakingAlert());
    setDismissed(true);
  };

  return (
    <div className="bg-signal text-white px-4 py-2.5 shadow-md flex items-center justify-between transition-all animate-fadeIn">
      <div className="mx-auto flex max-w-6xl items-center gap-3 text-xs sm:text-sm font-medium">
        <span className="inline-flex items-center gap-1.5 uppercase font-bold tracking-wider bg-white/20 px-2 py-0.5 rounded text-[10px]">
          <AlertCircle className="h-3.5 w-3.5 animate-pulse" />
          Breaking News
        </span>
        <Link
          href={`/articles/${activeAlert.slug}`}
          className="hover:underline underline-offset-2 font-serif font-semibold"
        >
          {activeAlert.title}
        </Link>
      </div>
      <button
        onClick={handleDismiss}
        className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10"
        aria-label="Dismiss alert"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
