import Link from "next/link"
import Image from "next/image"
import { AppFooter } from "@/components/footer"

export const metadata = {
  title: "Privacy Policy – Print2Play",
}

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <div className="flex items-center gap-3">
            <div className="h-px w-10 bg-border" />
            <span className="font-garamond italic text-sm text-muted-foreground">
              Last updated: 15 June 2025
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
        </div>

        <div className="prose-garamond space-y-8 font-garamond text-base text-foreground leading-relaxed">

          <section className="space-y-3">
            <h2 className="font-cinzel text-sm tracking-[0.25em] uppercase text-foreground font-semibold">
              1. Who We Are
            </h2>
            <p className="text-muted-foreground">
              Print2Play is a free D&amp;D 5e character sheet builder operated by Maarten Hormes
              as a personal project. This policy explains what data is collected, why, and how
              it is handled.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-cinzel text-sm tracking-[0.25em] uppercase text-foreground font-semibold">
              2. Data We Collect
            </h2>
            <p className="text-muted-foreground">
              When you create an account we collect:
            </p>
            <ul className="list-none space-y-1.5 text-muted-foreground pl-4">
              {[
                "Username — your chosen display name.",
                "Email address — used to verify your account and send password-reset links.",
                "Hashed password — we never store your password in plain text.",
                "Character data — names, ability scores, class levels, inventory, notes, and any other information you enter into the forge.",
                "Session tokens — stored in a secure, HTTP-only cookie to keep you signed in.",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-muted-foreground/50 shrink-0">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground">
              We do not use third-party analytics, advertising trackers, or fingerprinting
              scripts.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-cinzel text-sm tracking-[0.25em] uppercase text-foreground font-semibold">
              3. How We Use Your Data
            </h2>
            <ul className="list-none space-y-1.5 text-muted-foreground pl-4">
              {[
                "To create and authenticate your account.",
                "To store and retrieve your character sheets.",
                "To send transactional emails (email verification, password reset). No marketing emails.",
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
              4. Data Sharing
            </h2>
            <p className="text-muted-foreground">
              We do not sell, rent, or share your personal data with third parties. Your
              character data is private to your account and is never made publicly visible
              without your explicit action.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-cinzel text-sm tracking-[0.25em] uppercase text-foreground font-semibold">
              5. Data Retention &amp; Deletion
            </h2>
            <p className="text-muted-foreground">
              Your data is retained for as long as your account is active. You may request
              deletion of your account and all associated data at any time by contacting us
              via the{" "}
              <a
                href="https://github.com/mhormes"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2 hover:text-foreground/80 transition-colors"
              >
                GitHub repository
              </a>
              . Deletion is permanent and cannot be undone.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-cinzel text-sm tracking-[0.25em] uppercase text-foreground font-semibold">
              6. Security
            </h2>
            <p className="text-muted-foreground">
              Passwords are hashed using a strong one-way algorithm. Session tokens are
              signed and stored in HTTP-only cookies. Connections are encrypted over HTTPS.
              While we take reasonable precautions, no system is completely immune to
              security risks — please use a unique password.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-cinzel text-sm tracking-[0.25em] uppercase text-foreground font-semibold">
              7. Cookies
            </h2>
            <p className="text-muted-foreground">
              We use a single HTTP-only session cookie to keep you logged in. No
              advertising or tracking cookies are set.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-cinzel text-sm tracking-[0.25em] uppercase text-foreground font-semibold">
              8. Children
            </h2>
            <p className="text-muted-foreground">
              Print2Play is not directed at children under 13. We do not knowingly collect
              data from anyone under 13. If you believe a child under 13 has provided us
              with their information, please contact us for removal.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-cinzel text-sm tracking-[0.25em] uppercase text-foreground font-semibold">
              9. Changes to This Policy
            </h2>
            <p className="text-muted-foreground">
              We may update this policy from time to time. The &ldquo;last updated&rdquo; date at
              the top will reflect any changes. Continued use of the service after changes
              constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-cinzel text-sm tracking-[0.25em] uppercase text-foreground font-semibold">
              10. Contact
            </h2>
            <p className="text-muted-foreground">
              Questions or concerns? Open an issue on{" "}
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
            href="/terms"
            className="font-garamond text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            Read our Terms of Use &rarr;
          </Link>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}
