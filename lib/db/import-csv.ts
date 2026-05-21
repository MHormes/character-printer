/**
 * Imports CSV files into the database (upsert, safe to re-run).
 * Usage: pnpm db:import [--input <dir>]
 * Default input: database/data/
 */

import { createClient } from "@libsql/client";
import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

// ─── Tables with composite PKs (no single `id` column) ───────────────────────

const COMPOSITE_PK: Record<string, string[]> = {
  class_spell_slots: ["class_id", "level"],
  class_spells: ["class_id", "spell_id"],
};

// JSON columns that need parse/stringify round-trip on import
const JSON_COLUMNS: Record<string, string[]> = {
  characters: ["data"],
  canvas_templates: ["widgets"],
  backgrounds: ["skill_grants", "asi_grants"],
};

// Import order (FK-safe)
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

// ─── CSV parser ───────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let val = "";
      i++; // skip opening quote
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') {
          val += '"';
          i += 2;
        } else if (line[i] === '"') {
          i++; // skip closing quote
          break;
        } else {
          val += line[i++];
        }
      }
      result.push(val);
      if (line[i] === ",") i++;
    } else {
      const end = line.indexOf(",", i);
      if (end === -1) {
        result.push(line.slice(i));
        break;
      }
      result.push(line.slice(i, end));
      i = end + 1;
    }
  }
  return result;
}

async function readCsv(filePath: string): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const rows: Record<string, string>[] = [];
    let headers: string[] = [];

    const rl = readline.createInterface({ input: fs.createReadStream(filePath) });

    rl.on("line", line => {
      if (!line.trim()) return;
      if (headers.length === 0) {
        headers = parseCSVLine(line);
      } else {
        const vals = parseCSVLine(line);
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
        rows.push(row);
      }
    });

    rl.on("close", () => resolve(rows));
    rl.on("error", reject);
  });
}

// ─── Type coercion ────────────────────────────────────────────────────────────

const NULL_SENTINEL = "\\N";

function unescapeNewlines(s: string): string {
  return s.replace(/\\n/g, "\n");
}

function coerceValue(col: string, val: string, jsonCols: string[]): unknown {
  if (val === NULL_SENTINEL || val === undefined) return null;
  if (val === "true") return true;
  if (val === "false") return false;
  const unescaped = unescapeNewlines(val);
  if (jsonCols.includes(col)) {
    try { return JSON.parse(unescaped); } catch { return unescaped; }
  }
  return unescaped;
}

// ─── Chunk helper ─────────────────────────────────────────────────────────────

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

// ─── Build upsert SQL ─────────────────────────────────────────────────────────

function buildUpsert(
  table: string,
  columns: string[],
  rows: Record<string, unknown>[],
  pkCols: string[],
): { query: string; params: unknown[] } {
  const placeholders = rows.map(
    (_, ri) => `(${columns.map((_, ci) => `$${ri * columns.length + ci + 1}`).join(",")})`
  ).join(",");

  const updateCols = columns.filter(c => !pkCols.includes(c));
  const conflictTarget = pkCols.map(c => `"${c}"`).join(",");
  const updateClause = updateCols.length > 0
    ? `ON CONFLICT (${conflictTarget}) DO UPDATE SET ${updateCols.map(c => `"${c}" = EXCLUDED."${c}"`).join(",")}`
    : `ON CONFLICT (${conflictTarget}) DO NOTHING`;

  const query = `INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(",")}) VALUES ${placeholders} ${updateClause}`;
  const params = rows.flatMap(row => columns.map(c => row[c] ?? null));
  return { query, params };
}

// ─── SQLite upsert (libsql uses ? placeholders) ───────────────────────────────

