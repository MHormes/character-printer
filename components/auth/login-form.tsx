"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/characters"
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "CredentialsSignin" ? "Invalid username or password." : null
  )
  const verified = searchParams.get("verified") === "1"
  const registered = searchParams.get("registered") === "1"
  const [pending, setPending] = useState(false)
  const [step, setStep] = useState<"credentials" | "totp">("credentials")
  const [savedUsername, setSavedUsername] = useState("")
  const [savedPassword, setSavedPassword] = useState("")

  async function handleCredentials(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const form = e.currentTarget
    const username = (form.elements.namedItem("username") as HTMLInputElement).value
    const password = (form.elements.namedItem("password") as HTMLInputElement).value

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
      callbackUrl,
    })

    if (result?.error === "2FA_REQUIRED") {
      setSavedUsername(username)
      setSavedPassword(password)
      setStep("totp")
      setPending(false)
    } else if (result?.error) {
      setError("Invalid username or password.")
      setPending(false)
    } else {
      router.push(callbackUrl)
      router.refresh()
    }
  }

  async function handleTotp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const form = e.currentTarget
    const totpCode = (form.elements.namedItem("totpCode") as HTMLInputElement).value

    const result = await signIn("credentials", {
      username: savedUsername,
      password: savedPassword,
      totpCode,
      redirect: false,
      callbackUrl,
    })

    if (result?.error) {
      setError("Invalid authenticator code.")
      setPending(false)
    } else {
      router.push(callbackUrl)
      router.refresh()
    }
  }

  if (step === "totp") {
    return (
      <form onSubmit={handleTotp} className="w-full px-8 pb-8 flex flex-col gap-5" suppressHydrationWarning>
        {error && (
          <p className="text-sm text-destructive text-center font-garamond">{error}</p>
        )}
        <p className="text-sm text-center font-garamond text-muted-foreground">
          Enter the 6-digit code from your authenticator app.
        </p>
        <div className="flex flex-col gap-1.5" suppressHydrationWarning>
          <label
            htmlFor="totpCode"
            className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground"
          >
            Authenticator Code
          </label>
          <Input
            id="totpCode"
            name="totpCode"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="000000"
            autoComplete="one-time-code"
            autoFocus
            required
          />
        </div>
        <Button type="submit" className="w-full mt-1" size="lg" disabled={pending}>
          {pending ? "Verifying…" : "Verify Code"}
        </Button>
        <button
          type="button"
          onClick={() => { setStep("credentials"); setError(null) }}
          className="text-xs text-center text-muted-foreground hover:text-foreground transition-colors font-garamond"
        >
          ← Back to login
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={handleCredentials} className="w-full px-8 pb-8 flex flex-col gap-5" suppressHydrationWarning>
      {verified && (
        <p className="text-sm text-foreground text-center font-garamond bg-secondary rounded-md px-3 py-2">
          Email verified! You can now sign in.
        </p>
      )}
      {registered && !verified && (
        <p className="text-sm text-muted-foreground text-center font-garamond bg-secondary rounded-md px-3 py-2">
          Account created. Check your email to verify before signing in.
        </p>
      )}
      {error && (
        <p className="text-sm text-destructive text-center font-garamond">{error}</p>
      )}
      <div className="flex flex-col gap-1.5" suppressHydrationWarning>
        <label
          htmlFor="username"
          className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground"
        >
          Username
        </label>
        <Input
          id="username"
          name="username"
          type="text"
          placeholder="Your name, adventurer"
          autoComplete="username"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5" suppressHydrationWarning>
        <label
          htmlFor="password"
          className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground"
        >
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </div>

      <div className="text-right -mt-2">
        <a
          href="/forgot-password"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors font-garamond"
        >
          Forgot password?
        </a>
      </div>

      <Button type="submit" className="w-full mt-1" size="lg" disabled={pending}>
        {pending ? "Entering…" : "Enter the Forge"}
      </Button>
    </form>
  )
}
