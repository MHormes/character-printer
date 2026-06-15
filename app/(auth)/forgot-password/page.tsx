import Link from "next/link"
import Image from "next/image"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-8 rounded-xl border border-border bg-card shadow-sm overflow-hidden">

      {/* Top band */}
      <div className="w-full bg-primary flex flex-col items-center gap-2 py-7 px-8">
        <Image src="/images/p2p-logo.png" alt="Print2Play" width={96} height={96} />
        <p className="font-garamond italic text-primary-foreground/70 text-sm mt-1">
          Forgot your password?
        </p>
      </div>

      {/* Ornament rule */}
      <div className="flex items-center gap-3 w-full px-8 -mt-2">
        <div className="h-px flex-1 bg-border" />
        <span className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
          Reset
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <ForgotPasswordForm />

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



