"use server";

import { db } from "@/lib/db/client";
import {
  dbClasses,
  dbSpells,
  dbClassSpells,
  dbClassSpellSlots,
  dbRaces,
  dbSubraces,
  dbBackgrounds,
  dbItems,
  dbClassFeatures,
  dbRaceTraits,
  dbClassProficiencies,
  dbClassSkillChoices,
  dbLanguages,
  dbSubclasses,
  dbFeats,
  dbRaceAbilityBonuses,
  dbRaceAbilityBonusOptions,
  dbRaceSkillChoices,
  dbRaceLanguageChoices,
  dbRaceProficiencies,
  dbClassStartingEquipment,
  dbClassStartingEquipmentOptions,
} from "@/lib/db/tables";
import { eq, and, like, ilike, asc, min } from "drizzle-orm";

const likeCI = process.env.DB_DRIVER === "postgres" ? ilike : like;

// Cast once — db is a union of SQLite/PG clients, TS can't resolve both overload signatures
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any;

export type RaceAbilityBonusRow = typeof dbRaceAbilityBonuses.$inferSelect;
export type RaceAbilityBonusOptionRow = typeof dbRaceAbilityBonusOptions.$inferSelect;
export type RaceSkillChoiceRow = typeof dbRaceSkillChoices.$inferSelect;
export type RaceLanguageChoiceRow = typeof dbRaceLanguageChoices.$inferSelect;
export type RaceProficiencyRow = typeof dbRaceProficiencies.$inferSelect;
export type ClassStartingEquipmentRow = typeof dbClassStartingEquipment.$inferSelect & {
  armorCategory: string | null;
  acBase: number | null;
  acDexBonus: boolean | null;
  acMaxDex: number | null;
  stealthDisadvantage: boolean | null;
  strMinimum: number | null;
  weaponCategory: string | null;
  weaponRange: string | null;
  damageDiceCount: number | null;
  damageDieType: string | null;
  damageType: string | null;
  properties: string | null;
  rangeNormal: number | null;
  rangeLong: number | null;
  itemWeight: number | null;
  modifiersJson: string | null;
};
export type ClassStartingEquipmentOptionRow = typeof dbClassStartingEquipmentOptions.$inferSelect;
export type ClassRow = typeof dbClasses.$inferSelect;
export type ClassSkillChoiceRow = typeof dbClassSkillChoices.$inferSelect;
export type ClassFeatureRow = typeof dbClassFeatures.$inferSelect;
export type RaceTraitRow = typeof dbRaceTraits.$inferSelect;
export type ClassProficiencyRow = typeof dbClassProficiencies.$inferSelect;
export type LanguageRow = typeof dbLanguages.$inferSelect;
export type SubclassRow = typeof dbSubclasses.$inferSelect;
export type FeatRow = typeof dbFeats.$inferSelect;
export type ItemRow = typeof dbItems.$inferSelect;
export type SpellRow = typeof dbSpells.$inferSelect;
export type SpellSlotRow = typeof dbClassSpellSlots.$inferSelect;
export type RaceRow = typeof dbRaces.$inferSelect;
export type SubraceRow = typeof dbSubraces.$inferSelect;
export type BackgroundRow = typeof dbBackgrounds.$inferSelect;

// ─── Backgrounds ─────────────────────────────────────────────────────────────

export async function getBackgrounds(system = "dnd5e"): Promise<BackgroundRow[]> {
  return anyDb
    .select()
    .from(dbBackgrounds)
    .where(eq(dbBackgrounds.system, system))
    .orderBy(asc(dbBackgrounds.name));
}

// ─── Races ────────────────────────────────────────────────────────────────────

export async function getRaces(system = "dnd5e"): Promise<RaceRow[]> {
  return anyDb
    .select()
    .from(dbRaces)
    .where(eq(dbRaces.system, system))
    .orderBy(asc(dbRaces.name));
}

