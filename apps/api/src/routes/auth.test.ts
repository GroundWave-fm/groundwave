import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { createDatabasePool } from '@groundwave/database';

describe('Auth & Invitation API Routes', () => {
  const pool = createDatabasePool();
  let adminToken: string;
  let creatorToken: string; // Maya Lin (owner of The Static Veins)
  let fanToken: string; // Jordan Bell (fan, not creator owner)

  beforeAll(async () => {
    // 1. Login as Admin
    const adminLoginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@groundwave.fm',
    });
    adminToken = adminLoginRes.body.token;

    // 2. Login as Creator (Maya Lin)
    const creatorLoginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'maya@groundwave.fm',
    });
    creatorToken = creatorLoginRes.body.token;

    // 3. Login as Fan (Jordan Bell)
    const fanLoginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'jordan@gmail.com',
    });
    fanToken = fanLoginRes.body.token;
  });

  describe('POST /api/v1/auth/invite/validate', () => {
    it('returns 400 when code is missing', async () => {
      const res = await request(app).post('/api/v1/auth/invite/validate').send({});
      expect(res.status).toBe(400);
      expect(res.body.valid).toBe(false);
      expect(res.body.error).toContain('Invitation code is required');
    });

    it('returns 404 for non-existent invite code', async () => {
      const res = await request(app).post('/api/v1/auth/invite/validate').send({
        code: 'NON-EXISTENT-CODE-12345',
      });
      expect(res.status).toBe(404);
      expect(res.body.valid).toBe(false);
      expect(res.body.error).toContain('Invitation code not found');
    });

    it('validates a valid alpha code successfully (case-insensitive)', async () => {
      const res = await request(app).post('/api/v1/auth/invite/validate').send({
        code: 'gw-alpha-chicago',
      });
      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
      expect(res.body.code).toBe('GW-ALPHA-CHICAGO');
      expect(res.body.assignedUserType).toBe('fan');
      expect(res.body.remainingUses).toBeGreaterThan(0);
    });

    it('returns 400 when invite code is inactive', async () => {
      const inactiveCode = `INACTIVE-${Date.now()}`;
      await pool.query(
        `INSERT INTO invitation_codes (code, max_uses, current_uses, is_active)
         VALUES ($1, 1, 0, false)`,
        [inactiveCode]
      );

      const res = await request(app).post('/api/v1/auth/invite/validate').send({
        code: inactiveCode,
      });
      expect(res.status).toBe(400);
      expect(res.body.valid).toBe(false);
      expect(res.body.error).toContain('Invitation code is inactive');
    });

    it('returns 400 when invite code has expired', async () => {
      const expiredCode = `EXPIRED-${Date.now()}`;
      await pool.query(
        `INSERT INTO invitation_codes (code, max_uses, current_uses, expires_at, is_active)
         VALUES ($1, 1, 0, NOW() - INTERVAL '1 day', true)`,
        [expiredCode]
      );

      const res = await request(app).post('/api/v1/auth/invite/validate').send({
        code: expiredCode,
      });
      expect(res.status).toBe(400);
      expect(res.body.valid).toBe(false);
      expect(res.body.error).toContain('Invitation code has expired');
    });

    it('returns 400 when invite code has reached max uses', async () => {
      const exhaustedCode = `EXHAUSTED-${Date.now()}`;
      await pool.query(
        `INSERT INTO invitation_codes (code, max_uses, current_uses, is_active)
         VALUES ($1, 2, 2, true)`,
        [exhaustedCode]
      );

      const res = await request(app).post('/api/v1/auth/invite/validate').send({
        code: exhaustedCode,
      });
      expect(res.status).toBe(400);
      expect(res.body.valid).toBe(false);
      expect(res.body.error).toContain('usage limit has been reached');
    });

    it('returns 400 when email does not match target_email', async () => {
      const targetedCode = `TARGETED-${Date.now()}`;
      await pool.query(
        `INSERT INTO invitation_codes (code, max_uses, current_uses, target_email, is_active)
         VALUES ($1, 1, 0, 'reserved@example.com', true)`,
        [targetedCode]
      );

      const res = await request(app).post('/api/v1/auth/invite/validate').send({
        code: targetedCode,
        email: 'wrong@example.com',
      });
      expect(res.status).toBe(400);
      expect(res.body.valid).toBe(false);
      expect(res.body.error).toContain('reserved for a specific email');

      // Passes when email matches target_email
      const validTargetRes = await request(app).post('/api/v1/auth/invite/validate').send({
        code: targetedCode,
        email: 'reserved@example.com',
      });
      expect(validTargetRes.status).toBe(200);
      expect(validTargetRes.body.valid).toBe(true);
    });
  });

  describe('POST /api/v1/auth/register (Invite Gating)', () => {
    it('returns 403 when inviteCode is missing during invite-only alpha', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: `tester_${Date.now()}@example.com`,
        username: `tester_${Date.now()}`,
        displayName: 'Alpha Applicant',
      });
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Invitation code is required');
    });

    it('returns 403 when inviteCode is invalid', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: `tester_${Date.now()}@example.com`,
        username: `tester_${Date.now()}`,
        displayName: 'Alpha Applicant',
        inviteCode: 'INVALID-CODE-XYZ',
      });
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Invalid invitation code');
    });

    it('registers user successfully with valid code and increments usage', async () => {
      const singleUseCode = `SINGLE-${Date.now()}`;
      await pool.query(
        `INSERT INTO invitation_codes (code, max_uses, current_uses, is_active)
         VALUES ($1, 1, 0, true)`,
        [singleUseCode]
      );

      const email = `single_user_${Date.now()}@example.com`;
      const res = await request(app).post('/api/v1/auth/register').send({
        email,
        username: `user_${Date.now()}`,
        displayName: 'Registered User',
        cityName: 'Chicago',
        inviteCode: singleUseCode,
      });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(email);

      // Verify code in DB has current_uses = 1 and claimed_by_user_id set
      const codeCheck = await pool.query('SELECT * FROM invitation_codes WHERE code = $1', [singleUseCode]);
      expect(codeCheck.rows[0].current_uses).toBe(1);
      expect(codeCheck.rows[0].claimed_by_user_id).toBe(res.body.user.id);

      // Attempting to register another user with the same single-use code fails with 403
      const secondRes = await request(app).post('/api/v1/auth/register').send({
        email: `second_${Date.now()}@example.com`,
        username: `second_${Date.now()}`,
        displayName: 'Second Applicant',
        cityName: 'Chicago',
        inviteCode: singleUseCode,
      });
      expect(secondRes.status).toBe(403);
      expect(secondRes.body.error).toContain('usage limit has been reached');
    });

    it('returns 403 when registering with an email that does not match targeted code', async () => {
      const targetedCode = `TARGET-${Date.now()}`;
      await pool.query(
        `INSERT INTO invitation_codes (code, max_uses, current_uses, target_email, is_active)
         VALUES ($1, 1, 0, 'invited_vip@example.com', true)`,
        [targetedCode]
      );

      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'uninvited_person@example.com',
        username: `uninvited_${Date.now()}`,
        displayName: 'Uninvited User',
        inviteCode: targetedCode,
      });
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('reserved for a specific email address');
    });
  });

  describe('POST /api/v1/auth/invite/grant-waitlist', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await request(app).post('/api/v1/auth/invite/grant-waitlist').send({
        email: 'some_waitlist@example.com',
      });
      expect(res.status).toBe(401);
    });

    it('returns 403 when authenticated as non-admin', async () => {
      const res = await request(app)
        .post('/api/v1/auth/invite/grant-waitlist')
        .set('Authorization', `Bearer ${fanToken}`)
        .send({ email: 'some_waitlist@example.com' });
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Platform admin privileges required');
    });

    it('returns 400 when neither waitlistId nor email is provided', async () => {
      const res = await request(app)
        .post('/api/v1/auth/invite/grant-waitlist')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('waitlistId or email is required');
    });

    it('returns 404 when waitlist entry is not found', async () => {
      const res = await request(app)
        .post('/api/v1/auth/invite/grant-waitlist')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'unknown_waitlist@example.com' });
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Waitlist entry not found');
    });

    it('generates a targeted invite code and links to waitlist entry', async () => {
      const waitlistEmail = `waitlist_promoted_${Date.now()}@example.com`;
      await pool.query(
        `INSERT INTO waitlist_entries (email, user_type, city_name)
         VALUES ($1, 'artist', 'Chicago')`,
        [waitlistEmail]
      );

      const res = await request(app)
        .post('/api/v1/auth/invite/grant-waitlist')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: waitlistEmail });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.inviteCode).toMatch(/^GW-WL-/);
      expect(res.body.waitlistEmail).toBe(waitlistEmail);

      // Verify waitlist_entries is updated
      const entryRes = await pool.query('SELECT * FROM waitlist_entries WHERE email = $1', [waitlistEmail]);
      expect(entryRes.rows[0].is_invited).toBe(true);
      expect(entryRes.rows[0].invitation_code_id).toBeDefined();

      // Verify the generated code in invitation_codes is targeted
      const codeRes = await pool.query('SELECT * FROM invitation_codes WHERE id = $1', [entryRes.rows[0].invitation_code_id]);
      expect(codeRes.rows[0].target_email).toBe(waitlistEmail);
      expect(codeRes.rows[0].assigned_user_type).toBe('artist');

      // Idempotency: calling again returns the existing code
      const secondRes = await request(app)
        .post('/api/v1/auth/invite/grant-waitlist')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: waitlistEmail });
      expect(secondRes.status).toBe(200);
      expect(secondRes.body.inviteCode).toBe(res.body.inviteCode);
    });
  });

  describe('POST /api/v1/auth/invite/generate & GET /api/v1/auth/invite/my-codes', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await request(app).post('/api/v1/auth/invite/generate').send({});
      expect(res.status).toBe(401);
    });

    it('returns 403 when regular fan user attempts to generate code', async () => {
      const res = await request(app)
        .post('/api/v1/auth/invite/generate')
        .set('Authorization', `Bearer ${fanToken}`)
        .send({});
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Only platform admins or verified creator entities');
    });

    it('allows admin to generate custom invite code', async () => {
      const customCode = `ADMIN-SPECIAL-${Date.now()}`;
      const res = await request(app)
        .post('/api/v1/auth/invite/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: customCode,
          maxUses: 15,
          assignedUserType: 'label',
        });

      expect(res.status).toBe(201);
      expect(res.body.code.code).toBe(customCode);
      expect(res.body.code.maxUses).toBe(15);
      expect(res.body.code.assignedUserType).toBe('label');
    });

    it('returns 409 when generating a code that already exists', async () => {
      const duplicateCode = `DUP-CODE-${Date.now()}`;
      await request(app)
        .post('/api/v1/auth/invite/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: duplicateCode });

      const res = await request(app)
        .post('/api/v1/auth/invite/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: duplicateCode });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('Invitation code already exists');
    });

    it('allows verified creator entity owner (Maya) to generate up to 5 codes', async () => {
      // Clean up any dynamic test codes for Maya so quota is not exceeded
      await pool.query(
        "DELETE FROM invitation_codes WHERE created_by_user_id = (SELECT id FROM users WHERE email = 'maya@groundwave.fm') AND code NOT IN ('GW-ALPHA-CHICAGO', 'STATIC-VEINS-VIP', 'GROUNDWAVE-FOUNDER-2026')"
      );

      // Maya Lin is verified owner of The Static Veins
      const res = await request(app)
        .post('/api/v1/auth/invite/generate')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({
          maxUses: 3,
        });

      expect(res.status).toBe(201);
      expect(res.body.code.code).toMatch(/^GW-/);
      expect(res.body.code.maxUses).toBe(3);

      // Verify GET /api/v1/auth/invite/my-codes
      const myCodesRes = await request(app)
        .get('/api/v1/auth/invite/my-codes')
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(myCodesRes.status).toBe(200);
      expect(Array.isArray(myCodesRes.body.codes)).toBe(true);
      expect(myCodesRes.body.codes.some((c: any) => c.code === res.body.code.code)).toBe(true);
    });
  });
});
