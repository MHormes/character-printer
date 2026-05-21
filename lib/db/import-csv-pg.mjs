/**
 * PostgreSQL CSV import for bootstrap.
 * Reads database/data/*.csv and upserts all tables (FK-safe order).
 */

import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";

const NULL_SENTINEL = "\\N";

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

const COMPOSITE_PK = {
  class_spell_slots: ["class_id", "level"],
  class_spells: ["class_id", "spell_id"],
};

const JSON_COLUMNS = {
  characters: ["data"],
  canvas_templates: ["widgets"],
  backgrounds: ["skill_grants", "asi_grants"],
};

// ─── CSV parsing ──────────────────────────────────────────────────────────────

function parseCSVLine(line) {
  const result = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let val = "";
      i++;
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') { val += '"'; i += 2; }
        else if (line[i] === '"') { i++; break; }
        else { val += line[i++]; }
      }
      result.push(val);
      if (line[i] === ",") i++;
    } else {
      const end = line.indexOf(",", i);
      if (end === -1) { result.push(line.slice(i)); break; }
      result.push(line.slice(i, end));
      i = end + 1;
    }
  }
  return result;
}

async function readCsv(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    let headers = [];
    const rl = readline.createInterface({ input: fs.createReadStream(filePath) });
    rl.on("line", line => {
      if (!line.trim()) return;
      if (headers.length === 0) { headers = parseCSVLine(line); return; }
      const vals = parseCSVLine(line);
      const row = {};
      headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
      rows.push(row);
    });
    rl.on("close", () => resolve(rows));
    rl.on("error", reject);
  });
}

function unescapeNewlines(s) {
  return s.replace(/\\n/g, "\n");
}

function coerceValue(col, val, jsonCols) {
  if (val === NULL_SENTINEL || val === undefined) return null;
  if (val === "true") return true;
  if (val === "false") return false;
  const unescaped = unescapeNewlines(val);
  if (jsonCols.includes(col)) {
    try { return JSON.parse(unescaped); } catch { return unescaped; }
  }
  return unescaped;
}

function chunk(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

function buildUpsert(table, columns, rows, pkCols) {
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

// ─── Public API ───────────────────────────────────────────────────────────────

export function hasCsvData(dataDir) {
  return fs.existsSync(path.join(dataDir, "users.csv"));
}

export async function importCsvData(pool, dataDir) {
  await pool.query("SET CONSTRAINTS ALL DEFERRED");
  let totalRows = 0;

  for (const table of TABLES) {
    const filePath = path.join(dataDir, `${table}.csv`);
    if (!fs.existsSync(filePath)) {
      console.log(`  [csv] ${table}: not found, skipping`);
      continue;
    }

    const rawRows = await readCsv(filePath);
    if (rawRows.length === 0) { console.log(`  [csv] ${table}: 0 rows`); continue; }

    const columns = Object.keys(rawRows[0]);
    const jsonCols = JSON_COLUMNS[table] ?? [];
    const pkCols = COMPOSITE_PK[table] ?? ["id"];

    const coerced = rawRows.map(row => {
      const out = {};
      for (const col of columns) out[col] = coerceValue(col, row[col], jsonCols);
      return out;
    });

    for (const batch of chunk(coerced, 250)) {
      const { query, params } = buildUpsert(table, columns, batch, pkCols);
      await pool.query(query, params);
    }

    console.log(`  [csv] ${table}: ${rawRows.length} rows`);
    totalRows += rawRows.length;
  }

  console.log(`CSV import complete. ${totalRows} total rows.`);
}
