/**
 * PostgreSQL CSV import for bootstrap.
 * Reads database/data/*.csv and upserts all tables (FK-safe order).
 */

import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";

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

const BOOLEAN_COLUMNS = {
  spells: ["verbal", "somatic", "material", "ritual", "concentration"],
  items: ["ac_dex_bonus", "stealth_disadvantage"],
  characters: ["auto_save"],
};

const INTEGER_COLUMNS = {
  spells: ["level", "damage_dice_count"],
  items: ["weight", "damage_dice_count", "two_handed_dice_count", "range_normal", "range_long", "ac_base", "ac_max_dex", "str_minimum"],
  races: ["speed"],
  backgrounds: ["language_choice_count"],
  class_spell_slots: ["level", "slot_1", "slot_2", "slot_3", "slot_4", "slot_5", "slot_6", "slot_7", "slot_8", "slot_9"],
  class_features: ["level"],
  class_skill_choices: ["choose_count"],
  race_ability_bonuses: ["bonus"],
  race_ability_bonus_options: ["bonus", "choose_count"],
  race_skill_choices: ["choose_count"],
  class_starting_equipment: ["quantity", "weight"],
  class_starting_equipment_options: ["choice_index", "choose_count"],
  canvas_templates: ["cols"],
};

const TIMESTAMP_COLUMNS = {
  users: ["created_at"],
  characters: ["created_at", "updated_at"],
  canvas_templates: ["created_at", "updated_at"],
};

// ─── CSV parsing ──────────────────────────────────────────────────────────────

function parseCSV(content) {
  const allRows = [];
  let i = 0;
  const n = content.length;

  function parseField() {
    if (i < n && content[i] === '"') {
      i++;
      let val = "";
      while (i < n) {
        if (content[i] === '"' && content[i + 1] === '"') { val += '"'; i += 2; }
        else if (content[i] === '"') { i++; break; }
        else { val += content[i++]; }
      }
      return val;
    }
    let val = "";
    while (i < n && content[i] !== "," && content[i] !== "\n" && content[i] !== "\r") {
      val += content[i++];
    }
    // Unquoted empty field = NULL in PostgreSQL COPY CSV format
    return val === "" ? NULL_SENTINEL : val;
  }

  while (i < n) {
    if (content[i] === "\r" || content[i] === "\n") {
      if (content[i] === "\r") i++;
      if (i < n && content[i] === "\n") i++;
      continue;
    }
    const fields = [];
    while (i < n) {
      fields.push(parseField());
      if (i < n && content[i] === ",") { i++; continue; }
      if (i < n && content[i] === "\r") i++;
      if (i < n && content[i] === "\n") i++;
      break;
    }
    allRows.push(fields);
  }

  return allRows;
}

async function readCsv(filePath) {
  const content = await fsPromises.readFile(filePath, "utf8");
  const allRows = parseCSV(content);
  if (allRows.length === 0) return [];
  const headers = allRows[0];
  return allRows.slice(1).map(vals => {
    const row = {};
    headers.forEach((h, idx) => { row[h] = vals[idx] ?? ""; });
    return row;
  });
}

function unescapeNewlines(s) {
  return s.replace(/\\n/g, "\n");
}

function coerceValue(col, val, jsonCols, tsCols, intCols, boolCols) {
  if (val === NULL_SENTINEL || val === undefined) return null;
  if (val === "true") return true;
  if (val === "false") return false;
  if (intCols.includes(col) && val === "") return null;
  if (boolCols.includes(col) && val === "") return null;
  if (jsonCols.includes(col)) {
    try { return JSON.parse(val); } catch { return val; }
  }
  if (tsCols.includes(col) && /^\d{10,13}$/.test(val)) {
    const ms = val.length === 13 ? Number(val) : Number(val) * 1000;
    return new Date(ms).toISOString();
  }
  return unescapeNewlines(val);
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
  const params = rows.flatMap(row => columns.map(c => {
    const v = row[c] ?? null;
    if (v !== null && typeof v === "object") return JSON.stringify(v);
    return v;
  }));
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
    const tsCols = TIMESTAMP_COLUMNS[table] ?? [];
    const intCols = INTEGER_COLUMNS[table] ?? [];
    const boolCols = BOOLEAN_COLUMNS[table] ?? [];
    const pkCols = COMPOSITE_PK[table] ?? ["id"];

    const coerced = rawRows.map(row => {
      const out = {};
      for (const col of columns) out[col] = coerceValue(col, row[col], jsonCols, tsCols, intCols, boolCols);
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
