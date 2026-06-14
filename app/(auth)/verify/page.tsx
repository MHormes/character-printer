import { verifyTokenAction } from "@/lib/actions/verify-email"
import { redirect } from "next/navigation"
import Link from "next/link"

const D20Mini = () => (
  <svg
    viewBox="0 0 200 230"
    className="w-8 h-8 text-primary-foreground"
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

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) redirect("/login")

  const result = await verifyTokenAction(token)

  if (result.success === true) {
    redirect("/login?verified=1")
  }

  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-8 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="w-full bg-primary flex flex-col items-center gap-2 py-7 px-8">
        <D20Mini />
        <h1 className="font-cinzel text-xl font-bold tracking-widest uppercase text-primary-foreground mt-1">
          Character Printer
        </h1>
        <p className="font-garamond italic text-primary-foreground/70 text-sm">
          Email Verification
        </p>
      </div>

      <div className="flex items-center gap-3 w-full px-8 -mt-2">
        <div className="h-px flex-1 bg-border" />
        <span className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground">Error</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="px-8 pb-8 w-full flex flex-col gap-5 text-center">
        <p className="font-garamond text-destructive text-sm">{result.error}</p>
        <p className="font-garamond text-sm text-muted-foreground">
          Sign in to request a new verification email.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center h-10 px-6 rounded-md bg-primary text-primary-foreground font-cinzel text-xs tracking-widest uppercase hover:bg-primary/90 transition-colors"
        >
          Sign In
        </Link>
      </div>
    </div>
  )
}
