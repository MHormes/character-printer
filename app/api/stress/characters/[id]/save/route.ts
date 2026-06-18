import { auth } from "@/lib/auth"
import { db } from "@/lib/db/client"
import { dbCharacters } from "@/lib/db/tables"
import { and, eq, sql } from "drizzle-orm"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any

// Read the character's current data from DB then write it back unchanged.
// Exercises the full Postgres JSONB read+write path with real payload sizes
// without needing k6 to carry the CharacterData blob.
// Only active when MAIL_PROVIDER=disabled (staging mode via activate-staging.sh).
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  if (process.env["MAIL_PROVIDER"] !== "disabled") {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const rows = await anyDb
    .select({ data: sql<string>`${dbCharacters.data}` })
    .from(dbCharacters)
    .where(and(eq(dbCharacters.id, id), eq(dbCharacters.userId, session.user.id)))
    .limit(1)

  if (!rows[0]) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  await anyDb
    .update(dbCharacters)
    .set({ data: rows[0].data, updatedAt: new Date() })
    .where(eq(dbCharacters.id, id))

  return Response.json({ success: true })
}
