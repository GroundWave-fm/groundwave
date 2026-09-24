import { Pool } from 'pg';

export * from './geo';
export * from './migrate';
export * from './seed';

export function createDatabasePool(connectionString?: string): Pool {
  return new Pool({
    connectionString:
      connectionString ||
      process.env.DATABASE_URL ||
      'postgresql://groundwave_user:groundwave_password@localhost:5432/groundwave_dev',
  });
}
