import type { Config } from "drizzle-kit";

const driver = process.env.DB_DRIVER;
const url = process.env.DATABASE_URL!;

export default (
  driver === "postgres"
    ? {
        dialect: "postgresql",
        schema: "./lib/db/schema.ts",
        out: "./lib/db/migrations/pg",
        dbCredentials: { url },
      }
    : {
        dialect: "sqlite",
        schema: "./lib/db/schema.ts",
        out: "./lib/db/migrations/sqlite",
        dbCredentials: { url },
      }
) satisfies Config;
