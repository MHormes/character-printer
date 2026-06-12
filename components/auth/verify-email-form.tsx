"use client"

import { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { resendVerificationAction } from "@/lib/actions/verify-email"
import { LogoutButton } from "@/components/auth/logout-button"

const COOLDOWN_MS = 60_000

interface Props {
  email: string
  lastSentAt: number | null
}

export function VerifyEmailForm({ email, lastSentAt }: Props) {
  const [pending, startTransition] = useTransition()
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(() =>
    lastSentAt && Date.now() < lastSentAt + COOLDOWN_MS ? lastSentAt + COOLDOWN_MS : null
  )
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!cooldownUntil) { setSecondsLeft(0); return }
    const tick = () => {
      const remaining = Math.ceil((cooldownUntil - Date.now()) / 1000)
      if (remaining <= 0) { setSecondsLeft(0); setCooldownUntil(null) }
      else setSecondsLeft(remaining)
    }
    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [cooldownUntil])

  function handleResend() {
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const result = await resendVerificationAction()
      if (result.success === true) {
        setCooldownUntil(result.cooldownUntil)
        setMessage("Verification email sent! Check your inbox.")
      } else {
        if (result.cooldownUntil != null) setCooldownUntil(result.cooldownUntil)
        setError(result.error)
      }
    })
  }

  const onCooldown = cooldownUntil !== null && secondsLeft > 0

  return (
    <div className="w-full px-8 pb-8 flex flex-col gap-5 text-center">
      <p className="font-garamond text-sm text-muted-foreground leading-relaxed">
        A verification email was sent to{" "}
        <span className="text-foreground font-semibold">{email}</span>.
        Click the link in that email to activate your account.
      </p>

      {message && (
        <p className="text-sm text-foreground font-garamond bg-secondary rounded-md px-3 py-2">{message}</p>
      )}
      {error && (
        <p className="text-sm text-destructive font-garamond">{error}</p>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleResend}
        disabled={pending || onCooldown}
      >
        {pending
          ? "Sending…"
          : onCooldown
            ? `Resend in ${secondsLeft}s`
            : "Resend verification email"
        }
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <LogoutButton />
    </div>
  )
}
