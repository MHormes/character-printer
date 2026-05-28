import { getServerSession, type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db/client"
import { sqliteUsers } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

declare module "next-auth" {
  interface User {
    username?: string
    role?: "admin" | "user"
  }
  interface Session {
    user: {
      id: string
      username: string
      role: "admin" | "user"
    } & Pick<import("next-auth").DefaultSession["user"], "email" | "name" | "image">
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username?: string
    role?: "admin" | "user"
  }
}

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
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        const rows = await anyDb
          .select()
          .from(sqliteUsers)
          .where(eq(sqliteUsers.username, credentials.username))
          .limit(1)

        const user = rows[0]
        if (!user || !user.passwordHash) return null

        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          role: user.role,
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
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.username = token.username as string
      session.user.role = token.role as "admin" | "user"
      return session
    },
  },
}

export function auth() {
  return getServerSession(authOptions)
}
