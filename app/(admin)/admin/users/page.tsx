export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { Shield } from "lucide-react"
import {
  listUsers,
  toggleUserDisabled,
  deleteUser,
  setUserRole,
  listUserCharacters,
  copyCharacterToUser,
} from "@/lib/actions/admin"
import { UsersTable } from "@/components/admin/users-table"

export default async function AdminUsersPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const users = await listUsers()

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between bg-primary px-8 py-4">
        <Link
          href="/characters"
          className="font-cinzel text-xs tracking-[0.3em] uppercase font-semibold text-primary-foreground/80 hover:text-primary-foreground transition-colors"
        >
          ← Characters
        </Link>
        <div className="flex items-center gap-2">
          <Shield className="size-3.5 text-primary-foreground/70" />
          <span className="font-cinzel text-xs tracking-[0.3em] uppercase font-semibold text-primary-foreground/80">
            Admin
          </span>
        </div>
      </header>

      <main className="px-8 py-10 max-w-screen-2xl mx-auto">
        <div className="mb-10">
          <h1 className="font-cinzel text-5xl md:text-6xl font-black tracking-tight text-foreground mb-4">
            User Management
          </h1>
          <div className="flex items-center gap-3">
            <div className="h-px w-10 bg-border" />
            <span className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
              {users.length} {users.length === 1 ? "user" : "users"}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
        </div>

        <UsersTable
          initialUsers={users}
          currentUserId={session.user.id}
          actions={{
            toggleDisabled: toggleUserDisabled,
            deleteUser,
            setRole: setUserRole,
            listCharacters: listUserCharacters,
            copyCharacter: copyCharacterToUser,
          }}
        />
      </main>
    </div>
  )
}
