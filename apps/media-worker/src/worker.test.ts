import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const mockProcessMediaJob = vi.fn();

vi.mock('./transcoder', () => ({
  processMediaJob: (...args: any[]) => mockProcessMediaJob(...args),
}));

import { app } from './worker';

describe('Worker Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 if objectKey or trackId is missing', async () => {
    const res = await request(app).post('/process').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Missing objectKey or trackId');
  });

  it('returns 202 and triggers processMediaJob in background', async () => {
    mockProcessMediaJob.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .post('/process')
      .send({ objectKey: 'masters/user-1/track.wav', trackId: 'track-123' });

    expect(res.status).toBe(202);
    expect(res.body.message).toBe('Job accepted');
    expect(mockProcessMediaJob).toHaveBeenCalledWith('masters/user-1/track.wav', 'track-123');
  });

  it('handles processMediaJob failure gracefully', async () => {
    mockProcessMediaJob.mockRejectedValueOnce(new Error('Transcode error'));

    const res = await request(app)
      .post('/process')
      .send({ objectKey: 'masters/user-1/track.wav', trackId: 'track-123' });

    expect(res.status).toBe(202);
  });
});
