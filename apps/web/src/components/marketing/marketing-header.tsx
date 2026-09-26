'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { AuthModal } from '@/components/auth/auth-modal';
import { AdminWaitlistModal } from '@/components/admin/admin-waitlist-modal';
import { ArrowRight, Key, ShieldCheck } from 'lucide-react';

export function MarketingHeader() {
  const { isAuthenticated, user, openAuthModal } = useAuth();
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tighter">
            GroundWave<span className="text-sky-500">.</span>
          </Link>
          <nav className="flex items-center gap-3 sm:gap-6">
            <Link href="/manifesto" className="text-sm text-gray-300 hover:text-white transition-colors">
              Manifesto
            </Link>
            {user?.isPlatformAdmin && (
              <button
                type="button"
                onClick={() => setIsAdminModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 py-1 px-2.5 rounded-full border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition-all cursor-pointer"
              >
                <ShieldCheck size={13} />
                <span>Admin Console</span>
              </button>
            )}
            {isAuthenticated ? (
              <Link
                href="/feed"
                className="text-sm font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
              >
                <span>Enter App</span>
                <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="text-sm text-gray-300 hover:text-white transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal('register')}
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 py-1.5 px-3 rounded-full border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 transition-all cursor-pointer"
                >
                  <Key size={13} />
                  <span>Alpha Access</span>
                </button>
              </>
            )}
            <a
              href="#waitlist"
              className="text-sm font-medium text-black bg-white px-4 py-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              Join Waitlist
            </a>
          </nav>
        </div>
      </header>
      <AuthModal />
      <AdminWaitlistModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} />
    </>
  );
}
