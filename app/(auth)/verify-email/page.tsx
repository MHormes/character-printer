import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { VerifyEmailForm } from "@/components/auth/verify-email-form"
import { db } from "@/lib/db/client"
import { dbUsers } from "@/lib/db/tables"
import { eq } from "drizzle-orm"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any

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

export default async function VerifyEmailPage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.emailVerified) redirect("/characters")

  const rows = await anyDb
    .select({ emailVerificationSentAt: dbUsers.emailVerificationSentAt, email: dbUsers.email })
    .from(dbUsers)
    .where(eq(dbUsers.id, session.user.id))
    .limit(1)

  const user = rows[0]
  const sentAt: number | null = user?.emailVerificationSentAt
    ? new Date(user.emailVerificationSentAt).getTime()
    : null

  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-8 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="w-full bg-primary flex flex-col items-center gap-2 py-7 px-8">
        <D20Mini />
        <h1 className="font-cinzel text-xl font-bold tracking-widest uppercase text-primary-foreground mt-1">
          Character Printer
        </h1>
        <p className="font-garamond italic text-primary-foreground/70 text-sm">
          Check your inbox
        </p>
      </div>

      <div className="flex items-center gap-3 w-full px-8 -mt-2">
        <div className="h-px flex-1 bg-border" />
        <span className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground">Verify Email</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <VerifyEmailForm
        email={user?.email ?? ""}
        lastSentAt={sentAt}
      />
    </div>
  )
}
