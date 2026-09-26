import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioProvider, useAudio } from './audio-context';
import type { SoundRecording } from '@groundwave/types';

const mockTrack1: SoundRecording = {
  id: 'tr-1',
  title: 'Track 1',
  artistName: 'Artist 1',
  hlsMasterManifestUrl: 'https://cdn.example.com/tr-1/index.m3u8',
  durationSeconds: 180,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const mockTrack2: SoundRecording = {
  id: 'tr-2',
  title: 'Track 2',
  artistName: 'Artist 2',
  hlsMasterManifestUrl: 'https://cdn.example.com/tr-2/index.m3u8',
  durationSeconds: 200,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

function TestComponent() {
  const audio = useAudio();
  return (
    <div>
      <div data-testid="title">{audio.currentTrack?.title || 'No Track'}</div>
      <div data-testid="is-playing">{audio.isPlaying ? 'Playing' : 'Paused'}</div>
      <div data-testid="queue-length">{audio.queue.length}</div>
      <button onClick={() => audio.playTrack(mockTrack1)}>Play 1</button>
      <button onClick={() => audio.playTrack(mockTrack2, [mockTrack1, mockTrack2])}>Play 2 with Queue</button>
      <button onClick={() => audio.togglePlayPause()}>Toggle</button>
      <button onClick={() => audio.nextTrack()}>Next</button>
      <button onClick={() => audio.previousTrack()}>Prev</button>
      <button onClick={() => audio.seekTo(30)}>Seek 30</button>
      <button onClick={() => audio.setVolume(0.5)}>Vol 0.5</button>
      <button onClick={() => audio.addToQueue(mockTrack2)}>Add 2</button>
      <button onClick={() => audio.setQuality('lossless')}>Quality Lossless</button>
    </div>
  );
}

describe('AudioContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock HTMLMediaElement prototype functions
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    window.HTMLMediaElement.prototype.pause = vi.fn();
    window.HTMLMediaElement.prototype.canPlayType = vi.fn().mockReturnValue('maybe');
  });

  it('throws error when useAudio is used outside AudioProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestComponent />)).toThrow('useAudio must be used within an AudioProvider');
    consoleError.mockRestore();
  });

  it('provides initial audio state', () => {
    render(
      <AudioProvider>
        <TestComponent />
      </AudioProvider>
    );

    expect(screen.getByTestId('title').textContent).toBe('No Track');
    expect(screen.getByTestId('is-playing').textContent).toBe('Paused');
    expect(screen.getByTestId('queue-length').textContent).toBe('0');
  });

  it('plays track and updates queue state', async () => {
    render(
      <AudioProvider>
        <TestComponent />
      </AudioProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Play 1'));
    });

    expect(screen.getByTestId('title').textContent).toBe('Track 1');
    expect(screen.getByTestId('is-playing').textContent).toBe('Playing');
    expect(screen.getByTestId('queue-length').textContent).toBe('1');
  });

  it('plays track with custom queue', async () => {
    render(
      <AudioProvider>
        <TestComponent />
      </AudioProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Play 2 with Queue'));
    });

    expect(screen.getByTestId('title').textContent).toBe('Track 2');
    expect(screen.getByTestId('queue-length').textContent).toBe('2');
  });

  it('toggles play pause, seeks, volume and quality', async () => {
    render(
      <AudioProvider>
        <TestComponent />
      </AudioProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Play 1'));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Toggle'));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Seek 30'));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Vol 0.5'));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Quality Lossless'));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Add 2'));
    });

    expect(screen.getByTestId('queue-length').textContent).toBe('2');
  });

  it('handles next and previous track transitions', async () => {
    render(
      <AudioProvider>
        <TestComponent />
      </AudioProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Play 2 with Queue'));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Prev'));
    });
    expect(screen.getByTestId('title').textContent).toBe('Track 1');

    await act(async () => {
      fireEvent.click(screen.getByText('Next'));
    });
    expect(screen.getByTestId('title').textContent).toBe('Track 2');
  });
});
