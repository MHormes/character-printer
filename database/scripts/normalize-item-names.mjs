/**
 * One-time script: renames SRD items from "Category, Qualifier" to "Category - Qualifier"
 * in database/data/items.csv. Safe to re-run — idempotent.
 *
 * Usage: node database/scripts/normalize-item-names.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const csvPath = resolve(__dirname, "../data/items.csv");

function normalizeSrdName(name) {
  const idx = name.indexOf(", ");
  return idx === -1 ? name : name.slice(0, idx) + " - " + name.slice(idx + 2);
}

// ── Full-document CSV parser (handles embedded newlines and quotes) ─────────

function parseCSV(text) {
  const rows = [];
  let cur = [];
  let field = "";
  let inQuote = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuote) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuote = false; i++; continue;
      }
      field += ch; i++; continue;
    }

    if (ch === '"') { inQuote = true; i++; continue; }

    if (ch === ",") { cur.push(field); field = ""; i++; continue; }

    if (ch === "\r" && text[i + 1] === "\n") {
      cur.push(field); field = ""; rows.push(cur); cur = []; i += 2; continue;
    }
    if (ch === "\n") {
      cur.push(field); field = ""; rows.push(cur); cur = []; i++; continue;
    }

    field += ch; i++;
  }

  if (field || cur.length) { cur.push(field); rows.push(cur); }
  return rows;
}

function serializeField(v) {
  if (v.includes(",") || v.includes('"') || v.includes("\n") || v.includes("\r")) {
    return '"' + v.replace(/"/g, '""') + '"';
  }
  return v;
}

function serializeCSV(rows) {
  return rows.map((r) => r.map(serializeField).join(",")).join("\n");
}

// ── Main ───────────────────────────────────────────────────────────────────────

const raw = readFileSync(csvPath, "utf8");
const rows = parseCSV(raw);

const nameCol = rows[0].indexOf("name");
if (nameCol === -1) throw new Error('No "name" column in CSV header');

let changed = 0;
for (let i = 1; i < rows.length; i++) {
  const row = rows[i];
  if (!row[nameCol]) continue;
  const original = row[nameCol];
  const normalized = normalizeSrdName(original);
  if (normalized !== original) { row[nameCol] = normalized; changed++; }
}

writeFileSync(csvPath, serializeCSV(rows), "utf8");
console.log(`Done. ${changed} item names updated.`);
