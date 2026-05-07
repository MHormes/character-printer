"use server"

import { db } from "@/lib/db/client"
import { sqliteCharacters } from "@/lib/db/schema"
import { createDefaultCharacter } from "@/lib/character/defaults"
import type { CharacterData } from "@/lib/types/character"
import { eq } from "drizzle-orm"
import { randomUUID } from "crypto"

export async function createCharacter(userId: string): Promise<{ id: string }> {
  const id = randomUUID()
  const data = createDefaultCharacter(id)

  await db.insert(sqliteCharacters).values({
    id,
    userId,
    name: "",
    autoSave: true,
    // @ts-expect-error drizzle union type, correct at runtime
    data,
  })

  return { id }
}

export async function saveCharacter(id: string, data: CharacterData, autoSave?: boolean): Promise<void> {
  await db
    .update(sqliteCharacters)
    // @ts-expect-error drizzle union type, correct at runtime
    .set({
      name: data.identity.name,
      data,
      ...(autoSave !== undefined ? { autoSave } : {}),
      updatedAt: new Date(),
    })
    .where(eq(sqliteCharacters.id, id))
}

export async function loadCharacter(id: string): Promise<{ data: CharacterData; autoSave: boolean } | null> {
  const rows = await db
    .select({ data: sqliteCharacters.data, autoSave: sqliteCharacters.autoSave })
    .from(sqliteCharacters)
    .where(eq(sqliteCharacters.id, id))
    .limit(1)

  if (!rows[0]) return null
  return {
    data: rows[0].data as CharacterData,
    autoSave: rows[0].autoSave,
  }
}

export async function listAllCharacters(): Promise<{ id: string; name: string; updatedAt: Date | null }[]> {
  return db
    .select({
      id: sqliteCharacters.id,
      name: sqliteCharacters.name,
      updatedAt: sqliteCharacters.updatedAt,
    })
    .from(sqliteCharacters)
    .orderBy(sqliteCharacters.updatedAt)
}

export async function deleteCharacter(id: string): Promise<void> {
  await db.delete(sqliteCharacters).where(eq(sqliteCharacters.id, id))
}