export async function getSubraces(raceId?: string, system = "dnd5e"): Promise<SubraceRow[]> {
  const conditions = raceId
    ? and(eq(dbSubraces.system, system), eq(dbSubraces.raceId, raceId))
    : eq(dbSubraces.system, system);
  return anyDb
    .select()
    .from(dbSubraces)
    .where(conditions)
    .orderBy(asc(dbSubraces.name));
}

// ─── Classes ──────────────────────────────────────────────────────────────────

export async function getClasses(system = "dnd5e"): Promise<ClassRow[]> {
  return anyDb
    .select()
    .from(dbClasses)
    .where(eq(dbClasses.system, system))
    .orderBy(asc(dbClasses.name));
}

export async function getClassSpellSlots(system = "dnd5e"): Promise<SpellSlotRow[]> {
  return anyDb
    .select({
      classId: dbClassSpellSlots.classId,
      level: dbClassSpellSlots.level,
      slot1: dbClassSpellSlots.slot1,
      slot2: dbClassSpellSlots.slot2,
      slot3: dbClassSpellSlots.slot3,
      slot4: dbClassSpellSlots.slot4,
      slot5: dbClassSpellSlots.slot5,
      slot6: dbClassSpellSlots.slot6,
      slot7: dbClassSpellSlots.slot7,
      slot8: dbClassSpellSlots.slot8,
      slot9: dbClassSpellSlots.slot9,
    })
    .from(dbClassSpellSlots)
    .innerJoin(dbClasses, eq(dbClasses.id, dbClassSpellSlots.classId))
    .where(eq(dbClasses.system, system))
    .orderBy(asc(dbClassSpellSlots.classId), asc(dbClassSpellSlots.level));
}

// ─── Spell slots for a class at a given level ─────────────────────────────────

