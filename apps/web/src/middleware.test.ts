import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from './middleware';
import { DEMO_COOKIE_NAME, hashDemoPassword } from './lib/demo-auth';

describe('Scoped Demo Gate Middleware', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.DEMO_PASSWORD;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  function createMockRequest(url: string, cookies: Record<string, string> = {}): NextRequest {
    const req = new NextRequest(url);
    Object.entries(cookies).forEach(([k, v]) => {
      req.cookies.set(k, v);
    });
    return req;
  }

  it('allows all routes when DEMO_PASSWORD is not configured', async () => {
    const req = createMockRequest('http://localhost:3000/feed');
    const res = await middleware(req);
    expect(res.status).toBe(200);
  });

  it('allows public landing page (/) even when DEMO_PASSWORD is set', async () => {
    process.env.DEMO_PASSWORD = 'super_secret_demo_pass';
    const req = createMockRequest('http://localhost:3000/');
    const res = await middleware(req);
    expect(res.status).toBe(200);
  });

  it('allows public manifesto (/manifesto) when DEMO_PASSWORD is set', async () => {
    process.env.DEMO_PASSWORD = 'super_secret_demo_pass';
    const req = createMockRequest('http://localhost:3000/manifesto');
    const res = await middleware(req);
    expect(res.status).toBe(200);
  });

  it('allows demo gate page (/demo-gate) and demo auth / waitlist api (/api/demo-auth, /api/v1/waitlist)', async () => {
    process.env.DEMO_PASSWORD = 'super_secret_demo_pass';
    
    const gateReq = createMockRequest('http://localhost:3000/demo-gate?returnUrl=/feed');
    const gateRes = await middleware(gateReq);
    expect(gateRes.status).toBe(200);

    const apiReq = createMockRequest('http://localhost:3000/api/demo-auth');
    const apiRes = await middleware(apiReq);
    expect(apiRes.status).toBe(200);

    const waitlistReq = createMockRequest('http://localhost:3000/api/v1/waitlist');
    const waitlistRes = await middleware(waitlistReq);
    expect(waitlistRes.status).toBe(200);
  });

  it('redirects unauthenticated access to /feed to /demo-gate with returnUrl', async () => {
    process.env.DEMO_PASSWORD = 'super_secret_demo_pass';
    const req = createMockRequest('http://localhost:3000/feed');
    const res = await middleware(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toContain('/demo-gate?returnUrl=%2Ffeed');
  });

  it('redirects access to /onboarding with query params to /demo-gate with preserved returnUrl', async () => {
    process.env.DEMO_PASSWORD = 'super_secret_demo_pass';
    const req = createMockRequest('http://localhost:3000/onboarding?step=2');
    const res = await middleware(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toContain('/demo-gate?returnUrl=%2Fonboarding%3Fstep%3D2');
  });

  it('redirects when an invalid / forged cookie is provided', async () => {
    process.env.DEMO_PASSWORD = 'super_secret_demo_pass';
    const req = createMockRequest('http://localhost:3000/feed', {
      [DEMO_COOKIE_NAME]: 'forged_invalid_hash_value',
    });
    const res = await middleware(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toContain('/demo-gate');
  });

  it('allows access to protected app route when valid hashed cookie is provided', async () => {
    process.env.DEMO_PASSWORD = 'super_secret_demo_pass';
    const validHash = await hashDemoPassword('super_secret_demo_pass');
    
    const req = createMockRequest('http://localhost:3000/feed', {
      [DEMO_COOKIE_NAME]: validHash,
    });
    const res = await middleware(req);

    expect(res.status).toBe(200);
  });
});
