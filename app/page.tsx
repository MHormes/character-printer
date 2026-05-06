import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-8 py-4">
        <span className="font-semibold tracking-tight">Character Printer</span>
        <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Login
        </Link>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
        <div className="space-y-3">
          <h1 className="text-5xl font-semibold tracking-tight">Character Printer</h1>
          <p className="mx-auto max-w-md text-base text-muted-foreground">
            Build, manage, and print D&amp;D 5e character sheets. All your stats, spells, and gear — one place.
          </p>
        </div>
        <Link href="/login" className={buttonVariants({ size: "lg" })}>
          Get started
          <ArrowRight />
        </Link>
      </section>

      <footer className="border-t border-border px-8 py-4 text-center text-xs text-muted-foreground">
        Character Printer — D&amp;D 5e
      </footer>
    </main>
  )
}
