"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Edition, CharacterMode } from "@/lib/types/character";

type CharacterOption = { edition: Edition; mode: CharacterMode; label: string; subtitle: string };

const CHARACTER_OPTIONS: CharacterOption[] = [
  {
    edition: "2014",
    mode: "player",
    label: "D&D 5e (2014)",
    subtitle: "Player's Handbook — classic ruleset",
  },
  {
    edition: "2024",
    mode: "player",
    label: "D&D 5e (2024)",
    subtitle: "Revised rules — One D&D",
  },
  {
    edition: "2014",
    mode: "npc",
    label: "NPC / Monster",
    subtitle: "Manual stats — no class or race automation (2014 base rules)",
  },
];

type Props = {
  createAction: (formData: FormData) => Promise<void>;
  size?: "default" | "sm";
};

export function NewCharacterDialog({ createAction, size = "default" }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<CharacterOption>(CHARACTER_OPTIONS[0]);
  const [pending, startTransition] = useTransition();

  function handleCreate() {
    const fd = new FormData();
    fd.set("edition", selected.edition);
    fd.set("mode", selected.mode);
    startTransition(() => createAction(fd));
  }

  return (
    <>
      <Button
        type="button"
        size={size}
        variant={size === "sm" ? "secondary" : "default"}
        onClick={() => setOpen(true)}
      >
        <Plus className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
        New Character
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />

          {/* Dialog */}
          <div className="relative z-10 bg-card border border-border rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-cinzel font-bold text-lg text-foreground">
                  New Character
                </h2>
                <p className="font-garamond italic text-sm text-muted-foreground mt-0.5">
                  Choose your ruleset
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {CHARACTER_OPTIONS.map((opt) => {
                const isSelected = selected.edition === opt.edition && selected.mode === opt.mode;
                return (
                  <button
                    key={`${opt.edition}-${opt.mode}`}
                    type="button"
                    onClick={() => setSelected(opt)}
                    className={[
                      "w-full text-left rounded-lg border px-4 py-3 transition-colors",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:bg-muted",
                    ].join(" ")}
                  >
                    <p className="font-cinzel text-sm font-semibold text-foreground">
                      {opt.label}
                    </p>
                    <p className="font-garamond italic text-xs text-muted-foreground mt-0.5">
                      {opt.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleCreate}
                disabled={pending}
              >
                {pending ? "Creating…" : "Create Character"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
