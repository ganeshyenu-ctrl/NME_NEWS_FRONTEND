'use client';

import React from 'react';
import Link from 'next/link';
import Header from '@/components/website/Header';
import Footer from '@/components/website/Footer';
import { useAppSelector } from '@/store/hooks';
import { Scale, Mail } from 'lucide-react';

export default function TermsPage() {
  const { settings } = useAppSelector((state) => state.settings);

  const publicationName = settings?.publicationName || 'NME';
  const contactEmail = settings?.contactEmail || 'contact@nmepublications.com';
  const termsText =
    settings?.termsText ||
    `1. Acceptance of Terms\nBy accessing and using ${publicationName}, you agree to be bound by these Terms of Service, all applicable laws, and regulations.\n\n2. Intellectual Property Rights\nAll original articles, editorial dispatches, market analyses, infographics, and digital assets published on ${publicationName} are the exclusive intellectual property of the publisher and protected by international copyright laws. Reproduction, redistribution, or commercial syndication without prior written editorial consent is strictly prohibited.\n\n3. Reader Comments & Discussion\nReaders participating in article discussions agree to maintain professional decorum. Libelous, abusive, infringing, or defamatory commentary will be removed without notice, and violating accounts may be permanently blocked.\n\n4. Limitation of Liability\nArticles published on ${publicationName} provide journalistic reporting and executive intelligence. Content is not intended as financial, legal, or investment advice.`;

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
          <span className="text-navy-900 font-semibold">Terms of Service</span>
        </nav>

        {/* Hero */}
        <div className="border-b border-rule pb-8 mb-8">
          <span className="text-[10px] font-bold uppercase tracking-widest text-navy-700 bg-navy-50 border border-navy-200 px-2.5 py-1 rounded inline-block mb-3">
            Legal & Compliance
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold text-navy-900 tracking-tight">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-muted">
            Last revised for {publicationName} • Effective as of 2026
          </p>
        </div>

        {/* Body */}
        <div className="space-y-6">
          <div className="bg-wash/40 border border-rule/80 rounded-lg p-6 sm:p-8">
            <div className="flex items-center gap-2.5 mb-4 text-navy-900 font-serif font-bold text-lg border-b border-rule pb-2">
              <Scale className="h-5 w-5" />
              <span>Editorial Terms & Conditions</span>
            </div>
            <div className="prose prose-navy max-w-none whitespace-pre-line text-sm sm:text-base leading-relaxed text-ink/80">
              {termsText}
            </div>
          </div>

          <div className="border border-rule rounded-lg p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
            <div>
              <h3 className="font-semibold text-navy-900 text-sm">Questions Regarding Terms?</h3>
              <p className="text-xs text-muted mt-0.5">Contact our legal and syndication compliance desk.</p>
            </div>
            {contactEmail && (
              <a
                href={`mailto:${contactEmail}`}
                className="inline-flex items-center gap-2 rounded-md bg-navy-900 text-white px-4 py-2 text-xs font-semibold hover:bg-navy-800 transition-colors shrink-0"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Contact Legal Desk</span>
              </a>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
