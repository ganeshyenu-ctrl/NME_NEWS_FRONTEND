'use client';

import React from 'react';
import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';
import { SECURE_ADMIN_LOGIN_PATH } from '@/config/routes';
import { Mail, ExternalLink, ShieldCheck } from 'lucide-react';

export default function Footer() {
  const { settings } = useAppSelector((state) => state.settings);

  const publicationName = settings?.publicationName || 'NME';
  const tagline = settings?.tagline || 'Navigating Marine Excellence';
  const contactEmail = settings?.contactEmail || 'contact@nmepublications.com';
  const linkedinUrl = settings?.linkedinUrl || 'https://www.linkedin.com/company/navigating-marine-excellence';
  const aboutSummary =
    settings?.aboutText ||
    'Independent perspectives and informed maritime intelligence. Critical analysis across commercial shipping, green propulsion, regulatory mandates, and port operations.';

  return (
    <footer className="border-t-2 border-navy-900 bg-navy-950 text-navy-100">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Publication Identity */}
          <div className="md:col-span-2 space-y-4">
            <div className="inline-flex items-baseline gap-3">
              <span className="font-serif font-bold text-3xl tracking-tight text-white">
                NME
              </span>
              <span className="border-l border-white/20 pl-3 font-sans font-semibold uppercase text-xs tracking-wider text-navy-100">
                Navigating Marine Excellence
              </span>
            </div>

            <p className="text-sm text-navy-100/70 max-w-md leading-relaxed line-clamp-3">
              {aboutSummary}
            </p>

            {/* Contact Email & Social Link */}
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs">
              {contactEmail && (
                <a
                  href={`mailto:${contactEmail}`}
                  className="inline-flex items-center gap-1.5 text-navy-100/80 hover:text-white transition-colors"
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
                  className="inline-flex items-center gap-1.5 text-navy-100/80 hover:text-white transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>LinkedIn</span>
                </a>
              )}
            </div>

            <div className="pt-2 text-xs text-navy-100/50">
              © {new Date().getFullYear()} Design &amp; Developed by Charter Fleet Marine
            </div>
          </div>

          {/* Quick Sections */}
          <div>
            <h3 className="font-semibold text-white uppercase text-xs tracking-wider mb-3">Sections</h3>
            <ul className="space-y-2 text-xs text-navy-100/80">
              <li>
                <Link href="/news" className="hover:text-white hover:underline">
                  Latest Wire
                </Link>
              </li>
              <li>
                <Link href="/category/shipping" className="hover:text-white hover:underline">
                  Commercial Shipping
                </Link>
              </li>
              <li>
                <Link href="/category/maritime-technology" className="hover:text-white hover:underline">
                  Maritime Technology
                </Link>
              </li>
              <li>
                <Link href="/category/offshore-and-energy" className="hover:text-white hover:underline">
                  Offshore & Energy
                </Link>
              </li>
              <li>
                <Link href="/category/ports-and-logistics" className="hover:text-white hover:underline">
                  Ports & Logistics
                </Link>
              </li>
            </ul>
          </div>

          {/* Editorial Policies, Statements & Platform */}
          <div>
            <h3 className="font-semibold text-white uppercase text-xs tracking-wider mb-3">Policy & Legal</h3>
            <ul className="space-y-2 text-xs text-navy-100/80">
              <li>
                <Link href="/about" className="hover:text-white hover:underline">
                  About {publicationName}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white hover:underline">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white hover:underline">
                  Privacy Notice
                </Link>
              </li>
              <li>
                <Link href="/newsletter" className="hover:text-white hover:underline">
                  Newsletter Briefing
                </Link>
              </li>
              <li>
                <Link href={SECURE_ADMIN_LOGIN_PATH} className="hover:text-white hover:underline flex items-center gap-1">
                  <span>Editorial CRM</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
