/**
 * Seeds the database with D&D 5e SRD content from 5e-bits/5e-database.
 * Run with: npm run db:seed
 * Safe to re-run — deletes and reinserts all system=dnd5e/source=srd rows.
 */

import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
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
  sqliteClassFeatures,
  sqliteRaceTraits,
  sqliteClassProficiencies,
  sqliteClassSkillChoices,
  sqliteLanguages,
  sqliteSubclasses,
  sqliteFeats,
  sqliteRaceAbilityBonuses,
  sqliteRaceAbilityBonusOptions,
  sqliteRaceSkillChoices,
  sqliteClassStartingEquipment,
  sqliteClassStartingEquipmentOptions,
} from "./schema";

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

type Raw5eEquipOption = {
  option_type: "counted_reference" | "multiple" | "choice";
  count?: number;
  of?: { index: string; name: string };
  items?: Raw5eEquipOption[];
  choice?: {
    choose?: number;
    from?: {
      option_set_type: "equipment_category" | "options_array";
      equipment_category?: { name: string };
      options?: Raw5eEquipOption[];
    };
  };
};

type Raw5eClass = {
  index: string;
  name: string;
  hit_die: number;
  spellcasting?: {
    spellcasting_ability: { index: string };
  };
  proficiency_choices?: {
    choose: number;
    type: string;
    from: {
      option_set_type: string;
      options: { option_type: string; item: { index: string } }[];
    };
  }[];
  starting_equipment?: { equipment: { index: string; name: string }; quantity: number }[];
  starting_equipment_options?: {
    desc: string;
    choose: number;
    from: {
      option_set_type: string;
      options: Raw5eEquipOption[];
    };
  }[];
};

