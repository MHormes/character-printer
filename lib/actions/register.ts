"use server"

import { db } from "@/lib/db/client"
import { dbUsers } from "@/lib/db/tables"
import { eq, or } from "drizzle-orm"
import { randomUUID, randomBytes } from "crypto"
import bcrypt from "bcryptjs"
import { sendEmail } from "@/lib/email"
import { verificationEmail } from "@/lib/email/templates"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any

export type RegisterResult =
  | { success: true }
  | { success: false; error: string; field?: "username" | "email" | "password" | "confirmPassword" }

const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/

function passwordStrength(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters."
  if (!/[A-Z]/.test(pw)) return "Password must contain an uppercase letter."
  if (!/[a-z]/.test(pw)) return "Password must contain a lowercase letter."
  if (!/[0-9]/.test(pw)) return "Password must contain a number."
  if (!/[^A-Za-z0-9]/.test(pw)) return "Password must contain a special character."
  return null
}

export async function registerAction(
  _prev: RegisterResult | null,
  formData: FormData
): Promise<RegisterResult> {
  const username = (formData.get("username") as string)?.trim()
  const email = (formData.get("email") as string)?.trim().toLowerCase()
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!USERNAME_RE.test(username)) {
    return { success: false, error: "Username must be 3–30 characters, letters/numbers/underscore only.", field: "username" }
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Enter a valid email address.", field: "email" }
  }

  const pwError = passwordStrength(password)
  if (pwError) return { success: false, error: pwError, field: "password" }

  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match.", field: "confirmPassword" }
  }

  // Check uniqueness
  const existing = await anyDb
    .select({ id: dbUsers.id, username: dbUsers.username, email: dbUsers.email })
    .from(dbUsers)
    .where(or(eq(dbUsers.username, username), eq(dbUsers.email, email)))
    .limit(1)

  if (existing[0]) {
    if (existing[0].username === username) {
      return { success: false, error: "That username is already taken.", field: "username" }
    }
    return { success: false, error: "An account with that email already exists.", field: "email" }
  }

  const id = randomUUID()
  const passwordHash = await bcrypt.hash(password, 12)
  const verificationToken = randomBytes(32).toString("hex")
  const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const now = new Date()

  await anyDb.insert(dbUsers).values({
    id,
    email,
    username,
    name: username,
    passwordHash,
    role: "user",
    verificationToken,
    verificationTokenExpiry,
    emailVerificationSentAt: now,
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
  const verifyUrl = `${baseUrl}/verify?token=${verificationToken}`

  try {
    await sendEmail({
      to: email,
      subject: "Verify your Print 2 Play account",
      html: verificationEmail(username, verifyUrl),
    })
  } catch {
    // Don't block registration if email fails — user can resend from /verify-email
  }

  return { success: true }
}
