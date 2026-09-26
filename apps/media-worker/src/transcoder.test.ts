import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import { Readable } from 'stream';

const { mockS3Send, mockQuery } = vi.hoisted(() => ({
  mockS3Send: vi.fn(),
  mockQuery: vi.fn(),
}));

vi.mock('@aws-sdk/client-s3', () => {
  function MockS3Client() {
    return {
      send: mockS3Send,
    };
  }
  return {
    S3Client: MockS3Client,
    GetObjectCommand: vi.fn(),
    PutObjectCommand: vi.fn(),
  };
});

vi.mock('@groundwave/database', () => ({
  createDatabasePool: () => ({
    query: mockQuery,
  }),
}));

vi.mock('child_process', () => ({
  spawn: vi.fn(() => {
    const mockProcess: any = {
      stderr: { on: vi.fn() },
      on: vi.fn((event: string, callback: Function) => {
        if (event === 'close') callback(0); // Exit code 0
      }),
    };
    return mockProcess;
  }),
}));

import { processMediaJob } from './transcoder';

describe('Media Worker Transcoder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('downloads raw audio from R2, spawns FFmpeg, uploads segments, and updates sound_recordings table', async () => {
    const mockStream = new Readable({
      read() {
        this.push('dummy audio data');
        this.push(null);
      },
    });

    mockS3Send
      .mockResolvedValueOnce({ Body: mockStream }) // GetObjectCommand
      .mockResolvedValue({}); // PutObjectCommands

    mockQuery.mockResolvedValueOnce({ rows: [] });

    vi.spyOn(fs, 'readdirSync').mockReturnValue(['index.m3u8', 'segment_000.ts'] as any);
    vi.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from('dummy content'));

    await processMediaJob('masters/user-1/track.wav', 'track-123');

    expect(mockS3Send).toHaveBeenCalled();
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE sound_recordings SET'),
      expect.arrayContaining(['track-123'])
    );
  });

  it('throws error if GetObject body is not a Readable stream', async () => {
    mockS3Send.mockResolvedValueOnce({ Body: null });

    await expect(processMediaJob('masters/user-1/track.wav', 'track-123')).rejects.toThrow(
      'S3 GetObject response body is not a Readable stream'
    );
  });
});