function kebabToCamel(s: string): string {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

type SpellSlotProgression = "none" | "full" | "half";

type BgFeature = { name: string; description: string };
type BgEquipItem = { name: string; quantity: number };
type PhbBackground = {
  index: string;
  name: string;
  skills: string[];
  features: BgFeature[];
  fixedEquipment: BgEquipItem[];
};

// Backgrounds are PHB content — SRD JSON only has Acolyte, so we maintain
// the full list here with hardcoded skill grants, features, and starting equipment.
const PHB_BACKGROUNDS: PhbBackground[] = [
  {
    index: "acolyte", name: "Acolyte", skills: ["insight", "religion"],
    features: [
      { name: "Languages", description: "You can speak, read, and write 2 additional languages of your choice." },
    ],
    fixedEquipment: [
      { name: "Holy symbol", quantity: 1 },
      { name: "Prayer book", quantity: 1 },
      { name: "Stick of incense", quantity: 5 },
      { name: "Vestments", quantity: 1 },
      { name: "Common clothes", quantity: 1 },
      { name: "Belt pouch (15 gp)", quantity: 1 },
    ],
  },
  {
    index: "charlatan", name: "Charlatan", skills: ["deception", "sleightOfHand"],
    features: [
      { name: "Tool Proficiencies", description: "Disguise kit, Forgery kit." },
      { name: "Equipment — Tools of the Con", description: "Add one of the following to your inventory: ten stoppered bottles of colored liquid, a set of weighted dice, a deck of marked cards, or a signet ring of an imaginary duke." },
    ],
    fixedEquipment: [
      { name: "Fine clothes", quantity: 1 },
      { name: "Disguise kit", quantity: 1 },
      { name: "Belt pouch (15 gp)", quantity: 1 },
    ],
  },
  {
    index: "criminal", name: "Criminal", skills: ["deception", "stealth"],
    features: [
      { name: "Tool Proficiencies", description: "One type of gaming set, Thieves' tools." },
      { name: "Equipment — Gaming Set", description: "Add one gaming set of your choice (e.g. dice set, playing card set) to your inventory." },
    ],
    fixedEquipment: [
      { name: "Crowbar", quantity: 1 },
      { name: "Dark common clothes with hood", quantity: 1 },
      { name: "Belt pouch (15 gp)", quantity: 1 },
    ],
  },
  {
    index: "entertainer", name: "Entertainer", skills: ["acrobatics", "performance"],
    features: [
      { name: "Tool Proficiencies", description: "Disguise kit, one type of musical instrument." },
      { name: "Equipment — Musical Instrument", description: "Add one musical instrument of your choice to your inventory." },
    ],
    fixedEquipment: [
      { name: "Admirer's token", quantity: 1 },
      { name: "Costume clothes", quantity: 1 },
      { name: "Belt pouch (15 gp)", quantity: 1 },
    ],
  },
  {
    index: "folk-hero", name: "Folk Hero", skills: ["animalHandling", "survival"],
    features: [
      { name: "Tool Proficiencies", description: "One type of artisan's tools, Vehicles (land)." },
      { name: "Equipment — Artisan's Tools", description: "Add one set of artisan's tools of your choice to your inventory." },
    ],
    fixedEquipment: [
      { name: "Shovel", quantity: 1 },
      { name: "Iron pot", quantity: 1 },
      { name: "Common clothes", quantity: 1 },
      { name: "Belt pouch (10 gp)", quantity: 1 },
    ],
  },
  {
    index: "guild-artisan", name: "Guild Artisan", skills: ["insight", "persuasion"],
    features: [
      { name: "Tool Proficiencies", description: "One type of artisan's tools." },
      { name: "Languages", description: "You can speak, read, and write 1 additional language of your choice." },
      { name: "Equipment — Artisan's Tools", description: "Add one set of artisan's tools of your choice to your inventory." },
    ],
    fixedEquipment: [
      { name: "Letter of introduction from guild", quantity: 1 },
      { name: "Traveler's clothes", quantity: 1 },
      { name: "Belt pouch (15 gp)", quantity: 1 },
    ],
  },
  {
    index: "hermit", name: "Hermit", skills: ["medicine", "religion"],
    features: [
      { name: "Tool Proficiencies", description: "Herbalism kit." },
      { name: "Languages", description: "You can speak, read, and write 1 additional language of your choice." },
    ],
    fixedEquipment: [
      { name: "Scroll case with notes", quantity: 1 },
      { name: "Winter blanket", quantity: 1 },
      { name: "Common clothes", quantity: 1 },
      { name: "Herbalism kit", quantity: 1 },
      { name: "Belt pouch (5 gp)", quantity: 1 },
    ],
  },
  {
    index: "noble", name: "Noble", skills: ["history", "persuasion"],
    features: [
      { name: "Tool Proficiencies", description: "One type of gaming set." },
      { name: "Languages", description: "You can speak, read, and write 1 additional language of your choice." },
      { name: "Equipment — Gaming Set", description: "Add one gaming set of your choice to your inventory." },
    ],
    fixedEquipment: [
      { name: "Fine clothes", quantity: 1 },
      { name: "Signet ring", quantity: 1 },
      { name: "Scroll of pedigree", quantity: 1 },
      { name: "Belt pouch (25 gp)", quantity: 1 },
    ],
  },
  {
    index: "outlander", name: "Outlander", skills: ["athletics", "survival"],
    features: [
      { name: "Tool Proficiencies", description: "One type of musical instrument." },
      { name: "Languages", description: "You can speak, read, and write 1 additional language of your choice." },
      { name: "Equipment — Musical Instrument", description: "Add one musical instrument of your choice to your inventory." },
    ],
    fixedEquipment: [
      { name: "Staff", quantity: 1 },
      { name: "Hunting trap", quantity: 1 },
      { name: "Trophy from an animal you killed", quantity: 1 },
      { name: "Traveler's clothes", quantity: 1 },
      { name: "Belt pouch (10 gp)", quantity: 1 },
    ],
  },
  {
    index: "sage", name: "Sage", skills: ["arcana", "history"],
    features: [
      { name: "Languages", description: "You can speak, read, and write 2 additional languages of your choice." },
    ],
    fixedEquipment: [
      { name: "Bottle of black ink", quantity: 1 },
      { name: "Quill", quantity: 1 },
      { name: "Small knife", quantity: 1 },
      { name: "Letter from dead colleague", quantity: 1 },
      { name: "Common clothes", quantity: 1 },
      { name: "Belt pouch (10 gp)", quantity: 1 },
    ],
  },
  {
    index: "sailor", name: "Sailor", skills: ["athletics", "perception"],
    features: [
      { name: "Tool Proficiencies", description: "Navigator's tools, Vehicles (water)." },
    ],
    fixedEquipment: [
      { name: "Belaying pin (club)", quantity: 1 },
      { name: "Silk rope (50 feet)", quantity: 1 },
      { name: "Lucky charm", quantity: 1 },
      { name: "Common clothes", quantity: 1 },
      { name: "Belt pouch (10 gp)", quantity: 1 },
    ],
  },
  {
    index: "soldier", name: "Soldier", skills: ["athletics", "intimidation"],
    features: [
      { name: "Tool Proficiencies", description: "One type of gaming set, Vehicles (land)." },
      { name: "Equipment — Gaming Set", description: "Add one gaming set of your choice to your inventory." },
    ],
    fixedEquipment: [
      { name: "Insignia of rank", quantity: 1 },
      { name: "Trophy from fallen enemy", quantity: 1 },
      { name: "Common clothes", quantity: 1 },
      { name: "Belt pouch (10 gp)", quantity: 1 },
    ],
  },
  {
    index: "urchin", name: "Urchin", skills: ["sleightOfHand", "stealth"],
    features: [
      { name: "Tool Proficiencies", description: "Disguise kit, Thieves' tools." },
    ],
    fixedEquipment: [
      { name: "Small knife", quantity: 1 },
      { name: "Map of the city you grew up in", quantity: 1 },
      { name: "Pet mouse", quantity: 1 },
      { name: "Token of remembrance from parents", quantity: 1 },
      { name: "Common clothes", quantity: 1 },
      { name: "Belt pouch (10 gp)", quantity: 1 },
    ],
  },
];

type Raw5eRace = {
  index: string;
  name: string;
  speed: number;
  subraces: { index: string; name: string }[];
  ability_bonuses: { ability_score: { index: string }; bonus: number }[];
  ability_bonus_options?: {
    choose: number;
    from: {
      options: { option_type: string; ability_score: { index: string }; bonus: number }[];
    };
  };
};


type Raw5eFeature = {
  index: string;
  name: string;
  level: number;
  class: { index: string };
  subclass?: { index: string } | null;
  desc: string[];
};

type Raw5eTrait = {
  index: string;
  name: string;
  races: { index: string }[];
  subraces: { index: string }[];
  desc: string[];
  proficiency_choices?: {
    choose: number;
    from: {
      options: { item?: { index: string } }[];
    };
  };
};

type Raw5eProficiency = {
  index: string;
  name: string;
  type: string;
  classes: { index: string }[];
  races: { index: string }[];
};

type Raw5eLanguage = {
  index: string;
  name: string;
};

type Raw5eSubclass = {
  index: string;
  name: string;
  class: { index: string };
  subclass_flavor: string;
  desc: string[];
};

type Raw5eFeat = {
  index: string;
  name: string;
  desc: string[];
};

type Raw5eSubrace = {
  index: string;
  name: string;
  race: { index: string };
  ability_bonuses: { ability_score: { index: string }; bonus: number }[];
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

// ─── Starting equipment option processing ────────────────────────────────────

type StartingEquipAlt =
  | { type: "items"; label: string; items: { itemId: string; name: string; quantity: number }[] }
  | { type: "category"; label: string; category: string; count: number }
  | { type: "bundle"; label: string; fixedItems: { itemId: string; name: string; quantity: number }[]; categoryPick: { category: string; count: number } };

function flattenMultiple(items: Raw5eEquipOption[]): {
  fixedItems: { itemId: string; name: string; quantity: number }[];
  categoryPick: { category: string; count: number } | null;
} {
  const fixedItems: { itemId: string; name: string; quantity: number }[] = [];
  let categoryPick: { category: string; count: number } | null = null;
  for (const item of items) {
    if (item.option_type === "counted_reference" && item.of) {
      fixedItems.push({ itemId: `${SYSTEM}:${item.of.index}`, name: item.of.name, quantity: item.count ?? 1 });
    } else if (
      item.option_type === "choice" &&
      item.choice?.from?.option_set_type === "equipment_category" &&
      item.choice.from.equipment_category
    ) {
      categoryPick = { category: item.choice.from.equipment_category.name, count: item.choice.choose ?? 1 };
    }
  }
  return { fixedItems, categoryPick };
}

function processEquipOption(opt: Raw5eEquipOption): StartingEquipAlt | null {
  if (opt.option_type === "counted_reference" && opt.of) {
    const name = opt.of.name;
    const qty = opt.count ?? 1;
    return {
      type: "items",
      label: `${qty > 1 ? `${qty}× ` : ""}${name}`,
      items: [{ itemId: `${SYSTEM}:${opt.of.index}`, name, quantity: qty }],
    };
  }

  if (opt.option_type === "multiple" && opt.items) {
    const { fixedItems, categoryPick } = flattenMultiple(opt.items);
    if (fixedItems.length === 0 && !categoryPick) return null;
    const parts = [
      ...fixedItems.map((i) => `${i.quantity > 1 ? `${i.quantity}× ` : ""}${i.name}`),
      ...(categoryPick ? [`${categoryPick.count > 1 ? `${categoryPick.count}× ` : ""}Any ${categoryPick.category}`] : []),
    ];
    const label = parts.join(" + ");
    if (categoryPick) return { type: "bundle", label, fixedItems, categoryPick };
    return { type: "items", label, items: fixedItems };
  }

  if (opt.option_type === "choice" && opt.choice?.from) {
    const from = opt.choice.from;
    if (from.option_set_type === "equipment_category" && from.equipment_category) {
      const count = opt.choice.choose ?? 1;
      return {
        type: "category",
        label: `${count > 1 ? `${count}× ` : ""}Any ${from.equipment_category.name}`,
        category: from.equipment_category.name,
        count,
      };
    }
    if (from.option_set_type === "options_array" && from.options) {
      // Process inner options — take first valid non-null to represent this nested choice
      // We can't perfectly represent nested choices, but we try to capture the most common patterns
      const inner = from.options.map(processEquipOption).filter(Boolean) as StartingEquipAlt[];
      if (inner.length === 0) return null;
      // Return the first alternative as a representative label (will be shown in UI as a sub-choice)
      // This is a simplification — complex nested choices are left as a note in the label
      return inner[0];
    }
  }

  return null;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not set");

  const sqlite = createClient({ url: dbUrl.startsWith("file:") ? dbUrl : `file:${dbUrl}` });
  const db = drizzle(sqlite);

  console.log("Fetching 5e SRD data...");
  const [
    rawSpells, rawClasses, rawLevels, rawRaces, rawSubraces,
    rawFeatures, rawTraits, rawProficiencies, rawLanguages,
    rawSubclasses, rawFeats, rawEquipment, rawMagicItems,
  ] = await Promise.all([
    fetchJson<Raw5eSpell[]>(`${BASE_URL}/5e-SRD-Spells.json`),
    fetchJson<Raw5eClass[]>(`${BASE_URL}/5e-SRD-Classes.json`),
    fetchJson<Raw5eLevel[]>(`${BASE_URL}/5e-SRD-Levels.json`),
    fetchJson<Raw5eRace[]>(`${BASE_URL}/5e-SRD-Races.json`),
    fetchJson<Raw5eSubrace[]>(`${BASE_URL}/5e-SRD-Subraces.json`),
    fetchJson<Raw5eFeature[]>(`${BASE_URL}/5e-SRD-Features.json`),
    fetchJson<Raw5eTrait[]>(`${BASE_URL}/5e-SRD-Traits.json`),
    fetchJson<Raw5eProficiency[]>(`${BASE_URL}/5e-SRD-Proficiencies.json`),
    fetchJson<Raw5eLanguage[]>(`${BASE_URL}/5e-SRD-Languages.json`),
    fetchJson<Raw5eSubclass[]>(`${BASE_URL}/5e-SRD-Subclasses.json`),
    fetchJson<Raw5eFeat[]>(`${BASE_URL}/5e-SRD-Feats.json`),
    fetchJson<Raw5eEquipment[]>(`${BASE_URL}/5e-SRD-Equipment.json`),
    fetchJson<Raw5eMagicItem[]>(`${BASE_URL}/5e-SRD-Magic-Items.json`),
  ]);

  const baseClassFeatures = rawFeatures.filter((f) => !f.subclass);
  const subclassFeatures = rawFeatures.filter((f) => !!f.subclass);

  console.log(
    `  ${rawSpells.length} spells, ${rawClasses.length} classes, ${rawLevels.length} levels, ` +
    `${rawRaces.length} races, ${rawSubraces.length} subraces, ${PHB_BACKGROUNDS.length} backgrounds (hardcoded), ` +
    `${baseClassFeatures.length} base class features + ${subclassFeatures.length} subclass features, ${rawTraits.length} traits, ` +
    `${rawProficiencies.length} proficiencies, ${rawLanguages.length} languages, ${rawSubclasses.length} subclasses, ` +
    `${rawFeats.length} feats, ${rawEquipment.length} equipment, ${rawMagicItems.length} magic items`,
  );

  console.log("Clearing existing SRD data...");
  db.delete(sqliteClassStartingEquipmentOptions).where(eq(sqliteClassStartingEquipmentOptions.system, SYSTEM)).run();
  db.delete(sqliteClassStartingEquipment).where(eq(sqliteClassStartingEquipment.system, SYSTEM)).run();
  db.delete(sqliteFeats).where(eq(sqliteFeats.system, SYSTEM)).run();
  db.delete(sqliteSubclasses).where(eq(sqliteSubclasses.system, SYSTEM)).run();
  db.delete(sqliteLanguages).where(eq(sqliteLanguages.system, SYSTEM)).run();
  db.delete(sqliteClassSkillChoices).where(eq(sqliteClassSkillChoices.system, SYSTEM)).run();
  db.delete(sqliteClassProficiencies).where(eq(sqliteClassProficiencies.system, SYSTEM)).run();
  db.delete(sqliteRaceSkillChoices).where(eq(sqliteRaceSkillChoices.system, SYSTEM)).run();
  db.delete(sqliteRaceAbilityBonusOptions).where(eq(sqliteRaceAbilityBonusOptions.system, SYSTEM)).run();
  db.delete(sqliteRaceAbilityBonuses).where(eq(sqliteRaceAbilityBonuses.system, SYSTEM)).run();
  db.delete(sqliteRaceTraits).where(eq(sqliteRaceTraits.system, SYSTEM)).run();
  db.delete(sqliteClassFeatures).where(eq(sqliteClassFeatures.system, SYSTEM)).run();
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
    speed: r.speed ?? null,
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
    skillGrants: JSON.stringify(b.skills),
    featuresJson: JSON.stringify(b.features),
    fixedEquipmentJson: JSON.stringify(b.fixedEquipment),
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

  // Build a classId lookup from index → DB id
  const classIdByIndex = new Map(rawClasses.map((c) => [c.index, classId(c.index)]));

  // Subclasses must be inserted before class features (FK constraint)
  console.log("Inserting subclasses...");
  const subclassRows = rawSubclasses
    .filter((s) => classIdByIndex.has(s.class.index))
    .map((s) => ({
      id: `${SYSTEM}:${s.index}`,
      system: SYSTEM,
      classId: classIdByIndex.get(s.class.index)!,
      name: s.name,
      subclassFlavor: s.subclass_flavor ?? null,
      description: Array.isArray(s.desc) ? s.desc.join("\n\n") : (s.desc ?? ""),
      source: SOURCE,
      userId: null as string | null,
    }));
  for (let i = 0; i < subclassRows.length; i += 100) {
    db.insert(sqliteSubclasses).values(subclassRows.slice(i, i + 100)).run();
  }
  console.log(`  ${subclassRows.length} subclasses`);
  const subclassIdByIndex = new Map(rawSubclasses.map((s) => [s.index, `${SYSTEM}:${s.index}`]));

  console.log("Inserting class features...");
  const allClassFeatures = [...baseClassFeatures, ...subclassFeatures];
  const featureRows = allClassFeatures
    .filter((f) => classIdByIndex.has(f.class.index))
    .map((f) => {
      const scId = f.subclass ? subclassIdByIndex.get(f.subclass.index) ?? null : null;
      return {
        id: `${SYSTEM}:${f.index}`,
        system: SYSTEM,
        classId: classIdByIndex.get(f.class.index)!,
        subclassId: scId,
        level: f.level,
        name: f.name,
        description: f.desc.join("\n\n"),
        source: SOURCE,
        userId: null as string | null,
      };
    });

  for (let i = 0; i < featureRows.length; i += 100) {
    db.insert(sqliteClassFeatures).values(featureRows.slice(i, i + 100)).run();
  }
  console.log(`  ${baseClassFeatures.length} base + ${subclassFeatures.length} subclass features`);

  console.log("Inserting race traits...");
  // Build lookup: race index → DB id, subrace index → DB id
  const raceIdByIndex = new Map(rawRaces.map((r) => [r.index, `${SYSTEM}:${r.index}`]));
  const subraceIdByIndex = new Map(rawSubraces.map((s) => [s.index, `${SYSTEM}:${s.index}`]));

  const traitRows: {
    id: string; system: string; raceId: string | null; subraceId: string | null;
    name: string; description: string; source: string;
  }[] = [];
  for (const t of rawTraits) {
    for (const r of t.races) {
      if (raceIdByIndex.has(r.index)) {
        traitRows.push({
          id: `${SYSTEM}:trait:${t.index}:${r.index}`,
          system: SYSTEM,
          raceId: raceIdByIndex.get(r.index)!,
          subraceId: null,
          name: t.name,
          description: t.desc.join("\n\n"),
          source: SOURCE,
        });
      }
    }
    for (const s of t.subraces) {
      if (subraceIdByIndex.has(s.index)) {
        traitRows.push({
          id: `${SYSTEM}:trait:${t.index}:${s.index}`,
          system: SYSTEM,
          raceId: null,
          subraceId: subraceIdByIndex.get(s.index)!,
          name: t.name,
          description: t.desc.join("\n\n"),
          source: SOURCE,
        });
      }
    }
  }
  for (let i = 0; i < traitRows.length; i += 100) {
    db.insert(sqliteRaceTraits).values(traitRows.slice(i, i + 100)).run();
  }
  console.log(`  ${traitRows.length} race trait entries`);

  console.log("Inserting race ability bonuses...");
  const raceAsiRows: {
    id: string; system: string; raceId: string | null; subraceId: string | null;
    abilityScore: string; bonus: number;
  }[] = [];

  for (const r of rawRaces) {
    const rid = raceIdByIndex.get(r.index);
    if (!rid) continue;
    for (const bonus of (r.ability_bonuses ?? [])) {
      raceAsiRows.push({
        id: `${SYSTEM}:race-asi:${r.index}:${bonus.ability_score.index}`,
        system: SYSTEM,
        raceId: rid,
        subraceId: null,
        abilityScore: bonus.ability_score.index,
        bonus: bonus.bonus,
      });
    }
  }
  for (const s of rawSubraces) {
    const sid = subraceIdByIndex.get(s.index);
    const rid = raceIdByIndex.get(s.race.index);
    if (!sid || !rid) continue;
    for (const bonus of (s.ability_bonuses ?? [])) {
      raceAsiRows.push({
        id: `${SYSTEM}:subrace-asi:${s.index}:${bonus.ability_score.index}`,
        system: SYSTEM,
        raceId: null,
        subraceId: sid,
        abilityScore: bonus.ability_score.index,
        bonus: bonus.bonus,
      });
    }
  }
  if (raceAsiRows.length > 0) {
    for (let i = 0; i < raceAsiRows.length; i += 100) {
      db.insert(sqliteRaceAbilityBonuses).values(raceAsiRows.slice(i, i + 100)).run();
    }
  }
  console.log(`  ${raceAsiRows.length} race/subrace ASI bonus entries`);

  console.log("Inserting race ability bonus options...");
  const raceAsiOptionRows: {
    id: string; system: string; raceId: string; abilityScore: string; bonus: number; chooseCount: number;
  }[] = [];
  for (const r of rawRaces) {
    const rid = raceIdByIndex.get(r.index);
    if (!rid || !r.ability_bonus_options) continue;
    const count = r.ability_bonus_options.choose;
    for (const opt of (r.ability_bonus_options.from?.options ?? [])) {
      if (opt.ability_score?.index) {
        raceAsiOptionRows.push({
          id: `${SYSTEM}:race-asi-opt:${r.index}:${opt.ability_score.index}`,
          system: SYSTEM,
          raceId: rid,
          abilityScore: opt.ability_score.index,
          bonus: opt.bonus ?? 1,
          chooseCount: count,
        });
      }
    }
  }
  if (raceAsiOptionRows.length > 0) {
    db.insert(sqliteRaceAbilityBonusOptions).values(raceAsiOptionRows).run();
  }
  console.log(`  ${raceAsiOptionRows.length} race ASI option entries`);

  console.log("Inserting race skill choices...");
  const raceSkillRows: {
    id: string; system: string; raceId: string; skillKey: string; chooseCount: number;
  }[] = [];
  // Skill proficiency choices live in trait data (e.g. Half-Elf Skill Versatility)
  for (const t of rawTraits) {
    if (!t.proficiency_choices) continue;
    const count = t.proficiency_choices.choose;
    for (const r of t.races) {
      const rid = raceIdByIndex.get(r.index);
      if (!rid) continue;
      for (const opt of (t.proficiency_choices.from?.options ?? [])) {
        if (!opt.item?.index?.startsWith("skill-")) continue;
        const raw = opt.item.index.replace(/^skill-/, "");
        if (!raw) continue;
        const skillKey = kebabToCamel(raw);
        raceSkillRows.push({
          id: `${SYSTEM}:race-skill:${r.index}:${raw}`,
          system: SYSTEM,
          raceId: rid,
          skillKey,
          chooseCount: count,
        });
      }
    }
  }
  if (raceSkillRows.length > 0) {
    db.insert(sqliteRaceSkillChoices).values(raceSkillRows).run();
  }
  console.log(`  ${raceSkillRows.length} race skill choice entries`);

  console.log("Inserting class proficiencies...");
  const classProfRows: {
    id: string; system: string; classId: string; name: string; profType: string; source: string;
  }[] = [];
  for (const p of rawProficiencies) {
    for (const cls of p.classes) {
      const cid = classIdByIndex.get(cls.index);
      if (cid) {
        classProfRows.push({
          id: `${SYSTEM}:prof:${cls.index}:${p.index}`,
          system: SYSTEM,
          classId: cid,
          name: p.name,
          profType: p.type,
          source: SOURCE,
        });
      }
    }
  }
  for (let i = 0; i < classProfRows.length; i += 100) {
    db.insert(sqliteClassProficiencies).values(classProfRows.slice(i, i + 100)).run();
  }
  console.log(`  ${classProfRows.length} class proficiency entries`);

  console.log("Inserting class skill choices...");
  const classSkillChoiceRows: {
    id: string; system: string; classId: string; skillKey: string; chooseCount: number;
  }[] = [];
  for (const cls of rawClasses) {
    const cid = classIdByIndex.get(cls.index);
    if (!cid) continue;
    const skillGroup = cls.proficiency_choices?.find(
      (g) => g.from?.options?.[0]?.item?.index?.startsWith("skill-"),
    );
    if (!skillGroup) continue;
    const count = skillGroup.choose;
    for (const opt of skillGroup.from.options) {
      const rawKey = opt.item.index.replace(/^skill-/, ""); // "animal-handling" etc.
      const skillKey = kebabToCamel(rawKey);                // "animalHandling"
      classSkillChoiceRows.push({
        id: `${SYSTEM}:${cls.index}:skill-choice:${rawKey}`,
        system: SYSTEM,
        classId: cid,
        skillKey,
        chooseCount: count,
      });
    }
  }
  for (let i = 0; i < classSkillChoiceRows.length; i += 100) {
    db.insert(sqliteClassSkillChoices).values(classSkillChoiceRows.slice(i, i + 100)).run();
  }
  console.log(`  ${classSkillChoiceRows.length} class skill choice entries`);

  console.log("Inserting languages...");
  const languageRows = rawLanguages.map((l) => ({
    id: `${SYSTEM}:${l.index}`,
    system: SYSTEM,
    name: l.name,
    source: SOURCE,
  }));
  if (languageRows.length) db.insert(sqliteLanguages).values(languageRows).run();
  console.log(`  ${languageRows.length} languages`);

  console.log("Inserting feats...");
  const featRows = rawFeats.map((f) => ({
    id: `${SYSTEM}:${f.index}`,
    system: SYSTEM,
    name: f.name,
    description: Array.isArray(f.desc) ? f.desc.join("\n\n") : (f.desc ?? ""),
    source: SOURCE,
    userId: null as string | null,
  }));
  if (featRows.length) {
    for (let i = 0; i < featRows.length; i += 100) {
      db.insert(sqliteFeats).values(featRows.slice(i, i + 100)).run();
    }
  }
  console.log(`  ${featRows.length} feats`);

  // ── Starting equipment ────────────────────────────────────────────────────
  console.log("Inserting class starting equipment...");

  // Build item lookup by index for weight/category data
  const itemByIndex = new Map(rawEquipment.map((e) => [e.index, e]));

  const fixedEquipRows: (typeof sqliteClassStartingEquipment.$inferInsert)[] = [];
  const equipOptionRows: (typeof sqliteClassStartingEquipmentOptions.$inferInsert)[] = [];

  for (const cls of rawClasses) {
    const cid = classId(cls.index);

    // Fixed items
    for (let idx = 0; idx < (cls.starting_equipment ?? []).length; idx++) {
      const se = cls.starting_equipment![idx];
      const eIndex = se.equipment.index;
      const eData = itemByIndex.get(eIndex);
      fixedEquipRows.push({
        id: `${SYSTEM}:${cls.index}:fixed:${idx}`,
        system: SYSTEM,
        classId: cid,
        itemId: `${SYSTEM}:${eIndex}`,
        itemName: se.equipment.name,
        quantity: se.quantity,
        equipmentCategory: eData?.equipment_category?.name ?? "Adventuring Gear",
        weight: eData?.weight ?? null,
      });
    }

    // Choice groups
    for (let gIdx = 0; gIdx < (cls.starting_equipment_options ?? []).length; gIdx++) {
      const group = cls.starting_equipment_options![gIdx];
      if (group.from?.option_set_type !== "options_array") continue;

      const alternatives = (group.from.options ?? [])
        .map((opt: Raw5eEquipOption) => processEquipOption(opt))
        .filter(Boolean) as StartingEquipAlt[];

      if (alternatives.length === 0) continue;

      equipOptionRows.push({
        id: `${SYSTEM}:${cls.index}:opt:${gIdx}`,
        system: SYSTEM,
        classId: cid,
        choiceIndex: gIdx,
        description: group.desc,
        chooseCount: group.choose ?? 1,
        optionsJson: JSON.stringify(alternatives),
      });
    }
  }

  for (let i = 0; i < fixedEquipRows.length; i += 100) {
    db.insert(sqliteClassStartingEquipment).values(fixedEquipRows.slice(i, i + 100)).run();
  }
  for (let i = 0; i < equipOptionRows.length; i += 100) {
    db.insert(sqliteClassStartingEquipmentOptions).values(equipOptionRows.slice(i, i + 100)).run();
  }
  console.log(`  ${fixedEquipRows.length} fixed starting equipment | ${equipOptionRows.length} choice groups`);

  console.log(
    `Done. ${spellRows.length} spells | ${classRows.length} classes | ${slotRows.length} slot rows | ` +
    `${classMappingRows.length} class→spell links | ${raceRows.length} races | ${subraceRows.length} subraces | ` +
    `${PHB_BACKGROUNDS.length} backgrounds | ${featureRows.length} features (base+subclass) | ${traitRows.length} race traits | ` +
    `${classProfRows.length} class profs | ${languageRows.length} languages | ${subclassRows.length} subclasses | ` +
    `${featRows.length} feats | ${itemRows.length} equipment | ${magicItemRows.length} magic items | ` +
    `${fixedEquipRows.length} fixed start equip | ${equipOptionRows.length} equip choice groups`,
  );
  sqlite.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