function buildSqliteUpsert(
  table: string,
  columns: string[],
  rows: Record<string, unknown>[],
  pkCols: string[],
): { query: string; params: unknown[] }[] {
  const updateCols = columns.filter(c => !pkCols.includes(c));
  const updateClause = updateCols.length > 0
    ? `ON CONFLICT (${pkCols.map(c => `"${c}"`).join(",")}) DO UPDATE SET ${updateCols.map(c => `"${c}" = excluded."${c}"`).join(",")}`
    : `ON CONFLICT (${pkCols.map(c => `"${c}"`).join(",")}) DO NOTHING`;

  return rows.map(row => ({
    query: `INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(",")}) VALUES (${columns.map(() => "?").join(",")}) ${updateClause}`,
    params: columns.map(c => {
      const v = row[c] ?? null;
      // SQLite booleans → 1/0
      if (typeof v === "boolean") return v ? 1 : 0;
      // JSON objects → string
      if (typeof v === "object" && v !== null) return JSON.stringify(v);
      return v;
    }),
  }));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const driver = process.env.DB_DRIVER;
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not set");

  const inputArgIdx = process.argv.indexOf("--input");
  const inputDir = inputArgIdx !== -1
    ? process.argv[inputArgIdx + 1]
    : path.join(process.cwd(), "database", "data");

  console.log(`Importing from: ${inputDir}`);

  const isPostgres = driver === "postgres";

  if (isPostgres) {
    const pool = new Pool({ connectionString: dbUrl });

    await pool.query("SET CONSTRAINTS ALL DEFERRED");

    let totalRows = 0;
    for (const table of TABLES) {
      const filePath = path.join(inputDir, `${table}.csv`);
      if (!fs.existsSync(filePath)) {
        console.log(`  -> ${table}: not found, skipping`);
        continue;
      }

      const rawRows = await readCsv(filePath);
      if (rawRows.length === 0) { console.log(`  -> ${table}: 0 rows`); continue; }

      const columns = Object.keys(rawRows[0]);
      const jsonCols = JSON_COLUMNS[table] ?? [];
      const pkCols = COMPOSITE_PK[table] ?? ["id"];

      const coerced = rawRows.map(row => {
        const out: Record<string, unknown> = {};
        for (const col of columns) out[col] = coerceValue(col, row[col], jsonCols);
        return out;
      });

      for (const batch of chunk(coerced, 250)) {
        const { query, params } = buildUpsert(table, columns, batch, pkCols);
        await pool.query(query, params);
      }

      console.log(`  -> ${table}: ${rawRows.length} rows`);
      totalRows += rawRows.length;
    }

    console.log(`\nDone. ${totalRows} total rows imported.`);
    await pool.end();

  } else {
    // SQLite path — use raw libsql client
    const libsql = createClient({ url: dbUrl.startsWith("file:") ? dbUrl : `file:${dbUrl}` });

    await libsql.execute("PRAGMA foreign_keys = OFF");

    let totalRows = 0;
    for (const table of TABLES) {
      const filePath = path.join(inputDir, `${table}.csv`);
      if (!fs.existsSync(filePath)) {
        console.log(`  -> ${table}: not found, skipping`);
        continue;
      }

      const rawRows = await readCsv(filePath);
      if (rawRows.length === 0) { console.log(`  -> ${table}: 0 rows`); continue; }

      const columns = Object.keys(rawRows[0]);
      const jsonCols = JSON_COLUMNS[table] ?? [];
      const pkCols = COMPOSITE_PK[table] ?? ["id"];

      const coerced = rawRows.map(row => {
        const out: Record<string, unknown> = {};
        for (const col of columns) out[col] = coerceValue(col, row[col], jsonCols);
        return out;
      });

      for (const batch of chunk(coerced, 250)) {
        const stmts = buildSqliteUpsert(table, columns, batch, pkCols);
        for (const stmt of stmts) {
          await libsql.execute({ sql: stmt.query, args: stmt.params as import("@libsql/client").InValue[] });
        }
      }

      console.log(`  -> ${table}: ${rawRows.length} rows`);
      totalRows += rawRows.length;
    }

    await libsql.execute("PRAGMA foreign_keys = ON");
    console.log(`\nDone. ${totalRows} total rows imported.`);
    libsql.close();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
