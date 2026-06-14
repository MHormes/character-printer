"use server"

import { db } from "@/lib/db/client"
import { dbCharacters, dbClasses, dbRaces } from "@/lib/db/tables"
import { createDefaultCharacter } from "@/lib/character/defaults"
import { eq } from "drizzle-orm"
import { randomUUID } from "crypto"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any

export async function createDemoCharacter(userId: string): Promise<{ id: string }> {
  const id = randomUUID()

  const [wizardRow] = await anyDb
    .select({ id: dbClasses.id })
    .from(dbClasses)
    .where(eq(dbClasses.name, "Wizard"))
    .limit(1)

  const [halfElfRow] = await anyDb
    .select({ id: dbRaces.id })
    .from(dbRaces)
    .where(eq(dbRaces.name, "Half-Elf"))
    .limit(1)

  const base = createDefaultCharacter(id, "2014", "player")

  const data = {
    ...base,
    identity: {
      ...base.identity,
      name: "Aria Brightblade",
      race: "Half-Elf",
      background: "Sage",
      alignment: "Neutral Good",
      classes: [
        {
          classId: wizardRow?.id ?? null,
          name: "Wizard",
          subclass: "",
          subclassId: null,
          level: 3,
          hitDie: "d6",
          ignoreAutomation: false,
        },
      ],
    },
    // Pre-dismiss one skill choice so the Revert step has something to show
    dismissedRaceChoiceKeys: halfElfRow?.id
      ? [`${halfElfRow.id}:skill`]
      : [],
    attributes: {
      ...base.attributes,
      str: {
        base: 14,
        stack: [
          {
            id: randomUUID(),
            source: "Gauntlets of Ogre Power",
            value: 4,
            isActive: true,
          },
        ],
        override: 18,
      },
      dex: { base: 14, stack: [], override: null },
      con: { base: 13, stack: [], override: null },
      int: { base: 16, stack: [], override: null },
      wis: { base: 12, stack: [], override: null },
      cha: { base: 10, stack: [], override: null },
    },
    characteristics: {
      personalityTraits: "I am always polite, even to my enemies.",
      ideals: "Knowledge. The path to power lies through knowing.",
      bonds: "I must find the ancient tome that holds the secrets of my lineage.",
      flaws: "I speak without thinking and often offend people.",
    },
  }

  await anyDb.insert(dbCharacters).values({
    id,
    userId,
    name: "Aria Brightblade",
    autoSave: true,
    data,
  })

  return { id }
}
