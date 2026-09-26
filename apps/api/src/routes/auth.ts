import { Router, Response } from 'express';
import crypto from 'crypto';
import { createDatabasePool, latLngToH3, KNOWN_CITIES } from '@groundwave/database';
import { generateToken, requireAuth, requirePlatformAdmin, AuthenticatedRequest } from '../auth';

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
 * POST /api/v1/auth/invite/validate
 * Validates an invitation code for registration
 */
router.post('/invite/validate', async (req, res) => {
  const { code, email } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ valid: false, error: 'Invitation code is required' });
  }

  const normalizedCode = code.trim().toUpperCase();

  try {
    const result = await pool.query(
      'SELECT * FROM invitation_codes WHERE UPPER(code) = $1',
      [normalizedCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ valid: false, error: 'Invitation code not found' });
    }

    const invite = result.rows[0];

    if (!invite.is_active) {
      return res.status(400).json({ valid: false, error: 'Invitation code is inactive' });
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return res.status(400).json({ valid: false, error: 'Invitation code has expired' });
    }

    if (invite.current_uses >= invite.max_uses) {
      return res.status(400).json({ valid: false, error: 'Invitation code usage limit has been reached' });
    }

    if (invite.target_email) {
      if (!email || typeof email !== 'string' || invite.target_email.toLowerCase().trim() !== email.toLowerCase().trim()) {
        return res.status(400).json({ valid: false, error: 'This invitation code is reserved for a specific email address' });
      }
    }

    return res.json({
      valid: true,
      code: invite.code,
      assignedUserType: invite.assigned_user_type,
      remainingUses: invite.max_uses - invite.current_uses,
    });
  } catch (err) {
    console.error('Validate invite code error:', err);
    return res.status(500).json({ valid: false, error: 'Internal server error validating invitation code' });
  }
});

/**
 * POST /api/v1/auth/register
 * Creates a new personal human user account (gated by invite code during alpha)
 */
router.post('/register', async (req, res) => {
  const { email, username, displayName, cityName, lat, lng, inviteCode } = req.body;

  if (!email || !username || !displayName) {
    return res.status(400).json({ error: 'email, username, and displayName are required' });
  }

  const inviteOnly = process.env.INVITE_ONLY_SIGNUP !== 'false';
  if (inviteOnly && (!inviteCode || !inviteCode.trim())) {
    return res.status(403).json({ error: 'Invitation code is required to register during private alpha' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let validatedInviteId: string | null = null;

    if (inviteCode && inviteCode.trim()) {
      const normalizedCode = inviteCode.trim().toUpperCase();
      const codeRes = await client.query(
        'SELECT * FROM invitation_codes WHERE UPPER(code) = $1 FOR UPDATE',
        [normalizedCode]
      );

      if (codeRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Invalid invitation code' });
      }

      const codeRow = codeRes.rows[0];

      if (!codeRow.is_active) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Invitation code is inactive' });
      }

      if (codeRow.expires_at && new Date(codeRow.expires_at) < new Date()) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Invitation code has expired' });
      }

      if (codeRow.current_uses >= codeRow.max_uses) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Invitation code usage limit has been reached' });
      }

      if (codeRow.target_email) {
        if (!email || typeof email !== 'string' || codeRow.target_email.toLowerCase().trim() !== email.toLowerCase().trim()) {
          await client.query('ROLLBACK');
          return res.status(403).json({ error: 'This invitation code is reserved for a specific email address' });
        }
      }

      validatedInviteId = codeRow.id;
    }

    let h3Index = null;
    let countryCode = 'US';

    if (lat && lng) {
      h3Index = latLngToH3(parseFloat(lat), parseFloat(lng));
    } else if (cityName && KNOWN_CITIES[cityName]) {
      const city = KNOWN_CITIES[cityName];
      h3Index = latLngToH3(city.lat, city.lng);
      countryCode = city.country;
    }

    const insertRes = await client.query(
      `INSERT INTO users (email, username, display_name, city_name, country_code, h3_index_res8)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *;`,
      [email.toLowerCase().trim(), username.toLowerCase().trim(), displayName, cityName || 'Chicago', countryCode, h3Index]
    );

    const user = insertRes.rows[0];

    if (validatedInviteId) {
      await client.query(
        `UPDATE invitation_codes
         SET current_uses = current_uses + 1,
             claimed_by_user_id = COALESCE(claimed_by_user_id, $1),
             updated_at = NOW()
         WHERE id = $2;`,
        [user.id, validatedInviteId]
      );
    }

    await client.query('COMMIT');

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
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email or username is already taken' });
    }
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error during registration' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/v1/auth/invite/grant-waitlist
 * Converts a waitlist entry into an invited alpha tester with a dedicated invitation code
 * Restricted to platform admins.
 */
router.post('/invite/grant-waitlist', requireAuth, requirePlatformAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { waitlistId, email } = req.body;

  if (!waitlistId && !email) {
    return res.status(400).json({ error: 'waitlistId or email is required' });
  }

  try {
    let waitlistRes;
    if (waitlistId) {
      waitlistRes = await pool.query('SELECT * FROM waitlist_entries WHERE id = $1', [waitlistId]);
    } else {
      waitlistRes = await pool.query('SELECT * FROM waitlist_entries WHERE email = $1', [email.toLowerCase().trim()]);
    }

    if (waitlistRes.rows.length === 0) {
      return res.status(404).json({ error: 'Waitlist entry not found' });
    }

    const entry = waitlistRes.rows[0];

    // If already invited, return existing code
    if (entry.is_invited && entry.invitation_code_id) {
      const codeRes = await pool.query('SELECT * FROM invitation_codes WHERE id = $1', [entry.invitation_code_id]);
      if (codeRes.rows.length > 0) {
        return res.json({
          success: true,
          inviteCode: codeRes.rows[0].code,
          waitlistEmail: entry.email,
        });
      }
    }

    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const generatedCode = `GW-WL-${randomSuffix}`;

    const insertCodeRes = await pool.query(
      `INSERT INTO invitation_codes (code, created_by_user_id, max_uses, current_uses, assigned_user_type, target_email, expires_at)
       VALUES ($1, $2, 1, 0, $3, $4, NOW() + INTERVAL '30 days')
       RETURNING *;`,
      [generatedCode, req.user?.id || null, entry.user_type, entry.email]
    );

    const newCode = insertCodeRes.rows[0];

    await pool.query(
      `UPDATE waitlist_entries
       SET is_invited = TRUE, invitation_code_id = $1
       WHERE id = $2;`,
      [newCode.id, entry.id]
    );

    return res.status(201).json({
      success: true,
      inviteCode: newCode.code,
      waitlistEmail: entry.email,
    });
  } catch (err) {
    console.error('Grant waitlist invite error:', err);
    return res.status(500).json({ error: 'Internal server error granting waitlist invitation' });
  }
});

