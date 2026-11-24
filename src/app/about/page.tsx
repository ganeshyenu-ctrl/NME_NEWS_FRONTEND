'use client';

import React from 'react';
import Link from 'next/link';
import Header from '@/components/website/Header';
import Footer from '@/components/website/Footer';
import { useAppSelector } from '@/store/hooks';
import { Mail, ExternalLink, ShieldCheck, Newspaper, Compass, BookOpen } from 'lucide-react';

export default function AboutPage() {
  const { settings } = useAppSelector((state) => state.settings);

  const publicationName = settings?.publicationName || 'NME';
  const tagline = settings?.tagline || 'Independent Perspectives. Informed Maritime Decisions.';
  const contactEmail = settings?.contactEmail || 'contact@nmepublications.com';
  const linkedinUrl = settings?.linkedinUrl || 'https://www.linkedin.com/company/navigating-marine-excellence';
  const aboutText =
    settings?.aboutText ||
    'Navigating Marine Excellence (NME) is an independent maritime journalism platform providing executive intelligence, investigative fleet reporting, decarbonisation analysis, and regulatory policy dossiers to shipping executives, port operators, and maritime decision-makers globally.';

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
          <span className="text-navy-900 font-semibold">About</span>
        </nav>

        {/* Hero Section */}
        <div className="border-b border-rule pb-8 mb-8">
          <span className="text-[10px] font-bold uppercase tracking-widest text-navy-700 bg-navy-50 border border-navy-200 px-2.5 py-1 rounded inline-block mb-3">
            Editorial Mission & Identity
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold text-navy-900 tracking-tight leading-tight">
            About {publicationName}
          </h1>
          <p className="mt-3 text-base sm:text-lg text-muted font-normal max-w-2xl leading-relaxed">
            {tagline}
          </p>
        </div>

        {/* Content Section */}
        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-ink/90">
          <section className="bg-wash/50 border border-rule/80 rounded-lg p-6 sm:p-8">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-navy-900 mb-4 flex items-center gap-2.5">
              <Compass className="h-5 w-5 text-navy-900" />
              <span>Publication Statement</span>
            </h2>
            <div className="prose prose-navy max-w-none whitespace-pre-line leading-relaxed text-ink/80">
              {aboutText}
            </div>
          </section>

          {/* Pillars */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="border border-rule rounded-lg p-5 bg-white">
              <Newspaper className="h-5 w-5 text-navy-900 mb-3" />
              <h3 className="font-bold text-navy-900 text-sm mb-1.5">Independent Reporting</h3>
              <p className="text-xs text-muted leading-relaxed">
                Free from commercial bias, delivering fact-verified reporting on global shipping markets and fleet movements.
              </p>
            </div>

            <div className="border border-rule rounded-lg p-5 bg-white">
              <ShieldCheck className="h-5 w-5 text-navy-900 mb-3" />
              <h3 className="font-bold text-navy-900 text-sm mb-1.5">Regulatory Intelligence</h3>
              <p className="text-xs text-muted leading-relaxed">
                In-depth analysis of IMO mandates, EU ETS maritime compliance, safety audits, and port state controls.
              </p>
            </div>

            <div className="border border-rule rounded-lg p-5 bg-white">
              <BookOpen className="h-5 w-5 text-navy-900 mb-3" />
              <h3 className="font-bold text-navy-900 text-sm mb-1.5">Verified Sourcing</h3>
              <p className="text-xs text-muted leading-relaxed">
                Original interviews with classification societies, shipowners, naval architects, and energy leaders.
              </p>
            </div>
          </section>

          {/* Contact & Connect */}
          <section className="border-t border-rule pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-navy-900 text-sm">Editorial Enquiries & Press Office</h3>
              <p className="text-xs text-muted mt-0.5">Reach out to our newsroom directly for tips or syndication.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {contactEmail && (
                <a
                  href={`mailto:${contactEmail}`}
                  className="inline-flex items-center gap-2 rounded-md bg-navy-900 text-white px-4 py-2 text-xs font-semibold hover:bg-navy-800 transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>{contactEmail}</span>
                </a>
              )}
              {linkedinUrl && (
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-rule bg-white text-navy-900 px-4 py-2 text-xs font-semibold hover:bg-wash transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>LinkedIn Profile</span>
                </a>
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
