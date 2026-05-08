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
} from "@/lib/db/schema";
import { eq, and, like, asc } from "drizzle-orm";

// Cast once — db is a union of SQLite/PG clients, TS can't call both signatures
const anyDb = db as any;

export type ClassRow = typeof sqliteClasses.$inferSelect;
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
