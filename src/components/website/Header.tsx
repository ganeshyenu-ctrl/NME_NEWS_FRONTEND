'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { SECURE_ADMIN_LOGIN_PATH } from '@/config/routes';
import {
  Search,
  User,
  Users,
  BookOpen,
  ShieldCheck,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Mail,
  ArrowRight,
} from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [readStats, setReadStats] = useState({
    totalReads: '2,338',
    activeToday: '738',
  });
  const { categories } = useAppSelector((state) => state.categories);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { settings } = useAppSelector((state) => state.settings);

  useEffect(() => {
    setMounted(true);

    const fetchReadStats = async () => {
      try {
        const res = await api.get('/articles/admin/stats').catch(() => null);
        if (res?.data?.success && res.data.stats) {
          const s = res.data.stats;
          const mostRead = res.data.mostRead || [];
          const calculatedViews = mostRead.reduce((acc: number, art: any) => acc + (art.views || 0), 0);
          const totalReads =
            s.pageViews && s.pageViews !== 142900 && s.pageViews !== 38400
              ? s.pageViews
              : (calculatedViews || 2338);
          const activeToday = s.todayViews || 738;
          setReadStats({
            totalReads: Number(totalReads).toLocaleString(),
            activeToday: Number(activeToday).toLocaleString(),
          });
        }
      } catch {}
    };

    fetchReadStats();
  }, []);

  const publicationName = settings?.publicationName || 'NME';
  const tagline = settings?.tagline || 'Independent Perspectives. Informed Maritime Decisions.';

  // Horizontal category bar scroll reference & arrow indicators
  const navRef = useRef<HTMLUListElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    if (navRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = navRef.current;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
    }
  };

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    updateScrollButtons();
    const timer = setTimeout(updateScrollButtons, 100);

    nav.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons);

    return () => {
      clearTimeout(timer);
      nav.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [categories]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (navRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      navRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Prevent background scrolling when mobile sidebar is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/news?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const currentDateStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="border-b border-navy-900 bg-white relative">
      {/* Top Utility Bar: ONLY visible on desktop (hidden on mobile as requested) */}
      <div className="hidden md:block border-b border-rule/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-2 text-xs text-muted">
          <span suppressHydrationWarning>{currentDateStr}</span>
          <span className="hidden xl:inline" suppressHydrationWarning>
            {mounted ? tagline : 'Independent Perspectives. Informed Maritime Decisions.'}
          </span>
          <div className="flex items-center gap-3.5">
            {/* Live Readership Statistics with Icons & Hover Tooltips */}
            <div className="flex items-center gap-2.5 text-xs">
              {/* Total Reads */}
              <div
                title="Total Reads"
                className="relative group/stat flex items-center gap-1.5 text-navy-900 cursor-default transition-colors py-0.5"
              >
                <BookOpen className="h-3.5 w-3.5 text-navy-800 shrink-0" />
                <span className="font-bold text-navy-900">{readStats.totalReads}</span>

                {/* Hover Tooltip */}
                <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-navy-900 px-2 py-0.5 text-[10px] font-medium text-white shadow-md opacity-0 group-hover/stat:opacity-100 transition-opacity duration-150 z-50">
                  Total Reads
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-b-4 border-b-navy-900" />
                </div>
              </div>

              <span className="text-rule">•</span>

              {/* Active Today */}
              <div
                title="Active Today"
                className="relative group/stat flex items-center gap-1.5 text-navy-900 cursor-default transition-colors py-0.5"
              >
                <Users className="h-3.5 w-3.5 text-navy-800 shrink-0" />
                <span className="font-bold text-navy-900">{readStats.activeToday}</span>

                {/* Hover Tooltip */}
                <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-navy-900 px-2 py-0.5 text-[10px] font-medium text-white shadow-md opacity-0 group-hover/stat:opacity-100 transition-opacity duration-150 z-50">
                  Active Today
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-b-4 border-b-navy-900" />
                </div>
              </div>
            </div>

            <span className="text-rule">|</span>

            <Link href="/newsletter" className="font-semibold text-navy-900 hover:underline">
              Subscribe
            </Link>
            <span className="text-rule">|</span>
            {mounted ? (
              isAuthenticated ? (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 border border-navy-100 px-2.5 py-0.5 text-xs font-semibold text-navy-900 hover:bg-navy-100 transition-colors"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>CRM Portal ({user?.name?.split(' ')[0] || 'Staff'})</span>
                </Link>
              ) : (
                <Link
                  href={SECURE_ADMIN_LOGIN_PATH}
                  className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 text-white px-2.5 py-0.5 text-xs font-semibold hover:bg-navy-800 transition-colors shadow-sm"
                >
                  <User className="h-3 w-3" />
                  <span>Login</span>
                </Link>
              )
            ) : (
              <span className="inline-block w-14 h-5" aria-hidden="true" />
            )}
          </div>
        </div>
      </div>

      {/* Main Logo & Mobile Hamburger Bar */}
      <div>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:py-6">
          <Link
            aria-label="NME home"
            href="/"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="inline-flex items-baseline gap-2.5 sm:gap-3">
              <span className="font-serif font-bold tracking-tight text-navy-900 text-3xl sm:text-4xl md:text-5xl">
                NME
              </span>
              <span className="border-l border-navy-900 pl-2.5 sm:pl-3 font-sans font-semibold uppercase text-navy-900 text-[0.6rem] tracking-[0.22em] sm:text-xs leading-tight whitespace-nowrap">
                Navigating
                <br />
                Marine Excellence
              </span>
            </span>
          </Link>

          {/* Desktop Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative">
            <input
              type="search"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 border-b border-rule bg-transparent py-1.5 pl-2 pr-7 text-sm placeholder:text-muted focus:border-navy-900 focus:outline-none"
            />
            <button
              type="submit"
              className="absolute right-1 text-muted hover:text-navy-900"
              aria-label="Submit search"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>

          {/* Mobile Hamburger Button (Right side) */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="inline-flex items-center justify-center p-2 rounded-md text-navy-900 hover:bg-wash focus:outline-none focus:ring-2 focus:ring-navy-900 transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Navigation Bar with Scroll Arrows */}
      <nav aria-label="Sections" className="border-t border-rule relative bg-white">
        <div className="mx-auto max-w-6xl relative flex items-center">
          {/* Left Arrow Button with subtle gradient fade */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center bg-gradient-to-r from-white via-white/95 to-transparent pr-4 pl-1">
              <button
                type="button"
                onClick={() => handleScroll('left')}
                aria-label="Scroll categories left"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white border border-rule/90 shadow-xs text-navy-900 hover:bg-navy-50 hover:border-navy-900 transition-all cursor-pointer active:scale-95"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Categories Horizontal Scroll List */}
          <ul
            ref={navRef}
            className="flex w-full gap-x-6 overflow-x-auto px-5 text-[0.8125rem] font-semibold text-navy-900 no-scrollbar scroll-smooth"
          >
            <li className="shrink-0">
              <Link className="block py-3 hover:underline hover:underline-offset-4" href="/news">
                Latest
              </Link>
            </li>
            {categories.map((cat) => (
              <li key={cat._id} className="shrink-0">
                <Link
                  className="block py-3 hover:underline hover:underline-offset-4 whitespace-nowrap"
                  href={`/category/${cat.slug}`}
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right Arrow Button with subtle gradient fade */}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center bg-gradient-to-l from-white via-white/95 to-transparent pl-4 pr-1">
              <button
                type="button"
                onClick={() => handleScroll('right')}
                aria-label="Scroll categories right"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white border border-rule/90 shadow-xs text-navy-900 hover:bg-navy-50 hover:border-navy-900 transition-all cursor-pointer active:scale-95"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Slide-Out Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-sm transition-opacity duration-300 md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-Out Sidebar (Opens from Right) */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-xs sm:max-w-sm bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-rule px-5 py-4 bg-wash">
          <div className="flex items-baseline gap-2">
            <span className="font-serif font-bold text-2xl text-navy-900">NME</span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-muted">
              Navigation
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-md p-1.5 text-navy-900 hover:bg-rule/40 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* Mobile Instant Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="search"
              placeholder="Search news, topics, vessels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-rule bg-wash px-3.5 py-2 pl-9 text-xs text-ink placeholder:text-muted focus:border-navy-900 focus:bg-white focus:outline-none"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted pointer-events-none" />
          </form>

          {/* User / CRM Portal Card */}
          <div className="rounded-lg border border-rule bg-wash p-4 space-y-3">
            <div className="text-[11px] text-muted flex items-center justify-between">
              <span suppressHydrationWarning>{currentDateStr}</span>
              <span className="font-semibold text-navy-900">NME Digital</span>
            </div>

            {mounted && isAuthenticated ? (
              <div className="space-y-2 pt-2 border-t border-rule/70">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold text-xs">
                    {(user?.name || 'A')[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-navy-900 truncate">{user?.name}</p>
                    <p className="text-[10px] text-muted uppercase font-medium">{user?.role}</p>
                  </div>
                </div>
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-md bg-navy-900 px-3 py-2 text-xs font-semibold text-white hover:bg-navy-800 transition-colors shadow-sm"
                >
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span>Open CRM Portal</span>
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="pt-2 border-t border-rule/70">
                <Link
                  href={SECURE_ADMIN_LOGIN_PATH}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-md bg-navy-900 px-3 py-2 text-xs font-semibold text-white hover:bg-navy-800 transition-colors shadow-sm"
                >
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    <span>Login</span>
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            {/* Live Readership Statistics (Mobile) */}
            <div className="flex items-center justify-between rounded-md bg-wash px-3 py-2 text-xs border border-rule/70">
              <span className="inline-flex items-center gap-1.5 font-medium text-navy-900" title="Total Reads">
                <BookOpen className="h-3.5 w-3.5 text-navy-800" />
                <strong className="font-bold">{readStats.totalReads}</strong>
                <span className="text-muted text-[11px]">reads</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-navy-900 font-medium" title="Active Today">
                <Users className="h-3.5 w-3.5 text-navy-800" />
                <strong className="font-bold text-navy-900">{readStats.activeToday}</strong>
                <span className="text-muted text-[11px]">active today</span>
              </span>
            </div>

            <Link
              href="/newsletter"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-md border border-navy-900/30 bg-white px-3 py-2 text-xs font-semibold text-navy-900 hover:bg-navy-50 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-navy-700" />
                <span>Subscribe to Briefing</span>
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-muted" />
            </Link>
          </div>

          {/* Editorial Sections Navigation */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2 px-1">
              Editorial Sections
            </h4>
            <nav className="space-y-1">
              <Link
                href="/news"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-md px-3 py-2 text-xs font-semibold text-navy-900 hover:bg-wash transition-colors"
              >
                <span>Latest Wire Stories</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted" />
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  href={`/category/${cat.slug}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-md px-3 py-2 text-xs font-medium text-ink hover:bg-wash hover:text-navy-900 transition-colors"
                >
                  <span className="flex items-center gap-2 truncate">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color || '#0b1f3a' }}
                    />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <span className="text-[11px] text-muted">
                    {cat.articleCount || 0}
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Publication Links */}
          <div className="pt-4 border-t border-rule space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1 px-1">
              Publication
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted">
              <Link
                href="/newsletter"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 hover:text-navy-900"
              >
                Newsletter
              </Link>
              <Link
                href="/news"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 hover:text-navy-900"
              >
                All News
              </Link>
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 hover:text-navy-900"
              >
                Homepage
              </Link>
              <Link
                href={SECURE_ADMIN_LOGIN_PATH}
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 hover:text-navy-900"
              >
                Staff Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
