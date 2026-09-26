'use client';

import React from 'react';
import { useAudio } from '@/context/audio-context';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ListMusic, Radio } from 'lucide-react';
import Image from 'next/image';

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function GlobalAudioDock() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    togglePlayPause,
    seekTo,
    nextTrack,
    previousTrack,
    setVolume
  } = useAudio();

  if (!currentTrack) return null;

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-24 bg-[#0a0a0c]/95 backdrop-blur-lg border-t border-white/5 flex items-center justify-between px-6 z-50">
      
      {/* Left: Track Info */}
      <div className="flex items-center w-1/3">
        {currentTrack.coverArtUrl ? (
          <img
            src={currentTrack.coverArtUrl}
            alt={currentTrack.title}
            className="h-14 w-14 rounded object-cover flex-shrink-0"
          />
        ) : (
          <div className="h-14 w-14 rounded bg-gradient-to-br from-indigo-500 to-purple-500 flex-shrink-0" />
        )}
        <div className="ml-4 truncate">
          <div className="text-sm font-semibold text-white truncate">{currentTrack.title}</div>
          <div className="text-xs text-gray-400 truncate mt-0.5">{currentTrack.artistName || 'Unknown Artist'}</div>
        </div>
      </div>

      {/* Center: Controls & Scrubber */}
      <div className="flex flex-col items-center w-1/3 max-w-lg">
        <div className="flex items-center space-x-6 mb-2">
          <button 
            onClick={previousTrack}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <SkipBack className="h-5 w-5" />
          </button>
          
          <button 
            onClick={togglePlayPause}
            className="h-10 w-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current translate-x-[1px]" />}
          </button>

          <button 
            onClick={nextTrack}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center w-full space-x-3 text-xs text-gray-400 font-mono">
          <span>{formatTime(currentTime)}</span>
          
          {/* Progress Bar */}
          <div 
            className="flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer relative group"
            onClick={(e) => {
              const bounds = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - bounds.left;
              const pct = Math.max(0, Math.min(1, x / bounds.width));
              seekTo(pct * duration);
            }}
          >
            <div 
              className="absolute top-0 left-0 h-full bg-sky-500 rounded-full group-hover:bg-sky-400"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right: Volume & Queue */}
      <div className="flex items-center justify-end w-1/3 space-x-4">
        <button className="text-gray-400 hover:text-white transition-colors">
          <ListMusic className="h-4 w-4" />
        </button>
        <button className="text-gray-400 hover:text-white transition-colors">
          <Radio className="h-4 w-4" />
        </button>

        <div className="flex items-center space-x-2 w-28 group">
          <button 
            onClick={() => setVolume(isMuted ? 1 : 0)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          
          {/* Volume Bar */}
          <div 
            className="flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer relative"
            onClick={(e) => {
              const bounds = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - bounds.left;
              const pct = Math.max(0, Math.min(1, x / bounds.width));
              setVolume(pct);
            }}
          >
            <div 
              className="absolute top-0 left-0 h-full bg-white rounded-full"
              style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
