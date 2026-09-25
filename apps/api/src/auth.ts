import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, EntityMemberRole } from '@groundwave/types';
import { createDatabasePool } from '@groundwave/database';

const JWT_SECRET = process.env.JWT_SECRET || 'groundwave_super_secret_jwt_key_for_dev_only_change_in_prod';
const pool = createDatabasePool();

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: { id: string; email: string; username: string }): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      username: user.username,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; email: string; username: string };
    
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [payload.sub]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const row = result.rows[0];
    req.user = {
      id: row.id,
      email: row.email,
      username: row.username,
      displayName: row.display_name,
      bio: row.bio,
      avatarUrl: row.avatar_url,
      bannerUrl: row.banner_url,
      cityName: row.city_name,
      countryCode: row.country_code,
      h3IndexRes8: row.h3_index_res8,
      isPlatformAdmin: row.is_platform_admin,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
}

/**
 * RBAC Middleware: Verifies that the authenticated user has a specific minimum role on an entity
 */
export const ROLE_HIERARCHY: Record<EntityMemberRole, number> = {
  owner: 4,
  admin: 3,
  finance_manager: 2,
  member: 2,
  moderator: 1,
};

export function requireEntityRole(minimumRole: EntityMemberRole) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const entityId = req.params.entityId || req.body.entityId || req.query.entityId;
    if (!entityId) {
      return res.status(400).json({ error: 'Target entityId is required for authorization' });
    }

    // Platform admins bypass entity-specific role checks
    if (req.user.isPlatformAdmin) {
      return next();
    }

    try {
      const membershipRes = await pool.query(
        'SELECT role FROM entity_memberships WHERE entity_id = $1 AND user_id = $2',
        [entityId, req.user.id]
      );

      if (membershipRes.rows.length === 0) {
        return res.status(403).json({ error: 'You are not a member of this creator entity' });
      }

      const userRole = membershipRes.rows[0].role as EntityMemberRole;
      if (ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY[minimumRole]) {
        return res.status(403).json({
          error: `Insufficient permissions. Requires '${minimumRole}', your role is '${userRole}'`,
        });
      }

      next();
    } catch (err) {
      console.error('RBAC check error:', err);
      return res.status(500).json({ error: 'Failed to verify entity permissions' });
    }
  };
}
