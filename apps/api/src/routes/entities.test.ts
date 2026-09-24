import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';

describe('Creator Entities & RBAC API Routes', () => {
  let mayaToken: string;
  let jordanToken: string;
  let createdEntityId: string;
  const testEntitySlug = `test-band-${Date.now()}`;

  beforeAll(async () => {
    // Login as Maya (Artist / Band founder)
    const mayaLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'maya@groundwave.fm',
    });
    mayaToken = mayaLogin.body.token;

    // Login as Jordan (Fan / Listener)
    const jordanLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'jordan@gmail.com',
    });
    jordanToken = jordanLogin.body.token;
  });

  describe('POST /api/v1/entities', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).post('/api/v1/entities').send({
        slug: 'no-auth-band',
        name: 'No Auth Band',
        entityType: 'band',
      });
      expect(res.status).toBe(401);
    });

    it('validates required fields with 400', async () => {
      const res = await request(app)
        .post('/api/v1/entities')
        .set('Authorization', `Bearer ${mayaToken}`)
        .send({
          name: 'Missing Slug',
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('slug, name, and entityType are required');
    });

    it('rejects invalid entityType with 400', async () => {
      const res = await request(app)
        .post('/api/v1/entities')
        .set('Authorization', `Bearer ${mayaToken}`)
        .send({
          slug: 'invalid-type-band',
          name: 'Invalid Type Band',
          entityType: 'spaceship',
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid entityType');
    });

    it('successfully creates a new creator entity and assigns owner membership', async () => {
      const res = await request(app)
        .post('/api/v1/entities')
        .set('Authorization', `Bearer ${mayaToken}`)
        .send({
          slug: testEntitySlug,
          name: 'Lunar Waves Echo',
          entityType: 'band',
          bio: 'Psychedelic space rock from Chicago',
          cityName: 'Chicago',
        });

      expect(res.status).toBe(201);
      expect(res.body.entity.slug).toBe(testEntitySlug);
      expect(res.body.membership.role).toBe('owner');
      createdEntityId = res.body.entity.id;
    });

    it('rejects duplicate slug handle with 409', async () => {
      const res = await request(app)
        .post('/api/v1/entities')
        .set('Authorization', `Bearer ${mayaToken}`)
        .send({
          slug: testEntitySlug,
          name: 'Duplicate Lunar Waves',
          entityType: 'band',
        });
      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already taken');
    });
  });

  describe('GET /api/v1/entities/:slug', () => {
    it('returns 404 for nonexistent entity', async () => {
      const res = await request(app).get('/api/v1/entities/non-existent-band-xyz-404');
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    it('returns entity details and team members for valid slug', async () => {
      const res = await request(app).get(`/api/v1/entities/${testEntitySlug}`);
      expect(res.status).toBe(200);
      expect(res.body.entity.slug).toBe(testEntitySlug);
      expect(Array.isArray(res.body.teamMembers)).toBe(true);
      expect(res.body.teamMembers.length).toBeGreaterThan(0);
      expect(res.body.teamMembers[0].username).toBe('maya_guitar');
    });
  });

  describe('POST /api/v1/entities/:entityId/members', () => {
    it('rejects unauthenticated member addition with 401', async () => {
      const res = await request(app)
        .post(`/api/v1/entities/${createdEntityId}/members`)
        .send({
          username: 'jordan_commuter',
          role: 'member',
        });
      expect(res.status).toBe(401);
    });

    it('rejects member addition from non-owner/non-admin user with 403', async () => {
      const res = await request(app)
        .post(`/api/v1/entities/${createdEntityId}/members`)
        .set('Authorization', `Bearer ${jordanToken}`)
        .send({
          username: 'alex_drums',
          role: 'member',
        });
      expect(res.status).toBe(403);
    });

    it('validates input role and username', async () => {
      const res = await request(app)
        .post(`/api/v1/entities/${createdEntityId}/members`)
        .set('Authorization', `Bearer ${mayaToken}`)
        .send({
          username: 'jordan_commuter',
          role: 'wizard',
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid role');
    });

    it('returns 404 when target username does not exist', async () => {
      const res = await request(app)
        .post(`/api/v1/entities/${createdEntityId}/members`)
        .set('Authorization', `Bearer ${mayaToken}`)
        .send({
          username: 'unknown_ghost_user_999',
          role: 'member',
        });
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    it('allows owner to add a team member with custom split', async () => {
      const res = await request(app)
        .post(`/api/v1/entities/${createdEntityId}/members`)
        .set('Authorization', `Bearer ${mayaToken}`)
        .send({
          username: 'jordan_commuter',
          role: 'member',
          memberTitle: 'Synthesizers & Keys',
          royaltySplitPct: 25.0,
        });

      expect(res.status).toBe(200);
      expect(res.body.membership.role).toBe('member');
      expect(res.body.membership.member_title).toBe('Synthesizers & Keys');
      expect(parseFloat(res.body.membership.royalty_split_pct)).toBe(25);
    });
  });
});
