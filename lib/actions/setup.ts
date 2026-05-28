"use server"

import { db } from "@/lib/db/client"
import { sqliteUsers, sqliteCharacters } from "@/lib/db/schema"
import { eq, ne, count } from "drizzle-orm"
import { randomUUID } from "crypto"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any
const STUB_USER_ID = "00000000-0000-0000-0000-000000000001"

export async function createUserAction(formData: FormData) {
  const username = (formData.get("username") as string)?.trim()
  const email = (formData.get("email") as string)?.trim()
  const password = formData.get("password") as string
  const role = (formData.get("role") as string) === "admin" ? "admin" : "user"

  if (!username || !email || !password) return

  // Count existing real users (excluding the stub)
  const realUsers = await anyDb
    .select({ count: count() })
    .from(sqliteUsers)
    .where(ne(sqliteUsers.id, STUB_USER_ID))

  const existingCount = realUsers[0]?.count ?? 0

  if (existingCount > 0) {
    // Already bootstrapped — require admin session
    const session = await auth()
    if (!session || session.user.role !== "admin") {
      redirect("/login")
    }
  }

  const id = randomUUID()
  const passwordHash = await bcrypt.hash(password, 12)

  await anyDb.insert(sqliteUsers).values({ id, email, username, passwordHash, role })

  // Migrate stub user's characters to this account (no-op after first run)
  await anyDb
    .update(sqliteCharacters)
    .set({ userId: id })
    .where(eq(sqliteCharacters.userId, STUB_USER_ID))

  redirect("/login")
}
