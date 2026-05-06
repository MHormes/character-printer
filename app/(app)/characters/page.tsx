import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import Link from "next/link"
import { listAllCharacters, createCharacter, deleteCharacter } from "@/lib/actions/character"
import { getOrCreateStubUser } from "@/lib/actions/user"
import { Button, buttonVariants } from "@/components/ui/button"
import { Plus, Pencil, Trash2 } from "lucide-react"

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

function formatDate(date: Date | null) {
  if (!date) return "—"
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

export default async function CharactersPage() {
  const characters = await listAllCharacters()

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Characters</h1>
        <form action={createAction}>
          <Button type="submit" size="sm">
            <Plus />
            New Character
          </Button>
        </form>
      </div>

      {characters.length === 0 ? (
        <p className="text-sm text-muted-foreground">No characters yet. Create one to get started.</p>
      ) : (
        <ul className="space-y-2">
          {characters.map((char) => (
            <li
              key={char.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{char.name || <span className="text-muted-foreground italic">Unnamed</span>}</p>
                <p className="text-xs text-muted-foreground">Updated {formatDate(char.updatedAt)}</p>
              </div>
              <div className="ml-4 flex shrink-0 items-center gap-2">
                <Link href={`/forge/${char.id}`} className={buttonVariants({ variant: "outline", size: "icon-sm" })}>
                  <Pencil className="size-3.5" />
                </Link>
                <form action={deleteAction}>
                  <input type="hidden" name="id" value={char.id} />
                  <Button variant="destructive" size="icon-sm" type="submit">
                    <Trash2 />
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
