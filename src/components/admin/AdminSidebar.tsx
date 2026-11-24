'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logoutUser } from '@/store/slices/authSlice';
import { useAdminSidebar } from './AdminSidebarContext';
import { SECURE_ADMIN_LOGIN_PATH } from '@/config/routes';
import {
  LayoutDashboard,
  FileText,
  SquarePen,
  Image as ImageIcon,
  FolderTree,
  Users,
  Settings,
  ShieldAlert,
  LogOut,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  UserCheck,
} from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { isCollapsed, toggleCollapse } = useAdminSidebar();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.push(SECURE_ADMIN_LOGIN_PATH);
  };

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Articles', href: '/admin/articles', icon: FileText },
    { label: 'Create Article', href: '/admin/articles/create', icon: SquarePen },
    { label: 'Media Library', href: '/admin/media', icon: ImageIcon },
    { label: 'My Profile', href: '/admin/profile', icon: UserCheck },
    ...(user?.role === 'admin' || user?.role === 'editor'
      ? [{ label: 'Categories', href: '/admin/categories', icon: FolderTree }]
      : []),
    ...(user?.role === 'admin'
      ? [
          { label: 'Users & Roles', href: '/admin/users', icon: Users },
          { label: 'Audit Logs', href: '/admin/audit-log', icon: ShieldAlert },
          { label: 'Settings', href: '/admin/settings', icon: Settings },
        ]
      : []),
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-navy-950 text-navy-100 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-60 shadow-2xl'
      }`}
    >
      {/* Floating Arrow Toggle Button to minimize/expand sidebar */}
      <button
        type="button"
        onClick={toggleCollapse}
        className="absolute -right-3 top-5 z-50 flex h-6 w-6 items-center justify-center rounded-full bg-navy-900 border border-white/20 text-white shadow-md hover:bg-navy-800 transition-transform active:scale-95 focus:outline-none"
        title={isCollapsed ? 'Expand sidebar' : 'Minimise sidebar to icons only'}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Minimise sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Top Branding Section */}
      <div
        className={`border-b border-white/10 flex items-center transition-all duration-300 ${
          isCollapsed ? 'h-16 justify-center px-2' : 'h-16 justify-between px-5'
        }`}
      >
        {isCollapsed ? (
          <Link
            href="/"
            title="NME Public Site"
            className="font-serif text-xl font-bold text-white tracking-tight hover:text-navy-100"
          >
            NME
          </Link>
        ) : (
          <Link href="/" className="group flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-white tracking-tight">NME</span>
            <span className="text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-navy-100/70 group-hover:text-white transition-colors">
              Editorial CRM
            </span>
          </Link>
        )}
      </div>

      {/* Main Navigation List */}
      <nav aria-label="Administration" className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center rounded-md text-sm font-medium transition-all ${
                isCollapsed
                  ? 'justify-center p-2.5 mx-auto'
                  : 'gap-2.5 px-3 py-2'
              } ${
                isActive
                  ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10'
                  : 'hover:bg-white/5 hover:text-white text-navy-100/80'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User profile & actions */}
      <div className="border-t border-white/10 p-2 bg-navy-950/60">
        {!isCollapsed && (
          <div className="flex items-center justify-between mb-2 px-2">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs text-navy-100/70 hover:text-white transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              <span>Public Site</span>
            </Link>
          </div>
        )}

        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Link
              href="/admin/profile"
              className="h-8 w-8 rounded-full bg-navy-800 border border-white/20 flex items-center justify-center font-bold text-white text-xs hover:border-white transition-all overflow-hidden"
              title={`View Profile: ${user?.name || 'Administrator'} (${user?.role || 'admin'})`}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                (user?.name || 'A')[0]
              )}
            </Link>
            <button
              onClick={handleLogout}
              className="text-navy-100/60 hover:text-white p-1.5 rounded hover:bg-white/10 transition-colors"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-md p-2 bg-white/5 hover:bg-white/10 transition-colors">
            <Link
              href="/admin/profile"
              className="h-8 w-8 rounded-full bg-navy-800 border border-white/20 flex items-center justify-center font-bold text-white text-xs shrink-0 overflow-hidden hover:border-white transition-all"
              title="View & Edit Profile"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                (user?.name || 'A')[0]
              )}
            </Link>
            <Link href="/admin/profile" className="flex-1 min-w-0 group" title="View & Edit Profile">
              <p className="text-xs font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
                {user?.name || 'Administrator'}
              </p>
              <p className="text-[10px] text-navy-100/60 uppercase tracking-wider">{user?.role || 'admin'}</p>
            </Link>
            <button
              onClick={handleLogout}
              className="text-navy-100/60 hover:text-white p-1 rounded hover:bg-white/10 transition-colors shrink-0"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
