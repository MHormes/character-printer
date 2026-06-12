"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  generateTotpSetupAction,
  enableTotpAction,
  disableTotpAction,
} from "@/lib/actions/user-settings"

type Props = { totpEnabled: boolean }

type SetupState = {
  qrDataUrl: string
  secret: string
}

export function TwoFactorSection({ totpEnabled }: Props) {
  const [enabled, setEnabled] = useState(totpEnabled)
  const [setup, setSetup] = useState<SetupState | null>(null)
  const [showDisable, setShowDisable] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function startSetup() {
    setPending(true)
    setError(null)
    const result = await generateTotpSetupAction()
    if (result.success && result.qrDataUrl && result.secret) {
      setSetup({ qrDataUrl: result.qrDataUrl, secret: result.secret })
    } else {
      setError(result.error ?? "Failed to generate setup.")
    }
    setPending(false)
  }

  async function handleEnable(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!setup) return
    setPending(true)
    setError(null)
    const code = (e.currentTarget.elements.namedItem("code") as HTMLInputElement).value
    const result = await enableTotpAction(setup.secret, code)
    if (result.success) {
      setEnabled(true)
      setSetup(null)
      setSuccess("Two-factor authentication enabled.")
    } else {
      setError(result.error ?? "Verification failed.")
    }
    setPending(false)
  }

  async function handleDisable(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const password = (e.currentTarget.elements.namedItem("password") as HTMLInputElement).value
    const result = await disableTotpAction(password)
    if (result.success) {
      setEnabled(false)
      setShowDisable(false)
      setSuccess("Two-factor authentication disabled.")
    } else {
      setError(result.error ?? "Something went wrong.")
    }
    setPending(false)
  }

  if (enabled) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-foreground" />
          <span className="font-garamond text-sm text-foreground">2FA is active on this account.</span>
        </div>

        {success && <p className="text-sm font-garamond text-foreground">{success}</p>}
        {error && <p className="text-sm text-destructive font-garamond">{error}</p>}

        {!showDisable ? (
          <Button variant="outline" className="self-start" onClick={() => { setShowDisable(true); setError(null); setSuccess(null) }}>
            Disable 2FA
          </Button>
        ) : (
          <form onSubmit={handleDisable} className="flex flex-col gap-4">
            <p className="font-garamond text-sm text-muted-foreground">
              Enter your password to confirm.
            </p>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="disable-password" className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                Password
              </label>
              <Input id="disable-password" name="password" type="password" placeholder="••••••••" autoComplete="current-password" required />
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="destructive" disabled={pending}>
                {pending ? "Disabling…" : "Confirm Disable"}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowDisable(false); setError(null) }}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    )
  }

  if (setup) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="font-garamond text-sm text-muted-foreground">
            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.).
          </p>
          <div className="w-48 h-48 rounded-lg border border-border bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={setup.qrDataUrl} alt="2FA QR code" className="w-full h-full" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            Manual Entry Key
          </span>
          <code className="font-mono text-sm bg-background border border-border rounded px-3 py-2 text-foreground tracking-widest select-all">
            {setup.secret.match(/.{1,4}/g)?.join(" ")}
          </code>
        </div>

        <form onSubmit={handleEnable} className="flex flex-col gap-4">
          {error && <p className="text-sm text-destructive font-garamond">{error}</p>}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="totp-verify" className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
              Verification Code
            </label>
            <Input
              id="totp-verify"
              name="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              autoComplete="one-time-code"
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Verifying…" : "Activate 2FA"}
            </Button>
            <Button type="button" variant="outline" onClick={() => { setSetup(null); setError(null) }}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-border" />
        <span className="font-garamond text-sm text-muted-foreground">2FA is not enabled.</span>
      </div>
      {success && <p className="text-sm font-garamond text-foreground">{success}</p>}
      {error && <p className="text-sm text-destructive font-garamond">{error}</p>}
      <p className="font-garamond text-sm text-muted-foreground">
        Add an extra layer of security by requiring an authenticator app code at login.
      </p>
      <Button className="self-start" onClick={startSetup} disabled={pending}>
        {pending ? "Generating…" : "Enable 2FA"}
      </Button>
    </div>
  )
}
