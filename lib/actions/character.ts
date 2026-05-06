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
    // @ts-expect-error drizzle union type, correct at runtime
    data,
  })

  return { id }
}

export async function saveCharacter(id: string, data: CharacterData): Promise<void> {
  await db
    .update(sqliteCharacters)
    // @ts-expect-error drizzle union type, correct at runtime
    .set({
      name: data.identity.name,
      data,
      updatedAt: new Date(),
    })
    .where(eq(sqliteCharacters.id, id))
}

export async function loadCharacter(id: string): Promise<CharacterData | null> {
  const rows = await db
    .select({ data: sqliteCharacters.data })
    .from(sqliteCharacters)
    .where(eq(sqliteCharacters.id, id))
    .limit(1)

  if (!rows[0]) return null
  return rows[0].data as CharacterData
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
