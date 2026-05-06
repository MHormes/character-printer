"use server"

import { db } from "@/lib/db/client"
import { sqliteUsers } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const STUB_USER_ID = "00000000-0000-0000-0000-000000000001"

export async function getOrCreateStubUser() {
  const existing = await db
    .select()
    .from(sqliteUsers)
    .where(eq(sqliteUsers.id, STUB_USER_ID))
    .limit(1)

  if (existing[0]) return existing[0]

  await db.insert(sqliteUsers).values({
    id: STUB_USER_ID,
    email: "stub@local",
    name: "Local User",
  })

  return { id: STUB_USER_ID, email: "stub@local", name: "Local User" }
}
