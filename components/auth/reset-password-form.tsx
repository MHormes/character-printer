"use client"

import { useActionState } from "react"
import { resetPasswordAction } from "@/lib/actions/reset-password"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

interface Props {
  token: string | null
}

export function ResetPasswordForm({ token }: Props) {
  const [state, action, pending] = useActionState(resetPasswordAction, null)

  if (!token) {
    return (
      <div className="w-full px-8 pb-8 flex flex-col gap-5 text-center">
        <p className="text-sm text-destructive font-garamond">
          Invalid or missing reset link.
        </p>
        <Link
          href="/forgot-password"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors font-garamond"
        >
          Request a new link
        </Link>
      </div>
    )
  }

  if (state?.success) {
    return (
      <div className="w-full px-8 pb-8 flex flex-col gap-5 text-center">
        <p className="text-sm text-foreground font-garamond bg-secondary rounded-md px-3 py-2">
          Password updated! You can now sign in with your new password.
        </p>
        <Link
          href="/login"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors font-garamond"
        >
          ← Back to login
        </Link>
      </div>
    )
  }

  return (
    <form action={action} className="w-full px-8 pb-8 flex flex-col gap-5" suppressHydrationWarning>
      <input type="hidden" name="token" value={token} />
      {state && !state.success && (
        <p className="text-sm text-destructive text-center font-garamond">{state.error}</p>
      )}
      <div className="flex flex-col gap-1.5" suppressHydrationWarning>
        <label
          htmlFor="password"
          className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground"
        >
          New Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          autoFocus
          required
        />
      </div>
      <div className="flex flex-col gap-1.5" suppressHydrationWarning>
        <label
          htmlFor="confirmPassword"
          className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground"
        >
          Confirm Password
        </label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          required
        />
      </div>
      <Button type="submit" className="w-full mt-1" size="lg" disabled={pending}>
        {pending ? "Updating…" : "Set New Password"}
      </Button>
    </form>
  )
}
