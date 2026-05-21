/**
 * Exports all DB tables to CSV files.
 * Usage: pnpm db:export [--output <dir>]
 * Default output: database/data/
 */

import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { createClient } from "@libsql/client";
import { Pool } from "pg";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

// ─── CSV helpers ──────────────────────────────────────────────────────────────

const NULL_SENTINEL = "\\N";

function escapeNewlines(s: string): string {
  return s.replace(/\r\n/g, "\\n").replace(/\r/g, "\\n").replace(/\n/g, "\\n");
}

function csvEscape(s: string): string {
  return '"' + s.replace(/"/g, '""') + '"';
}

function rowToCsvLine(headers: string[], row: Record<string, unknown>): string {
  return headers.map(h => {
    const v = row[h];
    if (v === null || v === undefined) return NULL_SENTINEL;
    if (typeof v === "boolean") return String(v);
    if (typeof v === "object") {
      const s = escapeNewlines(JSON.stringify(v));
      return s.includes(",") || s.includes('"') ? csvEscape(s) : s;
    }
    const s = escapeNewlines(String(v));
    return s.includes(",") || s.includes('"') ? csvEscape(s) : s;
  }).join(",");
}

// ─── Table list (FK-safe import order) ───────────────────────────────────────

const TABLES = [
  "users",
  "spells",
  "classes",
  "races",
  "subraces",
  "backgrounds",
  "items",
  "languages",
  "subclasses",
  "feats",
  "class_spell_slots",
  "class_spells",
  "class_features",
  "race_traits",
  "class_proficiencies",
  "class_skill_choices",
  "race_ability_bonuses",
  "race_ability_bonus_options",
  "race_skill_choices",
  "class_starting_equipment",
  "class_starting_equipment_options",
  "characters",
  "canvas_templates",
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const driver = process.env.DB_DRIVER;
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not set");

  // Parse --output arg
  const outputArgIdx = process.argv.indexOf("--output");
  const outputDir = outputArgIdx !== -1
    ? process.argv[outputArgIdx + 1]
    : path.join(process.cwd(), "database", "data");

  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`Exporting to: ${outputDir}`);

  let totalRows = 0;

  if (driver === "postgres") {
    const pool = new Pool({ connectionString: dbUrl });
    const db = drizzlePg(pool);

    for (const table of TABLES) {
      process.stdout.write(`  -> ${table}... `);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await db.execute(sql.raw(`SELECT * FROM "${table}"`)) as any;
      const data: Record<string, unknown>[] = Array.isArray(result) ? result : (result.rows ?? []);

      if (data.length === 0) { console.log("0 rows (skipped)"); continue; }

      const headers = Object.keys(data[0]);
      const lines = [headers.join(","), ...data.map(row => rowToCsvLine(headers, row))];
      fs.writeFileSync(path.join(outputDir, `${table}.csv`), lines.join("\n"), "utf8");
      console.log(`${data.length} rows`);
      totalRows += data.length;
    }

    await pool.end();

  } else {
    // SQLite via raw libsql client (drizzle-libsql wraps it but raw .execute is on the client)
    const libsql = createClient({ url: dbUrl.startsWith("file:") ? dbUrl : `file:${dbUrl}` });

    for (const table of TABLES) {
      process.stdout.write(`  -> ${table}... `);
      const result = await libsql.execute(`SELECT * FROM "${table}"`);
      const { columns, rows } = result;

      if (rows.length === 0) { console.log("0 rows (skipped)"); continue; }

      // libsql returns rows as arrays; zip with columns
      const data: Record<string, unknown>[] = rows.map(row => {
        const obj: Record<string, unknown> = {};
        columns.forEach((col, i) => { obj[col] = row[i]; });
        return obj;
      });

      const headers = columns;
      const lines = [headers.join(","), ...data.map(row => rowToCsvLine(headers, row))];
      fs.writeFileSync(path.join(outputDir, `${table}.csv`), lines.join("\n"), "utf8");
      console.log(`${data.length} rows`);
      totalRows += data.length;
    }

    libsql.close();
  }

  console.log(`\nDone. ${totalRows} total rows exported to ${outputDir}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
