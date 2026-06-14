export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import {
  listAllCharacters,
  createCharacter,
  deleteCharacter,
} from "@/lib/actions/character";
import { auth } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { Pencil, Scroll, Shield } from "lucide-react";
import { NewCharacterDialog } from "@/components/characters/new-character-dialog";
import { DeleteCharacterButton } from "@/components/characters/delete-character-button";
import { LogoutButton } from "@/components/auth/logout-button";
import { Settings } from "lucide-react";
import type { Edition, CharacterMode, AbilityScoreMode } from "@/lib/types/character";

const EDITION_LABELS: Record<Edition, string> = {
  "2014": "D&D 5e 2014",
  "2024": "D&D 5e 2024",
};

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(date);
}

async function createAction(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const edition = (formData.get("edition") as Edition) || "2014";
  const mode = (formData.get("mode") as CharacterMode) || "player";
  const abilityScoreMode = ((formData.get("abilityScoreMode") as string) || "manual") as AbilityScoreMode;
  const rawScores = formData.get("abilityScores") as string | null;
  const abilityScores = rawScores ? (JSON.parse(rawScores) as Record<string, number>) : undefined;
  const { id } = await createCharacter(session.user.id, edition, mode, { abilityScoreMode, abilityScores });
  redirect(`/forge/${id}`);
}

async function deleteAction(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const charId = formData.get("id") as string;
  await deleteCharacter(charId, session.user.id);
  revalidatePath("/characters");
}

export default async function CharactersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const characters = await listAllCharacters(session.user.id);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between bg-primary px-8 py-4">
        <Link
          href="/"
          className="font-cinzel text-xs tracking-[0.3em] uppercase font-semibold text-primary-foreground/80 hover:text-primary-foreground transition-colors"
        >
          Character Printer
        </Link>
        <div className="flex items-center gap-2">
          {session.user.role === "admin" && (
            <Link
              href="/admin/users"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              <Shield className="size-3.5" />
              Admin
            </Link>
          )}
          <NewCharacterDialog createAction={createAction} size="sm" />
          <Link
            href="/settings"
            className={buttonVariants({ variant: "secondary", size: "icon-sm" })}
            aria-label="Settings"
          >
            <Settings className="size-3.5" />
          </Link>
          <LogoutButton variant="secondary" />
        </div>
      </header>

      <main className="px-8 py-10 max-w-screen-2xl mx-auto">
        {/* Page heading */}
        <div className="mb-10">
          <h1 className="font-cinzel text-5xl md:text-6xl font-black tracking-tight text-foreground mb-4">
            Characters
          </h1>
          <div className="flex items-center gap-3">
            <div className="h-px w-10 bg-border" />
            <span className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
              {characters.length}{" "}
              {characters.length === 1 ? "character" : "characters"}
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
              <p className="font-cinzel text-sm font-semibold tracking-widest uppercase text-foreground">
                No characters yet
              </p>
              <p className="font-garamond italic text-muted-foreground text-base">
                Create your first character to begin.
              </p>
            </div>
            <NewCharacterDialog createAction={createAction} />
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
                  <div className="flex items-center gap-2">
                    <span className="font-cinzel text-[10px] tracking-[0.25em] uppercase text-primary-foreground/70">
                      {EDITION_LABELS[char.edition] ?? char.edition}
                    </span>
                    {char.mode === "npc" && (
                      <span className="font-cinzel text-[9px] tracking-[0.2em] uppercase text-primary-foreground/50 border border-primary-foreground/30 rounded px-1 py-0.5">
                        NPC
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/forge/${char.id}`}
                      className={buttonVariants({
                        variant: "ghost",
                        size: "icon-sm",
                      })}
                    >
                      <Pencil className="size-3.5 text-primary-foreground/70" />
                    </Link>
                    <DeleteCharacterButton
                      charId={char.id}
                      charName={char.name || undefined}
                      deleteAction={deleteAction}
                    />
                  </div>
                </div>

                {/* Card body */}
                <div className="flex flex-col flex-1 gap-3 p-4">
                  <div className="space-y-1 min-w-0">
                    <p className="font-cinzel font-bold text-base leading-tight truncate text-foreground">
                      {char.name || (
                        <span className="font-normal italic text-muted-foreground">
                          Unnamed
                        </span>
                      )}
                    </p>
                    {(char.race || char.classLabels) && (
                      <p className="font-garamond italic text-sm text-muted-foreground truncate">
                        {[char.race, char.classLabels, `Lv ${char.level}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </div>

                  <div className="mt-auto space-y-2">
                    <div className="h-px bg-border" />
                    <p className="font-garamond text-xs text-muted-foreground">
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
  );
}
