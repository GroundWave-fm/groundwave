import dotenv from 'dotenv';
import { createDatabasePool } from './index';
import { latLngToH3, KNOWN_CITIES } from './geo';

dotenv.config();

export async function seedDatabase() {
  const pool = createDatabasePool();
  console.log('🌱 Seeding GroundWave database with Individual Identity vs Creator Entity model...');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Wipe and re-apply fresh schema
    const chicagoH3 = latLngToH3(KNOWN_CITIES.Chicago.lat, KNOWN_CITIES.Chicago.lng);

    // 2. Seed Individual Human Users (Identity & Auth)
    const mayaUserRes = await client.query(`
      INSERT INTO users (email, username, display_name, bio, city_name, country_code, h3_index_res8)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name
      RETURNING id;
    `, ['maya@groundwave.fm', 'maya_guitar', 'Maya Lin', 'Musician & songwriter based in Chicago.', 'Chicago', 'US', chicagoH3]);
    const mayaUserId = mayaUserRes.rows[0].id;

    const alexUserRes = await client.query(`
      INSERT INTO users (email, username, display_name, bio, city_name, country_code, h3_index_res8)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name
      RETURNING id;
    `, ['alex@groundwave.fm', 'alex_drums', 'Alex Chen', 'Drummer & audio engineer.', 'Chicago', 'US', chicagoH3]);
    const alexUserId = alexUserRes.rows[0].id;

    const marcusUserRes = await client.query(`
      INSERT INTO users (email, username, display_name, bio, city_name, country_code, h3_index_res8)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name
      RETURNING id;
    `, ['marcus@midwestpressings.com', 'marcus_cole', 'Marcus Cole', 'Indie label founder & vinyl collector.', 'Chicago', 'US', chicagoH3]);
    const marcusUserId = marcusUserRes.rows[0].id;

    const elenaUserRes = await client.query(`
      INSERT INTO users (email, username, display_name, bio, city_name, country_code, h3_index_res8)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name
      RETURNING id;
    `, ['elena@groundwave.fm', 'elena_v', 'Elena Vance', 'DJ & scene tastemaker.', 'Chicago', 'US', chicagoH3]);
    const elenaUserId = elenaUserRes.rows[0].id;

    const jordanUserRes = await client.query(`
      INSERT INTO users (email, username, display_name, bio, city_name, country_code, h3_index_res8)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name
      RETURNING id;
    `, ['jordan@gmail.com', 'jordan_commuter', 'Jordan Bell', 'Music enthusiast and daily commuter.', 'Chicago', 'US', chicagoH3]);
    const jordanUserId = jordanUserRes.rows[0].id;

    // 3. Seed Creator Entities (Bands, Solo Acts, Labels, Venues)
    // 3A. Band Entity: The Static Veins
    const bandEntityRes = await client.query(`
      INSERT INTO creator_entities (slug, name, entity_type, bio, city_name, country_code, h3_index_res8, verification_status, allow_fan_posts)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'verified', true)
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `, ['static_veins', 'The Static Veins', 'band', 'Logan Square post-punk quartet.', 'Chicago', 'US', chicagoH3]);
    const bandEntityId = bandEntityRes.rows[0].id;

    // 3B. Solo Artist Entity: Maya Sol
    const soloEntityRes = await client.query(`
      INSERT INTO creator_entities (slug, name, entity_type, bio, city_name, country_code, h3_index_res8, verification_status, allow_fan_posts)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'verified', true)
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `, ['maya_sol', 'Maya Sol', 'solo_artist', 'Indie acoustic singer-songwriter.', 'Chicago', 'US', chicagoH3]);
    const soloEntityId = soloEntityRes.rows[0].id;

    // 3C. Label Entity: Midwest Pressings
    const labelEntityRes = await client.query(`
      INSERT INTO creator_entities (slug, name, entity_type, bio, city_name, country_code, h3_index_res8, verification_status, allow_fan_posts)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'verified', true)
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `, ['midwest_pressings', 'Midwest Pressings', 'label', 'Boutique cassette & vinyl record label.', 'Chicago', 'US', chicagoH3]);
    const labelEntityId = labelEntityRes.rows[0].id;

    // 3D. Curator Entity: Chicago Scene Radio
    const curatorEntityRes = await client.query(`
      INSERT INTO creator_entities (slug, name, entity_type, bio, city_name, country_code, h3_index_res8, verification_status, allow_fan_posts)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'verified', true)
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `, ['chicago_scene_radio', 'Chicago Scene Radio', 'curator', 'Weekly curated local scene broadcasts on groundwave.fm.', 'Chicago', 'US', chicagoH3]);
    const curatorEntityId = curatorEntityRes.rows[0].id;

    // 3E. Venue Entity: The Empty Bottle
    const venueEntityRes = await client.query(`
      INSERT INTO creator_entities (slug, name, entity_type, bio, city_name, country_code, h3_index_res8, verification_status, allow_fan_posts)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'verified', true)
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `, ['empty_bottle', 'The Empty Bottle', 'venue', 'Legendary Chicago indie music venue since 1992.', 'Chicago', 'US', chicagoH3]);
    const venueEntityId = venueEntityRes.rows[0].id;

    // 4. Seed Multi-User Team Memberships & Permissions
    // Maya is Owner of Maya Sol Solo entity
    await client.query(`
      INSERT INTO entity_memberships (entity_id, user_id, role, member_title, royalty_split_pct)
      VALUES ($1, $2, 'owner', 'Founder & Artist', 100.00)
      ON CONFLICT (entity_id, user_id) DO NOTHING;
    `, [soloEntityId, mayaUserId]);

    // Maya & Alex are in The Static Veins Band (with internal 50/50 splits)
    await client.query(`
      INSERT INTO entity_memberships (entity_id, user_id, role, member_title, royalty_split_pct)
      VALUES 
        ($1, $2, 'owner', 'Guitar & Lead Vocals', 50.00),
        ($1, $3, 'admin', 'Drums & Production', 50.00)
      ON CONFLICT (entity_id, user_id) DO NOTHING;
    `, [bandEntityId, mayaUserId, alexUserId]);

    // Marcus is Owner of Midwest Pressings label
    await client.query(`
      INSERT INTO entity_memberships (entity_id, user_id, role, member_title, royalty_split_pct)
      VALUES ($1, $2, 'owner', 'Label Manager', 100.00)
      ON CONFLICT (entity_id, user_id) DO NOTHING;
    `, [labelEntityId, marcusUserId]);

    // Elena manages Chicago Scene Radio
    await client.query(`
      INSERT INTO entity_memberships (entity_id, user_id, role, member_title, royalty_split_pct)
      VALUES ($1, $2, 'owner', 'Lead Tastemaker & DJ', 100.00)
      ON CONFLICT (entity_id, user_id) DO NOTHING;
    `, [curatorEntityId, elenaUserId]);

    // 5. Seed Label Roster Link (Midwest Pressings signed The Static Veins)
    await client.query(`
      INSERT INTO label_roster_memberships (label_entity_id, artist_entity_id, default_royalty_split_pct)
      VALUES ($1, $2, 50.00)
      ON CONFLICT (label_entity_id, artist_entity_id) DO NOTHING;
    `, [labelEntityId, bandEntityId]);

    // 6. Seed Releases & Tracks
    const releaseRes = await client.query(`
      INSERT INTO releases (creator_entity_id, label_entity_id, title, release_type, cover_art_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
    `, [bandEntityId, labelEntityId, 'Fading Neon Signals', 'ep', 'https://groundwave.fm/art/fading-neon.jpg']);
    const releaseId = releaseRes.rows[0].id;

    await client.query(`
      INSERT INTO tracks (release_id, creator_entity_id, title, track_number, duration_seconds, hls_master_manifest_url, lossless_flac_url)
      VALUES 
        ($1, $2, 'Echoes on Milwaukee Ave', 1, 214, 'https://cdn.groundwave.fm/hls/echoes/master.m3u8', 'https://cdn.groundwave.fm/flac/echoes.flac'),
        ($1, $2, 'Night Shift Radio', 2, 186, 'https://cdn.groundwave.fm/hls/nightshift/master.m3u8', 'https://cdn.groundwave.fm/flac/nightshift.flac');
    `, [releaseId, bandEntityId]);

    // 7. Seed Community Post authored by Maya in the Band Hub
    await client.query(`
      INSERT INTO community_posts (hub_entity_id, author_user_id, post_type, visibility, content, is_pinned)
      VALUES ($1, $2, 'creator_broadcast', 'public', 'Hey Chicago! Our release show at The Empty Bottle is official for next month! 7-inch vinyl will be available at the door.', true);
    `, [bandEntityId, mayaUserId]);

    // Jordan (Fan) posts a reply in The Static Veins Hub
    await client.query(`
      INSERT INTO community_posts (hub_entity_id, author_user_id, post_type, visibility, content)
      VALUES ($1, $2, 'fan_post', 'public', 'Cannot wait! Been playing Night Shift Radio on repeat on my daily commute.');
    `, [bandEntityId, jordanUserId]);

    await client.query('COMMIT');
    console.log('✅ Fresh seed complete! Seeded Users, Creator Entities, Team Memberships, Roster Links, Releases, and Posts.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
