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

// Lazy singleton — defers createDb() until first use so module import doesn't crash at build time when DATABASE_URL is absent
const globalDb = globalThis as typeof globalThis & { _db?: ReturnType<typeof createDb> };

function getDb(): ReturnType<typeof createDb> {
  if (!globalDb._db) globalDb._db = createDb();
  return globalDb._db;
}

export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_, prop) {
    const real = getDb();
    const val = (real as any)[prop];
    return typeof val === "function" ? val.bind(real) : val;
  },
});