export async function getSpellSlots(
  classId: string,
  level: number,
): Promise<SpellSlotRow | null> {
  const rows = await anyDb
    .select()
    .from(dbClassSpellSlots)
    .where(
      and(
        eq(dbClassSpellSlots.classId, classId),
        eq(dbClassSpellSlots.level, level),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

// ─── Single spell by ID ───────────────────────────────────────────────────────

export async function getSpell(id: string): Promise<SpellRow | null> {
  const rows = await anyDb
    .select()
    .from(dbSpells)
    .where(eq(dbSpells.id, id))
    .limit(1);
  return rows[0] ?? null;
}

// ─── Spell search ─────────────────────────────────────────────────────────────

export type SpellSearchParams = {
  system?: string;
  name?: string;
  level?: number;
  school?: string;
  classId?: string;
};

// ─── Items / Equipment ────────────────────────────────────────────────────────

export type ItemSearchParams = {
  system?: string;
  name?: string;
  equipmentCategory?: string;
};

function normalizeGroupCategory(value: string): string {
  return value.trim().toLowerCase();
}

function matchesStartingEquipmentGroup(item: ItemRow, group?: string): boolean {
  if (!group) return true;

  const normalized = normalizeGroupCategory(group);
  const itemName = item.name.trim().toLowerCase();

  if (normalized === "martial weapons") {
    return item.equipmentCategory === "Weapon" && item.weaponCategory === "Martial";
  }
  if (normalized === "martial melee weapons") {
    return item.equipmentCategory === "Weapon" && item.weaponCategory === "Martial" && item.weaponRange === "Melee";
  }
  if (normalized === "simple weapons") {
    return item.equipmentCategory === "Weapon" && item.weaponCategory === "Simple";
  }
  if (normalized === "simple melee weapons") {
    return item.equipmentCategory === "Weapon" && item.weaponCategory === "Simple" && item.weaponRange === "Melee";
  }
  if (normalized === "musical instruments") {
    return item.equipmentCategory === "Tools" && [
      "bagpipes",
      "drum",
      "dulcimer",
      "flute",
      "horn",
      "lute",
      "lyre",
      "pan flute",
      "shawm",
      "viol",
    ].includes(itemName);
  }
  if (normalized === "arcane foci") {
    return item.equipmentCategory === "Adventuring Gear" && [
      "crystal",
      "orb",
      "rod",
      "staff",
      "wand",
    ].includes(itemName);
  }

  return item.equipmentCategory === group;
}

export async function searchItems(params: ItemSearchParams): Promise<ItemRow[]> {
  const system = params.system ?? "dnd5e";
  const rows = await anyDb
    .select()
    .from(dbItems)
    .where(
      and(
        eq(dbItems.system, system),
        params.name ? likeCI(dbItems.name, `%${params.name}%`) : undefined,
      ),
    )
    .orderBy(asc(dbItems.name))
    .limit(params.equipmentCategory ? 300 : 60);

  return rows
    .filter((row: ItemRow) => matchesStartingEquipmentGroup(row, params.equipmentCategory))
    .slice(0, 60);
}

export async function getItem(id: string): Promise<ItemRow | null> {
  const rows = await anyDb
    .select()
    .from(dbItems)
    .where(eq(dbItems.id, id))
    .limit(1);
  return rows[0] ?? null;
}

// ─── Spell search ─────────────────────────────────────────────────────────────

// ─── Race traits ──────────────────────────────────────────────────────────────

export async function getRaceTraits(
  raceId: string,
  system = "dnd5e",
): Promise<RaceTraitRow[]> {
  return anyDb
    .select()
    .from(dbRaceTraits)
    .where(
      and(eq(dbRaceTraits.raceId, raceId), eq(dbRaceTraits.system, system)),
    )
    .orderBy(asc(dbRaceTraits.name));
}

export async function getSubraceTraits(
  subraceId: string,
  system = "dnd5e",
): Promise<RaceTraitRow[]> {
  return anyDb
    .select()
    .from(dbRaceTraits)
    .where(
      and(eq(dbRaceTraits.subraceId, subraceId), eq(dbRaceTraits.system, system)),
    )
    .orderBy(asc(dbRaceTraits.name));
}

// ─── Class proficiencies ──────────────────────────────────────────────────────

export async function getClassProficiencies(
  classId: string,
  system = "dnd5e",
): Promise<ClassProficiencyRow[]> {
  return anyDb
    .select()
    .from(dbClassProficiencies)
    .where(
      and(eq(dbClassProficiencies.classId, classId), eq(dbClassProficiencies.system, system)),
    )
    .orderBy(asc(dbClassProficiencies.profType), asc(dbClassProficiencies.name));
}

// ─── Languages ────────────────────────────────────────────────────────────────

export async function getLanguages(system = "dnd5e"): Promise<LanguageRow[]> {
  return anyDb
    .select()
    .from(dbLanguages)
    .where(eq(dbLanguages.system, system))
    .orderBy(asc(dbLanguages.name));
}

export async function getTools(system = "dnd5e"): Promise<ItemRow[]> {
  return anyDb
    .select()
    .from(dbItems)
    .where(
      and(eq(dbItems.system, system), eq(dbItems.equipmentCategory, "Tools")),
    )
    .orderBy(asc(dbItems.name));
}

// ─── Other proficiency search ─────────────────────────────────────────────────

export type OtherProfResult = {
  name: string;
  category: "Tool" | "Language" | "Vehicle" | "Weapon" | "Armor";
};

export async function searchOtherProficiencies(params: {
  name?: string;
  category?: "Tool" | "Language" | "Vehicle" | "Weapon" | "Armor";
  system?: string;
}): Promise<OtherProfResult[]> {
  const system = params.system ?? "dnd5e";
  const { name, category } = params;
  const results: OtherProfResult[] = [];

  if (!category || category === "Language") {
    const rows = await anyDb
      .select()
      .from(dbLanguages)
      .where(
        and(
          eq(dbLanguages.system, system),
          name ? likeCI(dbLanguages.name, `%${name}%`) : undefined,
        ),
      )
      .orderBy(asc(dbLanguages.name))
      .limit(30);
    results.push(...rows.map((r: LanguageRow) => ({ name: r.name, category: "Language" as const })));
  }

  if (!category || category === "Tool") {
    const rows = await anyDb
      .select()
      .from(dbItems)
      .where(
        and(
          eq(dbItems.system, system),
          eq(dbItems.equipmentCategory, "Tools"),
          name ? likeCI(dbItems.name, `%${name}%`) : undefined,
        ),
      )
      .orderBy(asc(dbItems.name))
      .limit(30);
    results.push(...rows.map((r: ItemRow) => ({ name: r.name, category: "Tool" as const })));
  }

  if (!category || category === "Weapon") {
    const rows = await anyDb
      .select()
      .from(dbItems)
      .where(
        and(
          eq(dbItems.system, system),
          eq(dbItems.equipmentCategory, "Weapon"),
          name ? likeCI(dbItems.name, `%${name}%`) : undefined,
        ),
      )
      .orderBy(asc(dbItems.name))
      .limit(30);
    results.push(...rows.map((r: ItemRow) => ({ name: r.name, category: "Weapon" as const })));
  }

  if (!category || category === "Armor") {
    const rows = await anyDb
      .select()
      .from(dbItems)
      .where(
        and(
          eq(dbItems.system, system),
          eq(dbItems.equipmentCategory, "Armor"),
          name ? likeCI(dbItems.name, `%${name}%`) : undefined,
        ),
      )
      .orderBy(asc(dbItems.name))
      .limit(30);
    results.push(...rows.map((r: ItemRow) => ({ name: r.name, category: "Armor" as const })));
  }

  return results.slice(0, 60);
}

// ─── Subclasses ───────────────────────────────────────────────────────────────

export async function getSubclasses(
  classId?: string,
  system = "dnd5e",
): Promise<SubclassRow[]> {
  return anyDb
    .select()
    .from(dbSubclasses)
    .where(
      classId
        ? and(eq(dbSubclasses.classId, classId), eq(dbSubclasses.system, system))
        : eq(dbSubclasses.system, system),
    )
    .orderBy(asc(dbSubclasses.name));
}

// ─── Feats ────────────────────────────────────────────────────────────────────

export async function searchFeats(
  name?: string,
  system = "dnd5e",
): Promise<FeatRow[]> {
  return anyDb
    .select()
    .from(dbFeats)
    .where(
      and(
        eq(dbFeats.system, system),
        name ? likeCI(dbFeats.name, `%${name}%`) : undefined,
      ),
    )
    .orderBy(asc(dbFeats.name))
    .limit(60);
}

// ─── Cross-table feature search ───────────────────────────────────────────────

export type SrdFeatureResult = {
  id: string
  name: string
  description: string
  category: "Feat" | "Class Feature" | "Race Trait"
}

export async function searchSrdFeatures(
  name?: string,
  system = "dnd5e",
): Promise<SrdFeatureResult[]> {
  const nameFilter = name ? `%${name}%` : undefined

  const [feats, classFeatures, raceTraits] = await Promise.all([
    anyDb
      .select()
      .from(dbFeats)
      .where(and(eq(dbFeats.system, system), nameFilter ? likeCI(dbFeats.name, nameFilter) : undefined))
      .orderBy(asc(dbFeats.name))
      .limit(20),
    anyDb
      .select()
      .from(dbClassFeatures)
      .where(and(eq(dbClassFeatures.system, system), nameFilter ? likeCI(dbClassFeatures.name, nameFilter) : undefined))
      .orderBy(asc(dbClassFeatures.name))
      .limit(20),
    anyDb
      .select({
        id: min(dbRaceTraits.id),
        name: dbRaceTraits.name,
        description: min(dbRaceTraits.description),
      })
      .from(dbRaceTraits)
      .where(and(eq(dbRaceTraits.system, system), nameFilter ? likeCI(dbRaceTraits.name, nameFilter) : undefined))
      .groupBy(dbRaceTraits.name)
      .orderBy(asc(dbRaceTraits.name))
      .limit(20),
  ])

  return [
    ...feats.map((f: typeof dbFeats.$inferSelect) => ({ id: f.id, name: f.name, description: f.description, category: "Feat" as const })),
    ...classFeatures.map((f: typeof dbClassFeatures.$inferSelect) => ({ id: f.id, name: f.name, description: f.description, category: "Class Feature" as const })),
    ...raceTraits.map((f: { id: string | null; name: string; description: string | null }) => ({ id: f.id ?? "", name: f.name, description: f.description ?? "", category: "Race Trait" as const })),
  ].sort((a, b) => a.name.localeCompare(b.name))
}

// ─── Class features ───────────────────────────────────────────────────────────

export async function getClassFeatures(
  classId: string,
  system = "dnd5e",
): Promise<ClassFeatureRow[]> {
  return anyDb
    .select()
    .from(dbClassFeatures)
    .where(
      and(
        eq(dbClassFeatures.classId, classId),
        eq(dbClassFeatures.system, system),
      ),
    )
    .orderBy(asc(dbClassFeatures.level), asc(dbClassFeatures.name));
}

export async function getAllClassFeatures(system = "dnd5e"): Promise<ClassFeatureRow[]> {
  return anyDb
    .select()
    .from(dbClassFeatures)
    .where(eq(dbClassFeatures.system, system))
    .orderBy(asc(dbClassFeatures.classId), asc(dbClassFeatures.level), asc(dbClassFeatures.name));
}

export async function getAllClassProficiencies(system = "dnd5e"): Promise<ClassProficiencyRow[]> {
  return anyDb
    .select()
    .from(dbClassProficiencies)
    .where(eq(dbClassProficiencies.system, system))
    .orderBy(asc(dbClassProficiencies.classId), asc(dbClassProficiencies.profType));
}

export async function getAllRaceTraits(system = "dnd5e"): Promise<RaceTraitRow[]> {
  return anyDb
    .select()
    .from(dbRaceTraits)
    .where(eq(dbRaceTraits.system, system))
    .orderBy(asc(dbRaceTraits.raceId), asc(dbRaceTraits.name));
}

export async function getAllClassSkillChoices(system = "dnd5e"): Promise<ClassSkillChoiceRow[]> {
  return anyDb
    .select()
    .from(dbClassSkillChoices)
    .where(eq(dbClassSkillChoices.system, system))
    .orderBy(asc(dbClassSkillChoices.classId), asc(dbClassSkillChoices.skillKey));
}

export async function getAllRaceAbilityBonuses(system = "dnd5e"): Promise<RaceAbilityBonusRow[]> {
  return anyDb
    .select()
    .from(dbRaceAbilityBonuses)
    .where(eq(dbRaceAbilityBonuses.system, system))
    .orderBy(asc(dbRaceAbilityBonuses.raceId), asc(dbRaceAbilityBonuses.abilityScore));
}

export async function getAllRaceAbilityBonusOptions(system = "dnd5e"): Promise<RaceAbilityBonusOptionRow[]> {
  return anyDb
    .select()
    .from(dbRaceAbilityBonusOptions)
    .where(eq(dbRaceAbilityBonusOptions.system, system))
    .orderBy(asc(dbRaceAbilityBonusOptions.raceId), asc(dbRaceAbilityBonusOptions.abilityScore));
}

export async function getAllRaceSkillChoices(system = "dnd5e"): Promise<RaceSkillChoiceRow[]> {
  return anyDb
    .select()
    .from(dbRaceSkillChoices)
    .where(eq(dbRaceSkillChoices.system, system))
    .orderBy(asc(dbRaceSkillChoices.raceId), asc(dbRaceSkillChoices.skillKey));
}

export async function getAllRaceLanguageChoices(system = "dnd5e"): Promise<RaceLanguageChoiceRow[]> {
  return anyDb
    .select()
    .from(dbRaceLanguageChoices)
    .where(eq(dbRaceLanguageChoices.system, system));
}

export async function getAllRaceProficiencies(system = "dnd5e"): Promise<RaceProficiencyRow[]> {
  return anyDb
    .select()
    .from(dbRaceProficiencies)
    .where(eq(dbRaceProficiencies.system, system));
}

// ─── Class starting equipment ─────────────────────────────────────────────────

export async function getAllClassStartingEquipment(system = "dnd5e"): Promise<ClassStartingEquipmentRow[]> {
  const rows = await anyDb
    .select({
      id: dbClassStartingEquipment.id,
      system: dbClassStartingEquipment.system,
      classId: dbClassStartingEquipment.classId,
      itemId: dbClassStartingEquipment.itemId,
      itemName: dbClassStartingEquipment.itemName,
      quantity: dbClassStartingEquipment.quantity,
      equipmentCategory: dbClassStartingEquipment.equipmentCategory,
      weight: dbClassStartingEquipment.weight,
      armorCategory: dbItems.armorCategory,
      acBase: dbItems.acBase,
      acDexBonus: dbItems.acDexBonus,
      acMaxDex: dbItems.acMaxDex,
      stealthDisadvantage: dbItems.stealthDisadvantage,
      strMinimum: dbItems.strMinimum,
      weaponCategory: dbItems.weaponCategory,
      weaponRange: dbItems.weaponRange,
      damageDiceCount: dbItems.damageDiceCount,
      damageDieType: dbItems.damageDieType,
      damageType: dbItems.damageType,
      properties: dbItems.properties,
      rangeNormal: dbItems.rangeNormal,
      rangeLong: dbItems.rangeLong,
      itemWeight: dbItems.weight,
      modifiersJson: dbItems.modifiersJson,
    })
    .from(dbClassStartingEquipment)
    .leftJoin(dbItems, eq(dbClassStartingEquipment.itemId, dbItems.id))
    .where(eq(dbClassStartingEquipment.system, system))
    .orderBy(asc(dbClassStartingEquipment.classId));
  return rows as ClassStartingEquipmentRow[];
}

export async function getAllClassStartingEquipmentOptions(system = "dnd5e"): Promise<ClassStartingEquipmentOptionRow[]> {
  return anyDb
    .select()
    .from(dbClassStartingEquipmentOptions)
    .where(eq(dbClassStartingEquipmentOptions.system, system))
    .orderBy(asc(dbClassStartingEquipmentOptions.classId), asc(dbClassStartingEquipmentOptions.choiceIndex));
}

// ─── Spell search ─────────────────────────────────────────────────────────────

export async function searchSpells(
  params: SpellSearchParams,
): Promise<SpellRow[]> {
  const system = params.system ?? "dnd5e";

  if (params.classId) {
    const rows = await anyDb
      .select({ spell: dbSpells })
      .from(dbSpells)
      .innerJoin(
        dbClassSpells,
        eq(dbClassSpells.spellId, dbSpells.id),
      )
      .where(
        and(
          eq(dbSpells.system, system),
          eq(dbClassSpells.classId, params.classId),
          params.level !== undefined
            ? eq(dbSpells.level, params.level)
            : undefined,
          params.school ? eq(dbSpells.school, params.school) : undefined,
          params.name
            ? likeCI(dbSpells.name, `%${params.name}%`)
            : undefined,
        ),
      )
      .orderBy(asc(dbSpells.level), asc(dbSpells.name))
      .limit(60);
    return rows.map((r: { spell: SpellRow }) => r.spell);
  }

  return anyDb
    .select()
    .from(dbSpells)
    .where(
      and(
        eq(dbSpells.system, system),
        params.level !== undefined
          ? eq(dbSpells.level, params.level)
          : undefined,
        params.school ? eq(dbSpells.school, params.school) : undefined,
        params.name ? likeCI(dbSpells.name, `%${params.name}%`) : undefined,
      ),
    )
    .orderBy(asc(dbSpells.level), asc(dbSpells.name))
    .limit(60);
}

export async function getCantripsByClass(classId: string, system = "dnd5e"): Promise<SpellRow[]> {
  const rows = await anyDb
    .select({ spell: dbSpells })
    .from(dbSpells)
    .innerJoin(dbClassSpells, eq(dbClassSpells.spellId, dbSpells.id))
    .where(
      and(
        eq(dbSpells.system, system),
        eq(dbClassSpells.classId, classId),
        eq(dbSpells.level, 0),
      ),
    )
    .orderBy(asc(dbSpells.name));
  return rows.map((r: { spell: SpellRow }) => r.spell);
}
