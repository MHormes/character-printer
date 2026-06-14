"use client"

import { useActionState } from "react"
import { forgotPasswordAction } from "@/lib/actions/forgot-password"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, null)

  if (state?.success) {
    return (
      <div className="w-full px-8 pb-8 flex flex-col gap-5 text-center">
        <p className="text-sm text-foreground font-garamond bg-secondary rounded-md px-3 py-2">
          If that email is registered, a reset link is on its way. Check your inbox.
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
      {state && !state.success && (
        <p className="text-sm text-destructive text-center font-garamond">{state.error}</p>
      )}
      <p className="text-sm text-muted-foreground text-center font-garamond">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>
      <div className="flex flex-col gap-1.5" suppressHydrationWarning>
        <label
          htmlFor="email"
          className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground"
        >
          Email Address
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="your@email.com"
          autoComplete="email"
          autoFocus
          required
        />
      </div>
      <Button type="submit" className="w-full mt-1" size="lg" disabled={pending}>
        {pending ? "Sending…" : "Send Reset Link"}
      </Button>
      <Link
        href="/login"
        className="text-xs text-center text-muted-foreground hover:text-foreground transition-colors font-garamond"
      >
        ← Back to login
      </Link>
    </form>
  )
}
