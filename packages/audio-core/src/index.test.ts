import { describe, it, expect } from 'vitest';
import { initialPlaybackState, getNextQueueTrack, getPreviousQueueTrack } from './index';
import { Track } from '@groundwave/types';

const mockTrack1: Track = {
  id: 'track-1',
  releaseId: 'rel-1',
  entityId: 'ent-1',
  title: 'Chicago Loop Groove',
  durationSeconds: 245,
  trackNumber: 1,
  audioMasterPath: '/masters/1.wav',
  hlsPlaylistPath: '/hls/1/playlist.m3u8',
  waveformJson: [0.1, 0.5, 0.8, 0.4],
  playCount: 100,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockTrack2: Track = {
  ...mockTrack1,
  id: 'track-2',
  title: 'Wicker Park Sunset',
  trackNumber: 2,
};

const mockTrack3: Track = {
  ...mockTrack1,
  id: 'track-3',
  title: 'Milwaukee Ave Midnight',
  trackNumber: 3,
};

describe('Audio Core Playback State & Queue Functions', () => {
  it('should initialize with default playback state', () => {
    expect(initialPlaybackState.isPlaying).toBe(false);
    expect(initialPlaybackState.currentTrack).toBeNull();
    expect(initialPlaybackState.currentTime).toBe(0);
    expect(initialPlaybackState.duration).toBe(0);
    expect(initialPlaybackState.volume).toBe(1.0);
    expect(initialPlaybackState.isMuted).toBe(false);
    expect(initialPlaybackState.quality).toBe('auto_hls');
    expect(initialPlaybackState.queue).toEqual([]);
    expect(initialPlaybackState.queueIndex).toBe(-1);
    expect(initialPlaybackState.radioMode).toBe(false);
  });

  describe('getNextQueueTrack', () => {
    it('returns null if queue is empty', () => {
      const state = { ...initialPlaybackState, queue: [], queueIndex: -1 };
      expect(getNextQueueTrack(state)).toBeNull();
    });

    it('returns next track if within bounds', () => {
      const state = {
        ...initialPlaybackState,
        queue: [mockTrack1, mockTrack2, mockTrack3],
        queueIndex: 0,
      };
      expect(getNextQueueTrack(state)).toEqual(mockTrack2);
    });

    it('returns null when at the end of the queue', () => {
      const state = {
        ...initialPlaybackState,
        queue: [mockTrack1, mockTrack2],
        queueIndex: 1,
      };
      expect(getNextQueueTrack(state)).toBeNull();
    });
  });

  describe('getPreviousQueueTrack', () => {
    it('returns null if queue is empty', () => {
      const state = { ...initialPlaybackState, queue: [], queueIndex: -1 };
      expect(getPreviousQueueTrack(state)).toBeNull();
    });

    it('returns previous track when index > 0', () => {
      const state = {
        ...initialPlaybackState,
        queue: [mockTrack1, mockTrack2, mockTrack3],
        queueIndex: 2,
      };
      expect(getPreviousQueueTrack(state)).toEqual(mockTrack2);
    });

    it('returns first track if index is 0 or negative', () => {
      const state = {
        ...initialPlaybackState,
        queue: [mockTrack1, mockTrack2],
        queueIndex: 0,
      };
      expect(getPreviousQueueTrack(state)).toEqual(mockTrack1);
    });
  });
});
