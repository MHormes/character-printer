import { redirect } from "next/navigation"
import { Cinzel, EB_Garamond } from "next/font/google"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "600", "700"],
})

const garamond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-garamond",
  style: ["normal", "italic"],
})

async function loginAction() {
  "use server"
  redirect("/characters")
}

const D20Mini = () => (
  <svg
    viewBox="0 0 200 230"
    className="w-8 h-8 text-foreground"
    fill="none"
    stroke="currentColor"
    strokeWidth="6"
    strokeLinejoin="round"
  >
    <polygon points="100,5 195,57 195,173 100,225 5,173 5,57" />
    <polygon points="100,5 147,57 100,85 53,57" />
    <polygon points="195,57 147,57 100,85 195,173" />
    <polygon points="5,57 53,57 100,85 5,173" />
    <polygon points="100,85 147,57 195,173 100,225" />
    <polygon points="100,85 53,57 5,173 100,225" />
  </svg>
)

export default function LoginPage() {
  return (
    <div className={`${cinzel.variable} ${garamond.variable}`}>
      <div className="w-full max-w-sm flex flex-col items-center gap-8 rounded-xl border border-border bg-card shadow-sm overflow-hidden">

        {/* Top band */}
        <div className="w-full bg-primary flex flex-col items-center gap-2 py-7 px-8">
          <D20Mini />
          <h1 className="font-[family-name:var(--font-cinzel)] text-xl font-bold tracking-widest uppercase text-primary-foreground mt-1">
            Character Printer
          </h1>
          <p className="font-[family-name:var(--font-garamond)] italic text-primary-foreground/70 text-sm">
            Sign in to manage your characters
          </p>
        </div>

        {/* Ornament rule */}
        <div className="flex items-center gap-3 w-full px-8 -mt-2">
          <div className="h-px flex-1 bg-border" />
          <span className="font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            Enter
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Form */}
        <form action={loginAction} className="w-full px-8 pb-8 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="username"
              className="font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.3em] uppercase text-muted-foreground"
            >
              Username
            </label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Your name, adventurer"
              autoComplete="username"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.3em] uppercase text-muted-foreground"
            >
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full mt-1" size="lg">
            Enter the Forge
          </Button>
        </form>

        {/* Footer */}
        <div className="w-full border-t border-border px-8 py-4 text-center">
          <p className="font-[family-name:var(--font-garamond)] text-sm text-muted-foreground">
            No account?{" "}
            <Link
              href="/register"
              className="text-foreground underline underline-offset-2 hover:text-foreground/80 transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
