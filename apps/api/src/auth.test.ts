import { describe, it, expect, vi } from 'vitest';
import { generateToken, ROLE_HIERARCHY, requireAuth, requireEntityRole, requirePlatformAdmin, AuthenticatedRequest } from './auth';
import jwt from 'jsonwebtoken';
import { Response } from 'express';

describe('Auth & RBAC Logic', () => {
  it('generates a valid signed JWT with sub, email, and username payload', () => {
    const mockUser = {
      id: 'usr_maya_123',
      email: 'maya@groundwave.fm',
      username: 'mayasound',
    };

    const token = generateToken(mockUser);
    expect(typeof token).toBe('string');

    const decoded = jwt.decode(token) as any;
    expect(decoded.sub).toBe(mockUser.id);
    expect(decoded.email).toBe(mockUser.email);
    expect(decoded.username).toBe(mockUser.username);
  });

  it('verifies strict role hierarchy order', () => {
    expect(ROLE_HIERARCHY.owner).toBeGreaterThan(ROLE_HIERARCHY.admin);
    expect(ROLE_HIERARCHY.admin).toBeGreaterThan(ROLE_HIERARCHY.finance_manager);
    expect(ROLE_HIERARCHY.finance_manager).toBeGreaterThanOrEqual(ROLE_HIERARCHY.member);
    expect(ROLE_HIERARCHY.member).toBeGreaterThan(ROLE_HIERARCHY.moderator);
  });

  describe('requireAuth Middleware', () => {
    it('returns 401 when Authorization header is missing or does not start with Bearer', async () => {
      const mockReq: Partial<AuthenticatedRequest> = {
        headers: {},
      };
      const mockRes: Partial<Response> = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const mockNext = vi.fn();

      await requireAuth(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Missing or malformed') }));
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns 401 when token is invalid', async () => {
      const mockReq: Partial<AuthenticatedRequest> = {
        headers: { authorization: 'Bearer invalid_garbage_token' },
      };
      const mockRes: Partial<Response> = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const mockNext = vi.fn();

      await requireAuth(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Invalid or expired') }));
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireEntityRole Middleware', () => {
    it('returns 401 if user is not attached to request', async () => {
      const mockReq: Partial<AuthenticatedRequest> = {};
      const mockRes: Partial<Response> = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const mockNext = vi.fn();

      const middleware = requireEntityRole('admin');
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns 400 if entityId is not provided in params/body/query', async () => {
      const mockReq: Partial<AuthenticatedRequest> = {
        user: { id: 'usr_1', email: 'test@example.com' } as any,
        params: {},
        body: {},
        query: {},
      };
      const mockRes: Partial<Response> = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const mockNext = vi.fn();

      const middleware = requireEntityRole('admin');
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('entityId is required') }));
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('allows platform admins to bypass entity role checks', async () => {
      const mockReq: Partial<AuthenticatedRequest> = {
        user: { id: 'usr_admin', email: 'admin@groundwave.fm', isPlatformAdmin: true } as any,
        params: { entityId: 'ent_some_band' },
        body: {},
        query: {},
      };
      const mockRes: Partial<Response> = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const mockNext = vi.fn();

      const middleware = requireEntityRole('owner');
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requirePlatformAdmin Middleware', () => {
    it('returns 401 if user is not attached to request', async () => {
      const mockReq: Partial<AuthenticatedRequest> = {};
      const mockRes: Partial<Response> = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const mockNext = vi.fn();

      await requirePlatformAdmin(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns 403 if user is not a platform admin', async () => {
      const mockReq: Partial<AuthenticatedRequest> = {
        user: { id: 'usr_user', email: 'fan@example.com', isPlatformAdmin: false } as any,
      };
      const mockRes: Partial<Response> = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const mockNext = vi.fn();

      await requirePlatformAdmin(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Platform admin privileges required' }));
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('calls next if user is a platform admin', async () => {
      const mockReq: Partial<AuthenticatedRequest> = {
        user: { id: 'usr_admin', email: 'admin@groundwave.fm', isPlatformAdmin: true } as any,
      };
      const mockRes: Partial<Response> = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const mockNext = vi.fn();

      await requirePlatformAdmin(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });
});

