import Link from "next/link"
import Image from "next/image"
import { AppFooter } from "@/components/footer"

export const metadata = {
  title: "Terms of Use – Print2Play",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between bg-primary px-8 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/images/p2p-logo.png" alt="Print2Play" width={44} height={44} />
          <span className="font-cinzel text-xs tracking-[0.3em] uppercase font-semibold text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            Print2Play
          </span>
        </Link>
      </header>

      <main className="flex-1 px-8 py-14 max-w-2xl mx-auto w-full">
        <div className="mb-10">
          <p className="font-cinzel text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-3">
            Legal
          </p>
          <h1 className="font-cinzel text-4xl font-black tracking-tight text-foreground mb-4">
            Terms of Use
          </h1>
          <div className="flex items-center gap-3">
            <div className="h-px w-10 bg-border" />
            <span className="font-garamond italic text-sm text-muted-foreground">
              Last updated: 15 June 2025
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
        </div>

        <div className="space-y-8 font-garamond text-base text-foreground leading-relaxed">

          <section className="space-y-3">
            <h2 className="font-cinzel text-sm tracking-[0.25em] uppercase text-foreground font-semibold">
              1. Acceptance
            </h2>
            <p className="text-muted-foreground">
              By creating an account or using Print2Play (the &ldquo;Service&rdquo;), you agree to
              these Terms of Use. If you do not agree, do not use the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-cinzel text-sm tracking-[0.25em] uppercase text-foreground font-semibold">
              2. Description of Service
            </h2>
            <p className="text-muted-foreground">
              Print2Play is a free, browser-based D&amp;D 5e character sheet builder that lets
              you create characters, arrange a print layout, and generate printable sheets.
              The Service is provided as-is, free of charge, as a personal project.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-cinzel text-sm tracking-[0.25em] uppercase text-foreground font-semibold">
              3. Eligibility
            </h2>
            <p className="text-muted-foreground">
              You must be at least 13 years old to use the Service. By registering, you
              confirm that you meet this requirement.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-cinzel text-sm tracking-[0.25em] uppercase text-foreground font-semibold">
              4. Your Account
            </h2>
            <p className="text-muted-foreground">
              You are responsible for keeping your account credentials secure. Do not share
              your password. You are liable for any activity that occurs under your account.
              Notify us immediately via{" "}
              <a
                href="https://github.com/mhormes"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2 hover:text-foreground/80 transition-colors"
              >
                GitHub
              </a>{" "}
              if you suspect unauthorised use.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-cinzel text-sm tracking-[0.25em] uppercase text-foreground font-semibold">
              5. Your Content
            </h2>
            <p className="text-muted-foreground">
              The character data you create (names, stats, notes, and other information)
              belongs to you. We do not claim ownership of your character data. By using the
              Service you grant us a limited licence to store and serve your data solely for
              the purpose of operating the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-cinzel text-sm tracking-[0.25em] uppercase text-foreground font-semibold">
              6. D&amp;D Content &amp; Licensing
            </h2>
            <p className="text-muted-foreground">
              Game rules, class features, spells, and other mechanical content available in
              the Service are derived from the{" "}
              <em>Dungeons &amp; Dragons System Reference Document 5.1</em>, licensed under the{" "}
              <a
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2 hover:text-foreground/80 transition-colors"
              >
                Creative Commons Attribution 4.0 International License
              </a>
              . Dungeons &amp; Dragons and D&amp;D are trademarks of Wizards of the Coast LLC.
              Print2Play is an independent fan project and is not affiliated with or endorsed
              by Wizards of the Coast.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-cinzel text-sm tracking-[0.25em] uppercase text-foreground font-semibold">
              7. Acceptable Use
            </h2>
            <p className="text-muted-foreground">You agree not to:</p>
            <ul className="list-none space-y-1.5 text-muted-foreground pl-4">
              {[
                "Attempt to gain unauthorised access to any part of the Service or its infrastructure.",
                "Upload malicious code, scripts, or content intended to harm the Service or other users.",
                "Scrape, mirror, or reproduce the Service in bulk without permission.",
                "Use the Service for any unlawful purpose.",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-muted-foreground/50 shrink-0">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-cinzel text-sm tracking-[0.25em] uppercase text-foreground font-semibold">
              8. Availability
            </h2>
            <p className="text-muted-foreground">
              Print2Play is a personal project provided without guarantees of uptime or
              continuity. The Service may be modified, interrupted, or discontinued at any
              time without notice. We are not liable for any loss of data or access
              resulting from downtime or termination.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-cinzel text-sm tracking-[0.25em] uppercase text-foreground font-semibold">
              9. Disclaimer of Warranties
            </h2>
            <p className="text-muted-foreground">
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranty of
              any kind, express or implied. We make no warranties regarding accuracy,
              reliability, or fitness for a particular purpose.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-cinzel text-sm tracking-[0.25em] uppercase text-foreground font-semibold">
              10. Limitation of Liability
            </h2>
            <p className="text-muted-foreground">
              To the maximum extent permitted by law, Maarten Hormes shall not be liable
              for any indirect, incidental, special, or consequential damages arising from
              your use of, or inability to use, the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-cinzel text-sm tracking-[0.25em] uppercase text-foreground font-semibold">
              11. Changes to These Terms
            </h2>
            <p className="text-muted-foreground">
              We may update these terms from time to time. The &ldquo;last updated&rdquo; date at the
              top will reflect any changes. Continued use after changes constitutes
              acceptance of the new terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-cinzel text-sm tracking-[0.25em] uppercase text-foreground font-semibold">
              12. Contact
            </h2>
            <p className="text-muted-foreground">
              Questions? Open an issue on{" "}
              <a
                href="https://github.com/mhormes"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2 hover:text-foreground/80 transition-colors"
              >
                GitHub
              </a>
              .
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <Link
            href="/privacy"
            className="font-garamond text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            Read our Privacy Policy &rarr;
          </Link>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}
