import dotenv from 'dotenv';
import { createDatabasePool } from './index';
import { latLngToH3, KNOWN_CITIES } from './geo';

dotenv.config();

export async function seedDatabase() {
  const pool = createDatabasePool();
  console.log('🌱 Seeding Groundwave alpha database with test personas & catalog...');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Seed Cities H3
    const chicagoH3 = latLngToH3(KNOWN_CITIES.Chicago.lat, KNOWN_CITIES.Chicago.lng);
    const austinH3 = latLngToH3(KNOWN_CITIES.Austin.lat, KNOWN_CITIES.Austin.lng);

    // 2. Seed Artists (Maya & The Static Veins)
    const mayaRes = await client.query(`
      INSERT INTO users (username, email, role, display_name, bio, city_name, country_code, h3_index_res8)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (username) DO UPDATE SET display_name = EXCLUDED.display_name
      RETURNING id;
    `, ['maya_music', 'maya@groundwave.fm', 'artist', 'Maya Sol', 'Chicago indie folk singer-songwriter.', 'Chicago', 'US', chicagoH3]);
    const mayaId = mayaRes.rows[0].id;

    await client.query(`
      INSERT INTO artist_profiles (artist_id, payouts_enabled, allow_fan_posts)
      VALUES ($1, true, true)
      ON CONFLICT (artist_id) DO NOTHING;
    `, [mayaId]);

    const bandRes = await client.query(`
      INSERT INTO users (username, email, role, display_name, bio, city_name, country_code, h3_index_res8)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (username) DO UPDATE SET display_name = EXCLUDED.display_name
      RETURNING id;
    `, ['static_veins', 'veins@groundwave.fm', 'artist', 'The Static Veins', 'Post-punk quartet from Logan Square, Chicago.', 'Chicago', 'US', chicagoH3]);
    const bandId = bandRes.rows[0].id;

    await client.query(`
      INSERT INTO artist_profiles (artist_id, payouts_enabled, allow_fan_posts)
      VALUES ($1, true, true)
      ON CONFLICT (artist_id) DO NOTHING;
    `, [bandId]);

    // 3. Seed Independent Label (Marcus / Midwest Pressings)
    const labelUserRes = await client.query(`
      INSERT INTO users (username, email, role, display_name, bio, city_name, country_code, h3_index_res8)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (username) DO UPDATE SET display_name = EXCLUDED.display_name
      RETURNING id;
    `, ['midwest_pressings', 'marcus@midwestpressings.com', 'label', 'Midwest Pressings', 'Boutique indie cassette & vinyl label.', 'Chicago', 'US', chicagoH3]);
    const labelId = labelUserRes.rows[0].id;

    await client.query(`
      INSERT INTO label_profiles (label_id, founded_year, headquarters_city, has_vinyl_club)
      VALUES ($1, 2022, 'Chicago', true)
      ON CONFLICT (label_id) DO NOTHING;
    `, [labelId]);

    // Link Band to Label Roster
    await client.query(`
      INSERT INTO label_roster_memberships (label_id, artist_id, default_royalty_split_pct)
      VALUES ($1, $2, 50.00)
      ON CONFLICT (label_id, artist_id) DO NOTHING;
    `, [labelId, bandId]);

    // 4. Seed Verified Curator (Elena)
    const curatorRes = await client.query(`
      INSERT INTO users (username, email, role, display_name, bio, city_name, country_code, h3_index_res8)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (username) DO UPDATE SET display_name = EXCLUDED.display_name
      RETURNING id;
    `, ['elena_tunes', 'elena@groundwave.fm', 'curator', 'Elena V.', 'Host of Chicago Scene Radar Radio on groundwave.fm.', 'Chicago', 'US', chicagoH3]);
    const curatorId = curatorRes.rows[0].id;

    await client.query(`
      INSERT INTO curator_profiles (curator_id, verification_status, reputation_score, curator_type, show_name)
      VALUES ($1, 'verified', 850, 'dj', 'The Groundwave Midwest Pulse')
      ON CONFLICT (curator_id) DO NOTHING;
    `, [curatorId]);

    // 5. Seed Venue (The Empty Bottle)
    await client.query(`
      INSERT INTO users (username, email, role, display_name, bio, city_name, country_code, h3_index_res8)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (username) DO NOTHING;
    `, ['empty_bottle', 'shows@emptybottle.com', 'venue', 'The Empty Bottle', 'Legendary Chicago indie music venue since 1992.', 'Chicago', 'US', chicagoH3]);

    // 6. Seed Releases & Tracks
    const releaseRes = await client.query(`
      INSERT INTO releases (primary_artist_id, label_id, title, release_type, cover_art_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
    `, [bandId, labelId, 'Fading Neon Signals', 'ep', 'https://groundwave.fm/art/fading-neon.jpg']);
    const releaseId = releaseRes.rows[0].id;

    await client.query(`
      INSERT INTO tracks (release_id, artist_id, title, track_number, duration_seconds, hls_master_manifest_url, lossless_flac_url)
      VALUES 
        ($1, $2, 'Echoes on Milwaukee Ave', 1, 214, 'https://cdn.groundwave.fm/hls/echoes/master.m3u8', 'https://cdn.groundwave.fm/flac/echoes.flac'),
        ($1, $2, 'Night Shift Radio', 2, 186, 'https://cdn.groundwave.fm/hls/nightshift/master.m3u8', 'https://cdn.groundwave.fm/flac/nightshift.flac');
    `, [releaseId, bandId]);

    // 7. Seed Community Post in Band Hub
    await client.query(`
      INSERT INTO community_posts (hub_id, author_id, post_type, visibility, content, is_pinned)
      VALUES ($1, $2, 'creator_broadcast', 'public', 'Excited to announce our release show at The Empty Bottle next month! Physical 7-inch vinyl will be available.', true);
    `, [bandId, bandId]);

    await client.query('COMMIT');
    console.log('✅ Seed completed successfully! Seeded Artists, Label, Curator, Venue, Releases, and Posts.');
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
