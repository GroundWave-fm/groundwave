import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createDatabasePool } from './index';

dotenv.config();

export async function runMigrations() {
  const pool = createDatabasePool();
  console.log('🔄 Running database schema migration (init.sql)...');

  try {
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
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
