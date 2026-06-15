import { verifyTokenAction } from "@/lib/actions/verify-email"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

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
        <Image src="/images/p2p-logo.png" alt="Print2Play" width={72} height={72} />
        <h1 className="font-cinzel text-xl font-bold tracking-widest uppercase text-primary-foreground mt-1">
          Print2Play
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



