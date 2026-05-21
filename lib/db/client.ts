import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { createClient } from "@libsql/client";
import { Pool } from "pg";
import * as sqliteSchema from "./schema";

const driver = process.env.DB_DRIVER;
const url = process.env.DATABASE_URL!;

function createDb() {
  if (driver === "postgres") {
    const pool = new Pool({ connectionString: url });
    return drizzlePg(pool, { schema: sqliteSchema });
  }

  const libsql = createClient({ url: url.startsWith("file:") ? url : `file:${url}` });
  return drizzleLibsql(libsql, { schema: sqliteSchema });
}

// Singleton — reuse across hot-reloads in dev
const globalDb = globalThis as typeof globalThis & { _db?: ReturnType<typeof createDb> };
if (!globalDb._db) globalDb._db = createDb();

export const db = globalDb._db;
