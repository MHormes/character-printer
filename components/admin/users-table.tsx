"use client"

import { useState, useTransition, Fragment } from "react"
import { ChevronDown, ChevronRight, UserX, UserCheck, Shield, User, Trash2, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { CopyCharacterModal } from "@/components/admin/copy-character-modal"
import type { AdminUser } from "@/lib/actions/admin"
import type { CharacterSummary } from "@/lib/actions/character"

type Actions = {
  toggleDisabled: (userId: string) => Promise<{ success: boolean; error?: string; disabled?: boolean }>
  deleteUser: (userId: string) => Promise<{ success: boolean; error?: string }>
  setRole: (userId: string, role: "admin" | "user") => Promise<{ success: boolean; error?: string }>
  listCharacters: (userId: string) => Promise<CharacterSummary[]>
  copyCharacter: (characterId: string, targetUserId: string) => Promise<{ success: boolean; error?: string; newId?: string }>
}

type ConfirmState =
  | { type: "disable"; userId: string }
  | { type: "enable"; userId: string }
  | { type: "delete"; userId: string }
  | { type: "role"; userId: string; newRole: "admin" | "user" }

type CopyTarget = { characterId: string; charName: string; ownerId: string }

function RoleBadge({ role }: { role: "admin" | "user" }) {
  return (
    <span
      className={`font-cinzel text-[10px] tracking-[0.2em] uppercase px-2 py-0.5 rounded border ${
        role === "admin"
          ? "bg-primary/10 text-primary border-primary/30"
          : "bg-muted text-muted-foreground border-border"
      }`}
    >
      {role}
    </span>
  )
}

function StatusBadge({ disabled }: { disabled: boolean }) {
  return (
    <span
      className={`font-cinzel text-[10px] tracking-[0.2em] uppercase px-2 py-0.5 rounded border ${
        disabled
          ? "bg-destructive/10 text-destructive border-destructive/30"
          : "bg-secondary text-secondary-foreground border-transparent"
      }`}
    >
      {disabled ? "Disabled" : "Active"}
    </span>
  )
}

function formatDate(date: Date | null) {
  if (!date) return "—"
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(date)
}

export function UsersTable({
  initialUsers,
  currentUserId,
  actions,
}: {
  initialUsers: AdminUser[]
  currentUserId: string
  actions: Actions
}) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [charCache, setCharCache] = useState<Record<string, CharacterSummary[]>>({})
  const [loadingChars, setLoadingChars] = useState<Set<string>>(new Set())
  const [copyTarget, setCopyTarget] = useState<CopyTarget | null>(null)
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function toggleExpand(userId: string) {
    if (expanded.has(userId)) {
      setExpanded((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    } else {
      setExpanded((prev) => new Set(prev).add(userId))
      if (!charCache[userId]) {
        setLoadingChars((s) => new Set(s).add(userId))
        actions.listCharacters(userId).then((chars) => {
          setCharCache((c) => ({ ...c, [userId]: chars }))
          setLoadingChars((s) => {
            const n = new Set(s)
            n.delete(userId)
            return n
          })
        })
      }
    }
  }

  function handleConfirm() {
    if (!confirmState) return
    setError(null)
    startTransition(async () => {
      if (confirmState.type === "disable" || confirmState.type === "enable") {
        const result = await actions.toggleDisabled(confirmState.userId)
        if (result.success) {
          setUsers((prev) =>
            prev.map((u) =>
              u.id === confirmState.userId ? { ...u, disabled: result.disabled! } : u
            )
          )
        } else {
          setError(result.error ?? "Something went wrong.")
        }
      } else if (confirmState.type === "delete") {
        const result = await actions.deleteUser(confirmState.userId)
        if (result.success) {
          setUsers((prev) => prev.filter((u) => u.id !== confirmState.userId))
        } else {
          setError(result.error ?? "Something went wrong.")
        }
      } else if (confirmState.type === "role") {
        const result = await actions.setRole(confirmState.userId, confirmState.newRole)
        if (result.success) {
          setUsers((prev) =>
            prev.map((u) =>
              u.id === confirmState.userId ? { ...u, role: confirmState.newRole } : u
            )
          )
        } else {
          setError(result.error ?? "Something went wrong.")
        }
      }
      setConfirmState(null)
    })
  }

  function confirmTitle(state: ConfirmState | null) {
    if (!state) return ""
    if (state.type === "disable") return "Disable Account"
    if (state.type === "enable") return "Enable Account"
    if (state.type === "delete") return "Delete Account"
    return state.newRole === "admin" ? "Promote to Admin" : "Demote to User"
  }

  function confirmDescription(state: ConfirmState | null) {
    if (!state) return ""
    const u = users.find((u) => u.id === state.userId)
    const name = u?.username ?? "this user"
    if (state.type === "disable") return `${name} will not be able to log in.`
    if (state.type === "enable") return `${name} will be able to log in again.`
    if (state.type === "delete") return `Permanently delete ${name} and all their characters.`
    return state.newRole === "admin"
      ? `Grant ${name} admin access.`
      : `Remove admin access from ${name}.`
  }

  return (
    <>
      {error && (
        <div className="mb-4 px-4 py-2.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm font-garamond italic">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="w-10 px-4 py-3" />
              <th className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground text-left px-4 py-3">
                User
              </th>
              <th className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground text-left px-4 py-3">
                Role
              </th>
              <th className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground text-left px-4 py-3">
                Status
              </th>
              <th className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground text-left px-4 py-3">
                Characters
              </th>
              <th className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground text-left px-4 py-3">
                Joined
              </th>
              <th className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground text-left px-4 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = user.id === currentUserId
              const isExpanded = expanded.has(user.id)

              return (
                <Fragment key={user.id}>
                  <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleExpand(user.id)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={isExpanded ? "Collapse" : "Expand"}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-cinzel text-sm font-semibold text-foreground">
                        {user.username}
                        {isSelf && (
                          <span className="ml-2 font-cinzel text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-normal">
                            (you)
                          </span>
                        )}
                      </p>
                      <p className="font-garamond italic text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge disabled={user.disabled} />
                    </td>
                    <td className="px-4 py-3 font-cinzel text-sm text-foreground">
                      {user.characterCount}
                    </td>
                    <td className="px-4 py-3 font-garamond italic text-xs text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {isSelf ? null : (
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() =>
                              setConfirmState({
                                type: user.disabled ? "enable" : "disable",
                                userId: user.id,
                              })
                            }
                          >
                            {user.disabled ? (
                              <UserCheck className="w-3 h-3" />
                            ) : (
                              <UserX className="w-3 h-3" />
                            )}
                            {user.disabled ? "Enable" : "Disable"}
                          </Button>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() =>
                              setConfirmState({
                                type: "role",
                                userId: user.id,
                                newRole: user.role === "admin" ? "user" : "admin",
                              })
                            }
                          >
                            {user.role === "admin" ? (
                              <User className="w-3 h-3" />
                            ) : (
                              <Shield className="w-3 h-3" />
                            )}
                            {user.role === "admin" ? "Make User" : "Make Admin"}
                          </Button>
                          <Button
                            variant="destructive"
                            size="xs"
                            disabled={!user.disabled}
                            title={!user.disabled ? "Disable first" : "Delete account"}
                            onClick={() =>
                              setConfirmState({ type: "delete", userId: user.id })
                            }
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr key={`${user.id}-chars`} className="border-b border-border last:border-0 bg-muted/20">
                      <td />
                      <td colSpan={6} className="px-4 py-4">
                        {loadingChars.has(user.id) ? (
                          <p className="font-garamond italic text-sm text-muted-foreground">
                            Loading characters…
                          </p>
                        ) : !charCache[user.id] || charCache[user.id].length === 0 ? (
                          <p className="font-garamond italic text-sm text-muted-foreground">
                            No characters.
                          </p>
                        ) : (
                          <table className="w-full text-sm">
                            <thead>
                              <tr>
                                <th className="font-cinzel text-[9px] tracking-[0.25em] uppercase text-muted-foreground text-left pb-2 pr-4">
                                  Character
                                </th>
                                <th className="font-cinzel text-[9px] tracking-[0.25em] uppercase text-muted-foreground text-left pb-2 pr-4">
                                  Level
                                </th>
                                <th className="font-cinzel text-[9px] tracking-[0.25em] uppercase text-muted-foreground text-left pb-2 pr-4">
                                  Race / Class
                                </th>
                                <th className="font-cinzel text-[9px] tracking-[0.25em] uppercase text-muted-foreground text-left pb-2 pr-4">
                                  Updated
                                </th>
                                <th className="pb-2" />
                              </tr>
                            </thead>
                            <tbody>
                              {charCache[user.id].map((char) => (
                                <tr key={char.id} className="border-t border-border/50">
                                  <td className="py-2 pr-4 font-cinzel text-sm font-semibold text-foreground">
                                    {char.name || <span className="font-normal italic text-muted-foreground">Unnamed</span>}
                                  </td>
                                  <td className="py-2 pr-4 font-garamond text-xs text-muted-foreground">
                                    Lv {char.level}
                                  </td>
                                  <td className="py-2 pr-4 font-garamond italic text-xs text-muted-foreground">
                                    {[char.race, char.classLabels].filter(Boolean).join(" · ") || "—"}
                                  </td>
                                  <td className="py-2 pr-4 font-garamond italic text-xs text-muted-foreground">
                                    {formatDate(char.updatedAt)}
                                  </td>
                                  <td className="py-2">
                                    <Button
                                      variant="outline"
                                      size="xs"
                                      onClick={() =>
                                        setCopyTarget({
                                          characterId: char.id,
                                          charName: char.name || "Unnamed",
                                          ownerId: user.id,
                                        })
                                      }
                                    >
                                      <Copy className="w-3 h-3" />
                                      Copy
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={confirmState !== null}
        title={confirmTitle(confirmState)}
        description={confirmDescription(confirmState)}
        confirmLabel={pending ? "…" : confirmState?.type === "delete" ? "Delete" : "Confirm"}
        variant={confirmState?.type === "delete" ? "destructive" : "default"}
        pending={pending}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmState(null)}
      />

      {copyTarget && (
        <CopyCharacterModal
          characterId={copyTarget.characterId}
          charName={copyTarget.charName}
          ownerId={copyTarget.ownerId}
          users={users}
          copyAction={actions.copyCharacter}
          onClose={() => setCopyTarget(null)}
        />
      )}
    </>
  )
}
