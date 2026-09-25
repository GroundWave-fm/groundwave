import { Router, Request, Response } from 'express';
import { createDatabasePool, latLngToH3, KNOWN_CITIES } from '@groundwave/database';
import type { WaitlistUserType, CreateWaitlistInput, WaitlistResponse } from '@groundwave/types';

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

export default router;
