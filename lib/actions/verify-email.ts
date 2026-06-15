"use server"

import { db } from "@/lib/db/client"
import { dbUsers } from "@/lib/db/tables"
import { eq } from "drizzle-orm"
import { randomBytes } from "crypto"
import { sendEmail } from "@/lib/email"
import { resendVerificationEmail } from "@/lib/email/templates"
import { auth } from "@/lib/auth"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any

const RESEND_COOLDOWN_MS = 60_000

export type VerifyResult =
  | { success: true }
  | { success: false; error: string }

export async function verifyTokenAction(token: string): Promise<VerifyResult> {
  if (!token) return { success: false, error: "No token provided." }

  const rows = await anyDb
    .select()
    .from(dbUsers)
    .where(eq(dbUsers.verificationToken, token))
    .limit(1)

  const user = rows[0]
  if (!user) return { success: false, error: "Invalid or expired verification link." }

  const expiry = user.verificationTokenExpiry
  if (!expiry || new Date(expiry) < new Date()) {
    return { success: false, error: "This verification link has expired. Please request a new one." }
  }

  await anyDb
    .update(dbUsers)
    .set({
      emailVerified: new Date(),
      verificationToken: null,
      verificationTokenExpiry: null,
    })
    .where(eq(dbUsers.id, user.id))

  return { success: true }
}

export type ResendResult =
  | { success: true; cooldownUntil: number }
  | { success: false; error: string; cooldownUntil?: number }

export async function resendVerificationAction(): Promise<ResendResult> {
  const session = await auth()
  if (!session) return { success: false, error: "Not signed in." }

  const rows = await anyDb
    .select()
    .from(dbUsers)
    .where(eq(dbUsers.id, session.user.id))
    .limit(1)

  const user = rows[0]
  if (!user) return { success: false, error: "User not found." }
  if (user.emailVerified) return { success: false, error: "Email is already verified." }

  const lastSent = user.emailVerificationSentAt
  if (lastSent) {
    const elapsed = Date.now() - new Date(lastSent).getTime()
    if (elapsed < RESEND_COOLDOWN_MS) {
      const cooldownUntil = new Date(lastSent).getTime() + RESEND_COOLDOWN_MS
      return { success: false, error: "Please wait before requesting another email.", cooldownUntil }
    }
  }

  const verificationToken = randomBytes(32).toString("hex")
  const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const now = new Date()

  await anyDb
    .update(dbUsers)
    .set({ verificationToken, verificationTokenExpiry, emailVerificationSentAt: now })
    .where(eq(dbUsers.id, user.id))

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
  const verifyUrl = `${baseUrl}/verify?token=${verificationToken}`

  await sendEmail({
    to: user.email,
    subject: "Verify your Print 2 Play account",
    html: resendVerificationEmail(user.username || user.name || "Adventurer", verifyUrl),
  })

  return { success: true, cooldownUntil: now.getTime() + RESEND_COOLDOWN_MS }
}
