"use server"

import { db } from "@/lib/db/client"
import { dbUsers } from "@/lib/db/tables"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any

export type ResetPasswordResult =
  | { success: true }
  | { success: false; error: string; field?: "password" | "confirmPassword" }

function passwordStrength(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters."
  if (!/[A-Z]/.test(pw)) return "Password must contain an uppercase letter."
  if (!/[a-z]/.test(pw)) return "Password must contain a lowercase letter."
  if (!/[0-9]/.test(pw)) return "Password must contain a number."
  if (!/[^A-Za-z0-9]/.test(pw)) return "Password must contain a special character."
  return null
}

export async function resetPasswordAction(
  _prev: ResetPasswordResult | null,
  formData: FormData
): Promise<ResetPasswordResult> {
  const token = (formData.get("token") as string)?.trim()
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!token) return { success: false, error: "Invalid reset link." }

  const pwError = passwordStrength(password)
  if (pwError) return { success: false, error: pwError, field: "password" }

  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match.", field: "confirmPassword" }
  }

  const users = await anyDb
    .select({ id: dbUsers.id, passwordResetTokenExpiry: dbUsers.passwordResetTokenExpiry })
    .from(dbUsers)
    .where(eq(dbUsers.passwordResetToken, token))
    .limit(1)

  if (!users[0] || !users[0].passwordResetTokenExpiry || new Date(users[0].passwordResetTokenExpiry) < new Date()) {
    return { success: false, error: "This link has expired or is invalid." }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await anyDb
    .update(dbUsers)
    .set({ passwordHash, passwordResetToken: null, passwordResetTokenExpiry: null })
    .where(eq(dbUsers.id, users[0].id))

  return { success: true }
}
