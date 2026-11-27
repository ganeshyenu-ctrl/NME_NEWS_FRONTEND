'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginUser, clearAuthError } from '@/store/slices/authSlice';
import {
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function SecureAdminLoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    dispatch(clearAuthError());
    if (isAuthenticated) {
      router.push('/admin');
    }
  }, [isAuthenticated, router, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(result)) {
      router.push('/admin');
    }
  };

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row bg-white overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* ================= LEFT BRAND PANEL (Matches Reference Design) ================= */}
      <div className="relative hidden lg:flex lg:w-[48%] xl:w-[50%] h-full bg-gradient-to-br from-[#1b3298] via-[#2445c7] to-[#14267e] p-10 xl:p-14 flex-col justify-between overflow-hidden text-white">
        {/* Abstract Geometric Line Arcs Background Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden" aria-hidden="true">
          <svg
            className="absolute -right-24 top-1/2 -translate-y-1/2 w-[680px] h-[680px] text-white"
            viewBox="0 0 500 500"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            <circle cx="400" cy="250" r="120" />
            <circle cx="400" cy="250" r="180" />
            <circle cx="400" cy="250" r="240" />
            <circle cx="400" cy="250" r="300" />
            <circle cx="400" cy="250" r="360" />
            <circle cx="400" cy="250" r="420" />
          </svg>
        </div>

        {/* Ambient Radial Glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-900/40 blur-3xl pointer-events-none" />

        {/* Top: Starburst / Asterisk Icon */}
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center">
            {/* 8-pointed Asterisk Emblem matching reference image */}
            <svg
              className="w-12 h-12 text-white"
              viewBox="0 0 32 32"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.2"
              strokeLinecap="round"
            >
              <line x1="16" y1="3" x2="16" y2="29" />
              <line x1="3" y1="16" x2="29" y2="16" />
              <line x1="6.8" y1="6.8" x2="25.2" y2="25.2" />
              <line x1="6.8" y1="25.2" x2="25.2" y2="6.8" />
            </svg>
          </div>
        </div>

        {/* Middle: Headline & Value Proposition */}
        <div className="relative z-10 my-auto py-6">
          <h2 className="text-4xl xl:text-[50px] font-extrabold text-white tracking-tight leading-[1.12]">
            Hello<br />
            <span>NME Portal</span>
          </h2>

          <p className="mt-5 text-white/85 text-sm xl:text-base leading-relaxed max-w-md font-normal">
            Independent Perspectives. Informed Maritime Decisions. Access the high-performance editorial
            engine, publish wire dispatches, and manage global maritime intelligence in real time.
          </p>
        </div>

        {/* Bottom: Copyright */}
        <div className="relative z-10 pt-4 border-t border-white/10 text-xs text-white/60">
          <span>© 2026 Charter Fleet Marine. All rights reserved.</span>
        </div>
      </div>

      {/* ================= RIGHT FORM PANEL (Fits in Viewport, Zero Scroll) ================= */}
      <div className="flex-1 h-full flex flex-col justify-between p-6 sm:p-8 lg:p-10 xl:p-12 bg-white overflow-y-auto lg:overflow-hidden">
        {/* Top Bar: Brand Logo & Back Link */}
        <div className="flex items-center justify-between w-full max-w-[420px] mx-auto">
          <div className="flex items-center gap-2">
            <span className="font-serif font-black text-2xl tracking-tight text-navy-900">
              NME
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-navy-50 text-navy-700 px-2 py-0.5 rounded border border-navy-100">
              Editorial CRM
            </span>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-navy-900 transition-colors group"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Public Website</span>
          </Link>
        </div>

        {/* Center: Sign-in Form */}
        <div className="w-full max-w-[420px] mx-auto my-auto py-2">
          <div>
            <h1 className="text-2xl sm:text-[30px] font-bold text-gray-950 tracking-tight font-sans">
              Welcome Back!
            </h1>
            <p className="mt-1 text-xs text-gray-500 leading-relaxed">
              Sign in to access your newsroom workspace, editorial dossiers, and wire controls.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-900 flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5" noValidate>
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                autoComplete="username"
                placeholder="name@nmepublication.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 focus:outline-none transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-800">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-gray-500 hover:text-gray-900 inline-flex items-center gap-1 font-medium"
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      <span>Show</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 focus:outline-none transition-all pr-10"
                />
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Solid Black Login Button (Matching reference) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gray-950 hover:bg-black text-white font-semibold rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-50 cursor-pointer active:scale-[0.99] mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Login Now'}</span>
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </div>

        {/* Bottom Editorial Note */}
        <div className="w-full max-w-[420px] mx-auto text-center text-[11px] text-gray-400 py-1">
          <span>Navigating Marine Excellence • Editorial Management System</span>
        </div>
      </div>
    </div>
  );
}
