import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

const { mockClient } = vi.hoisted(() => ({
  mockClient: {
    query: vi.fn(),
    release: vi.fn(),
  }
}));

// Mock auth middleware
vi.mock('../auth', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.user = { id: 'user-123', email: 'test@example.com' };
    next();
  },
}));

vi.mock('@groundwave/database', () => ({
  createDatabasePool: () => ({
    connect: vi.fn().mockResolvedValue(mockClient),
  }),
}));

import releasesRouter from './releases';

const app = express();
app.use(express.json());
app.use('/api/v1/releases', releasesRouter);

describe('Releases Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /', () => {
    it('returns 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/releases')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Missing required fields');
    });

    it('creates release and enqueues processing job successfully', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response());

      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 'release-123' }] }) // INSERT release
        .mockResolvedValueOnce({ rows: [{ id: 'sr-123' }] }) // INSERT sound_recording
        .mockResolvedValueOnce({ rows: [] }) // INSERT release_tracks
        .mockResolvedValueOnce({ rows: [] }) // INSERT sound_recording_contributors
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const res = await request(app)
        .post('/api/v1/releases')
        .send({
          creator_entity_id: 'entity-123',
          title: 'Midnight Memories',
          release_type: 'single',
          cover_art_url: 'https://cdn.example.com/cover.jpg',
          master_audio_key: 'masters/user-123/audio.wav',
        });

      expect(res.status).toBe(201);
      expect(res.body.releaseId).toBe('release-123');
      expect(res.body.trackId).toBe('sr-123');
      expect(fetchSpy).toHaveBeenCalled();

      fetchSpy.mockRestore();
    });

    it('returns 500 on database error and rolls back transaction', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockRejectedValueOnce(new Error('DB query error')) // INSERT release fails
        .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

      const res = await request(app)
        .post('/api/v1/releases')
        .send({
          creator_entity_id: 'entity-123',
          title: 'Midnight Memories',
          release_type: 'single',
          cover_art_url: 'https://cdn.example.com/cover.jpg',
          master_audio_key: 'masters/user-123/audio.wav',
        });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to create release');
    });
  });
});
