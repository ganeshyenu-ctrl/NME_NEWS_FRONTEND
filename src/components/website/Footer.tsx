import React from 'react';
import Link from 'next/link';
import { SECURE_ADMIN_LOGIN_PATH } from '@/config/routes';

export default function Footer() {
  return (
    <footer className="border-t-2 border-navy-900 bg-navy-950 text-navy-100">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="inline-flex items-baseline gap-3">
              <span className="font-serif font-bold text-3xl tracking-tight text-white">NME</span>
              <span className="border-l border-white/20 pl-3 font-sans font-semibold uppercase text-xs tracking-wider text-navy-100">
                Navigating Marine Excellence
              </span>
            </div>
            <p className="text-sm text-navy-100/70 max-w-md leading-relaxed">
              Independent perspectives and informed maritime intelligence. Critical analysis across commercial
              shipping, green propulsion, regulatory mandates, and port operations.
            </p>
            <div className="pt-2 text-xs text-navy-100/50">
              © {new Date().getFullYear()} Navigating Marine Excellence. All rights reserved.
            </div>
          </div>

          {/* Quick Links */}
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
                <Link href="/category/environment-and-sustainability" className="hover:text-white hover:underline">
                  Decarbonisation
                </Link>
              </li>
              <li>
                <Link href="/category/ports-and-logistics" className="hover:text-white hover:underline">
                  Ports & Logistics
                </Link>
              </li>
            </ul>
          </div>

          {/* Editorial & CRM */}
          <div>
            <h3 className="font-semibold text-white uppercase text-xs tracking-wider mb-3">Platform</h3>
            <ul className="space-y-2 text-xs text-navy-100/80">
              <li>
                <Link href="/newsletter" className="hover:text-white hover:underline">
                  Newsletter Briefing
                </Link>
              </li>
              <li>
                <Link href={SECURE_ADMIN_LOGIN_PATH} className="hover:text-white hover:underline">
                  Editorial CRM
                </Link>
              </li>
              <li>
                <Link href="/news" className="hover:text-white hover:underline">
                  All Wire Dispatches
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
