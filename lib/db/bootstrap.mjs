import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { S3Client, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";
import { seedSrdPostgres } from "./seed-srd-postgres.mjs";
import { hasCsvData, importCsvData } from "./import-csv-pg.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");
const migrationsDir = path.join(projectRoot, "lib", "db", "migrations", "pg");

// database/data is committed + copied into the image.
// database/storage is a host-mounted volume (populated from a backup when needed).
const dataDir = path.join(process.cwd(), "database", "data");
const storageDir = path.join(process.cwd(), "database", "storage");

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

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
});

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
  const files = (await fsPromises.readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`Migration already applied: ${file}`);
      continue;
    }

    console.log(`Applying migration: ${file}`);
    const sql = await fsPromises.readFile(path.join(migrationsDir, file), "utf8");
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
  const spells = await client.query("SELECT COUNT(*)::int AS count FROM spells WHERE system = $1", ["dnd5e"]);
  const backgrounds = await client.query("SELECT COUNT(*)::int AS count FROM backgrounds WHERE system = $1", ["dnd5e"]);
  return spells.rows[0]?.count === 0 || backgrounds.rows[0]?.count === 0;
}

// ─── AIStor storage seeding ───────────────────────────────────────────────────
// Only runs if database/storage/ is mounted and has files AND the bucket is empty.
// To restore images from a backup: copy backup/storage/ → database/storage/ on the host, then restart.

async function isBucketEmpty() {
  try {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET,
      MaxKeys: 1,
    }));
    return (res.KeyCount ?? 0) === 0;
  } catch {
    return false;
  }
}

function guessContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".png": "image/png", ".gif": "image/gif",
    ".webp": "image/webp", ".svg": "image/svg+xml",
  };
  return map[ext] ?? "application/octet-stream";
}

async function listFilesRecursive(dir) {
  const entries = await fsPromises.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFilesRecursive(full) : [full];
  }));
  return files.flat();
}

async function seedStorage() {
  if (!fs.existsSync(storageDir)) return;

  const allFiles = await listFilesRecursive(storageDir);
  const imageFiles = allFiles.filter(f => !path.basename(f).startsWith("."));
  if (imageFiles.length === 0) return;

  if (!(await isBucketEmpty())) {
    console.log("AIStor bucket already has objects. Skipping storage seed.");
    return;
  }

  console.log(`Seeding AIStor with ${imageFiles.length} file(s) from database/storage/...`);
  for (const filePath of imageFiles) {
    const key = path.relative(storageDir, filePath).replace(/\\/g, "/");
    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: fs.readFileSync(filePath),
      ContentType: guessContentType(filePath),
    }));
    console.log(`  -> uploaded: ${key}`);
  }
  console.log("Storage seed complete.");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const client = await pool.connect();
  try {
    await runMigrations(client);

    if (hasCsvData(dataDir)) {
      console.log("CSV data found. Importing from database/data/...");
      await importCsvData(pool, dataDir);
    } else if (await shouldSeedSrd(client)) {
      console.log("No SRD spells found. Seeding D&D 5e SRD data from network...");
      await seedSrdPostgres(client);
    } else {
      console.log("DB already populated. Skipping seed.");
    }
  } finally {
    client.release();
    await pool.end();
  }

  await seedStorage();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
