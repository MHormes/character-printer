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
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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

    if (result?.error) {
      setError("Invalid username or password.")
      setPending(false)
    } else {
      router.push(callbackUrl)
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full px-8 pb-8 flex flex-col gap-5" suppressHydrationWarning>
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

      <Button type="submit" className="w-full mt-1" size="lg" disabled={pending}>
        {pending ? "Entering…" : "Enter the Forge"}
      </Button>
    </form>
  )
}
