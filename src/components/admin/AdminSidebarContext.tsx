'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  setIsCollapsed: (value: boolean) => void;
  isMobile: boolean;
}

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
  toggleCollapse: () => {},
  setIsCollapsed: () => {},
  isMobile: false,
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // On small mobile screens, default to collapsed (icons only) unless user opened it
      if (mobile && localStorage.getItem('nme_admin_sidebar_collapsed') === null) {
        setIsCollapsed(true);
      }
    };

    // Initial check
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nme_admin_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      } else if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
      handleResize();
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('nme_admin_sidebar_collapsed', String(next));
      }
      return next;
    });
  };

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        toggleCollapse,
        setIsCollapsed,
        isMobile,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export const useAdminSidebar = () => useContext(SidebarContext);
