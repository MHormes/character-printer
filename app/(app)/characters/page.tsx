import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import Link from "next/link"
import { Cinzel, EB_Garamond } from "next/font/google"
import { listAllCharacters, createCharacter, deleteCharacter } from "@/lib/actions/character"
import { getOrCreateStubUser } from "@/lib/actions/user"
import { Button, buttonVariants } from "@/components/ui/button"
import { Plus, Pencil, Trash2, Scroll } from "lucide-react"
import type { CharacterSummary } from "@/lib/actions/character"

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "600", "700", "900"],
})

const garamond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-garamond",
  style: ["normal", "italic"],
})

const SYSTEM_LABELS: Record<string, string> = {
  dnd5e: "D&D 5e",
  dnd5_5e: "D&D 2024",
}

function systemLabel(key: string) {
  return SYSTEM_LABELS[key] ?? key
}

function formatDate(date: Date | null) {
  if (!date) return "—"
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(date)
}

async function createAction() {
  "use server"
  const user = await getOrCreateStubUser()
  const { id } = await createCharacter(user.id)
  redirect(`/forge/${id}`)
}

async function deleteAction(formData: FormData) {
  "use server"
  const id = formData.get("id") as string
  await deleteCharacter(id)
  revalidatePath("/characters")
}

export default async function CharactersPage() {
  const characters = await listAllCharacters()

  return (
    <div className={`${cinzel.variable} ${garamond.variable} min-h-screen bg-background`}>

      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border bg-primary px-8 py-4">
        <Link
          href="/"
          className="font-[family-name:var(--font-cinzel)] text-xs tracking-[0.3em] uppercase font-semibold text-primary-foreground/80 hover:text-primary-foreground transition-colors"
        >
          Character Printer
        </Link>
        <form action={createAction}>
          <Button
            type="submit"
            size="sm"
            variant="secondary"
          >
            <Plus className="w-3.5 h-3.5" />
            New Character
          </Button>
        </form>
      </header>

      <main className="px-8 py-10 max-w-screen-2xl mx-auto">

        {/* Page heading */}
        <div className="mb-10">
          <h1 className="font-[family-name:var(--font-cinzel)] text-5xl md:text-6xl font-black tracking-tight text-foreground mb-4">
            Characters
          </h1>
          <div className="flex items-center gap-3">
            <div className="h-px w-10 bg-border" />
            <span className="font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
              {characters.length} {characters.length === 1 ? "character" : "characters"}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
        </div>

        {/* Grid or empty state */}
        {characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
            <div className="w-14 h-14 rounded-full border border-border bg-card flex items-center justify-center">
              <Scroll className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <p className="font-[family-name:var(--font-cinzel)] text-sm font-semibold tracking-widest uppercase text-foreground">
                No characters yet
              </p>
              <p className="font-[family-name:var(--font-garamond)] italic text-muted-foreground text-base">
                Create your first character to begin.
              </p>
            </div>
            <form action={createAction}>
              <Button type="submit">
                <Plus className="w-4 h-4" />
                New Character
              </Button>
            </form>
          </div>
        ) : (
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {characters.map((char) => (
              <li
                key={char.id}
                className="flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Card accent + system badge + actions */}
                <div className="bg-primary px-4 py-2.5 flex items-center justify-between">
                  <span className="font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.25em] uppercase text-primary-foreground/70">
                    {systemLabel(char.system)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/forge/${char.id}`}
                      className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                    >
                      <Pencil className="size-3.5 text-primary-foreground/70" />
                    </Link>
                    <form action={deleteAction}>
                      <input type="hidden" name="id" value={char.id} />
                      <Button variant="ghost" size="icon-sm" type="submit">
                        <Trash2 className="size-3.5 text-primary-foreground/70" />
                      </Button>
                    </form>
                  </div>
                </div>

                {/* Card body */}
                <div className="flex flex-col flex-1 gap-3 p-4">
                  <div className="space-y-1 min-w-0">
                    <p className="font-[family-name:var(--font-cinzel)] font-bold text-base leading-tight truncate text-foreground">
                      {char.name || (
                        <span className="font-[400] italic text-muted-foreground">Unnamed</span>
                      )}
                    </p>
                    {(char.race || char.classLabels) && (
                      <p className="font-[family-name:var(--font-garamond)] italic text-sm text-muted-foreground truncate">
                        {[char.race, char.classLabels, `Lv ${char.level}`].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>

                  <div className="mt-auto space-y-2">
                    <div className="h-px bg-border" />
                    <p className="font-[family-name:var(--font-garamond)] text-xs text-muted-foreground">
                      {formatDate(char.updatedAt)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
