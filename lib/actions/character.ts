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
    data: JSON.stringify(data),
  })

  return { id }
}

export async function saveCharacter(id: string, data: CharacterData): Promise<void> {
  await db
    .update(sqliteCharacters)
    .set({
      name: data.identity.name,
      data: JSON.stringify(data),
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
