export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { dbUsers } from "@/lib/db/tables";
import { eq } from "drizzle-orm";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { TwoFactorSection } from "@/components/settings/two-factor-section";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any;

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const rows = await anyDb
    .select()
    .from(dbUsers)
    .where(eq(dbUsers.id, session.user.id))
    .limit(1);

  const user = rows[0];
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between bg-primary px-8 py-4">
        <Link
          href="/characters"
          className="font-cinzel text-xs tracking-[0.3em] uppercase font-semibold text-primary-foreground/80 hover:text-primary-foreground transition-colors"
        >
          ← Characters
        </Link>
        <span className="font-cinzel text-xs tracking-[0.3em] uppercase font-semibold text-primary-foreground/60">
          Settings
        </span>
      </header>

      <main className="px-8 py-10 max-w-2xl mx-auto">
        <div className="mb-10">
          <h1 className="font-cinzel text-5xl font-black tracking-tight text-foreground mb-4">
            Settings
          </h1>
          <div className="flex items-center gap-3">
            <div className="h-px w-10 bg-border" />
            <span className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
              {session.user.username}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-cinzel text-sm tracking-[0.25em] uppercase font-semibold text-foreground mb-6">
              Change Password
            </h2>
            <ChangePasswordForm />
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-cinzel text-sm tracking-[0.25em] uppercase font-semibold text-foreground mb-6">
              Two-Factor Authentication
            </h2>
            <TwoFactorSection totpEnabled={user.totpEnabled ?? false} />
          </section>
        </div>
      </main>
    </div>
  );
}
