'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  Search,
  MapPin,
  ChevronDown,
  User as UserIcon,
  LogOut,
  Sliders,
  Check,
  Disc3,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { AdminWaitlistModal } from '@/components/admin/admin-waitlist-modal';

const KNOWN_SCENES = [
  { city: 'Chicago', state: 'IL', region: 'Midwest', h3: '882681a339fffff' },
  { city: 'Austin', state: 'TX', region: 'Southwest', h3: '88262a5b11fffff' },
  { city: 'Nashville', state: 'TN', region: 'Southeast', h3: '882649b047fffff' },
  { city: 'Bristol', state: 'UK', region: 'UK Bass', h3: '88195da497fffff' },
  { city: 'London', state: 'UK', region: 'UK Scene', h3: '88195da4b1fffff' },
  { city: 'Berlin', state: 'DE', region: 'Electronic', h3: '881f1d4887fffff' },
  { city: 'Detroit', state: 'MI', region: 'Midwest Techno', h3: '8826856235fffff' },
  { city: 'Minneapolis', state: 'MN', region: 'Midwest', h3: '8826852817fffff' },
];

export function Header() {
  const {
    user,
    isAuthenticated,
    managedEntities,
    activeEntity,
    currentCity,
    sceneRadiusMiles,
    openAuthModal,
    logout,
    switchActiveEntity,
    setSceneLocation
  } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSceneDropdownOpen, setIsSceneDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  const sceneMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sceneMenuRef.current && !sceneMenuRef.current.contains(event.target as Node)) {
        setIsSceneDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="h-16 border-b border-[#1f1f26] bg-[#0c0c10]/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Global Search Bar */}
      <div className="w-96 max-w-md relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search local artists, scene radios, tape labels, venues..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#14141a] border border-[#22222b] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/50 transition-all"
        />
      </div>

      {/* Right Controls: Scene Selector + Auth Context */}
      <div className="flex items-center gap-3">
        {/* Scene Location Pill */}
        <div className="relative" ref={sceneMenuRef}>
          <button
            type="button"
            onClick={() => setIsSceneDropdownOpen(!isSceneDropdownOpen)}
            className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-[#171720] hover:bg-[#1f1f2a] border border-[#272734] text-xs text-gray-200 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-sky-500/15 text-sky-400">
              <MapPin size={12} />
            </div>
            <span className="font-semibold">{currentCity} Scene</span>
            <span className="text-[11px] text-gray-400">({sceneRadiusMiles}mi)</span>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {/* Scene Dropdown */}
          {isSceneDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#14141c] border border-[#272736] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-[#20202c]">
                <p className="text-xs font-bold text-white">Local Scene Discovery</p>
                <p className="text-[11px] text-gray-400">H3 Res 8 Geodesic Radar</p>
              </div>
              <div className="max-h-60 overflow-y-auto py-1 space-y-0.5">
                {KNOWN_SCENES.map((scene) => {
                  const isSelected = currentCity === scene.city;
                  return (
                    <button
                      key={scene.city}
                      onClick={() => {
                        setSceneLocation(scene.city, scene.h3, 15);
                        setIsSceneDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-sky-500/10 text-sky-400 font-semibold'
                          : 'text-gray-300 hover:text-white hover:bg-[#1c1c27]'
                      }`}
                    >
                      <div>
                        <p className="font-medium text-white">
                          {scene.city}, {scene.state}
                        </p>
                        <p className="text-[10px] text-gray-400">{scene.region}</p>
                      </div>
                      {isSelected && <Check size={14} className="text-sky-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Platform Admin Console Button */}
        {isAuthenticated && user?.isPlatformAdmin && (
          <button
            type="button"
            onClick={() => setIsAdminModalOpen(true)}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-semibold transition-all cursor-pointer shadow-sm shadow-amber-500/10"
          >
            <ShieldCheck size={14} className="text-amber-400" />
            <span className="hidden sm:inline">Admin Console</span>
          </button>
        )}

        {/* User Profile / Auth Action */}
        {isAuthenticated && user ? (
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-[#171720] hover:bg-[#1f1f2a] border border-[#272734] transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-black uppercase">
                {user.displayName.substring(0, 2)}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-semibold text-white leading-tight">
                  {activeEntity ? activeEntity.name : user.displayName}
                </p>
                <p className="text-[10px] text-gray-400 leading-tight font-mono">
                  {activeEntity ? `@${activeEntity.slug}` : `@${user.username}`}
                </p>
              </div>
              <ChevronDown size={14} className="text-gray-400" />
            </button>

            {/* User & Entity Switcher Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#14141c] border border-[#272736] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Active Profile Info */}
                <div className="px-3 py-2.5 border-b border-[#20202c]">
                  <p className="text-xs font-bold text-white">{user.displayName}</p>
                  <p className="text-[11px] text-gray-400 font-mono">@{user.username} &bull; {user.email}</p>
                </div>

                {/* Platform Admin Action */}
                {user.isPlatformAdmin && (
                  <div className="py-2 border-b border-[#20202c]">
                    <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1">
                      Platform Administration
                    </p>
                    <button
                      onClick={() => {
                        setIsAdminModalOpen(true);
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-amber-300 hover:bg-amber-500/10 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={14} className="text-amber-400" />
                        <span>Waitlist & Alpha Invites</span>
                      </div>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">Console</span>
                    </button>
                  </div>
                )}

                {/* Creator Entity Switcher */}
                {managedEntities.length > 0 && (
                  <div className="py-2 border-b border-[#20202c]">
                    <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-1">
                      Active Creator Context
                    </p>
                    {/* Personal Fan Option */}
                    <button
                      onClick={() => {
                        switchActiveEntity(null);
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        activeEntity === null
                          ? 'bg-sky-500/10 text-sky-400 font-semibold'
                          : 'text-gray-300 hover:text-white hover:bg-[#1c1c27]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <UserIcon size={14} />
                        <span>Personal Profile</span>
                      </div>
                      {activeEntity === null && <Check size={14} />}
                    </button>

                    {/* Managed Bands & Labels */}
                    {managedEntities.map((entity) => {
                      const isSelected = activeEntity?.id === entity.id;
                      return (
                        <button
                          key={entity.id}
                          onClick={() => {
                            switchActiveEntity(entity.id);
                            setIsUserMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-purple-500/15 text-purple-300 font-semibold'
                              : 'text-gray-300 hover:text-white hover:bg-[#1c1c27]'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Disc3 size={14} className="text-purple-400 shrink-0" />
                            <span className="truncate">{entity.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-purple-400 uppercase">
                            {entity.role}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Account Actions */}
                <div className="pt-1">
                  <button
                    onClick={() => {
                      logout();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openAuthModal('login')}
              className="py-1.5 px-3 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-[#181820] transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => openAuthModal('register')}
              className="py-1.5 px-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black text-xs font-bold transition-colors cursor-pointer shadow-sm shadow-sky-500/20"
            >
              Get Started
            </button>
          </div>
        )}
      </div>
    </header>
    <AdminWaitlistModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} />
  </>
  );
}
