"use server"

import { db } from "@/lib/db/client"
import { sqliteCharacters, sqliteClasses } from "@/lib/db/schema"
import { normalizeCanvasPages } from "@/lib/canvas/page-utils"
import { createDefaultCharacter } from "@/lib/character/defaults"
import type { CharacterData, AttributeKey } from "@/lib/types/character"
import { eq } from "drizzle-orm"
import { randomUUID } from "crypto"

const anyDb = db as any

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
    level: cls.level,
    hitDie: cls.hitDie,
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
    identity: {
      ...defaults.identity,
      ...data.identity,
      classes: hydratedClasses,
    },
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

export async function createCharacter(userId: string): Promise<{ id: string }> {
  const id = randomUUID()
  const data = createDefaultCharacter(id)

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
    .select({ data: sqliteCharacters.data, autoSave: sqliteCharacters.autoSave })
    .from(sqliteCharacters)
    .where(eq(sqliteCharacters.id, id))
    .limit(1)

  if (!rows[0]) return null
  return {
    data: await hydrateCharacter(id, rows[0].data as CharacterData),
    autoSave: rows[0].autoSave,
  }
}

export async function listAllCharacters(): Promise<{ id: string; name: string; updatedAt: Date | null }[]> {
  return anyDb
    .select({
      id: sqliteCharacters.id,
      name: sqliteCharacters.name,
      updatedAt: sqliteCharacters.updatedAt,
    })
    .from(sqliteCharacters)
    .orderBy(sqliteCharacters.updatedAt)
}

export async function deleteCharacter(id: string): Promise<void> {
  await anyDb.delete(sqliteCharacters).where(eq(sqliteCharacters.id, id))
}
