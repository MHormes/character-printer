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
  sqliteLanguages,
  sqliteSubclasses,
  sqliteFeats,
} from "@/lib/db/schema";
import { eq, and, like, asc } from "drizzle-orm";

// Cast once — db is a union of SQLite/PG clients, TS can't call both signatures
const anyDb = db as any;

export type ClassRow = typeof sqliteClasses.$inferSelect;
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

export async function searchItems(params: ItemSearchParams): Promise<ItemRow[]> {
  const system = params.system ?? "dnd5e";
  return anyDb
    .select()
    .from(sqliteItems)
    .where(
      and(
        eq(sqliteItems.system, system),
        params.equipmentCategory
          ? eq(sqliteItems.equipmentCategory, params.equipmentCategory)
          : undefined,
        params.name ? like(sqliteItems.name, `%${params.name}%`) : undefined,
      ),
    )
    .orderBy(asc(sqliteItems.name))
    .limit(60);
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
        name ? like(sqliteFeats.name, `%${name}%`) : undefined,
      ),
    )
    .orderBy(asc(sqliteFeats.name))
    .limit(60);
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
            ? like(sqliteSpells.name, `%${params.name}%`)
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
        params.name ? like(sqliteSpells.name, `%${params.name}%`) : undefined,
      ),
    )
    .orderBy(asc(sqliteSpells.level), asc(sqliteSpells.name))
    .limit(60);
}
