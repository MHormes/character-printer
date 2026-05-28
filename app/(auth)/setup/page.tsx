import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createUserAction } from "@/lib/actions/setup"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db/client"
import { sqliteUsers } from "@/lib/db/schema"
import { ne, count } from "drizzle-orm"

const STUB_USER_ID = "00000000-0000-0000-0000-000000000001"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any

const D20Mini = () => (
  <svg
    viewBox="0 0 200 230"
    className="w-8 h-8 text-primary-foreground"
    fill="none"
    stroke="currentColor"
    strokeWidth="6"
    strokeLinejoin="round"
  >
    <polygon points="100,5 195,57 195,173 100,225 5,173 5,57" />
    <polygon points="100,5 147,57 100,85 53,57" />
    <polygon points="195,57 147,57 100,85 195,173" />
    <polygon points="5,57 53,57 100,85 5,173" />
    <polygon points="100,85 147,57 195,173 100,225" />
    <polygon points="100,85 53,57 5,173 100,225" />
  </svg>
)

export default async function SetupPage() {
  const [session, realUsers] = await Promise.all([
    auth(),
    anyDb.select({ count: count() }).from(sqliteUsers).where(ne(sqliteUsers.id, STUB_USER_ID)),
  ])
  const existingCount: number = realUsers[0]?.count ?? 0

  // Bootstrap mode: no real users yet → open to anyone
  // Otherwise: require admin session
  if (existingCount > 0) {
    if (!session || session.user.role !== "admin") redirect("/login")
  }
  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-8 rounded-xl border border-border bg-card shadow-sm overflow-hidden">

      {/* Top band */}
      <div className="w-full bg-primary flex flex-col items-center gap-2 py-7 px-8">
        <D20Mini />
        <h1 className="font-cinzel text-xl font-bold tracking-widest uppercase text-primary-foreground mt-1">
          Character Printer
        </h1>
        <p className="font-garamond italic text-primary-foreground/70 text-sm">
          Create an account
        </p>
      </div>

      {/* Ornament rule */}
      <div className="flex items-center gap-3 w-full px-8 -mt-2">
        <div className="h-px flex-1 bg-border" />
        <span className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
          New Account
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Form */}
      <form action={createUserAction} className="w-full px-8 pb-8 flex flex-col gap-5" suppressHydrationWarning>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="username" className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            Username
          </label>
          <Input id="username" name="username" type="text" placeholder="Choose a name" autoComplete="username" required />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            Email
          </label>
          <Input id="email" name="email" type="email" placeholder="your@email.com" autoComplete="email" required />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            Password
          </label>
          <Input id="password" name="password" type="password" placeholder="••••••••" autoComplete="new-password" required />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="role" className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            Role
          </label>
          <select
            id="role"
            name="role"
            defaultValue="user"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <Button type="submit" className="w-full mt-1" size="lg">
          Create Account
        </Button>
      </form>
    </div>
  )
}
