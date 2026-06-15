"use server"

import { db } from "@/lib/db/client"
import { dbUsers, dbCharacters } from "@/lib/db/tables"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"
import { TOTP, Secret } from "otpauth"
import QRCode from "qrcode"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any

async function getAuthedUser() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Not authenticated")

  const rows = await anyDb
    .select()
    .from(dbUsers)
    .where(eq(dbUsers.id, session.user.id))
    .limit(1)

  const user = rows[0]
  if (!user) throw new Error("User not found")
  return user
}

export async function changePasswordAction(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getAuthedUser()

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) return { success: false, error: "Current password is incorrect." }

    if (newPassword.length < 8)
      return { success: false, error: "New password must be at least 8 characters." }

    const passwordHash = await bcrypt.hash(newPassword, 12)
    await anyDb
      .update(dbUsers)
      .set({ passwordHash })
      .where(eq(dbUsers.id, user.id))

    return { success: true }
  } catch {
    return { success: false, error: "Something went wrong. Please try again." }
  }
}

export async function generateTotpSetupAction(): Promise<{
  success: boolean
  secret?: string
  uri?: string
  qrDataUrl?: string
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Not authenticated" }

    const secret = new Secret({ size: 20 })
    const totp = new TOTP({
      issuer: "Print 2 Play",
      label: session.user.username ?? session.user.email ?? "user",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret,
    })

    const uri = totp.toString()
    const qrDataUrl = await QRCode.toDataURL(uri)

    return {
      success: true,
      secret: secret.base32,
      uri,
      qrDataUrl,
    }
  } catch {
    return { success: false, error: "Failed to generate 2FA setup." }
  }
}

export async function enableTotpAction(
  secretBase32: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getAuthedUser()

    const totp = new TOTP({
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: Secret.fromBase32(secretBase32),
    })

    const delta = totp.validate({ token: code, window: 1 })
    if (delta === null) return { success: false, error: "Invalid verification code." }

    await anyDb
      .update(dbUsers)
      .set({ totpSecret: secretBase32, totpEnabled: true })
      .where(eq(dbUsers.id, user.id))

    return { success: true }
  } catch {
    return { success: false, error: "Failed to enable 2FA." }
  }
}

export async function disableTotpAction(
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getAuthedUser()

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return { success: false, error: "Incorrect password." }

    await anyDb
      .update(dbUsers)
      .set({ totpSecret: null, totpEnabled: false })
      .where(eq(dbUsers.id, user.id))

    return { success: true }
  } catch {
    return { success: false, error: "Failed to disable 2FA." }
  }
}

export async function deleteAccountAction(
  usernameConfirm: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Not authenticated." }

    if (usernameConfirm !== session.user.username)
      return { success: false, error: "Username does not match." }

    await anyDb.delete(dbCharacters).where(eq(dbCharacters.userId, session.user.id))
    await anyDb.delete(dbUsers).where(eq(dbUsers.id, session.user.id))

    return { success: true }
  } catch {
    return { success: false, error: "Something went wrong. Please try again." }
  }
}
