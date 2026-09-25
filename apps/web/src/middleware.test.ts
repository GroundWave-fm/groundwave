import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from './middleware';

describe('Next.js Demo Basic Auth Middleware', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.DEMO_PASSWORD;
    delete process.env.DEMO_USER;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  function createMockRequest(headers: Record<string, string> = {}, url = 'http://localhost:3000/'): NextRequest {
    const headerMap = new Headers();
    Object.entries(headers).forEach(([k, v]) => headerMap.set(k, v));
    return new NextRequest(url, { headers: headerMap });
  }

  it('bypasses authentication when DEMO_PASSWORD is not set', () => {
    const req = createMockRequest();
    const res = middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('WWW-Authenticate')).toBeNull();
  });

  it('returns 401 Unauthorized with WWW-Authenticate header when DEMO_PASSWORD is set and no Authorization header provided', () => {
    process.env.DEMO_PASSWORD = 'super_secret_demo_pass';
    const req = createMockRequest();
    const res = middleware(req);

    expect(res.status).toBe(401);
    expect(res.headers.get('WWW-Authenticate')).toBe('Basic realm="GroundWave Demo Environment"');
  });

  it('returns 401 when invalid password is provided', () => {
    process.env.DEMO_PASSWORD = 'super_secret_demo_pass';
    const credentials = Buffer.from('admin:wrong_password').toString('base64');
    const req = createMockRequest({
      authorization: `Basic ${credentials}`,
    });
    const res = middleware(req);

    expect(res.status).toBe(401);
    expect(res.headers.get('WWW-Authenticate')).toBe('Basic realm="GroundWave Demo Environment"');
  });

  it('returns 401 when invalid username is provided with default DEMO_USER', () => {
    process.env.DEMO_PASSWORD = 'super_secret_demo_pass';
    const credentials = Buffer.from('wrong_user:super_secret_demo_pass').toString('base64');
    const req = createMockRequest({
      authorization: `Basic ${credentials}`,
    });
    const res = middleware(req);

    expect(res.status).toBe(401);
  });

  it('allows access (status 200 next()) when valid default credentials are provided', () => {
    process.env.DEMO_PASSWORD = 'super_secret_demo_pass';
    const credentials = Buffer.from('admin:super_secret_demo_pass').toString('base64');
    const req = createMockRequest({
      authorization: `Basic ${credentials}`,
    });
    const res = middleware(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('WWW-Authenticate')).toBeNull();
  });

  it('allows access with custom DEMO_USER and password containing special characters/colons', () => {
    process.env.DEMO_USER = 'groundwave_lead';
    process.env.DEMO_PASSWORD = 'pass:with:colons!@#';
    const credentials = Buffer.from('groundwave_lead:pass:with:colons!@#').toString('base64');
    const req = createMockRequest({
      authorization: `Basic ${credentials}`,
    });
    const res = middleware(req);

    expect(res.status).toBe(200);
  });

  it('handles malformed authorization headers gracefully with 401', () => {
    process.env.DEMO_PASSWORD = 'super_secret_demo_pass';
    const req = createMockRequest({
      authorization: 'Bearer non_basic_token',
    });
    const res = middleware(req);

    expect(res.status).toBe(401);
  });
});
