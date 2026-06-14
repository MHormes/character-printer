"use server"

import { db } from "@/lib/db/client"
import { dbUsers } from "@/lib/db/tables"
import { eq } from "drizzle-orm"
import { randomBytes } from "crypto"
import { sendEmail } from "@/lib/email"
import { passwordResetEmail } from "@/lib/email/templates"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any

export type ForgotPasswordResult = { success: true } | { success: false; error: string }

export async function forgotPasswordAction(
  _prev: ForgotPasswordResult | null,
  formData: FormData
): Promise<ForgotPasswordResult> {
  const email = (formData.get("email") as string)?.trim().toLowerCase()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Enter a valid email address." }
  }

  const users = await anyDb
    .select({ id: dbUsers.id, email: dbUsers.email, username: dbUsers.username })
    .from(dbUsers)
    .where(eq(dbUsers.email, email))
    .limit(1)

  // Always succeed to avoid email enumeration
  if (!users[0]) return { success: true }

  const token = randomBytes(32).toString("hex")
  const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await anyDb
    .update(dbUsers)
    .set({ passwordResetToken: token, passwordResetTokenExpiry: expiry })
    .where(eq(dbUsers.id, users[0].id))

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
  const resetUrl = `${baseUrl}/reset-password?token=${token}`

  try {
    await sendEmail({
      to: users[0].email,
      subject: "Reset your Character Printer password",
      html: passwordResetEmail(resetUrl),
    })
  } catch {
    // Silent — user can request again
  }

  return { success: true }
}