/**
 * POST /api/v1/auth/invite/generate
 * Generates an invitation code. Platform admins have unlimited generation;
 * verified creator entities can generate up to 5 codes.
 */
router.post('/invite/generate', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const isPlatformAdmin = Boolean(req.user.isPlatformAdmin);

  try {
    if (!isPlatformAdmin) {
      const creatorCheck = await pool.query(
        `SELECT em.*, ce.verification_status
         FROM entity_memberships em
         JOIN creator_entities ce ON ce.id = em.entity_id
         WHERE em.user_id = $1 AND em.role IN ('owner', 'admin') AND ce.verification_status = 'verified'`,
        [req.user.id]
      );

      if (creatorCheck.rows.length === 0) {
        return res.status(403).json({
          error: 'Only platform admins or verified creator entities may generate invite codes',
        });
      }

      const quotaRes = await pool.query(
        'SELECT COUNT(*) FROM invitation_codes WHERE created_by_user_id = $1',
        [req.user.id]
      );
      const existingCount = parseInt(quotaRes.rows[0].count, 10);
      if (existingCount >= 5) {
        return res.status(403).json({
          error: 'Invite code generation quota reached (maximum 5 codes per verified creator)',
        });
      }
    }

    const { code, maxUses, assignedUserType, targetEmail, expiresAt } = req.body;
    const finalCode = code
      ? code.trim().toUpperCase()
      : `GW-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    if (code) {
      const existing = await pool.query('SELECT id FROM invitation_codes WHERE UPPER(code) = $1', [finalCode]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Invitation code already exists' });
      }
    }

    const insertRes = await pool.query(
      `INSERT INTO invitation_codes (code, created_by_user_id, max_uses, assigned_user_type, target_email, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *;`,
      [
        finalCode,
        req.user.id,
        maxUses ? parseInt(maxUses, 10) : 1,
        assignedUserType || 'fan',
        targetEmail ? targetEmail.toLowerCase().trim() : null,
        expiresAt ? new Date(expiresAt) : null,
      ]
    );

    const row = insertRes.rows[0];
    return res.status(201).json({
      message: 'Invitation code generated successfully',
      code: {
        id: row.id,
        code: row.code,
        createdByUserId: row.created_by_user_id,
        claimedByUserId: row.claimed_by_user_id,
        maxUses: row.max_uses,
        currentUses: row.current_uses,
        assignedUserType: row.assigned_user_type,
        targetEmail: row.target_email,
        expiresAt: row.expires_at,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (err) {
    console.error('Generate invite code error:', err);
    return res.status(500).json({ error: 'Internal server error generating invitation code' });
  }
});

/**
 * GET /api/v1/auth/invite/my-codes
 * Lists invitation codes created by the authenticated user
 */
router.get('/invite/my-codes', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const codesRes = await pool.query(
      'SELECT * FROM invitation_codes WHERE created_by_user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    return res.json({
      codes: codesRes.rows.map((row) => ({
        id: row.id,
        code: row.code,
        createdByUserId: row.created_by_user_id,
        claimedByUserId: row.claimed_by_user_id,
        maxUses: row.max_uses,
        currentUses: row.current_uses,
        assignedUserType: row.assigned_user_type,
        targetEmail: row.target_email,
        expiresAt: row.expires_at,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  } catch (err) {
    console.error('Fetch my-codes error:', err);
    return res.status(500).json({ error: 'Failed to fetch invitation codes' });
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
