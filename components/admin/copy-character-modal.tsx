"use client"

import { createPortal } from "react-dom"
import { useState, useTransition } from "react"
import { X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AdminUser } from "@/lib/actions/admin"

type Props = {
  characterId: string
  charName: string
  ownerId: string
  users: AdminUser[]
  copyAction: (
    characterId: string,
    targetUserId: string
  ) => Promise<{ success: boolean; error?: string; newId?: string }>
  onClose: () => void
}

export function CopyCharacterModal({
  characterId,
  charName,
  ownerId,
  users,
  copyAction,
  onClose,
}: Props) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const targets = users.filter((u) => u.id !== ownerId)
  const selectedUser = targets.find((u) => u.id === selectedUserId)

  function handleCopy() {
    if (!selectedUserId) return
    setError(null)
    startTransition(async () => {
      const result = await copyAction(characterId, selectedUserId)
      if (result.success) {
        setDone(true)
        setTimeout(onClose, 1200)
      } else {
        setError(result.error ?? "Something went wrong.")
      }
    })
  }

  if (typeof document === "undefined") return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 bg-card border border-border rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-cinzel font-bold text-lg text-foreground">Copy Character</h2>
            <p className="font-garamond italic text-sm text-muted-foreground mt-0.5">
              &ldquo;{charName}&rdquo;
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="flex items-center gap-2 text-sm font-cinzel text-foreground py-2">
            <Check className="w-4 h-4 text-primary" />
            Copied to {selectedUser?.username}
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {targets.length === 0 ? (
                <p className="font-garamond italic text-sm text-muted-foreground">
                  No other users to copy to.
                </p>
              ) : (
                targets.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                      selectedUserId === u.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:border-primary/50"
                    }`}
                  >
                    <p className="font-cinzel text-sm font-semibold text-foreground">
                      {u.username}
                    </p>
                    <p className="font-garamond italic text-xs text-muted-foreground">
                      {u.email}
                    </p>
                  </button>
                ))
              )}
            </div>

            {error && (
              <p className="text-xs text-destructive font-garamond italic">{error}</p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={pending}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleCopy}
                disabled={!selectedUserId || pending}
              >
                {pending
                  ? "Copying…"
                  : selectedUser
                  ? `Copy to ${selectedUser.username}`
                  : "Select a user"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
