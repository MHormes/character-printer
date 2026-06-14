"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { deleteAccountAction } from "@/lib/actions/user-settings"

export function DeleteAccountSection({ username }: { username: string }) {
  const [expanded, setExpanded] = useState(false)
  const [confirm, setConfirm] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)

    const result = await deleteAccountAction(confirm)

    if (result.success) {
      await signOut({ callbackUrl: "/login" })
    } else {
      setError(result.error ?? "Something went wrong.")
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="font-garamond text-sm text-muted-foreground">
        Permanently deletes your account and all characters. Cannot be undone.
      </p>

      {!expanded && (
        <Button
          type="button"
          variant="destructive"
          className="self-start"
          onClick={() => setExpanded(true)}
        >
          Delete Account
        </Button>
      )}

      {expanded && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <p className="text-sm text-destructive font-garamond">{error}</p>
          )}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="username-confirm"
              className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground"
            >
              Type <span className="text-foreground">{username}</span> to confirm
            </label>
            <Input
              id="username-confirm"
              name="username-confirm"
              type="text"
              autoComplete="off"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={username}
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              variant="destructive"
              disabled={pending || confirm !== username}
            >
              {pending ? "Deleting…" : "Confirm Delete"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => { setExpanded(false); setConfirm(""); setError(null) }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
