import { RegisterForm } from "@/components/auth/register-form"
import Link from "next/link"
import Image from "next/image"

export default function RegisterPage() {
  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-8 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="w-full bg-primary flex flex-col items-center gap-2 py-7 px-8">
        <Image src="/images/p2p-logo.png" alt="Print2Play" width={96} height={96} />
        <p className="font-garamond italic text-primary-foreground/70 text-sm mt-1">
          Join the forge
        </p>
      </div>

      <div className="flex items-center gap-3 w-full px-8 -mt-2">
        <div className="h-px flex-1 bg-border" />
        <span className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground">Register</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <RegisterForm />

      <div className="w-full border-t border-border px-8 py-4 text-center -mt-4">
        <p className="font-garamond text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground underline underline-offset-2 hover:text-foreground/80 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}



