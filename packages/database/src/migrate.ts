import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createDatabasePool } from './index';

dotenv.config();

export async function runMigrations(reset = false) {
  const pool = createDatabasePool();
  console.log(`🔄 Running database schema migration (init.sql) ${reset ? '[RESET MODE]' : ''}...`);

  try {
    if (reset) {
      console.log('🧹 Dropping existing tables for clean schema re-alignment...');
      await pool.query(`
        DROP TABLE IF EXISTS products CASCADE;
        DROP TABLE IF EXISTS subscription_tiers CASCADE;
        DROP TABLE IF EXISTS community_posts CASCADE;
        DROP TABLE IF EXISTS content_track_attributions CASCADE;
        DROP TABLE IF EXISTS curator_content CASCADE;
        DROP TABLE IF EXISTS tracks CASCADE;
        DROP TABLE IF EXISTS releases CASCADE;
        DROP TABLE IF EXISTS label_roster_memberships CASCADE;
        DROP TABLE IF EXISTS entity_memberships CASCADE;
        DROP TABLE IF EXISTS creator_entities CASCADE;
        DROP TABLE IF EXISTS curator_profiles CASCADE;
        DROP TABLE IF EXISTS label_profiles CASCADE;
        DROP TABLE IF EXISTS artist_profiles CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
      `);
    }

    const initSqlPath = path.resolve(__dirname, '../init.sql');
    const sql = fs.readFileSync(initSqlPath, 'utf-8');

    await pool.query(sql);
    console.log('✅ Database schema and extensions successfully initialized!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  const isReset = process.argv.includes('--reset');
  runMigrations(isReset)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
