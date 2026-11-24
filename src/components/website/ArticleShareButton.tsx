'use client';

import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';

interface Props {
  title: string;
  url?: string;
}

export default function ArticleShareButton({ title, url }: Props) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          url: shareUrl,
        });
        return;
      } catch {}
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {}
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 rounded border border-rule bg-white px-3 py-1.5 text-xs font-semibold text-navy-900 hover:bg-wash transition-colors cursor-pointer"
      title="Share article on LinkedIn, Twitter, or copy link"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-600" />
          <span className="text-emerald-700">Link Copied!</span>
        </>
      ) : (
        <>
          <Share2 className="h-3.5 w-3.5" />
          <span>Share</span>
        </>
      )}
    </button>
  );
}
