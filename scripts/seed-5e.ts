/**
 * Seeds the database with D&D 5e SRD content from 5e-bits/5e-database.
 * Run with: npm run db:seed
 * Safe to re-run — deletes and reinserts all system=dnd5e/source=srd rows.
 */

import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import {
  sqliteSpells,
  sqliteClasses,
  sqliteClassSpellSlots,
  sqliteClassSpells,
  sqliteRaces,
  sqliteSubraces,
  sqliteBackgrounds,
} from "../lib/db/schema";

const SYSTEM = "dnd5e";
const SOURCE = "srd";
const BASE_URL =
  "https://raw.githubusercontent.com/5e-bits/5e-database/main/src/2014/en";

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string): Promise<T> {
  console.log(`  fetching ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json() as Promise<T>;
}

// ─── Raw types from 5e-bits ───────────────────────────────────────────────────

type Raw5eSpell = {
  index: string;
  name: string;
  level: number;
  school: { name: string };
  casting_time: string;
  range: string;
  duration: string;
  components: string[];
  material?: string;
  ritual: boolean;
  concentration: boolean;
  desc: string[];
  higher_level?: string[];
  classes: { index: string }[];
  attack_type?: string;
  dc?: { dc_type?: { index: string } };
  damage?: {
    damage_type?: { name: string };
    damage_at_slot_level?: Record<string, string>;
    damage_at_character_level?: Record<string, string>;
  };
  heal_at_slot_level?: Record<string, string>;
};

type Raw5eClass = {
  index: string;
  name: string;
  hit_die: number;
  spellcasting?: {
    spellcasting_ability: { index: string };
  };
};

type Raw5eBackground = {
  index: string;
  name: string;
};

type Raw5eRace = {
  index: string;
  name: string;
  subraces: { index: string; name: string }[];
};

type Raw5eSubrace = {
  index: string;
  name: string;
  race: { index: string };
};

type Raw5eLevel = {
  class: { index: string };
  level: number;
  spellcasting?: {
    spell_slots_level_1?: number;
    spell_slots_level_2?: number;
    spell_slots_level_3?: number;
    spell_slots_level_4?: number;
    spell_slots_level_5?: number;
    spell_slots_level_6?: number;
    spell_slots_level_7?: number;
    spell_slots_level_8?: number;
    spell_slots_level_9?: number;
  };
};

// ─── Transform helpers ────────────────────────────────────────────────────────

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function hitDieStr(n: number): string {
  return `d${n}`;
}

function spellId(index: string) {
  return `${SYSTEM}:${index}`;
}

function classId(index: string) {
  return `${SYSTEM}:${index}`;
}

const VALID_DICE = new Set(["d4", "d6", "d8", "d10", "d12", "d20", "d100"]);

function parseDiceStr(str: string): { count: number; die: string } | null {
  const m = str.match(/^(\d+)(d\d+)/);
  if (!m) return null;
  const die = m[2];
  if (!VALID_DICE.has(die)) return null;
  return { count: parseInt(m[1], 10), die };
}

function lowestEntry(record: Record<string, string>): string | null {
  const entries = Object.entries(record).sort(
    (a, b) => parseInt(a[0]) - parseInt(b[0]),
  );
  return entries[0]?.[1] ?? null;
}

type DamageInfo = {
  damageDiceCount: number | null;
  damageDieType: string | null;
  damageTypeName: string | null;
  attackType: string | null;
  dcSaveStat: string | null;
};

function extractDamage(s: Raw5eSpell): DamageInfo {
  const attackType = s.attack_type ?? null;
  const dcSaveStat = s.dc?.dc_type?.index ?? null;

  // Healing spell
  if (s.heal_at_slot_level) {
    const raw = lowestEntry(s.heal_at_slot_level);
    const parsed = raw ? parseDiceStr(raw) : null;
    return {
      damageDiceCount: parsed?.count ?? null,
      damageDieType: parsed?.die ?? null,
      damageTypeName: "Healing",
      attackType,
      dcSaveStat,
    };
  }

  // Damage spell
  if (s.damage) {
    const typeName = s.damage.damage_type?.name ?? null;
    const rawDice =
      (s.damage.damage_at_slot_level
        ? lowestEntry(s.damage.damage_at_slot_level)
        : null) ??
      (s.damage.damage_at_character_level
        ? s.damage.damage_at_character_level["1"] ?? null
        : null);

    const parsed = rawDice ? parseDiceStr(rawDice) : null;
    return {
      damageDiceCount: parsed?.count ?? null,
      damageDieType: parsed?.die ?? null,
      damageTypeName: typeName,
      attackType,
      dcSaveStat,
    };
  }

  return { damageDiceCount: null, damageDieType: null, damageTypeName: null, attackType, dcSaveStat };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not set");

  const sqlite = new Database(dbUrl);
  const db = drizzle(sqlite);

  console.log("Fetching 5e SRD data...");
  const [rawSpells, rawClasses, rawLevels, rawRaces, rawSubraces, rawBackgrounds] = await Promise.all([
    fetchJson<Raw5eSpell[]>(`${BASE_URL}/5e-SRD-Spells.json`),
    fetchJson<Raw5eClass[]>(`${BASE_URL}/5e-SRD-Classes.json`),
    fetchJson<Raw5eLevel[]>(`${BASE_URL}/5e-SRD-Levels.json`),
    fetchJson<Raw5eRace[]>(`${BASE_URL}/5e-SRD-Races.json`),
    fetchJson<Raw5eSubrace[]>(`${BASE_URL}/5e-SRD-Subraces.json`),
    fetchJson<Raw5eBackground[]>(`${BASE_URL}/5e-SRD-Backgrounds.json`),
  ]);

  console.log(
    `  ${rawSpells.length} spells, ${rawClasses.length} classes, ${rawLevels.length} levels, ${rawRaces.length} races, ${rawSubraces.length} subraces, ${rawBackgrounds.length} backgrounds`,
  );

  console.log("Clearing existing SRD data...");
  db.delete(sqliteBackgrounds).where(eq(sqliteBackgrounds.system, SYSTEM)).run();
  db.delete(sqliteSubraces).where(eq(sqliteSubraces.system, SYSTEM)).run();
  db.delete(sqliteRaces).where(eq(sqliteRaces.system, SYSTEM)).run();
  db.delete(sqliteClasses).where(eq(sqliteClasses.system, SYSTEM)).run();
  db.delete(sqliteSpells).where(eq(sqliteSpells.system, SYSTEM)).run();

  console.log("Inserting spells...");
  const spellRows = rawSpells.map((s) => {
    const dmg = extractDamage(s);
    return {
      id: spellId(s.index),
      system: SYSTEM,
      name: s.name,
      level: s.level,
      school: s.school.name,
      castingTime: capitalize(s.casting_time),
      range: s.range,
      duration: s.duration,
      verbal: s.components.includes("V"),
      somatic: s.components.includes("S"),
      material: s.components.includes("M"),
      materialDesc: s.material ?? "",
      ritual: s.ritual,
      concentration: s.concentration,
      description: s.desc.join("\n\n"),
      upcastDesc: s.higher_level?.join("\n\n") ?? "",
      damageDiceCount: dmg.damageDiceCount,
      damageDieType: dmg.damageDieType,
      damageTypeName: dmg.damageTypeName,
      attackType: dmg.attackType,
      dcSaveStat: dmg.dcSaveStat,
      source: SOURCE,
      userId: null as string | null,
    };
  });

  for (let i = 0; i < spellRows.length; i += 100) {
    db.insert(sqliteSpells).values(spellRows.slice(i, i + 100)).run();
  }

  const withDmg = spellRows.filter((s) => s.damageDiceCount !== null).length;
  const withHeal = spellRows.filter((s) => s.damageTypeName === "Healing").length;
  const withAtk = spellRows.filter((s) => s.attackType !== null).length;
  console.log(`  ${withDmg} spells with damage | ${withHeal} healing | ${withAtk} attack rolls`);

  console.log("Inserting classes...");
  const classRows = rawClasses.map((c) => ({
    id: classId(c.index),
    system: SYSTEM,
    name: c.name,
    hitDie: hitDieStr(c.hit_die),
    spellcastingStat: c.spellcasting?.spellcasting_ability?.index ?? null,
    source: SOURCE,
    userId: null as string | null,
  }));
  db.insert(sqliteClasses).values(classRows).run();

  console.log("Inserting spell slots...");
  const slotRows = rawLevels
    .filter((l) => l.spellcasting)
    .map((l) => ({
      classId: classId(l.class.index),
      level: l.level,
      slot1: l.spellcasting?.spell_slots_level_1 ?? 0,
      slot2: l.spellcasting?.spell_slots_level_2 ?? 0,
      slot3: l.spellcasting?.spell_slots_level_3 ?? 0,
      slot4: l.spellcasting?.spell_slots_level_4 ?? 0,
      slot5: l.spellcasting?.spell_slots_level_5 ?? 0,
      slot6: l.spellcasting?.spell_slots_level_6 ?? 0,
      slot7: l.spellcasting?.spell_slots_level_7 ?? 0,
      slot8: l.spellcasting?.spell_slots_level_8 ?? 0,
      slot9: l.spellcasting?.spell_slots_level_9 ?? 0,
    }));

  for (let i = 0; i < slotRows.length; i += 100) {
    db.insert(sqliteClassSpellSlots).values(slotRows.slice(i, i + 100)).run();
  }

  console.log("Inserting class→spell mappings...");
  const classMappingRows: { classId: string; spellId: string }[] = [];
  for (const s of rawSpells) {
    for (const cls of s.classes) {
      classMappingRows.push({ classId: classId(cls.index), spellId: spellId(s.index) });
    }
  }

  for (let i = 0; i < classMappingRows.length; i += 100) {
    db.insert(sqliteClassSpells).values(classMappingRows.slice(i, i + 100)).run();
  }

  console.log("Inserting races...");
  const raceRows = rawRaces.map((r) => ({
    id: `${SYSTEM}:${r.index}`,
    system: SYSTEM,
    name: r.name,
    source: SOURCE,
    userId: null as string | null,
  }));
  db.insert(sqliteRaces).values(raceRows).run();

  console.log("Inserting subraces...");
  const subraceRows = rawSubraces.map((s) => ({
    id: `${SYSTEM}:${s.index}`,
    system: SYSTEM,
    raceId: `${SYSTEM}:${s.race.index}`,
    name: s.name,
    source: SOURCE,
    userId: null as string | null,
  }));
  if (subraceRows.length > 0) {
    db.insert(sqliteSubraces).values(subraceRows).run();
  }

  console.log("Inserting backgrounds...");
  const backgroundRows = rawBackgrounds.map((b) => ({
    id: `${SYSTEM}:${b.index}`,
    system: SYSTEM,
    name: b.name,
    source: SOURCE,
    userId: null as string | null,
  }));
  db.insert(sqliteBackgrounds).values(backgroundRows).run();

  console.log(
    `Done. ${spellRows.length} spells | ${classRows.length} classes | ${slotRows.length} slot rows | ${classMappingRows.length} class→spell links | ${raceRows.length} races | ${subraceRows.length} subraces | ${backgroundRows.length} backgrounds`,
  );
  sqlite.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
