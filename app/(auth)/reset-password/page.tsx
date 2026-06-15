import Link from "next/link"
import Image from "next/image"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-8 rounded-xl border border-border bg-card shadow-sm overflow-hidden">

      {/* Top band */}
      <div className="w-full bg-primary flex flex-col items-center gap-2 py-7 px-8">
        <Image src="/images/p2p-logo.png" alt="Print2Play" width={72} height={72} />
        <h1 className="font-cinzel text-xl font-bold tracking-widest uppercase text-primary-foreground mt-1">
          Print2Play
        </h1>
        <p className="font-garamond italic text-primary-foreground/70 text-sm">
          Set a new password
        </p>
      </div>

      {/* Ornament rule */}
      <div className="flex items-center gap-3 w-full px-8 -mt-2">
        <div className="h-px flex-1 bg-border" />
        <span className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
          New Password
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <ResetPasswordForm token={token ?? null} />

      <div className="w-full border-t border-border px-8 py-4 text-center">
        <p className="font-garamond text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link href="/login" className="text-foreground underline underline-offset-2 hover:text-foreground/80 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}



