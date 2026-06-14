import { getServerSession, type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db/client"
import { dbUsers } from "@/lib/db/tables"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { TOTP, Secret } from "otpauth"


// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "Authenticator Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        const rows = await anyDb
          .select()
          .from(dbUsers)
          .where(eq(dbUsers.username, credentials.username))
          .limit(1)

        const user = rows[0]
        if (!user || !user.passwordHash) return null

        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) return null

        if (user.totpEnabled) {
          if (!credentials.totpCode) throw new Error("2FA_REQUIRED")
          const totp = new TOTP({
            algorithm: "SHA1",
            digits: 6,
            period: 30,
            secret: Secret.fromBase32(user.totpSecret!),
          })
          const delta = totp.validate({ token: credentials.totpCode, window: 1 })
          if (delta === null) return null
        }

        if (user.disabled) throw new Error("ACCOUNT_DISABLED")

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          role: user.role,
          emailVerified: !!user.emailVerified,
          disabled: false,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.role = user.role
        token.disabled = false
        const loginRows = await anyDb
          .select({ emailVerified: dbUsers.emailVerified })
          .from(dbUsers)
          .where(eq(dbUsers.id, user.id as string))
          .limit(1)
        token.emailVerified = !!loginRows[0]?.emailVerified
      } else if ((!token.emailVerified || token.disabled) && token.id) {
        const rows = await anyDb
          .select({ emailVerified: dbUsers.emailVerified, disabled: dbUsers.disabled })
          .from(dbUsers)
          .where(eq(dbUsers.id, token.id as string))
          .limit(1)
        token.emailVerified = !!rows[0]?.emailVerified
        token.disabled = !!rows[0]?.disabled
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.username = token.username as string
      session.user.role = token.role as "admin" | "user"
      session.user.emailVerified = token.emailVerified as boolean
      session.user.disabled = token.disabled as boolean
      return session
    },
  },
}

export function auth() {
  return getServerSession(authOptions)
}
