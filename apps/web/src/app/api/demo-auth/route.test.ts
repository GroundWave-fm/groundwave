import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { DEMO_COOKIE_NAME, hashDemoPassword } from '@/lib/demo-auth';

describe('POST /api/demo-auth', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.DEMO_PASSWORD;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  function createRequest(body: unknown): Request {
    return new Request('http://localhost:3000/api/demo-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('returns success immediately when no DEMO_PASSWORD is set', async () => {
    const req = createRequest({ password: 'any' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it('returns 400 if password is missing', async () => {
    process.env.DEMO_PASSWORD = 'correct_password';
    const req = createRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Password is required');
  });

  it('returns 401 for incorrect password', async () => {
    process.env.DEMO_PASSWORD = 'correct_password';
    const req = createRequest({ password: 'wrong_password' });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Invalid access code');
  });

  it('returns 200 and sets httpOnly cookie for correct password', async () => {
    process.env.DEMO_PASSWORD = 'correct_password';
    const req = createRequest({ password: 'correct_password' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain(DEMO_COOKIE_NAME);
    const expectedHash = await hashDemoPassword('correct_password');
    expect(setCookie).toContain(expectedHash);
    expect(setCookie).toContain('HttpOnly');
  });

  it('handles invalid json body with 500 error gracefully', async () => {
    process.env.DEMO_PASSWORD = 'correct_password';
    const req = new Request('http://localhost:3000/api/demo-auth', {
      method: 'POST',
      body: 'invalid-json{',
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
