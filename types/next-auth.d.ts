import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email?: string | null
      name?: string | null
      username: string
      role: "admin" | "user"
      emailVerified: boolean
      disabled: boolean
    }
  }
  interface User {
    id: string
    username: string
    role: "admin" | "user"
    emailVerified: boolean
    disabled: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    username: string
    role: "admin" | "user"
    emailVerified: boolean
    disabled: boolean
  }
}
