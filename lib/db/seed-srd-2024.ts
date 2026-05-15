/**
 * Seeds the database with D&D 2024 SRD content from 5e-bits/5e-database.
 * Run with: npm run db:seed-2024
 * Safe to re-run — deletes and reinserts all system=dnd5e_2024/source=srd rows.
 *
 * NOTE: The 2024 SRD data does not include Spells. Class features and spell slot
 * progressions are hardcoded from the 2024 SRD (Creative Commons).
 */

import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, inArray } from "drizzle-orm";
import {
  sqliteSpells,
  sqliteClasses,
  sqliteRaces,
  sqliteSubraces,
  sqliteBackgrounds,
  sqliteItems,
  sqliteClassFeatures,
  sqliteClassSpellSlots,
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

const SYSTEM = "dnd5e_2024";
const SOURCE = "srd";
const BASE_URL =
  "https://raw.githubusercontent.com/5e-bits/5e-database/main/src/2024/en";
const BASE_URL_2014 =
  "https://raw.githubusercontent.com/5e-bits/5e-database/main/src/2014/en";

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string): Promise<T> {
  console.log(`  fetching ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json() as Promise<T>;
}

// ─── Raw types from 5e-bits 2024 ─────────────────────────────────────────────

type Raw2024AbilityRef = { index: string; name: string; url: string };
type Raw2024Ref = { index: string; name: string; url: string };

type Raw2024Background = {
  index: string;
  name: string;
  ability_scores: Raw2024AbilityRef[];
  feat?: { index: string; name: string; note?: string; url: string };
  proficiencies: Raw2024Ref[];
};

type Raw2024Species = {
  index: string;
  name: string;
  speed?: number;
  size?: string;
  traits: Raw2024Ref[];
  subspecies?: Raw2024Ref[];
};

type Raw2024Subspecies = {
  index: string;
  name: string;
  species: Raw2024Ref;
  traits: (Raw2024Ref & { level?: number })[];
};

type Raw2024Trait = {
  index: string;
  name: string;
  description?: string;
  species?: Raw2024Ref[];
  subspecies?: Raw2024Ref[];
};

type Raw2024Class = {
  index: string;
  name: string;
  hit_die: number;
  spellcasting?: { spellcasting_ability?: { index: string } };
  proficiency_choices?: {
    desc?: string;
    choose: number;
    type: string;
    from: {
      option_set_type: string;
      options: { option_type: string; item: Raw2024Ref }[];
    };
  }[];
  proficiencies: Raw2024Ref[];
  saving_throws?: Raw2024AbilityRef[];
  starting_equipment_options?: {
    desc: string;
    choose: number;
    type?: string;
    from: {
      option_set_type: string;
      options: Raw2024EquipOption[];
    };
  }[];
  subclasses?: Raw2024Ref[];
};

type Raw2024EquipOption = {
  option_type: "counted_reference" | "multiple" | "choice" | "money";
  count?: number;
  unit?: string;
  of?: Raw2024Ref;
  items?: Raw2024EquipOption[];
  choice?: {
    choose?: number;
    from?: {
      option_set_type: "equipment_category" | "options_array";
      equipment_category?: { name: string };
      options?: Raw2024EquipOption[];
    };
  };
};

type Raw2024Subclass = {
  index: string;
  name: string;
  class: Raw2024Ref;
  subclass_flavor?: string;
  desc?: string | string[];
};

type Raw2024Feat = {
  index: string;
  name: string;
  desc?: string | string[];
  description?: string;
};

type Raw2024Equipment = {
  index: string;
  name: string;
  equipment_category: { name: string };
  desc?: string[];
  weight?: number;
  cost?: { quantity: number; unit: string };
  weapon_category?: string;
  weapon_range?: string;
  damage?: { damage_dice: string; damage_type: { name: string } };
  two_handed_damage?: { damage_dice: string; damage_type: { name: string } };
  properties?: { name: string }[];
  range?: { normal: number; long?: number };
  armor_category?: string;
  armor_class?: { base: number; dex_bonus: boolean; max_bonus?: number | null };
  stealth_disadvantage?: boolean;
  str_minimum?: number;
};

type Raw2024MagicItem = {
  index: string;
  name: string;
  equipment_category: { name: string };
  rarity?: { name: string };
  desc?: string[];
};

type Raw2024Language = {
  index: string;
  name: string;
};

type Raw2014Feature = {
  index: string;
  name: string;
  desc?: string[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function kebabToCamel(s: string): string {
  return s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

function hitDieStr(n: number): string {
  return `d${n}`;
}

type SpellSlotProgression = "none" | "full" | "half";

function getSpellSlotProgression(index: string): SpellSlotProgression {
  if (["bard", "cleric", "druid", "sorcerer", "wizard"].includes(index)) return "full";
  if (["paladin", "ranger"].includes(index)) return "half";
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

// ─── Starting equipment option processing ────────────────────────────────────

type StartingEquipAlt =
  | { type: "items"; label: string; items: { itemId: string; name: string; quantity: number }[] }
  | { type: "category"; label: string; category: string; count: number }
  | { type: "bundle"; label: string; fixedItems: { itemId: string; name: string; quantity: number }[]; categoryPick: { category: string; count: number } };

function flattenMultiple2024(items: Raw2024EquipOption[]): {
  fixedItems: { itemId: string; name: string; quantity: number }[];
  categoryPick: { category: string; count: number } | null;
} {
  const fixedItems: { itemId: string; name: string; quantity: number }[] = [];
  let categoryPick: { category: string; count: number } | null = null;
  for (const item of items) {
    if (item.option_type === "money") continue;
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

function processEquipOption2024(opt: Raw2024EquipOption): StartingEquipAlt | null {
  if (opt.option_type === "money") return null;

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
    const { fixedItems, categoryPick } = flattenMultiple2024(opt.items);
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
      const inner = from.options.map(processEquipOption2024).filter(Boolean) as StartingEquipAlt[];
      if (inner.length === 0) return null;
      return inner[0];
    }
  }

  return null;
}

// Map 2024 proficiency type → our profType enum value
function mapProfType(index: string, name: string): string {
  if (index.startsWith("saving-throw-")) return "Saving Throws";
  if (index.startsWith("skill-")) return "Skills";
  if (["light-armor", "medium-armor", "heavy-armor", "shields", "all-armor"].includes(index)) return "Armor";
  if (
    index.includes("weapon") || index === "simple-weapons" || index === "martial-weapons"
  ) return "Weapons";
  if (index.includes("tool") || index.includes("supplies") || index.includes("kit")) return "Tools";
  if (index.includes("language") || index.includes("-language")) return "Languages";
  const n = name.toLowerCase();
  if (n.includes("armor")) return "Armor";
  if (n.includes("weapon")) return "Weapons";
  if (n.includes("tool")) return "Tools";
  return "Other";
}

// ─── Hardcoded 2024 class features (not available in 5e-bits 2024 dataset) ────
// ASI levels are exact per 2024 PHB. Other features are representative.

type HardcodedClassFeature = { cls: string; level: number; name: string; desc?: string }

const CLASS_FEATURES_2024: HardcodedClassFeature[] = [
  // ── Barbarian ──────────────────────────────────────────────────────────────
  { cls: "barbarian", level: 1,  name: "Rage" },
  { cls: "barbarian", level: 1,  name: "Unarmored Defense" },
  { cls: "barbarian", level: 1,  name: "Weapon Mastery" },
  { cls: "barbarian", level: 2,  name: "Danger Sense" },
  { cls: "barbarian", level: 2,  name: "Reckless Attack" },
  { cls: "barbarian", level: 3,  name: "Barbarian Subclass" },
  { cls: "barbarian", level: 3,  name: "Primal Knowledge" },
  { cls: "barbarian", level: 4,  name: "Ability Score Improvement" },
  { cls: "barbarian", level: 5,  name: "Extra Attack" },
  { cls: "barbarian", level: 5,  name: "Fast Movement" },
  { cls: "barbarian", level: 6,  name: "Subclass Feature" },
  { cls: "barbarian", level: 7,  name: "Feral Instinct" },
  { cls: "barbarian", level: 7,  name: "Instinctive Pounce" },
  { cls: "barbarian", level: 8,  name: "Ability Score Improvement" },
  { cls: "barbarian", level: 9,  name: "Brutal Strike" },
  { cls: "barbarian", level: 10, name: "Subclass Feature" },
  { cls: "barbarian", level: 11, name: "Relentless Rage" },
  { cls: "barbarian", level: 12, name: "Ability Score Improvement" },
  { cls: "barbarian", level: 13, name: "Improved Brutal Strike" },
  { cls: "barbarian", level: 14, name: "Subclass Feature" },
  { cls: "barbarian", level: 15, name: "Persistent Rage" },
  { cls: "barbarian", level: 16, name: "Ability Score Improvement" },
  { cls: "barbarian", level: 17, name: "Improved Brutal Strike" },
  { cls: "barbarian", level: 18, name: "Indomitable Might" },
  { cls: "barbarian", level: 19, name: "Ability Score Improvement" },
  { cls: "barbarian", level: 20, name: "Primal Champion" },

  // ── Bard ───────────────────────────────────────────────────────────────────
  { cls: "bard", level: 1,  name: "Bardic Inspiration" },
  { cls: "bard", level: 1,  name: "Spellcasting" },
  { cls: "bard", level: 2,  name: "Expertise" },
  { cls: "bard", level: 2,  name: "Jack of All Trades" },
  { cls: "bard", level: 3,  name: "Bard Subclass" },
  { cls: "bard", level: 4,  name: "Ability Score Improvement" },
  { cls: "bard", level: 5,  name: "Font of Inspiration" },
  { cls: "bard", level: 6,  name: "Subclass Feature" },
  { cls: "bard", level: 7,  name: "Countercharm" },
  { cls: "bard", level: 8,  name: "Ability Score Improvement" },
  { cls: "bard", level: 9,  name: "Expertise" },
  { cls: "bard", level: 10, name: "Magical Secrets" },
  { cls: "bard", level: 12, name: "Ability Score Improvement" },
  { cls: "bard", level: 14, name: "Subclass Feature" },
  { cls: "bard", level: 16, name: "Ability Score Improvement" },
  { cls: "bard", level: 18, name: "Superior Inspiration" },
  { cls: "bard", level: 19, name: "Ability Score Improvement" },
  { cls: "bard", level: 20, name: "Words of Creation" },

  // ── Cleric ─────────────────────────────────────────────────────────────────
  { cls: "cleric", level: 1,  name: "Divine Order" },
  { cls: "cleric", level: 1,  name: "Spellcasting" },
  { cls: "cleric", level: 2,  name: "Channel Divinity" },
  { cls: "cleric", level: 2,  name: "Cleric Subclass" },
  { cls: "cleric", level: 4,  name: "Ability Score Improvement" },
  { cls: "cleric", level: 5,  name: "Sear Undead" },
  { cls: "cleric", level: 6,  name: "Subclass Feature" },
  { cls: "cleric", level: 8,  name: "Ability Score Improvement" },
  { cls: "cleric", level: 10, name: "Divine Intervention" },
  { cls: "cleric", level: 12, name: "Ability Score Improvement" },
  { cls: "cleric", level: 14, name: "Improved Blessed Strikes" },
  { cls: "cleric", level: 16, name: "Ability Score Improvement" },
  { cls: "cleric", level: 18, name: "Subclass Feature" },
  { cls: "cleric", level: 19, name: "Ability Score Improvement" },
  { cls: "cleric", level: 20, name: "Greater Divine Intervention" },

  // ── Druid ──────────────────────────────────────────────────────────────────
  { cls: "druid", level: 1,  name: "Druidic" },
  { cls: "druid", level: 1,  name: "Primal Order" },
  { cls: "druid", level: 1,  name: "Spellcasting" },
  { cls: "druid", level: 2,  name: "Wild Companion" },
  { cls: "druid", level: 2,  name: "Wild Shape" },
  { cls: "druid", level: 3,  name: "Druid Subclass" },
  { cls: "druid", level: 4,  name: "Ability Score Improvement" },
  { cls: "druid", level: 5,  name: "Wild Resurgence" },
  { cls: "druid", level: 6,  name: "Subclass Feature" },
  { cls: "druid", level: 7,  name: "Elemental Fury" },
  { cls: "druid", level: 8,  name: "Ability Score Improvement" },
  { cls: "druid", level: 10, name: "Subclass Feature" },
  { cls: "druid", level: 12, name: "Ability Score Improvement" },
  { cls: "druid", level: 14, name: "Subclass Feature" },
  { cls: "druid", level: 15, name: "Improved Elemental Fury" },
  { cls: "druid", level: 16, name: "Ability Score Improvement" },
  { cls: "druid", level: 18, name: "Beast Spells" },
  { cls: "druid", level: 19, name: "Ability Score Improvement" },
  { cls: "druid", level: 20, name: "Archdruid" },

  // ── Fighter ────────────────────────────────────────────────────────────────
  { cls: "fighter", level: 1,  name: "Fighting Style" },
  { cls: "fighter", level: 1,  name: "Second Wind" },
  { cls: "fighter", level: 1,  name: "Weapon Mastery" },
  { cls: "fighter", level: 2,  name: "Action Surge" },
  { cls: "fighter", level: 2,  name: "Tactical Mind" },
  { cls: "fighter", level: 3,  name: "Fighter Subclass" },
  { cls: "fighter", level: 4,  name: "Ability Score Improvement" },
  { cls: "fighter", level: 5,  name: "Extra Attack" },
  { cls: "fighter", level: 6,  name: "Ability Score Improvement" },
  { cls: "fighter", level: 7,  name: "Subclass Feature" },
  { cls: "fighter", level: 8,  name: "Ability Score Improvement" },
  { cls: "fighter", level: 9,  name: "Tactical Shift" },
  { cls: "fighter", level: 10, name: "Subclass Feature" },
  { cls: "fighter", level: 11, name: "Two Extra Attacks" },
  { cls: "fighter", level: 12, name: "Ability Score Improvement" },
  { cls: "fighter", level: 13, name: "Studied Attacks" },
  { cls: "fighter", level: 14, name: "Ability Score Improvement" },
  { cls: "fighter", level: 15, name: "Subclass Feature" },
  { cls: "fighter", level: 16, name: "Ability Score Improvement" },
  { cls: "fighter", level: 17, name: "Action Surge (2/rest)" },
  { cls: "fighter", level: 18, name: "Subclass Feature" },
  { cls: "fighter", level: 19, name: "Ability Score Improvement" },
  { cls: "fighter", level: 20, name: "Three Extra Attacks" },

  // ── Monk ───────────────────────────────────────────────────────────────────
  { cls: "monk", level: 1,  name: "Martial Arts" },
  { cls: "monk", level: 1,  name: "Unarmored Defense" },
  { cls: "monk", level: 2,  name: "Monk's Focus" },
  { cls: "monk", level: 2,  name: "Unarmored Movement" },
  { cls: "monk", level: 2,  name: "Uncanny Metabolism" },
  { cls: "monk", level: 3,  name: "Deflect Attacks" },
  { cls: "monk", level: 3,  name: "Monk Subclass" },
  { cls: "monk", level: 4,  name: "Ability Score Improvement" },
  { cls: "monk", level: 4,  name: "Slow Fall" },
  { cls: "monk", level: 5,  name: "Extra Attack" },
  { cls: "monk", level: 5,  name: "Stunning Strike" },
  { cls: "monk", level: 6,  name: "Empowered Strikes" },
  { cls: "monk", level: 6,  name: "Subclass Feature" },
  { cls: "monk", level: 7,  name: "Evasion" },
  { cls: "monk", level: 8,  name: "Ability Score Improvement" },
  { cls: "monk", level: 9,  name: "Acrobatic Movement" },
  { cls: "monk", level: 10, name: "Heightened Focus" },
  { cls: "monk", level: 10, name: "Self-Restoration" },
  { cls: "monk", level: 11, name: "Subclass Feature" },
  { cls: "monk", level: 12, name: "Ability Score Improvement" },
  { cls: "monk", level: 13, name: "Deflect Energy" },
  { cls: "monk", level: 14, name: "Disciplined Survivor" },
  { cls: "monk", level: 15, name: "Perfect Focus" },
  { cls: "monk", level: 16, name: "Ability Score Improvement" },
  { cls: "monk", level: 17, name: "Subclass Feature" },
  { cls: "monk", level: 18, name: "Superior Defense" },
  { cls: "monk", level: 19, name: "Ability Score Improvement" },
  { cls: "monk", level: 20, name: "Body and Mind" },

  // ── Paladin ────────────────────────────────────────────────────────────────
  { cls: "paladin", level: 1,  name: "Divine Smite" },
  { cls: "paladin", level: 1,  name: "Lay On Hands" },
  { cls: "paladin", level: 1,  name: "Spellcasting" },
  { cls: "paladin", level: 1,  name: "Weapon Mastery" },
  { cls: "paladin", level: 2,  name: "Fighting Style" },
  { cls: "paladin", level: 2,  name: "Paladin's Smite" },
  { cls: "paladin", level: 3,  name: "Channel Divinity" },
  { cls: "paladin", level: 3,  name: "Paladin Subclass" },
  { cls: "paladin", level: 4,  name: "Ability Score Improvement" },
  { cls: "paladin", level: 5,  name: "Extra Attack" },
  { cls: "paladin", level: 5,  name: "Faithful Steed" },
  { cls: "paladin", level: 6,  name: "Aura of Protection" },
  { cls: "paladin", level: 7,  name: "Subclass Feature" },
  { cls: "paladin", level: 8,  name: "Ability Score Improvement" },
  { cls: "paladin", level: 9,  name: "Abjure Foes" },
  { cls: "paladin", level: 10, name: "Aura of Courage" },
  { cls: "paladin", level: 11, name: "Radiant Strikes" },
  { cls: "paladin", level: 12, name: "Ability Score Improvement" },
  { cls: "paladin", level: 14, name: "Restoring Touch" },
  { cls: "paladin", level: 15, name: "Subclass Feature" },
  { cls: "paladin", level: 16, name: "Ability Score Improvement" },
  { cls: "paladin", level: 18, name: "Aura Expansion" },
  { cls: "paladin", level: 19, name: "Ability Score Improvement" },
  { cls: "paladin", level: 20, name: "Subclass Feature" },

  // ── Ranger ─────────────────────────────────────────────────────────────────
  { cls: "ranger", level: 1,  name: "Expertise" },
  { cls: "ranger", level: 1,  name: "Favored Enemy" },
  { cls: "ranger", level: 1,  name: "Spellcasting" },
  { cls: "ranger", level: 1,  name: "Weapon Mastery" },
  { cls: "ranger", level: 2,  name: "Deft Explorer" },
  { cls: "ranger", level: 2,  name: "Fighting Style" },
  { cls: "ranger", level: 3,  name: "Ranger Subclass" },
  { cls: "ranger", level: 4,  name: "Ability Score Improvement" },
  { cls: "ranger", level: 5,  name: "Extra Attack" },
  { cls: "ranger", level: 6,  name: "Roving" },
  { cls: "ranger", level: 7,  name: "Subclass Feature" },
  { cls: "ranger", level: 8,  name: "Ability Score Improvement" },
  { cls: "ranger", level: 9,  name: "Expertise" },
  { cls: "ranger", level: 10, name: "Tireless" },
  { cls: "ranger", level: 11, name: "Subclass Feature" },
  { cls: "ranger", level: 12, name: "Ability Score Improvement" },
  { cls: "ranger", level: 13, name: "Relentless Hunter" },
  { cls: "ranger", level: 14, name: "Nature's Veil" },
  { cls: "ranger", level: 15, name: "Subclass Feature" },
  { cls: "ranger", level: 16, name: "Ability Score Improvement" },
  { cls: "ranger", level: 17, name: "Precise Hunter" },
  { cls: "ranger", level: 18, name: "Feral Senses" },
  { cls: "ranger", level: 19, name: "Ability Score Improvement" },
  { cls: "ranger", level: 20, name: "Foe Slayer" },

  // ── Rogue ──────────────────────────────────────────────────────────────────
  { cls: "rogue", level: 1,  name: "Expertise" },
  { cls: "rogue", level: 1,  name: "Sneak Attack" },
  { cls: "rogue", level: 1,  name: "Thieves' Cant" },
  { cls: "rogue", level: 1,  name: "Weapon Mastery" },
  { cls: "rogue", level: 2,  name: "Cunning Action" },
  { cls: "rogue", level: 3,  name: "Rogue Subclass" },
  { cls: "rogue", level: 3,  name: "Steady Aim" },
  { cls: "rogue", level: 4,  name: "Ability Score Improvement" },
  { cls: "rogue", level: 5,  name: "Cunning Strike" },
  { cls: "rogue", level: 5,  name: "Uncanny Dodge" },
  { cls: "rogue", level: 6,  name: "Expertise" },
  { cls: "rogue", level: 7,  name: "Evasion" },
  { cls: "rogue", level: 7,  name: "Subclass Feature" },
  { cls: "rogue", level: 8,  name: "Ability Score Improvement" },
  { cls: "rogue", level: 9,  name: "Improved Cunning Strike" },
  { cls: "rogue", level: 10, name: "Ability Score Improvement" },
  { cls: "rogue", level: 11, name: "Reliable Talent" },
  { cls: "rogue", level: 11, name: "Subclass Feature" },
  { cls: "rogue", level: 12, name: "Ability Score Improvement" },
  { cls: "rogue", level: 13, name: "Subtle Strikes" },
  { cls: "rogue", level: 14, name: "Devious Strikes" },
  { cls: "rogue", level: 14, name: "Subclass Feature" },
  { cls: "rogue", level: 15, name: "Slippery Mind" },
  { cls: "rogue", level: 16, name: "Ability Score Improvement" },
  { cls: "rogue", level: 17, name: "Elusive" },
  { cls: "rogue", level: 18, name: "Subclass Feature" },
  { cls: "rogue", level: 19, name: "Ability Score Improvement" },
  { cls: "rogue", level: 20, name: "Stroke of Luck" },

  // ── Sorcerer ───────────────────────────────────────────────────────────────
  { cls: "sorcerer", level: 1,  name: "Innate Sorcery" },
  { cls: "sorcerer", level: 1,  name: "Spellcasting" },
  { cls: "sorcerer", level: 2,  name: "Font of Magic" },
  { cls: "sorcerer", level: 2,  name: "Sorcerer Subclass" },
  { cls: "sorcerer", level: 3,  name: "Metamagic" },
  { cls: "sorcerer", level: 4,  name: "Ability Score Improvement" },
  { cls: "sorcerer", level: 5,  name: "Sorcerous Restoration" },
  { cls: "sorcerer", level: 6,  name: "Subclass Feature" },
  { cls: "sorcerer", level: 7,  name: "Sorcery Incarnate" },
  { cls: "sorcerer", level: 8,  name: "Ability Score Improvement" },
  { cls: "sorcerer", level: 10, name: "Metamagic (3 options)" },
  { cls: "sorcerer", level: 10, name: "Subclass Feature" },
  { cls: "sorcerer", level: 12, name: "Ability Score Improvement" },
  { cls: "sorcerer", level: 14, name: "Subclass Feature" },
  { cls: "sorcerer", level: 16, name: "Ability Score Improvement" },
  { cls: "sorcerer", level: 17, name: "Metamagic (4 options)" },
  { cls: "sorcerer", level: 18, name: "Subclass Feature" },
  { cls: "sorcerer", level: 19, name: "Ability Score Improvement" },
  { cls: "sorcerer", level: 20, name: "Arcane Apotheosis" },

  // ── Warlock ────────────────────────────────────────────────────────────────
  { cls: "warlock", level: 1,  name: "Eldritch Invocations" },
  { cls: "warlock", level: 1,  name: "Pact Magic" },
  { cls: "warlock", level: 2,  name: "Magical Cunning" },
  { cls: "warlock", level: 3,  name: "Warlock Subclass" },
  { cls: "warlock", level: 4,  name: "Ability Score Improvement" },
  { cls: "warlock", level: 5,  name: "Contact Patron" },
  { cls: "warlock", level: 6,  name: "Subclass Feature" },
  { cls: "warlock", level: 8,  name: "Ability Score Improvement" },
  { cls: "warlock", level: 11, name: "Mystic Arcanum (6th level)" },
  { cls: "warlock", level: 12, name: "Ability Score Improvement" },
  { cls: "warlock", level: 13, name: "Mystic Arcanum (7th level)" },
  { cls: "warlock", level: 15, name: "Mystic Arcanum (8th level)" },
  { cls: "warlock", level: 15, name: "Subclass Feature" },
  { cls: "warlock", level: 16, name: "Ability Score Improvement" },
  { cls: "warlock", level: 17, name: "Mystic Arcanum (9th level)" },
  { cls: "warlock", level: 19, name: "Ability Score Improvement" },
  { cls: "warlock", level: 20, name: "Eldritch Master" },

  // ── Wizard ─────────────────────────────────────────────────────────────────
  { cls: "wizard", level: 1,  name: "Arcane Recovery" },
  { cls: "wizard", level: 1,  name: "Spellcasting" },
  { cls: "wizard", level: 2,  name: "Scholar" },
  { cls: "wizard", level: 2,  name: "Wizard Subclass" },
  { cls: "wizard", level: 4,  name: "Ability Score Improvement" },
  { cls: "wizard", level: 5,  name: "Memorize Spell" },
  { cls: "wizard", level: 6,  name: "Subclass Feature" },
  { cls: "wizard", level: 8,  name: "Ability Score Improvement" },
  { cls: "wizard", level: 10, name: "Subclass Feature" },
  { cls: "wizard", level: 12, name: "Ability Score Improvement" },
  { cls: "wizard", level: 14, name: "Subclass Feature" },
  { cls: "wizard", level: 16, name: "Ability Score Improvement" },
  { cls: "wizard", level: 18, name: "Spell Mastery" },
  { cls: "wizard", level: 18, name: "Subclass Feature" },
  { cls: "wizard", level: 19, name: "Ability Score Improvement" },
  { cls: "wizard", level: 20, name: "Signature Spells" },
]

// ─── Hardcoded 2024 spell slot progressions ──────────────────────────────────
// Full casters (Bard, Cleric, Druid, Sorcerer, Wizard) — same progression as 2014.
// Half casters (Paladin, Ranger) — start at level 1 in 2024 (vs level 2 in 2014).
// Warlock uses Pact Magic (short-rest slots, different system — tracked as 0 here).
// Non-casters (Barbarian, Fighter, Monk, Rogue) — omitted (no rows = 0 slots).

type SlotRow = [number, number, number, number, number, number, number, number, number]

// [slot1, slot2, slot3, slot4, slot5, slot6, slot7, slot8, slot9]
const FULL_CASTER_SLOTS: SlotRow[] = [
  [2,0,0,0,0,0,0,0,0], // 1
  [3,0,0,0,0,0,0,0,0], // 2
  [4,2,0,0,0,0,0,0,0], // 3
  [4,3,0,0,0,0,0,0,0], // 4
  [4,3,2,0,0,0,0,0,0], // 5
  [4,3,3,0,0,0,0,0,0], // 6
  [4,3,3,1,0,0,0,0,0], // 7
  [4,3,3,2,0,0,0,0,0], // 8
  [4,3,3,3,1,0,0,0,0], // 9
  [4,3,3,3,2,0,0,0,0], // 10
  [4,3,3,3,2,1,0,0,0], // 11
  [4,3,3,3,2,1,0,0,0], // 12
  [4,3,3,3,2,1,1,0,0], // 13
  [4,3,3,3,2,1,1,0,0], // 14
  [4,3,3,3,2,1,1,1,0], // 15
  [4,3,3,3,2,1,1,1,0], // 16
  [4,3,3,3,2,1,1,1,1], // 17
  [4,3,3,3,3,1,1,1,1], // 18
  [4,3,3,3,3,2,1,1,1], // 19
  [4,3,3,3,3,2,2,1,1], // 20
]

// 2024 half casters get spell slots starting at level 1
const HALF_CASTER_SLOTS: SlotRow[] = [
  [2,0,0,0,0,0,0,0,0], // 1
  [2,0,0,0,0,0,0,0,0], // 2
  [3,0,0,0,0,0,0,0,0], // 3
  [3,0,0,0,0,0,0,0,0], // 4
  [4,2,0,0,0,0,0,0,0], // 5
  [4,2,0,0,0,0,0,0,0], // 6
  [4,3,0,0,0,0,0,0,0], // 7
  [4,3,0,0,0,0,0,0,0], // 8
  [4,3,2,0,0,0,0,0,0], // 9
  [4,3,2,0,0,0,0,0,0], // 10
  [4,3,3,0,0,0,0,0,0], // 11
  [4,3,3,0,0,0,0,0,0], // 12
  [4,3,3,1,0,0,0,0,0], // 13
  [4,3,3,1,0,0,0,0,0], // 14
  [4,3,3,2,0,0,0,0,0], // 15
  [4,3,3,2,0,0,0,0,0], // 16
  [4,3,3,3,1,0,0,0,0], // 17
  [4,3,3,3,1,0,0,0,0], // 18
  [4,3,3,3,2,0,0,0,0], // 19
  [4,3,3,3,2,0,0,0,0], // 20
]

const FULL_CASTER_CLASSES = ["bard", "cleric", "druid", "sorcerer", "wizard"]
const HALF_CASTER_CLASSES = ["paladin", "ranger"]

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not set");

  const sqlite = new Database(dbUrl);
  const db = drizzle(sqlite);

  console.log("Fetching D&D 2024 SRD data...");
  const [
    rawBackgrounds,
    rawSpecies,
    rawSubspecies,
    rawTraits,
    rawClasses,
    rawFeats,
    rawEquipment,
    rawMagicItems,
    rawLanguages,
    rawSubclasses,
    raw2014Features,
  ] = await Promise.all([
    fetchJson<Raw2024Background[]>(`${BASE_URL}/5e-SRD-Backgrounds.json`),
    fetchJson<Raw2024Species[]>(`${BASE_URL}/5e-SRD-Species.json`),
    fetchJson<Raw2024Subspecies[]>(`${BASE_URL}/5e-SRD-Subspecies.json`),
    fetchJson<Raw2024Trait[]>(`${BASE_URL}/5e-SRD-Traits.json`),
    fetchJson<Raw2024Class[]>(`${BASE_URL}/5e-SRD-Classes.json`),
    fetchJson<Raw2024Feat[]>(`${BASE_URL}/5e-SRD-Feats.json`),
    fetchJson<Raw2024Equipment[]>(`${BASE_URL}/5e-SRD-Equipment.json`),
    fetchJson<Raw2024MagicItem[]>(`${BASE_URL}/5e-SRD-Magic-Items.json`),
    fetchJson<Raw2024Language[]>(`${BASE_URL}/5e-SRD-Languages.json`),
    fetchJson<Raw2024Subclass[]>(`${BASE_URL}/5e-SRD-Subclasses.json`),
    fetchJson<Raw2014Feature[]>(`${BASE_URL_2014}/5e-SRD-Features.json`),
  ]);

  // Build name→description fallback from 2014 SRD (no 2024 features file exists)
  const featureDescByName = new Map<string, string>();
  for (const f of raw2014Features) {
    const key = f.name.toLowerCase();
    if (!featureDescByName.has(key) && f.desc?.length) {
      featureDescByName.set(key, f.desc.join("\n\n"));
    }
  }

  console.log(
    `  ${rawBackgrounds.length} backgrounds | ${rawSpecies.length} species | ${rawSubspecies.length} subspecies | ` +
    `${rawTraits.length} traits | ${rawClasses.length} classes | ${rawFeats.length} feats | ` +
    `${rawEquipment.length} equipment | ${rawMagicItems.length} magic items | ` +
    `${rawLanguages.length} languages | ${rawSubclasses.length} subclasses`,
  );

  console.log("Clearing existing 2024 SRD data...");
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
  // class_spell_slots cascade-delete with classes, but delete explicitly to be safe
  const existingClassIds2024 = db.select({ id: sqliteClasses.id }).from(sqliteClasses).where(eq(sqliteClasses.system, SYSTEM)).all().map(r => r.id);
  if (existingClassIds2024.length > 0) {
    db.delete(sqliteClassSpellSlots).where(inArray(sqliteClassSpellSlots.classId, existingClassIds2024)).run();
  }
  db.delete(sqliteClasses).where(eq(sqliteClasses.system, SYSTEM)).run();
  db.delete(sqliteSpells).where(eq(sqliteSpells.system, SYSTEM)).run();
  db.delete(sqliteItems).where(eq(sqliteItems.system, SYSTEM)).run();

  // ── Backgrounds ──────────────────────────────────────────────────────────────
  console.log("Inserting backgrounds...");
  const bgRows = rawBackgrounds.map((bg) => {
    const skillGrants = bg.proficiencies
      .filter((p) => p.index.startsWith("skill-"))
      .map((p) => kebabToCamel(p.index.replace(/^skill-/, "")));
    const asiPool = bg.ability_scores.map((a) => a.index); // ["int","wis","cha"]
    const feat = bg.feat;
    const featGrant = feat
      ? feat.note
        ? `${feat.name} (${feat.note})`
        : feat.name
      : null;
    return {
      id: `${SYSTEM}:${bg.index}`,
      system: SYSTEM,
      name: bg.name,
      skillGrants: JSON.stringify(skillGrants),
      asiGrants: JSON.stringify(asiPool),
      featGrant,
      source: SOURCE,
      userId: null as string | null,
    };
  });
  if (bgRows.length) db.insert(sqliteBackgrounds).values(bgRows).run();
  console.log(`  ${bgRows.length} backgrounds`);

  // ── Species (Races) ──────────────────────────────────────────────────────────
  console.log("Inserting species...");
  const speciesRows = rawSpecies.map((s) => ({
    id: `${SYSTEM}:${s.index}`,
    system: SYSTEM,
    name: s.name,
    speed: s.speed ?? null,
    source: SOURCE,
    userId: null as string | null,
  }));
  if (speciesRows.length) db.insert(sqliteRaces).values(speciesRows).run();

  // ── Subspecies ───────────────────────────────────────────────────────────────
  console.log("Inserting subspecies...");
  const speciesIdByIndex = new Map(rawSpecies.map((s) => [s.index, `${SYSTEM}:${s.index}`]));
  const subspeciesRows = rawSubspecies
    .filter((s) => speciesIdByIndex.has(s.species.index))
    .map((s) => ({
      id: `${SYSTEM}:${s.index}`,
      system: SYSTEM,
      raceId: speciesIdByIndex.get(s.species.index)!,
      name: s.name,
      source: SOURCE,
      userId: null as string | null,
    }));
  if (subspeciesRows.length) db.insert(sqliteSubraces).values(subspeciesRows).run();
  console.log(`  ${speciesRows.length} species | ${subspeciesRows.length} subspecies`);

  // ── Traits ───────────────────────────────────────────────────────────────────
  console.log("Inserting species traits...");
  const subspeciesIdByIndex = new Map(rawSubspecies.map((s) => [s.index, `${SYSTEM}:${s.index}`]));

  const traitRows: (typeof sqliteRaceTraits.$inferInsert)[] = [];
  for (const t of rawTraits) {
    const desc = t.description ?? "";
    for (const sp of (t.species ?? [])) {
      const rid = speciesIdByIndex.get(sp.index);
      if (!rid) continue;
      traitRows.push({
        id: `${SYSTEM}:trait:${t.index}:${sp.index}`,
        system: SYSTEM,
        raceId: rid,
        subraceId: null,
        name: t.name,
        description: desc,
        source: SOURCE,
      });
    }
    for (const ss of (t.subspecies ?? [])) {
      const sid = subspeciesIdByIndex.get(ss.index);
      if (!sid) continue;
      traitRows.push({
        id: `${SYSTEM}:trait:${t.index}:${ss.index}`,
        system: SYSTEM,
        raceId: null,
        subraceId: sid,
        name: t.name,
        description: desc,
        source: SOURCE,
      });
    }
  }
  // Also handle subspecies traits referenced from subspecies objects
  for (const ss of rawSubspecies) {
    const sid = subspeciesIdByIndex.get(ss.index);
    if (!sid) continue;
    for (const t of ss.traits) {
      const alreadyAdded = traitRows.some(
        (r) => r.subraceId === sid && r.name === t.name,
      );
      if (!alreadyAdded) {
        traitRows.push({
          id: `${SYSTEM}:trait:${t.index}:${ss.index}`,
          system: SYSTEM,
          raceId: null,
          subraceId: sid,
          name: t.name,
          description: "",
          source: SOURCE,
        });
      }
    }
  }

  for (let i = 0; i < traitRows.length; i += 100) {
    db.insert(sqliteRaceTraits).values(traitRows.slice(i, i + 100)).run();
  }
  console.log(`  ${traitRows.length} trait entries`);

  // ── Classes ──────────────────────────────────────────────────────────────────
  console.log("Inserting classes...");
  const classRows = rawClasses.map((c) => ({
    id: `${SYSTEM}:${c.index}`,
    system: SYSTEM,
    name: c.name,
    hitDie: hitDieStr(c.hit_die),
    spellcastingStat: c.spellcasting?.spellcasting_ability?.index ?? null,
    spellSlotProgression: getSpellSlotProgression(c.index),
    source: SOURCE,
    userId: null as string | null,
  }));
  if (classRows.length) db.insert(sqliteClasses).values(classRows).run();
  const classIdByIndex = new Map(rawClasses.map((c) => [c.index, `${SYSTEM}:${c.index}`]));
  console.log(`  ${classRows.length} classes`);

  // ── Class features (hardcoded — not in 5e-bits 2024 dataset) ────────────────
  console.log("Inserting class features (hardcoded)...");
  const classFeatureRows: (typeof sqliteClassFeatures.$inferInsert)[] = [];
  for (const f of CLASS_FEATURES_2024) {
    const cid = classIdByIndex.get(f.cls);
    if (!cid) continue;
    const desc = f.desc ?? featureDescByName.get(f.name.toLowerCase()) ?? "";
    classFeatureRows.push({
      id: `${SYSTEM}:feature:${f.cls}:${f.level}:${f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      system: SYSTEM,
      classId: cid,
      name: f.name,
      level: f.level,
      description: desc,
      source: SOURCE,
    });
  }
  for (let i = 0; i < classFeatureRows.length; i += 100) {
    db.insert(sqliteClassFeatures).values(classFeatureRows.slice(i, i + 100)).run();
  }
  console.log(`  ${classFeatureRows.length} class features`);

  // ── Class spell slots (hardcoded progressions) ────────────────────────────────
  console.log("Inserting class spell slots (hardcoded)...");
  const spellSlotRows: (typeof sqliteClassSpellSlots.$inferInsert)[] = [];
  for (const index of FULL_CASTER_CLASSES) {
    const cid = classIdByIndex.get(index);
    if (!cid) continue;
    FULL_CASTER_SLOTS.forEach((slots, i) => {
      spellSlotRows.push({ classId: cid, level: i + 1, slot1: slots[0], slot2: slots[1], slot3: slots[2], slot4: slots[3], slot5: slots[4], slot6: slots[5], slot7: slots[6], slot8: slots[7], slot9: slots[8] });
    });
  }
  for (const index of HALF_CASTER_CLASSES) {
    const cid = classIdByIndex.get(index);
    if (!cid) continue;
    HALF_CASTER_SLOTS.forEach((slots, i) => {
      spellSlotRows.push({ classId: cid, level: i + 1, slot1: slots[0], slot2: slots[1], slot3: slots[2], slot4: slots[3], slot5: slots[4], slot6: slots[5], slot7: slots[6], slot8: slots[7], slot9: slots[8] });
    });
  }
  for (let i = 0; i < spellSlotRows.length; i += 100) {
    db.insert(sqliteClassSpellSlots).values(spellSlotRows.slice(i, i + 100)).run();
  }
  console.log(`  ${spellSlotRows.length} spell slot rows (${FULL_CASTER_CLASSES.length} full + ${HALF_CASTER_CLASSES.length} half casters)`);

  // ── Class proficiencies ───────────────────────────────────────────────────────
  console.log("Inserting class proficiencies...");
  const classProfRows: (typeof sqliteClassProficiencies.$inferInsert)[] = [];
  for (const cls of rawClasses) {
    const cid = classIdByIndex.get(cls.index);
    if (!cid) continue;
    for (const prof of cls.proficiencies) {
      classProfRows.push({
        id: `${SYSTEM}:prof:${cls.index}:${prof.index}`,
        system: SYSTEM,
        classId: cid,
        name: prof.name,
        profType: mapProfType(prof.index, prof.name),
        source: SOURCE,
      });
    }
  }
  for (let i = 0; i < classProfRows.length; i += 100) {
    db.insert(sqliteClassProficiencies).values(classProfRows.slice(i, i + 100)).run();
  }
  console.log(`  ${classProfRows.length} class proficiencies`);

  // ── Class skill choices ───────────────────────────────────────────────────────
  console.log("Inserting class skill choices...");
  const classSkillRows: (typeof sqliteClassSkillChoices.$inferInsert)[] = [];
  for (const cls of rawClasses) {
    const cid = classIdByIndex.get(cls.index);
    if (!cid) continue;
    const skillGroup = cls.proficiency_choices?.find(
      (g) => g.from?.options?.some((o) => o.item?.index?.startsWith("skill-")),
    );
    if (!skillGroup) continue;
    const count = skillGroup.choose;
    for (const opt of skillGroup.from.options) {
      if (!opt.item?.index?.startsWith("skill-")) continue;
      const rawKey = opt.item.index.replace(/^skill-/, "");
      const skillKey = kebabToCamel(rawKey);
      classSkillRows.push({
        id: `${SYSTEM}:${cls.index}:skill-choice:${rawKey}`,
        system: SYSTEM,
        classId: cid,
        skillKey,
        chooseCount: count,
      });
    }
  }
  for (let i = 0; i < classSkillRows.length; i += 100) {
    db.insert(sqliteClassSkillChoices).values(classSkillRows.slice(i, i + 100)).run();
  }
  console.log(`  ${classSkillRows.length} class skill choices`);

  // ── Starting equipment ────────────────────────────────────────────────────────
  console.log("Inserting class starting equipment...");
  const equipByIndex = new Map(rawEquipment.map((e) => [e.index, e]));
  const fixedEquipRows: (typeof sqliteClassStartingEquipment.$inferInsert)[] = [];
  const equipOptionRows: (typeof sqliteClassStartingEquipmentOptions.$inferInsert)[] = [];

  for (const cls of rawClasses) {
    const cid = `${SYSTEM}:${cls.index}`;
    for (let gIdx = 0; gIdx < (cls.starting_equipment_options ?? []).length; gIdx++) {
      const group = cls.starting_equipment_options![gIdx];
      if (group.from?.option_set_type !== "options_array") continue;
      const alternatives = (group.from.options ?? [])
        .map(processEquipOption2024)
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

  if (fixedEquipRows.length) {
    for (let i = 0; i < fixedEquipRows.length; i += 100) {
      db.insert(sqliteClassStartingEquipment).values(fixedEquipRows.slice(i, i + 100)).run();
    }
  }
  if (equipOptionRows.length) {
    for (let i = 0; i < equipOptionRows.length; i += 100) {
      db.insert(sqliteClassStartingEquipmentOptions).values(equipOptionRows.slice(i, i + 100)).run();
    }
  }
  console.log(`  ${fixedEquipRows.length} fixed | ${equipOptionRows.length} choice groups`);

  // ── Equipment ─────────────────────────────────────────────────────────────────
  console.log("Inserting equipment...");
  const itemRows = rawEquipment.map((e) => {
    const desc = e.desc?.length ? e.desc.join("\n\n") : null;
    let damageDiceCount: number | null = null;
    let damageDieType: string | null = null;
    let damageType: string | null = null;
    if (e.damage?.damage_dice) {
      const parsed = parseDiceStr(e.damage.damage_dice);
      damageDiceCount = parsed?.count ?? null;
      damageDieType = parsed?.die ?? null;
      damageType = e.damage.damage_type?.name ?? null;
    }
    let twoHandedDiceCount: number | null = null;
    let twoHandedDieType: string | null = null;
    let twoHandedDamageType: string | null = null;
    if (e.two_handed_damage?.damage_dice) {
      const parsed = parseDiceStr(e.two_handed_damage.damage_dice);
      twoHandedDiceCount = parsed?.count ?? null;
      twoHandedDieType = parsed?.die ?? null;
      twoHandedDamageType = e.two_handed_damage.damage_type?.name ?? null;
    }
    const properties = e.properties?.length ? JSON.stringify(e.properties.map((p) => p.name)) : null;
    let weaponCategory: string | null = null;
    if (e.weapon_category) {
      weaponCategory = e.weapon_category.split(" ")[0] ?? null;
    }
    return {
      id: `${SYSTEM}:${e.index}`,
      system: SYSTEM,
      name: e.name,
      equipmentCategory: e.equipment_category?.name ?? "Adventuring Gear",
      description: desc,
      weight: e.weight ?? null,
      cost: e.cost ? `${e.cost.quantity} ${e.cost.unit}` : null,
      weaponCategory,
      weaponRange: e.weapon_range ?? null,
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
  console.log(`  ${itemRows.length} equipment items`);

  // ── Magic items ───────────────────────────────────────────────────────────────
  console.log("Inserting magic items...");
  const magicItemRows = rawMagicItems.map((m) => ({
    id: `${SYSTEM}:magic:${m.index}`,
    system: SYSTEM,
    name: m.name,
    equipmentCategory: m.equipment_category.name,
    description: Array.isArray(m.desc) ? m.desc.join("\n\n") : (m.desc ?? null),
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

  // ── Languages ─────────────────────────────────────────────────────────────────
  console.log("Inserting languages...");
  const langRows = rawLanguages.map((l) => ({
    id: `${SYSTEM}:${l.index}`,
    system: SYSTEM,
    name: l.name,
    source: SOURCE,
  }));
  if (langRows.length) db.insert(sqliteLanguages).values(langRows).run();
  console.log(`  ${langRows.length} languages`);

  // ── Subclasses ────────────────────────────────────────────────────────────────
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

  // ── Feats ─────────────────────────────────────────────────────────────────────
  console.log("Inserting feats...");
  const featRows = rawFeats.map((f) => ({
    id: `${SYSTEM}:${f.index}`,
    system: SYSTEM,
    name: f.name,
    description: Array.isArray(f.desc)
      ? f.desc.join("\n\n")
      : (f.description ?? f.desc ?? "") as string,
    source: SOURCE,
    userId: null as string | null,
  }));
  for (let i = 0; i < featRows.length; i += 100) {
    db.insert(sqliteFeats).values(featRows.slice(i, i + 100)).run();
  }
  console.log(`  ${featRows.length} feats`);

  console.log(
    `\nDone. 2024 SRD seeded:\n` +
    `  ${bgRows.length} backgrounds | ${speciesRows.length} species | ${subspeciesRows.length} subspecies | ` +
    `${traitRows.length} traits | ${classRows.length} classes | ${classFeatureRows.length} class features (hardcoded) | ` +
    `${classProfRows.length} class profs | ${classSkillRows.length} class skill choices | ` +
    `${equipOptionRows.length} equipment choice groups | ${itemRows.length} equipment | ` +
    `${magicItemRows.length} magic items | ${langRows.length} languages | ` +
    `${subclassRows.length} subclasses | ${featRows.length} feats\n` +
    `  ${spellSlotRows.length} spell slot rows (hardcoded) | NOTE: Spells not in 2024 SRD dataset.`,
  );
  sqlite.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
