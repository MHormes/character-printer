"use server";

import { db } from "@/lib/db/client";
import {
  sqliteClasses,
  sqliteSpells,
  sqliteClassSpells,
  sqliteClassSpellSlots,
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
  sqliteRaceLanguageChoices,
  sqliteRaceProficiencies,
  sqliteClassStartingEquipment,
  sqliteClassStartingEquipmentOptions,
} from "@/lib/db/schema";
import { eq, and, like, ilike, asc, min } from "drizzle-orm";

const likeCI = process.env.DB_DRIVER === "postgres" ? ilike : like;

// Cast once — db is a union of SQLite/PG clients, TS can't call both signatures
const anyDb = db as any;

export type RaceAbilityBonusRow = typeof sqliteRaceAbilityBonuses.$inferSelect;
export type RaceAbilityBonusOptionRow = typeof sqliteRaceAbilityBonusOptions.$inferSelect;
export type RaceSkillChoiceRow = typeof sqliteRaceSkillChoices.$inferSelect;
export type RaceLanguageChoiceRow = typeof sqliteRaceLanguageChoices.$inferSelect;
export type RaceProficiencyRow = typeof sqliteRaceProficiencies.$inferSelect;
export type ClassStartingEquipmentRow = typeof sqliteClassStartingEquipment.$inferSelect & {
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
export type ClassStartingEquipmentOptionRow = typeof sqliteClassStartingEquipmentOptions.$inferSelect;
export type ClassRow = typeof sqliteClasses.$inferSelect;
export type ClassSkillChoiceRow = typeof sqliteClassSkillChoices.$inferSelect;
export type ClassFeatureRow = typeof sqliteClassFeatures.$inferSelect;
export type RaceTraitRow = typeof sqliteRaceTraits.$inferSelect;
export type ClassProficiencyRow = typeof sqliteClassProficiencies.$inferSelect;
export type LanguageRow = typeof sqliteLanguages.$inferSelect;
export type SubclassRow = typeof sqliteSubclasses.$inferSelect;
export type FeatRow = typeof sqliteFeats.$inferSelect;
export type ItemRow = typeof sqliteItems.$inferSelect;
export type SpellRow = typeof sqliteSpells.$inferSelect;
export type SpellSlotRow = typeof sqliteClassSpellSlots.$inferSelect;
export type RaceRow = typeof sqliteRaces.$inferSelect;
export type SubraceRow = typeof sqliteSubraces.$inferSelect;
export type BackgroundRow = typeof sqliteBackgrounds.$inferSelect;

// ─── Backgrounds ─────────────────────────────────────────────────────────────

export async function getBackgrounds(system = "dnd5e"): Promise<BackgroundRow[]> {
  return anyDb
    .select()
    .from(sqliteBackgrounds)
    .where(eq(sqliteBackgrounds.system, system))
    .orderBy(asc(sqliteBackgrounds.name));
}

// ─── Races ────────────────────────────────────────────────────────────────────

export async function getRaces(system = "dnd5e"): Promise<RaceRow[]> {
  return anyDb
    .select()
    .from(sqliteRaces)
    .where(eq(sqliteRaces.system, system))
    .orderBy(asc(sqliteRaces.name));
}

export async function getSubraces(raceId?: string, system = "dnd5e"): Promise<SubraceRow[]> {
  const conditions = raceId
    ? and(eq(sqliteSubraces.system, system), eq(sqliteSubraces.raceId, raceId))
    : eq(sqliteSubraces.system, system);
  return anyDb
    .select()
    .from(sqliteSubraces)
    .where(conditions)
    .orderBy(asc(sqliteSubraces.name));
}

// ─── Classes ──────────────────────────────────────────────────────────────────

export async function getClasses(system = "dnd5e"): Promise<ClassRow[]> {
  return anyDb
    .select()
    .from(sqliteClasses)
    .where(eq(sqliteClasses.system, system))
    .orderBy(asc(sqliteClasses.name));
}

export async function getClassSpellSlots(system = "dnd5e"): Promise<SpellSlotRow[]> {
  return anyDb
    .select({
      classId: sqliteClassSpellSlots.classId,
      level: sqliteClassSpellSlots.level,
      slot1: sqliteClassSpellSlots.slot1,
      slot2: sqliteClassSpellSlots.slot2,
      slot3: sqliteClassSpellSlots.slot3,
      slot4: sqliteClassSpellSlots.slot4,
      slot5: sqliteClassSpellSlots.slot5,
      slot6: sqliteClassSpellSlots.slot6,
      slot7: sqliteClassSpellSlots.slot7,
      slot8: sqliteClassSpellSlots.slot8,
      slot9: sqliteClassSpellSlots.slot9,
    })
    .from(sqliteClassSpellSlots)
    .innerJoin(sqliteClasses, eq(sqliteClasses.id, sqliteClassSpellSlots.classId))
    .where(eq(sqliteClasses.system, system))
    .orderBy(asc(sqliteClassSpellSlots.classId), asc(sqliteClassSpellSlots.level));
}

// ─── Spell slots for a class at a given level ─────────────────────────────────

export async function getSpellSlots(
  classId: string,
  level: number,
): Promise<SpellSlotRow | null> {
  const rows = await anyDb
    .select()
    .from(sqliteClassSpellSlots)
    .where(
      and(
        eq(sqliteClassSpellSlots.classId, classId),
        eq(sqliteClassSpellSlots.level, level),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

// ─── Single spell by ID ───────────────────────────────────────────────────────

export async function getSpell(id: string): Promise<SpellRow | null> {
  const rows = await anyDb
    .select()
    .from(sqliteSpells)
    .where(eq(sqliteSpells.id, id))
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
    .from(sqliteItems)
    .where(
      and(
        eq(sqliteItems.system, system),
        params.name ? likeCI(sqliteItems.name, `%${params.name}%`) : undefined,
      ),
    )
    .orderBy(asc(sqliteItems.name))
    .limit(params.equipmentCategory ? 300 : 60);

  return rows
    .filter((row: ItemRow) => matchesStartingEquipmentGroup(row, params.equipmentCategory))
    .slice(0, 60);
}

export async function getItem(id: string): Promise<ItemRow | null> {
  const rows = await anyDb
    .select()
    .from(sqliteItems)
    .where(eq(sqliteItems.id, id))
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
    .from(sqliteRaceTraits)
    .where(
      and(eq(sqliteRaceTraits.raceId, raceId), eq(sqliteRaceTraits.system, system)),
    )
    .orderBy(asc(sqliteRaceTraits.name));
}

export async function getSubraceTraits(
  subraceId: string,
  system = "dnd5e",
): Promise<RaceTraitRow[]> {
  return anyDb
    .select()
    .from(sqliteRaceTraits)
    .where(
      and(eq(sqliteRaceTraits.subraceId, subraceId), eq(sqliteRaceTraits.system, system)),
    )
    .orderBy(asc(sqliteRaceTraits.name));
}

// ─── Class proficiencies ──────────────────────────────────────────────────────

export async function getClassProficiencies(
  classId: string,
  system = "dnd5e",
): Promise<ClassProficiencyRow[]> {
  return anyDb
    .select()
    .from(sqliteClassProficiencies)
    .where(
      and(eq(sqliteClassProficiencies.classId, classId), eq(sqliteClassProficiencies.system, system)),
    )
    .orderBy(asc(sqliteClassProficiencies.profType), asc(sqliteClassProficiencies.name));
}

// ─── Languages ────────────────────────────────────────────────────────────────

export async function getLanguages(system = "dnd5e"): Promise<LanguageRow[]> {
  return anyDb
    .select()
    .from(sqliteLanguages)
    .where(eq(sqliteLanguages.system, system))
    .orderBy(asc(sqliteLanguages.name));
}

export async function getTools(system = "dnd5e"): Promise<ItemRow[]> {
  return anyDb
    .select()
    .from(sqliteItems)
    .where(
      and(eq(sqliteItems.system, system), eq(sqliteItems.equipmentCategory, "Tools")),
    )
    .orderBy(asc(sqliteItems.name));
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
      .from(sqliteLanguages)
      .where(
        and(
          eq(sqliteLanguages.system, system),
          name ? likeCI(sqliteLanguages.name, `%${name}%`) : undefined,
        ),
      )
      .orderBy(asc(sqliteLanguages.name))
      .limit(30);
    results.push(...rows.map((r: LanguageRow) => ({ name: r.name, category: "Language" as const })));
  }

  if (!category || category === "Tool") {
    const rows = await anyDb
      .select()
      .from(sqliteItems)
      .where(
        and(
          eq(sqliteItems.system, system),
          eq(sqliteItems.equipmentCategory, "Tools"),
          name ? likeCI(sqliteItems.name, `%${name}%`) : undefined,
        ),
      )
      .orderBy(asc(sqliteItems.name))
      .limit(30);
    results.push(...rows.map((r: ItemRow) => ({ name: r.name, category: "Tool" as const })));
  }

  if (!category || category === "Weapon") {
    const rows = await anyDb
      .select()
      .from(sqliteItems)
      .where(
        and(
          eq(sqliteItems.system, system),
          eq(sqliteItems.equipmentCategory, "Weapon"),
          name ? likeCI(sqliteItems.name, `%${name}%`) : undefined,
        ),
      )
      .orderBy(asc(sqliteItems.name))
      .limit(30);
    results.push(...rows.map((r: ItemRow) => ({ name: r.name, category: "Weapon" as const })));
  }

  if (!category || category === "Armor") {
    const rows = await anyDb
      .select()
      .from(sqliteItems)
      .where(
        and(
          eq(sqliteItems.system, system),
          eq(sqliteItems.equipmentCategory, "Armor"),
          name ? likeCI(sqliteItems.name, `%${name}%`) : undefined,
        ),
      )
      .orderBy(asc(sqliteItems.name))
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
    .from(sqliteSubclasses)
    .where(
      classId
        ? and(eq(sqliteSubclasses.classId, classId), eq(sqliteSubclasses.system, system))
        : eq(sqliteSubclasses.system, system),
    )
    .orderBy(asc(sqliteSubclasses.name));
}

// ─── Feats ────────────────────────────────────────────────────────────────────

export async function searchFeats(
  name?: string,
  system = "dnd5e",
): Promise<FeatRow[]> {
  return anyDb
    .select()
    .from(sqliteFeats)
    .where(
      and(
        eq(sqliteFeats.system, system),
        name ? likeCI(sqliteFeats.name, `%${name}%`) : undefined,
      ),
    )
    .orderBy(asc(sqliteFeats.name))
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
      .from(sqliteFeats)
      .where(and(eq(sqliteFeats.system, system), nameFilter ? likeCI(sqliteFeats.name, nameFilter) : undefined))
      .orderBy(asc(sqliteFeats.name))
      .limit(20),
    anyDb
      .select()
      .from(sqliteClassFeatures)
      .where(and(eq(sqliteClassFeatures.system, system), nameFilter ? likeCI(sqliteClassFeatures.name, nameFilter) : undefined))
      .orderBy(asc(sqliteClassFeatures.name))
      .limit(20),
    anyDb
      .select({
        id: min(sqliteRaceTraits.id),
        name: sqliteRaceTraits.name,
        description: min(sqliteRaceTraits.description),
      })
      .from(sqliteRaceTraits)
      .where(and(eq(sqliteRaceTraits.system, system), nameFilter ? likeCI(sqliteRaceTraits.name, nameFilter) : undefined))
      .groupBy(sqliteRaceTraits.name)
      .orderBy(asc(sqliteRaceTraits.name))
      .limit(20),
  ])

  return [
    ...feats.map((f: typeof sqliteFeats.$inferSelect) => ({ id: f.id, name: f.name, description: f.description, category: "Feat" as const })),
    ...classFeatures.map((f: typeof sqliteClassFeatures.$inferSelect) => ({ id: f.id, name: f.name, description: f.description, category: "Class Feature" as const })),
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
    .from(sqliteClassFeatures)
    .where(
      and(
        eq(sqliteClassFeatures.classId, classId),
        eq(sqliteClassFeatures.system, system),
      ),
    )
    .orderBy(asc(sqliteClassFeatures.level), asc(sqliteClassFeatures.name));
}

export async function getAllClassFeatures(system = "dnd5e"): Promise<ClassFeatureRow[]> {
  return anyDb
    .select()
    .from(sqliteClassFeatures)
    .where(eq(sqliteClassFeatures.system, system))
    .orderBy(asc(sqliteClassFeatures.classId), asc(sqliteClassFeatures.level), asc(sqliteClassFeatures.name));
}

export async function getAllClassProficiencies(system = "dnd5e"): Promise<ClassProficiencyRow[]> {
  return anyDb
    .select()
    .from(sqliteClassProficiencies)
    .where(eq(sqliteClassProficiencies.system, system))
    .orderBy(asc(sqliteClassProficiencies.classId), asc(sqliteClassProficiencies.profType));
}

export async function getAllRaceTraits(system = "dnd5e"): Promise<RaceTraitRow[]> {
  return anyDb
    .select()
    .from(sqliteRaceTraits)
    .where(eq(sqliteRaceTraits.system, system))
    .orderBy(asc(sqliteRaceTraits.raceId), asc(sqliteRaceTraits.name));
}

export async function getAllClassSkillChoices(system = "dnd5e"): Promise<ClassSkillChoiceRow[]> {
  return anyDb
    .select()
    .from(sqliteClassSkillChoices)
    .where(eq(sqliteClassSkillChoices.system, system))
    .orderBy(asc(sqliteClassSkillChoices.classId), asc(sqliteClassSkillChoices.skillKey));
}

export async function getAllRaceAbilityBonuses(system = "dnd5e"): Promise<RaceAbilityBonusRow[]> {
  return anyDb
    .select()
    .from(sqliteRaceAbilityBonuses)
    .where(eq(sqliteRaceAbilityBonuses.system, system))
    .orderBy(asc(sqliteRaceAbilityBonuses.raceId), asc(sqliteRaceAbilityBonuses.abilityScore));
}

export async function getAllRaceAbilityBonusOptions(system = "dnd5e"): Promise<RaceAbilityBonusOptionRow[]> {
  return anyDb
    .select()
    .from(sqliteRaceAbilityBonusOptions)
    .where(eq(sqliteRaceAbilityBonusOptions.system, system))
    .orderBy(asc(sqliteRaceAbilityBonusOptions.raceId), asc(sqliteRaceAbilityBonusOptions.abilityScore));
}

export async function getAllRaceSkillChoices(system = "dnd5e"): Promise<RaceSkillChoiceRow[]> {
  return anyDb
    .select()
    .from(sqliteRaceSkillChoices)
    .where(eq(sqliteRaceSkillChoices.system, system))
    .orderBy(asc(sqliteRaceSkillChoices.raceId), asc(sqliteRaceSkillChoices.skillKey));
}

export async function getAllRaceLanguageChoices(system = "dnd5e"): Promise<RaceLanguageChoiceRow[]> {
  return anyDb
    .select()
    .from(sqliteRaceLanguageChoices)
    .where(eq(sqliteRaceLanguageChoices.system, system));
}

export async function getAllRaceProficiencies(system = "dnd5e"): Promise<RaceProficiencyRow[]> {
  return anyDb
    .select()
    .from(sqliteRaceProficiencies)
    .where(eq(sqliteRaceProficiencies.system, system));
}

// ─── Class starting equipment ─────────────────────────────────────────────────

export async function getAllClassStartingEquipment(system = "dnd5e"): Promise<ClassStartingEquipmentRow[]> {
  const rows = await anyDb
    .select({
      id: sqliteClassStartingEquipment.id,
      system: sqliteClassStartingEquipment.system,
      classId: sqliteClassStartingEquipment.classId,
      itemId: sqliteClassStartingEquipment.itemId,
      itemName: sqliteClassStartingEquipment.itemName,
      quantity: sqliteClassStartingEquipment.quantity,
      equipmentCategory: sqliteClassStartingEquipment.equipmentCategory,
      weight: sqliteClassStartingEquipment.weight,
      armorCategory: sqliteItems.armorCategory,
      acBase: sqliteItems.acBase,
      acDexBonus: sqliteItems.acDexBonus,
      acMaxDex: sqliteItems.acMaxDex,
      stealthDisadvantage: sqliteItems.stealthDisadvantage,
      strMinimum: sqliteItems.strMinimum,
      weaponCategory: sqliteItems.weaponCategory,
      weaponRange: sqliteItems.weaponRange,
      damageDiceCount: sqliteItems.damageDiceCount,
      damageDieType: sqliteItems.damageDieType,
      damageType: sqliteItems.damageType,
      properties: sqliteItems.properties,
      rangeNormal: sqliteItems.rangeNormal,
      rangeLong: sqliteItems.rangeLong,
      itemWeight: sqliteItems.weight,
      modifiersJson: sqliteItems.modifiersJson,
    })
    .from(sqliteClassStartingEquipment)
    .leftJoin(sqliteItems, eq(sqliteClassStartingEquipment.itemId, sqliteItems.id))
    .where(eq(sqliteClassStartingEquipment.system, system))
    .orderBy(asc(sqliteClassStartingEquipment.classId));
  return rows as ClassStartingEquipmentRow[];
}

export async function getAllClassStartingEquipmentOptions(system = "dnd5e"): Promise<ClassStartingEquipmentOptionRow[]> {
  return anyDb
    .select()
    .from(sqliteClassStartingEquipmentOptions)
    .where(eq(sqliteClassStartingEquipmentOptions.system, system))
    .orderBy(asc(sqliteClassStartingEquipmentOptions.classId), asc(sqliteClassStartingEquipmentOptions.choiceIndex));
}

// ─── Spell search ─────────────────────────────────────────────────────────────

export async function searchSpells(
  params: SpellSearchParams,
): Promise<SpellRow[]> {
  const system = params.system ?? "dnd5e";

  if (params.classId) {
    const rows = await anyDb
      .select({ spell: sqliteSpells })
      .from(sqliteSpells)
      .innerJoin(
        sqliteClassSpells,
        eq(sqliteClassSpells.spellId, sqliteSpells.id),
      )
      .where(
        and(
          eq(sqliteSpells.system, system),
          eq(sqliteClassSpells.classId, params.classId),
          params.level !== undefined
            ? eq(sqliteSpells.level, params.level)
            : undefined,
          params.school ? eq(sqliteSpells.school, params.school) : undefined,
          params.name
            ? likeCI(sqliteSpells.name, `%${params.name}%`)
            : undefined,
        ),
      )
      .orderBy(asc(sqliteSpells.level), asc(sqliteSpells.name))
      .limit(60);
    return rows.map((r: { spell: SpellRow }) => r.spell);
  }

  return anyDb
    .select()
    .from(sqliteSpells)
    .where(
      and(
        eq(sqliteSpells.system, system),
        params.level !== undefined
          ? eq(sqliteSpells.level, params.level)
          : undefined,
        params.school ? eq(sqliteSpells.school, params.school) : undefined,
        params.name ? likeCI(sqliteSpells.name, `%${params.name}%`) : undefined,
      ),
    )
    .orderBy(asc(sqliteSpells.level), asc(sqliteSpells.name))
    .limit(60);
}

export async function getCantripsByClass(classId: string, system = "dnd5e"): Promise<SpellRow[]> {
  const rows = await anyDb
    .select({ spell: sqliteSpells })
    .from(sqliteSpells)
    .innerJoin(sqliteClassSpells, eq(sqliteClassSpells.spellId, sqliteSpells.id))
    .where(
      and(
        eq(sqliteSpells.system, system),
        eq(sqliteClassSpells.classId, classId),
        eq(sqliteSpells.level, 0),
      ),
    )
    .orderBy(asc(sqliteSpells.name));
  return rows.map((r: { spell: SpellRow }) => r.spell);
}
