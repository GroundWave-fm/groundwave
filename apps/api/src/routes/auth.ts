import { Router, Response } from 'express';
import { createDatabasePool, latLngToH3, KNOWN_CITIES } from '@groundwave/database';
import { generateToken, requireAuth, AuthenticatedRequest } from '../auth';

const router = Router();
const pool = createDatabasePool();

/**
 * POST /api/v1/auth/login
 * Passwordless / OAuth login endpoint (issues JWT)
 */
router.post('/login', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User account not found. Please register first.' });
    }

    const user = result.rows[0];
    const token = generateToken({ id: user.id, email: user.email, username: user.username });

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.display_name,
        cityName: user.city_name,
        h3IndexRes8: user.h3_index_res8,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
});

/**
 * POST /api/v1/auth/register
 * Creates a new personal human user account
 */
router.post('/register', async (req, res) => {
  const { email, username, displayName, cityName, lat, lng } = req.body;

  if (!email || !username || !displayName) {
    return res.status(400).json({ error: 'email, username, and displayName are required' });
  }

  try {
    let h3Index = null;
    let countryCode = 'US';

    if (lat && lng) {
      h3Index = latLngToH3(parseFloat(lat), parseFloat(lng));
    } else if (cityName && KNOWN_CITIES[cityName]) {
      const city = KNOWN_CITIES[cityName];
      h3Index = latLngToH3(city.lat, city.lng);
      countryCode = city.country;
    }

    const insertRes = await pool.query(
      `INSERT INTO users (email, username, display_name, city_name, country_code, h3_index_res8)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *;`,
      [email.toLowerCase().trim(), username.toLowerCase().trim(), displayName, cityName || 'Chicago', countryCode, h3Index]
    );

    const user = insertRes.rows[0];
    const token = generateToken({ id: user.id, email: user.email, username: user.username });

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.display_name,
        cityName: user.city_name,
        h3IndexRes8: user.h3_index_res8,
      },
    });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email or username is already taken' });
    }
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
});

/**
 * GET /api/v1/auth/me
 * Returns the authenticated user's profile + all Creator Entities they have permissions on
 */
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Fetch all creator entities this user has team membership in
    const entitiesRes = await pool.query(
      `SELECT ce.*, em.role as membership_role, em.member_title, em.royalty_split_pct
       FROM creator_entities ce
       JOIN entity_memberships em ON em.entity_id = ce.id
       WHERE em.user_id = $1
       ORDER BY ce.name ASC;`,
      [req.user.id]
    );

    return res.json({
      user: req.user,
      managedEntities: entitiesRes.rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        entityType: row.entity_type,
        avatarUrl: row.avatar_url,
        role: row.membership_role,
        memberTitle: row.member_title,
        royaltySplitPct: parseFloat(row.royalty_split_pct),
        verificationStatus: row.verification_status,
      })),
    });
  } catch (err) {
    console.error('Fetch me error:', err);
    return res.status(500).json({ error: 'Internal server error fetching user profile' });
  }
});

export default router;
