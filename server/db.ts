import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

export let useRealDatabase = true;
export let pool: Pool | null = null;
export let db: ReturnType<typeof drizzle> | null = null;

export const initializeDatabase = async () => {
  try {
    if (!process.env.DATABASE_URL) {
      console.log("DATABASE_URL not set, using in-memory storage.");
      return;
    }

    console.log("Attempting to connect to database...");

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 15000,
      max: 3,
      idleTimeoutMillis: 30000,
      allowExitOnIdle: true,
      statement_timeout: 10000,
      query_timeout: 10000
    });

    db = drizzle(pool, { schema });

    await pool.query('SELECT 1');

    useRealDatabase = true;
    console.log("Database connection successfully established.");
    console.log("useRealDatabase:", useRealDatabase);
    console.log("DATABASE URL:", process.env.DATABASE_URL);
  } catch (err) {
    console.error("Failed to connect to database:", err);
    pool = null;
    db = null;
    useRealDatabase = false;
    console.log("Inserting user into:", useRealDatabase ? "PostgreSQL" : "in-memory");
  }
};
