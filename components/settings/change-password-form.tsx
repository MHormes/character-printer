"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { changePasswordAction } from "@/lib/actions/user-settings"

export function ChangePasswordForm() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    setSuccess(false)

    const form = e.currentTarget
    const current = (form.elements.namedItem("current") as HTMLInputElement).value
    const next = (form.elements.namedItem("next") as HTMLInputElement).value
    const confirm = (form.elements.namedItem("confirm") as HTMLInputElement).value

    if (next !== confirm) {
      setError("New passwords do not match.")
      setPending(false)
      return
    }

    const result = await changePasswordAction(current, next)

    if (result.success) {
      setSuccess(true)
      form.reset()
    } else {
      setError(result.error ?? "Something went wrong.")
    }
    setPending(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <p className="text-sm text-destructive font-garamond">{error}</p>
      )}
      {success && (
        <p className="text-sm text-foreground font-garamond">Password changed successfully.</p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="current" className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
          Current Password
        </label>
        <Input id="current" name="current" type="password" placeholder="••••••••" autoComplete="current-password" required />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="next" className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
          New Password
        </label>
        <Input id="next" name="next" type="password" placeholder="••••••••" autoComplete="new-password" required />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirm" className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
          Confirm New Password
        </label>
        <Input id="confirm" name="confirm" type="password" placeholder="••••••••" autoComplete="new-password" required />
      </div>

      <Button type="submit" className="self-start mt-1" disabled={pending}>
        {pending ? "Saving…" : "Change Password"}
      </Button>
    </form>
  )
}
