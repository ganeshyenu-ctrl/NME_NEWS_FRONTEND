'use client';

import React from 'react';
import Link from 'next/link';
import Header from '@/components/website/Header';
import Footer from '@/components/website/Footer';
import { useAppSelector } from '@/store/hooks';
import { ShieldCheck, Mail, Lock } from 'lucide-react';

export default function PrivacyPage() {
  const { settings } = useAppSelector((state) => state.settings);

  const publicationName = settings?.publicationName || 'NME';
  const contactEmail = settings?.contactEmail || 'contact@nmepublications.com';
  const privacyText =
    settings?.privacyText ||
    `1. Information We Collect\n${publicationName} is committed to data minimization. We only collect the minimal information necessary to deliver newsletter briefings (email address and sector preferences), facilitate authenticated editorial staff operations, and render real-time interactive reader analytics.\n\n2. How We Use Information\nCollected information is strictly used to:\n- Deliver opt-in daily and weekly maritime briefings.\n- Maintain real-time WebSocket reader count rooms and discussion moderation.\n- Prevent automated brute force attacks and safeguard publication infrastructure.\n\n3. Data Sharing & Third Parties\nWe do not sell, rent, or trade reader personal data to any third-party advertisers or data brokers. Media assets are securely stored via Cloudinary CDN under encrypted transport.\n\n4. Your Rights\nYou may unsubscribe from our newsletter at any time via the link in any dispatch, or contact our Data Privacy Officer to request permanent removal of your data.`;

  return (
    <div className="min-h-screen flex flex-col bg-white text-ink">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-5 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav className="text-xs text-muted mb-6 flex items-center gap-2" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-navy-900 hover:underline">
            Home
          </Link>
          <span>/</span>
          <span className="text-navy-900 font-semibold">Privacy Notice</span>
        </nav>

        {/* Hero */}
        <div className="border-b border-rule pb-8 mb-8">
          <span className="text-[10px] font-bold uppercase tracking-widest text-navy-700 bg-navy-50 border border-navy-200 px-2.5 py-1 rounded inline-block mb-3">
            Data Protection & Privacy
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold text-navy-900 tracking-tight">
            Privacy Notice
          </h1>
          <p className="mt-2 text-sm text-muted">
            Transparency on reader data collection and protection for {publicationName}
          </p>
        </div>

        {/* Body */}
        <div className="space-y-6">
          <div className="bg-wash/40 border border-rule/80 rounded-lg p-6 sm:p-8">
            <div className="flex items-center gap-2.5 mb-4 text-navy-900 font-serif font-bold text-lg border-b border-rule pb-2">
              <ShieldCheck className="h-5 w-5" />
              <span>Data Protection & Privacy Commitments</span>
            </div>
            <div className="prose prose-navy max-w-none whitespace-pre-line text-sm sm:text-base leading-relaxed text-ink/80">
              {privacyText}
            </div>
          </div>

          <div className="border border-rule rounded-lg p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
            <div>
              <h3 className="font-semibold text-navy-900 text-sm">Privacy Concerns or Data Requests?</h3>
              <p className="text-xs text-muted mt-0.5">Reach our dedicated data protection officer.</p>
            </div>
            {contactEmail && (
              <a
                href={`mailto:${contactEmail}`}
                className="inline-flex items-center gap-2 rounded-md bg-navy-900 text-white px-4 py-2 text-xs font-semibold hover:bg-navy-800 transition-colors shrink-0"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Contact Privacy Desk</span>
              </a>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
