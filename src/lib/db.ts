import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './db/schema';

const globalForSql = globalThis as unknown as {
  __sql?: postgres.Sql;
};

function getSql(): postgres.Sql {
  if (globalForSql.__sql) return globalForSql.__sql;

  const connectionString = process.env.DATABASE_URL_QUINIELA;
  if (!connectionString) {
    throw new Error('DATABASE_URL_QUINIELA environment variable is not set');
  }

  const sql = postgres(connectionString, {
    max: 1,
    ssl: 'require',
    idle_timeout: 20,
    connect_timeout: 10,
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForSql.__sql = sql;
  }

  return sql;
}

const sql = getSql();
export const db = drizzle(sql, { schema });
export { schema };