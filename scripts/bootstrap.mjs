import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { seedSrdPostgres } from "./seed-5e-postgres.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const migrationsDir = path.join(projectRoot, "lib", "db", "migrations", "pg");

const requiredEnv = [
  "DATABASE_URL",
  "S3_ENDPOINT",
  "S3_BUCKET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
];

for (const name of requiredEnv) {
  if (!process.env[name]) {
    throw new Error(`Missing required startup env var: ${name}`);
  }
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function ensureMigrationTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS character_printer_migrations (
      name text PRIMARY KEY,
      applied_at timestamp NOT NULL DEFAULT now()
    )
  `);
}

async function appliedMigrations(client) {
  const result = await client.query("SELECT name FROM character_printer_migrations");
  return new Set(result.rows.map((row) => row.name));
}

async function runMigrations(client) {
  await ensureMigrationTable(client);
  const applied = await appliedMigrations(client);
  const files = (await fs.readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`Migration already applied: ${file}`);
      continue;
    }

    console.log(`Applying migration: ${file}`);
    const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        "INSERT INTO character_printer_migrations (name) VALUES ($1)",
        [file],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
}

async function shouldSeedSrd(client) {
  const result = await client.query("SELECT COUNT(*)::int AS count FROM spells WHERE system = $1", [
    "dnd5e",
  ]);
  return result.rows[0]?.count === 0;
}

async function main() {
  const client = await pool.connect();
  try {
    await runMigrations(client);

    if (await shouldSeedSrd(client)) {
      console.log("No SRD spells found. Seeding D&D 5e SRD data...");
      await seedSrdPostgres(client);
    } else {
      console.log("SRD data already present. Skipping seed.");
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
