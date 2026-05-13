import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Scroll, Printer, ArrowRight, LayoutGrid } from "lucide-react"

const OrnamentDivider = ({ flip = false }: { flip?: boolean }) => (
  <div className="flex items-center gap-4">
    <div className="h-px w-12 bg-primary-foreground/30" />
    <svg
      viewBox="0 0 24 24"
      className={`w-4 h-4 text-primary-foreground/50 ${flip ? "-scale-x-100" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M3 3l18 18M3 3h6M3 3v6M15 3l6 6M21 3h-6M21 3v6" />
    </svg>
    <div className="h-px flex-1 bg-primary-foreground/30" />
    <svg
      viewBox="0 0 24 24"
      className={`w-4 h-4 text-primary-foreground/50 ${flip ? "" : "-scale-x-100"}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M3 3l18 18M3 3h6M3 3v6M15 3l6 6M21 3h-6M21 3v6" />
    </svg>
    <div className="h-px w-12 bg-primary-foreground/30" />
  </div>
)

const D20 = () => (
  <svg
    viewBox="0 0 200 230"
    className="w-full h-full"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="1"
  >
    <polygon points="100,5 195,57 195,173 100,225 5,173 5,57" fill="currentColor" stroke="none" />
    <polygon points="100,5 147,57 100,85 53,57" fill="none" strokeWidth="1.5" />
    <polygon points="195,57 147,57 100,85 195,173" fill="none" strokeWidth="1.5" />
    <polygon points="5,57 53,57 100,85 5,173" fill="none" strokeWidth="1.5" />
    <polygon points="100,85 147,57 195,173 100,225" fill="none" strokeWidth="1.5" />
    <polygon points="100,85 53,57 5,173 100,225" fill="none" strokeWidth="1.5" />
    <line x1="100" y1="225" x2="100" y2="85" strokeWidth="1.5" />
  </svg>
)

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Header */}
      <header className="flex items-center justify-between bg-primary px-8 py-4">
        <span className="font-cinzel text-xs tracking-[0.3em] uppercase font-semibold text-primary-foreground/80">
          Character Printer
        </span>
        <Link href="/login" className={buttonVariants({ variant: "secondary", size: "sm" })}>
          Sign In
        </Link>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 relative overflow-hidden bg-primary">

        {/* D20 watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.06]">
          <div className="w-[540px] h-[540px] text-primary-foreground">
            <D20 />
          </div>
        </div>

        <OrnamentDivider />

        <div className="mt-10 mb-6 space-y-4 relative">
          <p className="font-cinzel text-xs tracking-[0.4em] uppercase text-primary-foreground/50">
            D&amp;D 5e
          </p>
          <h1 className="font-cinzel text-6xl md:text-8xl font-black tracking-tight text-primary-foreground leading-none">
            Character<br />
            <span className="font-normal">Printer</span>
          </h1>
          <p className="font-garamond italic text-xl md:text-2xl text-primary-foreground/70 max-w-sm mx-auto leading-relaxed">
            Build your sheet, design your layout,<br />and print it for the table.
          </p>
        </div>

        <OrnamentDivider flip />

        <div className="mt-10 relative">
          <Link href="/login" className={buttonVariants({ variant: "secondary", size: "lg" })}>
            Start Building
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Feature row */}
      <section className="border-t border-border bg-card">
        <div className="max-w-3xl mx-auto px-8 py-14 grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            {
              icon: Scroll,
              title: "Build",
              desc: "Automate stats, class features, race traits, and proficiencies through an intuitive forge.",
            },
            {
              icon: LayoutGrid,
              title: "Template",
              desc: "Arrange your sheet with pre-built widget layouts or design your own from scratch.",
            },
            {
              icon: Printer,
              title: "Print",
              desc: "Generate a clean, print-ready character sheet for in-person play in one click.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center text-center gap-3">
              <div className="w-9 h-9 rounded-full border border-border bg-background flex items-center justify-center">
                <Icon className="w-4 h-4 text-foreground" />
              </div>
              <h3 className="font-cinzel text-xs font-semibold tracking-[0.3em] uppercase text-foreground">
                {title}
              </h3>
              <p className="font-garamond text-sm text-muted-foreground leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-8 py-4 text-center">
        <span className="font-cinzel text-[10px] tracking-[0.35em] uppercase text-muted-foreground">
          Character Printer &mdash; D&amp;D 5e
        </span>
      </footer>
    </div>
  )
}
