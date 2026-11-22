'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { SidebarProvider, useAdminSidebar } from '@/components/admin/AdminSidebarContext';
import { SECURE_ADMIN_LOGIN_PATH } from '@/config/routes';

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { isCollapsed, setIsCollapsed, isMobile } = useAdminSidebar();

  return (
    <div className="min-h-screen bg-wash flex flex-col relative overflow-x-hidden">
      {/* Mobile Backdrop when sidebar is expanded on mobile screens */}
      {!isCollapsed && isMobile && (
        <div
          onClick={() => setIsCollapsed(true)}
          className="fixed inset-0 z-30 bg-navy-950/50 backdrop-blur-xs transition-opacity lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Responsive Collapsible Sidebar */}
      <AdminSidebar />

      {/* Main Content Area: dynamically adjusts left padding based on collapsed state */}
      <div
        className={`min-h-screen flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'pl-16' : 'pl-16 lg:pl-60'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const isLoginPage =
    pathname === SECURE_ADMIN_LOGIN_PATH ||
    pathname.includes('secure-login') ||
    pathname === '/admin/login';

  useEffect(() => {
    // If not authenticated and not on login page, redirect to secure login
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('nme_access_token');
      if (!token && !isLoginPage) {
        router.push(SECURE_ADMIN_LOGIN_PATH);
      }
    }
  }, [isAuthenticated, isLoginPage, router]);

  // If on login page, render full screen without sidebar
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </SidebarProvider>
  );
}
