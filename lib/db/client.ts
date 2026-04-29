import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import Database from "better-sqlite3";
import { Pool } from "pg";
import * as sqliteSchema from "./schema";

const driver = process.env.DB_DRIVER;
const url = process.env.DATABASE_URL!;

function createClient() {
  if (driver === "postgres") {
    const pool = new Pool({ connectionString: url });
    return drizzlePg(pool, { schema: sqliteSchema });
  }

  const sqlite = new Database(url);
  return drizzleSqlite(sqlite, { schema: sqliteSchema });
}

// Singleton — reuse across hot-reloads in dev
const globalDb = globalThis as typeof globalThis & { _db?: ReturnType<typeof createClient> };
if (!globalDb._db) globalDb._db = createClient();

export const db = globalDb._db;
