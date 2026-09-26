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
        sceneRadiusMiles: user.scene_radius_miles,
        onboardingCompleted: user.onboarding_completed,

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

    // Auto-create default Solo Artist entity for new user
    const slug = `${username.toLowerCase().replace(/[^a-z0-9]/g, '_')}_solo`;
    const entityRes = await pool.query(
      `INSERT INTO creator_entities (slug, name, entity_type, bio, city_name, country_code, h3_index_res8)
       VALUES ($1, $2, 'solo_artist', $3, $4, $5, $6)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING *;`,
      [slug, displayName, `${displayName}'s solo artist page`, cityName || 'Chicago', countryCode, h3Index]
    );
    const entity = entityRes.rows[0];

    await pool.query(
      `INSERT INTO entity_memberships (entity_id, user_id, role, member_title, royalty_split_pct)
       VALUES ($1, $2, 'owner', 'Solo Artist', 100.00)
       ON CONFLICT (entity_id, user_id) DO NOTHING;`,
      [entity.id, user.id]
    );

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
        sceneRadiusMiles: user.scene_radius_miles,
        onboardingCompleted: user.onboarding_completed,

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
    let entitiesRes = await pool.query(
      `SELECT ce.*, em.role as membership_role, em.member_title, em.royalty_split_pct
       FROM creator_entities ce
       JOIN entity_memberships em ON em.entity_id = ce.id
       WHERE em.user_id = $1
       ORDER BY ce.name ASC;`,
      [req.user.id]
    );

    // If user has 0 managed entities, auto-create a default Solo Artist entity for them
    if (entitiesRes.rows.length === 0) {
      const slug = `${req.user.username.toLowerCase().replace(/[^a-z0-9]/g, '_')}_solo`;
      const entityRes = await pool.query(
        `INSERT INTO creator_entities (slug, name, entity_type, bio, city_name, country_code, h3_index_res8)
         VALUES ($1, $2, 'solo_artist', $3, $4, 'US', $5)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING *;`,
        [slug, req.user.displayName || req.user.username, `${req.user.displayName || req.user.username}'s artist page`, req.user.cityName || 'Chicago', req.user.h3IndexRes8]
      );
      const entity = entityRes.rows[0];

      await pool.query(
        `INSERT INTO entity_memberships (entity_id, user_id, role, member_title, royalty_split_pct)
         VALUES ($1, $2, 'owner', 'Solo Artist', 100.00)
         ON CONFLICT (entity_id, user_id) DO NOTHING;`,
        [entity.id, req.user.id]
      );

      entitiesRes = await pool.query(
        `SELECT ce.*, em.role as membership_role, em.member_title, em.royalty_split_pct
         FROM creator_entities ce
         JOIN entity_memberships em ON em.entity_id = ce.id
         WHERE em.user_id = $1
         ORDER BY ce.name ASC;`,
        [req.user.id]
      );
    }

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



/**
 * POST /api/v1/auth/onboarding
 * Completes the onboarding wizard for the user (City and Radius selection)
 */
router.post('/onboarding', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { cityName, radiusMiles } = req.body;

  if (!cityName || !KNOWN_CITIES[cityName]) {
    return res.status(400).json({ error: 'Valid cityName from KNOWN_CITIES is required' });
  }

  try {
    const city = KNOWN_CITIES[cityName];
    const h3Index = latLngToH3(city.lat, city.lng);
    const radius = radiusMiles ? parseInt(radiusMiles, 10) : 15;

    const updateRes = await pool.query(
      `UPDATE users 
       SET city_name = $1, country_code = $2, h3_index_res8 = $3, scene_radius_miles = $4, onboarding_completed = TRUE, updated_at = NOW()
       WHERE id = $5
       RETURNING *;`,
      [cityName, city.country, h3Index, radius, req.user.id]
    );

    const updatedUser = updateRes.rows[0];

    return res.json({
      message: 'Onboarding complete',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        displayName: updatedUser.display_name,
        cityName: updatedUser.city_name,
        h3IndexRes8: updatedUser.h3_index_res8,
        sceneRadiusMiles: updatedUser.scene_radius_miles,
        onboardingCompleted: updatedUser.onboarding_completed,
      },
    });
  } catch (err) {
    console.error('Onboarding update error:', err);
    return res.status(500).json({ error: 'Internal server error during onboarding' });
  }
});

export default router;
