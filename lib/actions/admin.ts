"use server"

import { db } from "@/lib/db/client"
import { dbUsers, dbCharacters } from "@/lib/db/tables"
import { eq, sql } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { randomUUID } from "crypto"
import { listAllCharacters } from "@/lib/actions/character"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Not authenticated")
  if (session.user.role !== "admin") throw new Error("Forbidden")
  return session
}

export type AdminUser = {
  id: string
  email: string
  username: string
  role: "admin" | "user"
  disabled: boolean
  emailVerified: boolean
  createdAt: Date | null
  characterCount: number
}

export async function listUsers(): Promise<AdminUser[]> {
  await requireAdmin()

  const users = await anyDb
    .select({
      id: dbUsers.id,
      email: dbUsers.email,
      username: dbUsers.username,
      role: dbUsers.role,
      disabled: dbUsers.disabled,
      emailVerified: dbUsers.emailVerified,
      createdAt: dbUsers.createdAt,
    })
    .from(dbUsers)
    .orderBy(dbUsers.createdAt)

  const counts: { userId: string; count: number }[] = await anyDb
    .select({ userId: dbCharacters.userId, count: sql<number>`count(*)` })
    .from(dbCharacters)
    .groupBy(dbCharacters.userId)

  const countMap = new Map(counts.map((c) => [c.userId, Number(c.count)]))

  return users.map((u: typeof users[number]) => ({
    id: u.id,
    email: u.email,
    username: u.username,
    role: u.role as "admin" | "user",
    disabled: !!u.disabled,
    emailVerified: !!u.emailVerified,
    createdAt: u.createdAt ?? null,
    characterCount: countMap.get(u.id) ?? 0,
  }))
}

export async function toggleUserDisabled(
  userId: string
): Promise<{ success: boolean; error?: string; disabled?: boolean }> {
  try {
    const session = await requireAdmin()
    if (session.user.id === userId)
      return { success: false, error: "Cannot disable your own account." }

    const rows = await anyDb
      .select({ disabled: dbUsers.disabled })
      .from(dbUsers)
      .where(eq(dbUsers.id, userId))
      .limit(1)

    if (!rows[0]) return { success: false, error: "User not found." }

    const newDisabled = !rows[0].disabled
    await anyDb.update(dbUsers).set({ disabled: newDisabled }).where(eq(dbUsers.id, userId))
    return { success: true, disabled: newDisabled }
  } catch {
    return { success: false, error: "Something went wrong." }
  }
}

export async function deleteUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireAdmin()
    if (session.user.id === userId)
      return { success: false, error: "Cannot delete your own account." }

    const rows = await anyDb
      .select({ disabled: dbUsers.disabled })
      .from(dbUsers)
      .where(eq(dbUsers.id, userId))
      .limit(1)

    if (!rows[0]) return { success: false, error: "User not found." }
    if (!rows[0].disabled)
      return { success: false, error: "Disable the account before deleting it." }

    await anyDb.delete(dbUsers).where(eq(dbUsers.id, userId))
    return { success: true }
  } catch {
    return { success: false, error: "Something went wrong." }
  }
}

export async function setUserRole(
  userId: string,
  role: "admin" | "user"
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireAdmin()
    if (session.user.id === userId && role === "user")
      return { success: false, error: "Cannot demote your own admin account." }

    await anyDb.update(dbUsers).set({ role }).where(eq(dbUsers.id, userId))
    return { success: true }
  } catch {
    return { success: false, error: "Something went wrong." }
  }
}

export async function listUserCharacters(userId: string) {
  await requireAdmin()
  return listAllCharacters(userId)
}

export async function copyCharacterToUser(
  characterId: string,
  targetUserId: string
): Promise<{ success: boolean; error?: string; newId?: string }> {
  try {
    await requireAdmin()

    const chars = await anyDb
      .select()
      .from(dbCharacters)
      .where(eq(dbCharacters.id, characterId))
      .limit(1)

    if (!chars[0]) return { success: false, error: "Character not found." }

    const targets = await anyDb
      .select({ id: dbUsers.id })
      .from(dbUsers)
      .where(eq(dbUsers.id, targetUserId))
      .limit(1)

    if (!targets[0]) return { success: false, error: "Target user not found." }

    const newId = randomUUID()
    const now = new Date()
    await anyDb.insert(dbCharacters).values({
      id: newId,
      userId: targetUserId,
      name: (chars[0].name || "Unnamed") + " (copy)",
      autoSave: true,
      data: chars[0].data,
      createdAt: now,
      updatedAt: now,
    })

    return { success: true, newId }
  } catch {
    return { success: false, error: "Something went wrong." }
  }
}
