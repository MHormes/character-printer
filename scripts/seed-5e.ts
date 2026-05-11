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
  sqliteItems,
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

type SpellSlotProgression = "none" | "full" | "half";

const PHB_BACKGROUNDS: { index: string; name: string }[] = [
  { index: "acolyte", name: "Acolyte" },
  { index: "charlatan", name: "Charlatan" },
  { index: "criminal", name: "Criminal" },
  { index: "entertainer", name: "Entertainer" },
  { index: "folk-hero", name: "Folk Hero" },
  { index: "guild-artisan", name: "Guild Artisan" },
  { index: "hermit", name: "Hermit" },
  { index: "noble", name: "Noble" },
  { index: "outlander", name: "Outlander" },
  { index: "sage", name: "Sage" },
  { index: "sailor", name: "Sailor" },
  { index: "soldier", name: "Soldier" },
  { index: "urchin", name: "Urchin" },
];

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

type Raw5eMagicItem = {
  index: string;
  name: string;
  equipment_category: { name: string };
  rarity: { name: string };
  desc?: string[];
};

type Raw5eEquipment = {
  index: string;
  name: string;
  equipment_category: { name: string };
  desc?: string[];
  weight?: number;
  cost?: { quantity: number; unit: string };
  // Weapon fields
  weapon_category?: string;
  weapon_range?: string;
  damage?: { damage_dice: string; damage_type: { name: string } };
  two_handed_damage?: { damage_dice: string; damage_type: { name: string } };
  properties?: { name: string }[];
  range?: { normal: number; long?: number };
  // Armor fields
  armor_category?: string;
  armor_class?: { base: number; dex_bonus: boolean; max_bonus?: number | null };
  stealth_disadvantage?: boolean;
  str_minimum?: number;
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

function getSpellSlotProgression(index: string): SpellSlotProgression {
  if (["bard", "cleric", "druid", "sorcerer", "wizard"].includes(index)) {
    return "full";
  }
  if (["paladin", "ranger"].includes(index)) {
    return "half";
  }
  return "none";
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
  const [rawSpells, rawClasses, rawLevels, rawRaces, rawSubraces, rawEquipment, rawMagicItems] = await Promise.all([
    fetchJson<Raw5eSpell[]>(`${BASE_URL}/5e-SRD-Spells.json`),
    fetchJson<Raw5eClass[]>(`${BASE_URL}/5e-SRD-Classes.json`),
    fetchJson<Raw5eLevel[]>(`${BASE_URL}/5e-SRD-Levels.json`),
    fetchJson<Raw5eRace[]>(`${BASE_URL}/5e-SRD-Races.json`),
    fetchJson<Raw5eSubrace[]>(`${BASE_URL}/5e-SRD-Subraces.json`),
    fetchJson<Raw5eEquipment[]>(`${BASE_URL}/5e-SRD-Equipment.json`),
    fetchJson<Raw5eMagicItem[]>(`${BASE_URL}/5e-SRD-Magic-Items.json`),
  ]);

  console.log(
    `  ${rawSpells.length} spells, ${rawClasses.length} classes, ${rawLevels.length} levels, ${rawRaces.length} races, ${rawSubraces.length} subraces, ${PHB_BACKGROUNDS.length} backgrounds (hardcoded), ${rawEquipment.length} equipment, ${rawMagicItems.length} magic items`,
  );

  console.log("Clearing existing SRD data...");
  db.delete(sqliteBackgrounds).where(eq(sqliteBackgrounds.system, SYSTEM)).run();
  db.delete(sqliteSubraces).where(eq(sqliteSubraces.system, SYSTEM)).run();
  db.delete(sqliteRaces).where(eq(sqliteRaces.system, SYSTEM)).run();
  db.delete(sqliteClasses).where(eq(sqliteClasses.system, SYSTEM)).run();
  db.delete(sqliteSpells).where(eq(sqliteSpells.system, SYSTEM)).run();
  db.delete(sqliteItems).where(eq(sqliteItems.system, SYSTEM)).run();

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
    spellSlotProgression: getSpellSlotProgression(c.index),
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
  const backgroundRows = PHB_BACKGROUNDS.map((b) => ({
    id: `${SYSTEM}:${b.index}`,
    system: SYSTEM,
    name: b.name,
    source: SOURCE,
    userId: null as string | null,
  }));
  db.insert(sqliteBackgrounds).values(backgroundRows).run();

  console.log("Inserting equipment...");
  const itemRows = rawEquipment.map((e) => {
    const cost = e.cost ? `${e.cost.quantity} ${e.cost.unit}` : null;
    const desc = e.desc?.length ? e.desc.join("\n\n") : null;

    // Weapon dice
    let damageDiceCount: number | null = null;
    let damageDieType: string | null = null;
    let damageType: string | null = null;
    if (e.damage) {
      const parsed = parseDiceStr(e.damage.damage_dice);
      damageDiceCount = parsed?.count ?? null;
      damageDieType = parsed?.die ?? null;
      damageType = e.damage.damage_type.name;
    }

    // Versatile / two-handed dice
    let twoHandedDiceCount: number | null = null;
    let twoHandedDieType: string | null = null;
    let twoHandedDamageType: string | null = null;
    if (e.two_handed_damage) {
      const parsed = parseDiceStr(e.two_handed_damage.damage_dice);
      twoHandedDiceCount = parsed?.count ?? null;
      twoHandedDieType = parsed?.die ?? null;
      twoHandedDamageType = e.two_handed_damage.damage_type.name;
    }

    const properties = e.properties?.length
      ? JSON.stringify(e.properties.map((p) => p.name))
      : null;

    // Weapon category: "Simple Melee" → category "Simple", range "Melee"
    let weaponCategory: string | null = null;
    let weaponRange: string | null = null;
    if (e.weapon_category) {
      const parts = e.weapon_category.split(" ");
      weaponCategory = parts[0] ?? null; // "Simple" | "Martial"
    }
    if (e.weapon_range) {
      weaponRange = e.weapon_range; // "Melee" | "Ranged"
    }

    return {
      id: `${SYSTEM}:${e.index}`,
      system: SYSTEM,
      name: e.name,
      equipmentCategory: e.equipment_category.name,
      description: desc,
      weight: e.weight ?? null,
      cost,
      weaponCategory,
      weaponRange,
      damageDiceCount,
      damageDieType,
      damageType,
      twoHandedDiceCount,
      twoHandedDieType,
      twoHandedDamageType,
      properties,
      rangeNormal: e.range?.normal ?? null,
      rangeLong: e.range?.long ?? null,
      armorCategory: e.armor_category ?? null,
      acBase: e.armor_class?.base ?? null,
      acDexBonus: e.armor_class?.dex_bonus ?? null,
      acMaxDex: e.armor_class?.max_bonus ?? null,
      stealthDisadvantage: e.stealth_disadvantage ?? null,
      strMinimum: e.str_minimum ?? null,
      source: SOURCE,
      userId: null as string | null,
    };
  });

  for (let i = 0; i < itemRows.length; i += 100) {
    db.insert(sqliteItems).values(itemRows.slice(i, i + 100)).run();
  }

  const weapons = itemRows.filter((i) => i.weaponCategory !== null).length;
  const armors = itemRows.filter((i) => i.armorCategory !== null).length;
  console.log(`  ${itemRows.length} items | ${weapons} weapons | ${armors} armor pieces`);

  console.log("Inserting magic items...");
  const magicItemRows = rawMagicItems.map((m) => ({
    id: `${SYSTEM}:magic:${m.index}`,
    system: SYSTEM,
    name: m.name,
    equipmentCategory: m.equipment_category.name,
    description: m.desc?.length ? m.desc.join("\n\n") : null,
    weight: null as number | null,
    cost: null as string | null,
    weaponCategory: null as string | null,
    weaponRange: null as string | null,
    damageDiceCount: null as number | null,
    damageDieType: null as string | null,
    damageType: null as string | null,
    twoHandedDiceCount: null as number | null,
    twoHandedDieType: null as string | null,
    twoHandedDamageType: null as string | null,
    properties: null as string | null,
    rangeNormal: null as number | null,
    rangeLong: null as number | null,
    armorCategory: null as string | null,
    acBase: null as number | null,
    acDexBonus: null as boolean | null,
    acMaxDex: null as number | null,
    stealthDisadvantage: null as boolean | null,
    strMinimum: null as number | null,
    source: SOURCE,
    userId: null as string | null,
  }));

  for (let i = 0; i < magicItemRows.length; i += 100) {
    db.insert(sqliteItems).values(magicItemRows.slice(i, i + 100)).run();
  }
  console.log(`  ${magicItemRows.length} magic items`);

  console.log(
    `Done. ${spellRows.length} spells | ${classRows.length} classes | ${slotRows.length} slot rows | ${classMappingRows.length} class→spell links | ${raceRows.length} races | ${subraceRows.length} subraces | ${backgroundRows.length} backgrounds | ${itemRows.length} equipment | ${magicItemRows.length} magic items`,
  );
  sqlite.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
