'use client';

import React from 'react';
import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';
import { useAdminSidebar } from './AdminSidebarContext';
import { Radio, ExternalLink, Menu, ChevronRight } from 'lucide-react';

interface Props {
  title: string;
  actions?: React.ReactNode;
}

export default function AdminHeader({ title, actions }: Props) {
  const { isConnected } = useAppSelector((state) => state.socket);
  const { isCollapsed, toggleCollapse, isMobile } = useAdminSidebar();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-rule bg-white px-3 sm:px-6 py-3 sm:py-4 transition-all">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <h1 className="font-serif text-lg sm:text-2xl font-bold text-navy-900 truncate">
          {title}
        </h1>

        {/* Real-time Socket.io indicator (responsive) */}
        <div
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0 ${
            isConnected
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-amber-50 text-amber-900 border border-amber-200'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full shrink-0 ${
              isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          ></span>
          <span className="hidden sm:inline">
            {isConnected ? 'Realtime: Live' : 'Reconnecting'}
          </span>
          <span className="sm:hidden">{isConnected ? 'Live' : 'Offline'}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {actions}
        <Link
          href="/"
          target="_blank"
          className="hidden md:inline-flex items-center gap-1.5 rounded border border-rule px-3 py-1.5 text-xs font-semibold text-navy-900 hover:bg-wash transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          <span>Public Site</span>
        </Link>
      </div>
    </header>
  );
}
