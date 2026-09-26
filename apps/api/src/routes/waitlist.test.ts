import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app';

describe('Waitlist API Routes', () => {
  const uniqueTimestamp = Date.now();
  const testEmail = `earlyfan_${uniqueTimestamp}@example.com`;

  describe('POST /api/v1/waitlist', () => {
    it('returns 400 when email is missing', async () => {
      const res = await request(app).post('/api/v1/waitlist').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('valid email address is required');
    });

    it('returns 400 when email format is invalid', async () => {
      const res = await request(app).post('/api/v1/waitlist').send({
        email: 'invalid-not-an-email',
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('valid email address is required');
    });

    it('returns 400 when userType is invalid', async () => {
      const res = await request(app).post('/api/v1/waitlist').send({
        email: `valid_${uniqueTimestamp}@example.com`,
        userType: 'astronaut',
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid userType');
    });

    it('registers a new fan email successfully with 201', async () => {
      const res = await request(app).post('/api/v1/waitlist').send({
        email: testEmail,
        cityName: 'Chicago',
        userType: 'fan',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.alreadyRegistered).toBe(false);
      expect(res.body.entry).toBeDefined();
      expect(res.body.entry.email).toBe(testEmail.toLowerCase());
      expect(res.body.entry.cityName).toBe('Chicago');
      expect(res.body.entry.h3IndexRes8).toBeDefined();
      expect(res.body.entry.userType).toBe('fan');
    });

    it('registers an artist email with lat/lng coordinates', async () => {
      const artistEmail = `artist_${uniqueTimestamp}@example.com`;
      const res = await request(app).post('/api/v1/waitlist').send({
        email: artistEmail,
        userType: 'artist',
        lat: 41.8781,
        lng: -87.6298,
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.entry.email).toBe(artistEmail.toLowerCase());
      expect(res.body.entry.userType).toBe('artist');
      expect(res.body.entry.h3IndexRes8).toBeDefined();
    });

    it('handles idempotent re-registration gracefully with 200 and alreadyRegistered flag', async () => {
      const res = await request(app).post('/api/v1/waitlist').send({
        email: testEmail,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.alreadyRegistered).toBe(true);
      expect(res.body.message).toContain('already on the waitlist');
      expect(res.body.entry.email).toBe(testEmail.toLowerCase());
    });
  });

  describe('GET /api/v1/waitlist/count', () => {
    it('returns the total waitlist subscriber count with 200', async () => {
      const res = await request(app).get('/api/v1/waitlist/count');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.count).toBe('number');
      expect(res.body.count).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/waitlist/entries (Admin Only)', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/v1/waitlist/entries');
      expect(res.status).toBe(401);
    });

    it('returns 403 when user is not a platform admin', async () => {
      const fanLoginRes = await request(app).post('/api/v1/auth/login').send({
        email: 'jordan@gmail.com',
      });
      const res = await request(app)
        .get('/api/v1/waitlist/entries')
        .set('Authorization', `Bearer ${fanLoginRes.body.token}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Platform admin privileges required');
    });

    it('returns 200 with subscriber list when requested by platform admin', async () => {
      const adminLoginRes = await request(app).post('/api/v1/auth/login').send({
        email: 'admin@groundwave.fm',
      });
      const res = await request(app)
        .get('/api/v1/waitlist/entries')
        .set('Authorization', `Bearer ${adminLoginRes.body.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.entries)).toBe(true);
      expect(res.body.entries.length).toBeGreaterThan(0);
      const entry = res.body.entries[0];
      expect(entry.email).toBeDefined();
      expect(entry.userType).toBeDefined();
      expect(typeof entry.isInvited).toBe('boolean');
    });
  });
});
