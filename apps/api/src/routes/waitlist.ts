import { Router, Request, Response } from 'express';
import { createDatabasePool, latLngToH3, KNOWN_CITIES } from '@groundwave/database';
import type { WaitlistUserType, CreateWaitlistInput, WaitlistResponse } from '@groundwave/types';
import { requireAuth, requirePlatformAdmin, AuthenticatedRequest } from '../auth';

const router = Router();
const pool = createDatabasePool();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_USER_TYPES: WaitlistUserType[] = ['fan', 'artist', 'label', 'curator', 'venue'];

/**
 * POST /api/v1/waitlist
 * Register an email address for early access / waitlist
 */
router.post('/', async (req: Request<{}, {}, CreateWaitlistInput & { lat?: number; lng?: number }>, res: Response<WaitlistResponse | { error: string }>) => {
  const { email, cityName, userType = 'fan', source = 'marketing_landing', lat, lng } = req.body;

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ error: 'A valid email address is required' });
  }

  if (userType && !ALLOWED_USER_TYPES.includes(userType)) {
    return res.status(400).json({ error: `Invalid userType. Allowed values: ${ALLOWED_USER_TYPES.join(', ')}` });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    let h3Index: string | null = null;

    if (lat && lng) {
      h3Index = latLngToH3(Number(lat), Number(lng));
    } else if (cityName && KNOWN_CITIES[cityName]) {
      const city = KNOWN_CITIES[cityName];
      h3Index = latLngToH3(city.lat, city.lng);
    }

    // Check if email already exists
    const existingResult = await pool.query(
      'SELECT id, email, city_name, h3_index_res8, user_type, source, created_at FROM waitlist_entries WHERE email = $1',
      [normalizedEmail]
    );

    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0];
      return res.status(200).json({
        success: true,
        message: "You're already on the waitlist! We'll reach out when GroundWave arrives in your city.",
        alreadyRegistered: true,
        entry: {
          id: existing.id,
          email: existing.email,
          cityName: existing.city_name,
          h3IndexRes8: existing.h3_index_res8,
          userType: existing.user_type,
          source: existing.source,
          createdAt: existing.created_at,
        },
      });
    }

    // Insert new waitlist entry
    const insertResult = await pool.query(
      `INSERT INTO waitlist_entries (email, city_name, h3_index_res8, user_type, source)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, city_name, h3_index_res8, user_type, source, created_at;`,
      [normalizedEmail, cityName || null, h3Index, userType, source]
    );

    const row = insertResult.rows[0];
    return res.status(201).json({
      success: true,
      message: 'Welcome to the GroundWave waitlist! Stay tuned for early access.',
      alreadyRegistered: false,
      entry: {
        id: row.id,
        email: row.email,
        cityName: row.city_name,
        h3IndexRes8: row.h3_index_res8,
        userType: row.user_type,
        source: row.source,
        createdAt: row.created_at,
      },
    });
  } catch (err: any) {
    console.error('Waitlist submission error:', err);
    return res.status(500).json({ error: 'Internal server error while processing waitlist registration' });
  }
});

/**
 * GET /api/v1/waitlist/count
 * Returns total count of waitlist subscribers
 */
router.get('/count', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT COUNT(*)::int as count FROM waitlist_entries');
    const count = result.rows[0]?.count || 0;
    return res.json({ success: true, count });
  } catch (err) {
    console.error('Waitlist count error:', err);
    return res.status(500).json({ error: 'Internal server error retrieving waitlist count' });
  }
});

/**
 * GET /api/v1/waitlist/entries
 * Returns waitlist entries with invitation status and codes.
 * Restricted to platform admins.
 */
router.get('/entries', requireAuth, requirePlatformAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        we.id, 
        we.email, 
        we.city_name as "cityName", 
        we.user_type as "userType", 
        we.source, 
        we.is_invited as "isInvited", 
        we.created_at as "createdAt",
        ic.code as "inviteCode",
        ic.current_uses as "currentUses",
        ic.max_uses as "maxUses"
      FROM waitlist_entries we
      LEFT JOIN invitation_codes ic ON ic.id = we.invitation_code_id
      ORDER BY we.created_at DESC
      LIMIT 200;
    `);

    return res.json({
      success: true,
      entries: result.rows,
    });
  } catch (err) {
    console.error('Waitlist entries error:', err);
    return res.status(500).json({ error: 'Failed to retrieve waitlist entries' });
  }
});

export default router;
