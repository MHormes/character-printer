"use client"

import { useActionState, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { registerAction, type RegisterResult } from "@/lib/actions/register"
import { Check, X } from "lucide-react"

const RULES = [
  { label: "At least 8 characters",     test: (pw: string) => pw.length >= 8 },
  { label: "One uppercase letter",       test: (pw: string) => /[A-Z]/.test(pw) },
  { label: "One lowercase letter",       test: (pw: string) => /[a-z]/.test(pw) },
  { label: "One number",                 test: (pw: string) => /[0-9]/.test(pw) },
  { label: "One special character",      test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
]

export function RegisterForm() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [pending, startTransition] = useTransition()

  const [state, formAction] = useActionState<RegisterResult | null, FormData>(
    async (_prev, formData) => {
      const result = await registerAction(_prev, formData)
      if (result.success === true) {
        router.push("/login?registered=1")
      }
      return result
    },
    null
  )

  const allRulesPassed = RULES.every(r => r.test(password))
  const passwordsMatch = password.length > 0 && password === confirmPassword

  const error = state && state.success === false ? state : null

  return (
    <form action={formAction} className="w-full px-8 pb-8 flex flex-col gap-5" suppressHydrationWarning>
      {error && !error.field && (
        <p className="text-sm text-destructive text-center font-garamond">{error.error}</p>
      )}

      {/* Username */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="username" className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
          Username
        </label>
        <Input
          id="username"
          name="username"
          type="text"
          placeholder="Choose a name, adventurer"
          autoComplete="username"
          required
          aria-invalid={error?.field === "username"}
        />
        {error?.field === "username" && (
          <p className="text-xs text-destructive font-garamond">{error.error}</p>
        )}
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="your@email.com"
          autoComplete="email"
          required
          aria-invalid={error?.field === "email"}
        />
        {error?.field === "email" && (
          <p className="text-xs text-destructive font-garamond">{error.error}</p>
        )}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          aria-invalid={error?.field === "password"}
        />
        {password.length > 0 && (
          <ul className="flex flex-col gap-1 mt-1">
            {RULES.map(rule => {
              const ok = rule.test(password)
              return (
                <li key={rule.label} className={`flex items-center gap-1.5 text-xs font-garamond transition-colors ${ok ? "text-foreground" : "text-muted-foreground"}`}>
                  {ok
                    ? <Check className="w-3 h-3 text-foreground shrink-0" />
                    : <X className="w-3 h-3 text-muted-foreground shrink-0" />
                  }
                  {rule.label}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Confirm password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
          Confirm Password
        </label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          aria-invalid={error?.field === "confirmPassword" || (confirmPassword.length > 0 && !passwordsMatch)}
        />
        {confirmPassword.length > 0 && !passwordsMatch && (
          <p className="text-xs text-destructive font-garamond">Passwords do not match.</p>
        )}
        {error?.field === "confirmPassword" && (
          <p className="text-xs text-destructive font-garamond">{error.error}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full mt-1"
        size="lg"
        disabled={pending || !allRulesPassed || !passwordsMatch}
      >
        {pending ? "Creating account…" : "Create Account"}
      </Button>
    </form>
  )
}
