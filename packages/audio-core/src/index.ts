import { Track, PlaybackState, PlaybackQuality } from '@groundwave/types';

export interface AudioPlayerActions {
  playTrack: (track: Track, queue?: Track[]) => void;
  togglePlayPause: () => void;
  seekTo: (seconds: number) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  setVolume: (volume: number) => void;
  setQuality: (quality: PlaybackQuality) => void;
  addToQueue: (track: Track) => void;
}

export const initialPlaybackState: PlaybackState = {
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1.0,
  isMuted: false,
  quality: 'auto_hls',
  queue: [],
  queueIndex: -1,
  radioMode: false,
};

/**
 * Pure helper function to calculate next track in a queue
 */
export function getNextQueueTrack(state: PlaybackState): Track | null {
  if (state.queue.length === 0) return null;
  const nextIndex = state.queueIndex + 1;
  if (nextIndex < state.queue.length) {
    return state.queue[nextIndex];
  }
  return null;
}

/**
 * Pure helper function to calculate previous track in a queue
 */
export function getPreviousQueueTrack(state: PlaybackState): Track | null {
  if (state.queue.length === 0) return null;
  const prevIndex = state.queueIndex - 1;
  if (prevIndex >= 0) {
    return state.queue[prevIndex];
  }
  return state.queue[0];
}
