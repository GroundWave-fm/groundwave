'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  MapPin,
  Disc,
  Play,
  Users,
  Calendar,
  Activity,
  Music,
} from 'lucide-react';
import { useAudio } from '@/context/audio-context';
import { SoundRecording } from '@groundwave/types';

interface DynamicRelease {
  id: string;
  title: string;
  releaseType: string;
  coverArtUrl?: string;
  createdAt: string;
  artist: {
    id: string;
    name: string;
    type: string;
    city: string;
  };
  track: {
    id: string;
    title: string;
    durationSeconds: number;
    hlsMasterManifestUrl: string;
    losslessFlacUrl?: string;
  };
}

function ReleaseCoverArt({ url, title }: { url?: string; title: string }) {
  const [hasError, setHasError] = useState(false);

  if (!url || hasError) {
    return <Disc size={40} className="text-indigo-400 group-hover:rotate-45 transition-transform duration-300" />;
  }

  return (
    <img
      src={url}
      alt={title}
      onError={() => setHasError(true)}
      className="w-full h-full object-cover"
    />
  );
}

export default function HomePage() {
  const { currentCity, sceneRadiusMiles } = useAuth();
  const { playTrack } = useAudio();

  const [releases, setReleases] = useState<DynamicRelease[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReleases() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const res = await fetch(`${apiUrl}/api/v1/releases`);
        if (res.ok) {
          const data = await res.json();
          setReleases(data.releases || []);
        }
      } catch (err) {
        console.error('Failed to fetch dynamic releases:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReleases();
  }, []);

  const handlePlayRelease = (rel: DynamicRelease) => {
    const soundRecording: SoundRecording = {
      id: rel.track.id,
      title: rel.title || rel.track.title,
      artistName: rel.artist.name,
      coverArtUrl: rel.coverArtUrl,
      durationSeconds: rel.track.durationSeconds || 180,
      hlsMasterManifestUrl: rel.track.hlsMasterManifestUrl,
      losslessFlacUrl: rel.track.losslessFlacUrl,
      playCount: 1,
      createdAt: rel.createdAt,
    };

    const queue = releases.map((r) => ({
      id: r.track.id,
      title: r.title || r.track.title,
      artistName: r.artist.name,
      coverArtUrl: r.coverArtUrl,
      durationSeconds: r.track.durationSeconds || 180,
      hlsMasterManifestUrl: r.track.hlsMasterManifestUrl,
      losslessFlacUrl: r.track.losslessFlacUrl,
      playCount: 1,
      createdAt: r.createdAt,
    }));

    playTrack(soundRecording, queue);
  };

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
        </div>
      </section>

      {/* Local Scene Radio & Fresh Drops */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm text-gray-300 uppercase tracking-widest flex items-center gap-2">
            <Activity size={16} className="text-sky-500" />
            <span>Fresh Drops in {currentCity}</span>
          </h2>
          <span className="text-xs text-gray-500">{releases.length} releases available</span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-2xl bg-[#13131a] border border-[#22222e] animate-pulse h-48" />
            ))}
          </div>
        ) : releases.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#13131a] border border-[#22222e] text-center text-gray-400">
            <Music className="mx-auto h-8 w-8 text-gray-600 mb-2" />
            <p>No active releases found in this scene resolution yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {releases.map((rel) => (
              <div key={rel.id} className="p-4 rounded-2xl bg-[#13131a] border border-[#22222e] hover:border-sky-500/40 transition-all group relative">
                <div className="aspect-square rounded-xl bg-gradient-to-br from-indigo-900 to-slate-900 mb-3 flex items-center justify-center relative overflow-hidden">
                  <ReleaseCoverArt url={rel.coverArtUrl} title={rel.title} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <button
                      onClick={() => handlePlayRelease(rel)}
                      className="w-12 h-12 rounded-full bg-sky-500 flex items-center justify-center text-black shadow-lg cursor-pointer hover:scale-105 transition-transform"
                    >
                      <Play size={20} className="fill-black ml-0.5" />
                    </button>
                  </div>
                </div>
                <p className="font-bold text-sm text-white truncate">{rel.title}</p>
                <p className="text-xs text-gray-400 truncate">{rel.artist.name} &bull; {rel.artist.city || currentCity}</p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                  <span className="text-emerald-400 font-mono">24-bit Lossless</span>
                  <span>{rel.artist.city || currentCity}</span>
                </div>
              </div>
            ))}
          </div>
        )}
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
          </div>
        </div>
      </div>
    </div>
  );
}
