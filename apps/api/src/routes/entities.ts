import { Router, Response } from 'express';
import { createDatabasePool, latLngToH3, KNOWN_CITIES } from '@groundwave/database';
import { requireAuth, requireEntityRole, AuthenticatedRequest } from '../auth';

const router = Router();
const pool = createDatabasePool();

/**
 * POST /api/v1/entities
 * Creates a new Creator Entity (Band, Solo Artist, Label, Curator, Venue) and assigns the creator as 'owner'
 */
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { slug, name, entityType, bio, cityName, lat, lng } = req.body;
  const user = req.user!;

  if (!slug || !name || !entityType) {
    return res.status(400).json({ error: 'slug, name, and entityType are required' });
  }

  const validTypes = ['solo_artist', 'band', 'label', 'curator', 'venue'];
  if (!validTypes.includes(entityType)) {
    return res.status(400).json({ error: `Invalid entityType. Must be one of: ${validTypes.join(', ')}` });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let h3Index = null;
    let countryCode = 'US';
    if (lat && lng) {
      h3Index = latLngToH3(parseFloat(lat), parseFloat(lng));
    } else if (cityName && KNOWN_CITIES[cityName]) {
      const city = KNOWN_CITIES[cityName];
      h3Index = latLngToH3(city.lat, city.lng);
      countryCode = city.country;
    }

    const entityRes = await client.query(
      `INSERT INTO creator_entities (slug, name, entity_type, bio, city_name, country_code, h3_index_res8)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *;`,
      [slug.toLowerCase().trim(), name, entityType, bio, cityName || user.cityName, countryCode, h3Index || user.h3IndexRes8]
    );
    const entity = entityRes.rows[0];

    // Assign creating user as 'owner'
    await client.query(
      `INSERT INTO entity_memberships (entity_id, user_id, role, member_title, royalty_split_pct)
       VALUES ($1, $2, 'owner', 'Founder', 100.00);`,
      [entity.id, user.id]
    );

    await client.query('COMMIT');
    return res.status(201).json({
      message: 'Creator entity created successfully',
      entity,
      membership: {
        role: 'owner',
        userId: user.id,
      },
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Slug handle is already taken' });
    }
    console.error('Create entity error:', err);
    return res.status(500).json({ error: 'Internal server error creating entity' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/v1/entities/:slug
 * Retrieves public details of a creator entity, including its members, releases, and public hub info
 */
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;

  try {
    const entityRes = await pool.query('SELECT * FROM creator_entities WHERE slug = $1', [slug.toLowerCase().trim()]);
    if (entityRes.rows.length === 0) {
      return res.status(404).json({ error: 'Creator entity not found' });
    }
    const entity = entityRes.rows[0];

    // Fetch public team members
    const membersRes = await pool.query(
      `SELECT u.username, u.display_name, u.avatar_url, em.role, em.member_title
       FROM entity_memberships em
       JOIN users u ON u.id = em.user_id
       WHERE em.entity_id = $1
       ORDER BY em.created_at ASC;`,
      [entity.id]
    );

    // Fetch published releases
    const releasesRes = await pool.query(
      `SELECT * FROM releases WHERE creator_entity_id = $1 ORDER BY release_date DESC;`,
      [entity.id]
    );

    return res.json({
      entity,
      teamMembers: membersRes.rows,
      releases: releasesRes.rows,
    });
  } catch (err) {
    console.error('Fetch entity error:', err);
    return res.status(500).json({ error: 'Internal server error fetching entity' });
  }
});

/**
 * POST /api/v1/entities/:entityId/members
 * Adds / invites a user to the entity team (Requires 'owner' or 'admin' role on the entity)
 */
router.post('/:entityId/members', requireAuth, requireEntityRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  const { entityId } = req.params;
  const { username, role, memberTitle, royaltySplitPct } = req.body;

  if (!username || !role) {
    return res.status(400).json({ error: 'username and role are required' });
  }

  const validRoles = ['owner', 'admin', 'member', 'moderator', 'finance_manager'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
  }

  try {
    const userRes = await pool.query('SELECT id, username, display_name FROM users WHERE username = $1', [username.toLowerCase().trim()]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: `User with username @${username} not found` });
    }
    const targetUser = userRes.rows[0];

    const membershipRes = await pool.query(
      `INSERT INTO entity_memberships (entity_id, user_id, role, member_title, royalty_split_pct)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (entity_id, user_id) DO UPDATE SET role = EXCLUDED.role, member_title = EXCLUDED.member_title, royalty_split_pct = EXCLUDED.royalty_split_pct
       RETURNING *;`,
      [entityId, targetUser.id, role, memberTitle || null, royaltySplitPct ? parseFloat(royaltySplitPct) : 0.00]
    );

    return res.json({
      message: `User @${username} added to team successfully`,
      membership: membershipRes.rows[0],
      user: targetUser,
    });
  } catch (err) {
    console.error('Add member error:', err);
    return res.status(500).json({ error: 'Internal server error adding team member' });
  }
});

export default router;
