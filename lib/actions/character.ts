"use server"

import { db } from "@/lib/db/client"
import { sqliteCharacters, sqliteClasses } from "@/lib/db/schema"
import { normalizeCanvasPages } from "@/lib/canvas/page-utils"
import { createDefaultCharacter } from "@/lib/character/defaults"
import type { CharacterData, AttributeKey, Edition } from "@/lib/types/character"
import { eq, sql } from "drizzle-orm"
import { randomUUID } from "crypto"

const anyDb = db as any

// Drizzle returns timestamps as raw strings when using SQLite schema over PostgreSQL.
// SQLite's integer({ mode: "timestamp" }) mapper expects numbers, not strings → NaN.
function toDate(v: unknown): Date | null {
  if (!v) return null
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v
  if (typeof v === "number") return new Date(v * 1000)
  if (typeof v === "string") return new Date(v.replace(" ", "T"))
  return null
}

async function hydrateCharacter(id: string, data: CharacterData): Promise<CharacterData> {
  const defaults = createDefaultCharacter(id)
  const dbClasses = await anyDb
    .select({
      id: sqliteClasses.id,
      name: sqliteClasses.name,
    })
    .from(sqliteClasses)

  const classIdByName = new Map(
    dbClasses.map((dbClass: { id: string; name: string }) => [
      dbClass.name.trim().toLowerCase(),
      dbClass.id,
    ]),
  )
  const hydratedClasses = (data.identity?.classes ?? defaults.identity.classes).map((cls) => ({
    classId: (cls.classId ?? classIdByName.get(cls.name.trim().toLowerCase()) ?? null) as string | null,
    name: cls.name,
    subclass: cls.subclass,
    subclassId: cls.subclassId ?? null,
    level: cls.level,
    hitDie: cls.hitDie,
    ignoreAutomation: cls.ignoreAutomation ?? false,
  }))

  const normalizedPages = normalizeCanvasPages(
    data.canvas?.pages,
    data.canvas && "cols" in data.canvas && typeof data.canvas.cols === "number"
      ? data.canvas.cols
      : defaults.canvas.pages[0].cols,
  )

  return {
    ...defaults,
    ...data,
    edition: data.edition ?? "2014",
    selectionIgnores: {
      race: data.selectionIgnores?.race ?? defaults.selectionIgnores!.race,
      background: data.selectionIgnores?.background ?? defaults.selectionIgnores!.background,
    },
    dismissedClassChoiceKeys: data.dismissedClassChoiceKeys ?? defaults.dismissedClassChoiceKeys,
    dismissedRaceChoiceKeys: data.dismissedRaceChoiceKeys ?? defaults.dismissedRaceChoiceKeys,
    dismissedEquipmentChoiceKeys: data.dismissedEquipmentChoiceKeys ?? defaults.dismissedEquipmentChoiceKeys,
    automationKeys: data.automationKeys,
    identity: {
      ...defaults.identity,
      ...data.identity,
      classes: hydratedClasses,
    },
    portraitImage: data.portraitImage ?? defaults.portraitImage,
    attributes: { ...defaults.attributes, ...data.attributes },
    saves: { ...defaults.saves, ...data.saves },
    skills: { ...defaults.skills, ...data.skills },
    passivePerception: {
      ...defaults.passivePerception,
      ...data.passivePerception,
    },
    combat: {
      ...defaults.combat,
      ...data.combat,
      ac: { ...defaults.combat.ac, ...data.combat?.ac },
      initiative: {
        ...defaults.combat.initiative,
        ...data.combat?.initiative,
      },
      speed: { ...defaults.combat.speed, ...data.combat?.speed },
      hp: { ...defaults.combat.hp, ...data.combat?.hp },
    },
    spells: {
      ...defaults.spells,
      ...data.spells,
      slots: { ...defaults.spells.slots, ...data.spells?.slots },
      list: (data.spells?.list ?? []).map(s => {
        const raw = s as typeof s & { attackStat?: AttributeKey | null; castingStat?: AttributeKey | null }
        const castingStat = s.mode === "Attack" ? (raw.attackStat ?? null) : (raw.castingStat ?? null)
        const mode = s.mode === "Attack" ? ("Spell" as const) : s.mode
        return { ...s, mode, castingStat }
      }),
    },
    canvas: {
      ...defaults.canvas,
      ...data.canvas,
      pages: normalizedPages,
    },
  }
}

export async function createCharacter(userId: string, edition: Edition = "2014"): Promise<{ id: string }> {
  const id = randomUUID()
  const data = createDefaultCharacter(id, edition)

  await anyDb.insert(sqliteCharacters).values({
    id,
    userId,
    name: "",
    autoSave: true,
    data,
  })

  return { id }
}

export async function saveCharacter(id: string, data: CharacterData, autoSave?: boolean): Promise<void> {
  await anyDb
    .update(sqliteCharacters)
    .set({
      name: data.identity.name,
      data,
      ...(autoSave !== undefined ? { autoSave } : {}),
      updatedAt: new Date(),
    })
    .where(eq(sqliteCharacters.id, id))
}

export async function loadCharacter(id: string): Promise<{ data: CharacterData; autoSave: boolean } | null> {
  const rows = await anyDb
    .select({ rawData: sql<string>`${sqliteCharacters.data}`, autoSave: sqliteCharacters.autoSave })
    .from(sqliteCharacters)
    .where(eq(sqliteCharacters.id, id))
    .limit(1)

  if (!rows[0]) return null
  let parsed: CharacterData
  try {
    parsed = (typeof rows[0].rawData === "string" ? JSON.parse(rows[0].rawData) : rows[0].rawData) as CharacterData
  } catch {
    parsed = {} as CharacterData
  }
  return {
    data: await hydrateCharacter(id, parsed),
    autoSave: rows[0].autoSave,
  }
}

export type CharacterSummary = {
  id: string
  name: string
  updatedAt: Date | null
  system: string
  edition: Edition
  race: string
  classLabels: string
  level: number
}

export async function listAllCharacters(): Promise<CharacterSummary[]> {
  const rows = await anyDb
    .select({
      id: sqliteCharacters.id,
      name: sqliteCharacters.name,
      updatedAt: sqliteCharacters.updatedAt,
      createdAt: sqliteCharacters.createdAt,
      rawData: sql<string>`${sqliteCharacters.data}`,
    })
    .from(sqliteCharacters)

  return rows
    .map((row: any) => {
      let data: Partial<CharacterData> = {}
      try {
        data = (typeof row.rawData === "string" ? JSON.parse(row.rawData) : row.rawData) as Partial<CharacterData>
      } catch {
        // corrupted row — skip parsing, return defaults
      }
      const srdKey = data.automationKeys?.srdClassKey ?? data.identity?.classes?.[0]?.classId
      const system = srdKey ? (srdKey.split(":")[0] ?? "dnd5e") : "dnd5e"
      const classLabels =
        data.identity?.classLabels ||
        data.identity?.classes?.filter((c) => c.name).map((c) => c.name).join(" / ") ||
        ""
      return {
        id: row.id,
        name: row.name,
        updatedAt: toDate(row.updatedAt) ?? toDate(row.createdAt),
        system,
        edition: (data.edition ?? "2014") as Edition,
        race: data.identity?.race ?? "",
        classLabels,
        level: data.identity?.level ?? 1,
      }
    })
    .sort((a: CharacterSummary, b: CharacterSummary) =>
      (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0),
    )
}

export async function deleteCharacter(id: string): Promise<void> {
  await anyDb.delete(sqliteCharacters).where(eq(sqliteCharacters.id, id))
}
