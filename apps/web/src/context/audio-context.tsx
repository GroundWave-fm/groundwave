'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { PlaybackState, PlaybackQuality, SoundRecording } from '@groundwave/types';
import { initialPlaybackState, getNextQueueTrack, getPreviousQueueTrack, AudioPlayerActions } from '@groundwave/audio-core';

interface AudioContextType extends PlaybackState, AudioPlayerActions {
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PlaybackState>(initialPlaybackState);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Initialize Audio Events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setState(s => ({ ...s, currentTime: audio.currentTime }));
    const onDurationChange = () => setState(s => ({ ...s, duration: audio.duration }));
    const onEnded = () => {
      // Auto-play next track
      setState(s => {
        const nextTrack = getNextQueueTrack(s);
        if (nextTrack) {
          // Note: we can't play it directly in the reducer, we need an effect or timeout to trigger it.
          setTimeout(() => playTrack(nextTrack), 0);
          return { ...s, currentTrack: nextTrack, queueIndex: s.queueIndex + 1, currentTime: 0, isPlaying: true };
        }
        return { ...s, isPlaying: false };
      });
    };
    const onPlay = () => setState(s => ({ ...s, isPlaying: true }));
    const onPause = () => setState(s => ({ ...s, isPlaying: false }));
    const onVolumeChange = () => setState(s => ({ ...s, volume: audio.volume, isMuted: audio.muted }));

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('volumechange', onVolumeChange);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('volumechange', onVolumeChange);
    };
  }, []);

  const loadAndPlayTrack = async (track: SoundRecording, audio: HTMLAudioElement) => {
    // Cleanup previous HLS instance if any
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const url = track.hlsMasterManifestUrl;
    
    // Some browsers (Safari) natively support HLS
    if (audio.canPlayType('application/vnd.apple.mpegurl')) {
      audio.src = url;
      await audio.play().catch(e => console.error("Playback failed:", e));
    } 
    // Fallback to Hls.js for Chrome/Firefox/Edge
    else if (Hls.isSupported()) {
      const hls = new Hls({
        startLevel: -1, // Auto level
        capLevelToPlayerSize: false,
      });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(audio);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        audio.play().catch(e => console.error("Playback failed:", e));
      });
    } else {
      console.error("HLS is not supported in this browser.");
    }
  };

  const playTrack = (track: SoundRecording, queue?: SoundRecording[]) => {
    setState(s => {
      let newQueue = s.queue;
      let newIndex = s.queueIndex;
      
      if (queue) {
        newQueue = queue;
        newIndex = queue.findIndex(t => t.id === track.id);
        if (newIndex === -1) {
          newQueue = [track, ...queue];
          newIndex = 0;
        }
      } else if (s.queue.length === 0) {
        newQueue = [track];
        newIndex = 0;
      } else if (track.id !== s.currentTrack?.id) {
         // See if it's already in queue
         const existingIndex = s.queue.findIndex(t => t.id === track.id);
         if (existingIndex !== -1) {
           newIndex = existingIndex;
         } else {
           // Insert next
           newQueue = [...s.queue];
           newQueue.splice(s.queueIndex + 1, 0, track);
           newIndex = s.queueIndex + 1;
         }
      }

      return {
        ...s,
        currentTrack: track,
        queue: newQueue,
        queueIndex: newIndex,
        isPlaying: true, // Optimistically set playing
      };
    });

    if (audioRef.current) {
      loadAndPlayTrack(track, audioRef.current);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !state.currentTrack) return;
    
    if (audioRef.current.paused) {
      audioRef.current.play().catch(e => console.error("Playback failed:", e));
    } else {
      audioRef.current.pause();
    }
  };

  const seekTo = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
    }
  };

  const nextTrack = () => {
    const track = getNextQueueTrack(state);
    if (track) playTrack(track);
  };

  const previousTrack = () => {
    const track = getPreviousQueueTrack(state);
    if (track) playTrack(track);
  };

  const setVolume = (volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  };

  const setQuality = (quality: PlaybackQuality) => {
    setState(s => ({ ...s, quality }));
    // HLS.js logic to switch quality goes here if supported
  };

  const addToQueue = (track: SoundRecording) => {
    setState(s => ({ ...s, queue: [...s.queue, track] }));
  };

  return (
    <AudioContext.Provider 
      value={{ 
        ...state, 
        playTrack, 
        togglePlayPause, 
        seekTo, 
        nextTrack, 
        previousTrack, 
        setVolume, 
        setQuality, 
        addToQueue,
        audioRef 
      }}
    >
      {/* Invisible global audio element */}
      <audio ref={audioRef} />
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
