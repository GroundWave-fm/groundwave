import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GlobalAudioDock } from './global-audio-dock';
import { AudioProvider, useAudio } from '@/context/audio-context';
import type { SoundRecording } from '@groundwave/types';

const mockTrack: SoundRecording = {
  id: 'tr-100',
  title: 'Global Dock Test Track',
  artistName: 'Test Artist',
  hlsMasterManifestUrl: 'https://cdn.example.com/tr-100/index.m3u8',
  durationSeconds: 240,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

function DockWrapper() {
  const audio = useAudio();
  return (
    <div>
      <button onClick={() => audio.playTrack(mockTrack)}>Load Track</button>
      <GlobalAudioDock />
    </div>
  );
}

describe('GlobalAudioDock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    window.HTMLMediaElement.prototype.pause = vi.fn();
    window.HTMLMediaElement.prototype.canPlayType = vi.fn().mockReturnValue('maybe');
  });

  it('renders nothing when no currentTrack is active', () => {
    const { container } = render(
      <AudioProvider>
        <GlobalAudioDock />
      </AudioProvider>
    );

    expect(container.querySelector('.fixed')).toBeNull();
  });

  it('renders track info and audio controls when track is playing', async () => {
    render(
      <AudioProvider>
        <DockWrapper />
      </AudioProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Load Track'));
    });

    expect(screen.getByText('Global Dock Test Track')).toBeDefined();
  });
});
