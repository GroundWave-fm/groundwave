'use client';

import React from 'react';
import { useAuth } from '@/context/auth-context';
import {
  MapPin,
  Disc,
  Play,
  Flame,
  Users,
  Calendar,
} from 'lucide-react';

export default function HomePage() {
  const { currentCity, sceneRadiusMiles, isAuthenticated, openAuthModal } = useAuth();

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">
      {/* Hyperlocal Scene Hero Spotlight */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#12121c] via-[#161624] to-[#0e0e16] border border-[#262638] p-8 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 text-xs font-semibold">
            <MapPin size={13} />
            <span>Hyperlocal Scene Radar &bull; {currentCity} ({sceneRadiusMiles}mi radius)</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Discover underground music where you live.
          </h1>

          <p className="text-sm md:text-base text-gray-300 leading-relaxed">
            Lossless audio streaming, localized continuous scene radios, cassette/vinyl pressings, and direct band fan clubs without algorithm bloat.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                alert(`Starting ${currentCity} Scene Radio stream! (H3 geodesic queue)`);
              }}
              className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-sky-500/25"
            >
              <Play size={16} className="fill-black" />
              <span>Start {currentCity} Scene Radio</span>
            </button>

            {!isAuthenticated && (
              <button
                onClick={() => openAuthModal('register')}
                className="px-5 py-2.5 rounded-xl bg-[#1f1f2a] hover:bg-[#282836] border border-[#303042] text-gray-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                Join Community
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Local Scene Highlights */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Flame size={18} className="text-amber-400" />
              <span>Trending in {currentCity}</span>
            </h2>
            <p className="text-xs text-gray-400">Popular releases and live tracks in your active radius</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1 */}
          <div className="p-4 rounded-2xl bg-[#13131a] border border-[#22222e] hover:border-sky-500/40 transition-all group">
            <div className="aspect-square rounded-xl bg-gradient-to-br from-indigo-900 to-slate-900 mb-3 flex items-center justify-center relative overflow-hidden">
              <Disc size={40} className="text-indigo-400 group-hover:rotate-45 transition-transform duration-300" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <button
                  onClick={() => alert("Queuing track: Echoes on Milwaukee Ave")}
                  className="w-12 h-12 rounded-full bg-sky-500 flex items-center justify-center text-black shadow-lg cursor-pointer hover:scale-105 transition-transform"
                >
                  <Play size={20} className="fill-black ml-0.5" />
                </button>
              </div>
            </div>
            <p className="font-bold text-sm text-white truncate">Echoes on Milwaukee Ave</p>
            <p className="text-xs text-gray-400">The Static Veins &bull; Post-Punk</p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
              <span className="text-emerald-400 font-mono">24-bit Lossless</span>
              <span>Wicker Park, {currentCity}</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-4 rounded-2xl bg-[#13131a] border border-[#22222e] hover:border-sky-500/40 transition-all group">
            <div className="aspect-square rounded-xl bg-gradient-to-br from-purple-900 to-slate-900 mb-3 flex items-center justify-center relative overflow-hidden">
              <Disc size={40} className="text-purple-400 group-hover:rotate-45 transition-transform duration-300" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <button
                  onClick={() => alert("Queuing track: Dusk Over Lake Michigan")}
                  className="w-12 h-12 rounded-full bg-sky-500 flex items-center justify-center text-black shadow-lg cursor-pointer hover:scale-105 transition-transform"
                >
                  <Play size={20} className="fill-black ml-0.5" />
                </button>
              </div>
            </div>
            <p className="font-bold text-sm text-white truncate">Dusk Over Lake Michigan</p>
            <p className="text-xs text-gray-400">Maya Sol &bull; Ambient / Synth</p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
              <span className="text-emerald-400 font-mono">24-bit Lossless</span>
              <span>Logan Square, {currentCity}</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-4 rounded-2xl bg-[#13131a] border border-[#22222e] hover:border-sky-500/40 transition-all group">
            <div className="aspect-square rounded-xl bg-gradient-to-br from-emerald-900 to-slate-900 mb-3 flex items-center justify-center relative overflow-hidden">
              <Disc size={40} className="text-emerald-400 group-hover:rotate-45 transition-transform duration-300" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <button
                  onClick={() => alert("Queuing track: Rust Belt Tapes Vol. 1")}
                  className="w-12 h-12 rounded-full bg-sky-500 flex items-center justify-center text-black shadow-lg cursor-pointer hover:scale-105 transition-transform"
                >
                  <Play size={20} className="fill-black ml-0.5" />
                </button>
              </div>
            </div>
            <p className="font-bold text-sm text-white truncate">Rust Belt Tapes Vol. 1</p>
            <p className="text-xs text-gray-400">Midwest Pressings &bull; Compilation</p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
              <span className="text-purple-400 font-mono">Cassette Available</span>
              <span>Pilsen, {currentCity}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Scene Broadcasts & Live Shows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Broadcast Feed */}
        <div className="p-5 rounded-2xl bg-[#121218] border border-[#20202a] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Users size={16} className="text-sky-400" />
              <span>Sanctum Creator Broadcasts</span>
            </h3>
            <span className="text-[11px] text-gray-400">Live feeds</span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-[#171720] border border-[#252532] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-white">The Static Veins</span>
                <span className="text-[10px] text-gray-400 font-mono">2h ago</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Test pressing vinyl for Static Dreams just arrived! Bandcamp & GroundWave subscribers get first dibs this Friday.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#171720] border border-[#252532] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-white">Midwest Pressings</span>
                <span className="text-[10px] text-gray-400 font-mono">1d ago</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Submissions open for our upcoming Autumn ambient split tape. Local artists in the Midwest corridor DM your master WAVs.
              </p>
            </div>
          </div>
        </div>

        {/* Live Gigs Radar */}
        <div className="p-5 rounded-2xl bg-[#121218] border border-[#20202a] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Calendar size={16} className="text-purple-400" />
              <span>Concert Radar ({currentCity})</span>
            </h3>
            <span className="text-[11px] text-gray-400">Verified venues</span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-[#171720] border border-[#252532] flex items-center justify-between">
              <div>
                <p className="font-semibold text-xs text-white">The Empty Bottle</p>
                <p className="text-xs text-gray-400">The Static Veins + Guest Support</p>
                <p className="text-[10px] text-sky-400 mt-1">Friday, Oct 2 &bull; 8:00 PM</p>
              </div>
              <button
                onClick={() => alert("RSVP / Ticket checkout link")}
                className="px-3 py-1.5 rounded-lg bg-[#242434] hover:bg-[#2e2e42] text-xs font-semibold text-gray-200 transition-colors cursor-pointer"
              >
                RSVP
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#171720] border border-[#252532] flex items-center justify-between">
              <div>
                <p className="font-semibold text-xs text-white">Thalia Hall</p>
                <p className="text-xs text-gray-400">Midwest Ambient Showcase 2026</p>
                <p className="text-[10px] text-purple-400 mt-1">Saturday, Oct 10 &bull; 7:30 PM</p>
              </div>
              <button
                onClick={() => alert("RSVP / Ticket checkout link")}
                className="px-3 py-1.5 rounded-lg bg-[#242434] hover:bg-[#2e2e42] text-xs font-semibold text-gray-200 transition-colors cursor-pointer"
              >
                RSVP
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
