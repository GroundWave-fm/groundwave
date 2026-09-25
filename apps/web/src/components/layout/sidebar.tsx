'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
  Radio,
  Compass,
  Disc3,
  Users,
  ShoppingBag,
  Library,
  Sliders,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  requiresAuth?: boolean;
}

const mainNavItems: NavItem[] = [
  { label: 'Home Feed', href: '/', icon: Compass },
  { label: 'Scene Radio', href: '/radio', icon: Radio, badge: 'Live' },
  { label: 'Artist Hubs', href: '/hubs', icon: Disc3 },
  { label: 'Community Sanctums', href: '/sanctum', icon: Users },
  { label: 'Storefront & Merch', href: '/store', icon: ShoppingBag },
  { label: 'Your Library', href: '/library', icon: Library },
];

export function Sidebar() {
  const rawPathname = usePathname();
  const pathname = rawPathname || '/';
  const { user, activeEntity, managedEntities, openAuthModal } = useAuth();

  return (
    <aside className="w-64 shrink-0 bg-[#0e0e12] border-r border-[#1f1f26] flex flex-col h-screen sticky top-0 select-none z-30">
      {/* Platform Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-[#1b1b22]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-black shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Radio size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-sky-400 transition-colors">
                GroundWave
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Alpha
              </span>
            </div>
            <p className="text-[11px] text-gray-400">groundwave.fm</p>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        <div>
          <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Discover
          </p>
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-sky-500/10 text-sky-400 font-semibold shadow-sm'
                      : 'text-gray-300 hover:text-white hover:bg-[#181820]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={isActive ? 'text-sky-400' : 'text-gray-400'} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Creator Studio Section */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Creator Suite
            </p>
            {managedEntities.length > 0 && (
              <span className="text-[10px] font-mono font-semibold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                {managedEntities.length} {managedEntities.length === 1 ? 'Entity' : 'Entities'}
              </span>
            )}
          </div>
          <div className="space-y-1">
            <Link
              href="/studio"
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                pathname.startsWith('/studio')
                  ? 'bg-purple-500/15 text-purple-300 font-semibold'
                  : 'text-gray-300 hover:text-white hover:bg-[#181820]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sliders size={18} className={pathname.startsWith('/studio') ? 'text-purple-400' : 'text-gray-400'} />
                <span>Creator Studio</span>
              </div>
              <Sparkles size={14} className="text-purple-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Banner / Active Creator Status */}
      <div className="p-3 border-t border-[#1b1b22] bg-[#0b0b0e]">
        {activeEntity ? (
          <div className="p-2.5 rounded-xl bg-[#15151c] border border-purple-500/20">
            <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
              <span>Active Collective</span>
              <span className="text-purple-400 uppercase font-semibold font-mono text-[9px]">
                {activeEntity.role}
              </span>
            </div>
            <p className="font-semibold text-xs text-white truncate">{activeEntity.name}</p>
            <p className="text-[10px] text-gray-400 font-mono truncate">@{activeEntity.slug}</p>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#14141d] to-[#1a1a26] border border-[#262634]">
            <p className="font-semibold text-xs text-gray-200 mb-1">Are you an artist or label?</p>
            <p className="text-[11px] text-gray-400 mb-2 leading-relaxed">
              Upload 24-bit lossless masters, manage physical merch, and split payouts.
            </p>
            <button
              onClick={() => {
                if (user) {
                  // If logged in, go to studio setup
                  window.location.href = '/studio';
                } else {
                  openAuthModal('register');
                }
              }}
              className="w-full py-1.5 px-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-purple-600/30"
            >
              <span>Launch Studio</span>
              <ExternalLink size={12} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
