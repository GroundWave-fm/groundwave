import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './app';

describe('API Core HTTP Routes', () => {
  it('GET /health returns 200 and healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('online');
    expect(res.body.service).toBe('groundwave-api');
    expect(res.body.version).toBe('0.1.0');
    expect(res.body.timestamp).toBeDefined();
  });

  it('GET /api/v1 returns root platform discovery catalog', async () => {
    const res = await request(app).get('/api/v1');
    expect(res.status).toBe(200);
    expect(res.body.platform).toContain('GroundWave');
    expect(res.body.version).toBe('v1');
    expect(res.body.endpoints).toHaveProperty('auth');
    expect(res.body.endpoints).toHaveProperty('entities');
  });

  describe('Authentication Flow', () => {
    const uniqueEmail = `testuser_${Date.now()}@groundwave.fm`;
    const uniqueUsername = `testuser_${Date.now()}`;

    it('POST /api/v1/auth/register returns 400 when missing required fields', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'incomplete@groundwave.fm',
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('email, username, and displayName are required');
    });

    it('POST /api/v1/auth/register successfully registers a new user with GPS coords', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: uniqueEmail,
        username: uniqueUsername,
        displayName: 'Test Ingest User',
        cityName: 'Chicago',
        lat: 41.8781,
        lng: -87.6298,
      });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(uniqueEmail);
      expect(res.body.user.h3IndexRes8).toBeDefined();
    });

    it('POST /api/v1/auth/register returns 409 for duplicate email/username', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: uniqueEmail,
        username: uniqueUsername,
        displayName: 'Duplicate User',
      });
      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already taken');
    });

    it('POST /api/v1/auth/login returns 400 when missing email', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Email is required');
    });

    it('POST /api/v1/auth/login returns 404 for unknown user', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'nonexistent_user_999@groundwave.fm',
      });
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('User account not found');
    });

    it('POST /api/v1/auth/login succeeds for seeded persona Maya', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'maya@groundwave.fm',
      });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.username).toBe('maya_guitar');
    });

    it('GET /api/v1/auth/me returns 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Missing or malformed Authorization header');
    });

    it('GET /api/v1/auth/me returns user profile and managed entities with valid token', async () => {
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: 'maya@groundwave.fm',
      });
      const token = loginRes.body.token;

      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.user.email).toBe('maya@groundwave.fm');
      expect(Array.isArray(meRes.body.managedEntities)).toBe(true);
      expect(meRes.body.managedEntities.length).toBeGreaterThan(0);
    });

    it('POST /api/v1/auth/onboarding updates user profile with pre-calculated H3 index', async () => {
      // 1. Create a user
      const resReg = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'onboardtest@example.com',
          username: 'onboard_test',
          displayName: 'Onboard User',
        });
      const token = resReg.body.token;
      
      // 2. Perform onboarding
      const resOnboard = await request(app)
        .post('/api/v1/auth/onboarding')
        .set('Authorization', `Bearer ${token}`)
        .send({
          cityName: 'Austin',
          radiusMiles: 50
        });

      expect(resOnboard.status).toBe(200);
      expect(resOnboard.body.message).toBe('Onboarding complete');
      expect(resOnboard.body.user.cityName).toBe('Austin');
      expect(resOnboard.body.user.sceneRadiusMiles).toBe(50);
      expect(resOnboard.body.user.onboardingCompleted).toBe(true);
      expect(resOnboard.body.user.h3IndexRes8).toBeDefined(); // pre-calculated from Austin

      // 3. Test invalid city
      const resInvalid = await request(app)
        .post('/api/v1/auth/onboarding')
        .set('Authorization', `Bearer ${token}`)
        .send({
          cityName: 'NotACanonicalCity',
          radiusMiles: 15
        });
      expect(resInvalid.status).toBe(400);
    });
  });
});
