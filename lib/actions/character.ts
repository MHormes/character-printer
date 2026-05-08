"use server"

import { db } from "@/lib/db/client"
import { sqliteCharacters } from "@/lib/db/schema"
import { createDefaultCharacter } from "@/lib/character/defaults"
import type { CharacterData } from "@/lib/types/character"
import { eq } from "drizzle-orm"
import { randomUUID } from "crypto"

const anyDb = db as any

function hydrateCharacter(id: string, data: CharacterData): CharacterData {
  const defaults = createDefaultCharacter(id)

  return {
    ...defaults,
    ...data,
    identity: { ...defaults.identity, ...data.identity },
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
    },
    canvas: { ...defaults.canvas, ...data.canvas },
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
    data: hydrateCharacter(id, rows[0].data as CharacterData),
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
