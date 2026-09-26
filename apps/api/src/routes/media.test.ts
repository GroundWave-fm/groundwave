import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

let mockUser: any = { id: 'user-123', email: 'test@example.com' };

// Mock auth middleware BEFORE importing the router so it gets used
vi.mock('../auth', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    // Inject mock user if set
    if (mockUser) {
      req.user = mockUser;
    }
    next();
  }
}));

import mediaRouter from './media';
import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

vi.mock('@aws-sdk/client-s3');
vi.mock('@aws-sdk/s3-request-presigner');

// Setup mock express app
const app = express();
app.use(express.json());
app.use('/api/v1/media', mediaRouter);

describe('Media Routes', () => {
  const token = 'mock-token'; // We don't actually need a real JWT because requireAuth is mocked

  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: 'user-123', email: 'test@example.com' };
    (getSignedUrl as any).mockResolvedValue('https://mock-signed-url.com');
  });

  describe('POST /upload-url', () => {
    it('returns 401 if user context is missing', async () => {
      mockUser = null;
      const res = await request(app)
        .post('/api/v1/media/upload-url')
        .set('Authorization', `Bearer ${token}`)
        .send({
          filename: 'track.wav',
          contentType: 'audio/wav',
          fileSize: 10 * 1024 * 1024
        });
      
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/User authentication required/);
    });

    it('returns 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/media/upload-url')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Missing required fields/);
    });

    it('returns 400 for invalid MIME type', async () => {
      const res = await request(app)
        .post('/api/v1/media/upload-url')
        .set('Authorization', `Bearer ${token}`)
        .send({
          filename: 'test.txt',
          contentType: 'text/plain',
          fileSize: 1024
        });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid file type/);
    });

    it('returns 400 if file is too large', async () => {
      const res = await request(app)
        .post('/api/v1/media/upload-url')
        .set('Authorization', `Bearer ${token}`)
        .send({
          filename: 'huge-track.wav',
          contentType: 'audio/wav',
          fileSize: 600 * 1024 * 1024 // 600MB
        });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/File size exceeds maximum allowed size/);
    });

    it('generates a presigned URL successfully for valid audio', async () => {
      const res = await request(app)
        .post('/api/v1/media/upload-url')
        .set('Authorization', `Bearer ${token}`)
        .send({
          filename: 'track.wav',
          contentType: 'audio/wav',
          fileSize: 10 * 1024 * 1024
        });
      
      expect(res.status).toBe(200);
      expect(res.body.url).toBe('https://mock-signed-url.com');
      expect(res.body.objectKey).toMatch(/^masters\/user-123\/.*\.wav$/);
    });

    it('generates a presigned URL successfully for valid image', async () => {
      const res = await request(app)
        .post('/api/v1/media/upload-url')
        .set('Authorization', `Bearer ${token}`)
        .send({
          filename: 'cover.jpg',
          contentType: 'image/jpeg',
          fileSize: 2 * 1024 * 1024
        });
      
      expect(res.status).toBe(200);
      expect(res.body.url).toBe('https://mock-signed-url.com');
      expect(res.body.objectKey).toMatch(/^artworks\/user-123\/.*\.jpg$/);
    });
    
    it('returns 500 on presigner failure', async () => {
      (getSignedUrl as any).mockRejectedValueOnce(new Error('AWS error'));
      
      const res = await request(app)
        .post('/api/v1/media/upload-url')
        .set('Authorization', `Bearer ${token}`)
        .send({
          filename: 'track.wav',
          contentType: 'audio/wav',
          fileSize: 10 * 1024 * 1024
        });
      
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to generate upload URL');
    });
  });

  describe('POST /process', () => {
    it('returns 400 if objectKey or trackId is missing', async () => {
      const res = await request(app)
        .post('/api/v1/media/process')
        .set('Authorization', `Bearer ${token}`)
        .send({ objectKey: 'test/key' }); // missing trackId
        
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Missing objectKey or trackId');
    });

    it('enqueues the job and returns 202', async () => {
      // Mock global fetch
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response());
      
      const res = await request(app)
        .post('/api/v1/media/process')
        .set('Authorization', `Bearer ${token}`)
        .send({ objectKey: 'test/key', trackId: 'track-123' });
        
      expect(res.status).toBe(202);
      expect(res.body.message).toBe('Media processing job enqueued');
      expect(fetchSpy).toHaveBeenCalled();
      
      fetchSpy.mockRestore();
    });
  });
});
