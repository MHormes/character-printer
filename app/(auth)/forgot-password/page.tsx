import Link from "next/link"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

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

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-8 rounded-xl border border-border bg-card shadow-sm overflow-hidden">

      {/* Top band */}
      <div className="w-full bg-primary flex flex-col items-center gap-2 py-7 px-8">
        <D20Mini />
        <h1 className="font-cinzel text-xl font-bold tracking-widest uppercase text-primary-foreground mt-1">
          Character Printer
        </h1>
        <p className="font-garamond italic text-primary-foreground/70 text-sm">
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
