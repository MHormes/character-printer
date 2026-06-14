"use client";

import { useState, useTransition } from "react";
import { Plus, X, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Edition, CharacterMode, AttributeKey } from "@/lib/types/character";

type CharacterOption = { edition: Edition; mode: CharacterMode; label: string; subtitle: string };
type AbilityScoreMethod = "manual" | "standardArray" | "pointBuy";
type Step = "ruleset" | "method" | "assign";

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
    label: "NPC / Monster (2014)",
    subtitle: "Manual stats — no class or race automation",
  },
  {
    edition: "2024",
    mode: "npc",
    label: "NPC / Monster (2024)",
    subtitle: "Manual stats — no class or race automation",
  },
];

const ATTR_KEYS: AttributeKey[] = ["str", "dex", "con", "int", "wis", "cha"];
const ATTR_LABELS: Record<AttributeKey, string> = {
  str: "Strength", dex: "Dexterity", con: "Constitution",
  int: "Intelligence", wis: "Wisdom", cha: "Charisma",
};
const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
const PB_COST: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
const PB_BUDGET = 27;

function initPbScores(): Record<AttributeKey, number> {
  return { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
}

type Props = {
  createAction: (formData: FormData) => Promise<void>;
  size?: "default" | "sm";
};

export function NewCharacterDialog({ createAction, size = "default" }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("ruleset");
  const [selected, setSelected] = useState<CharacterOption>(CHARACTER_OPTIONS[0]);
  const [method, setMethod] = useState<AbilityScoreMethod>("manual");
  const [arrayAssignments, setArrayAssignments] = useState<Partial<Record<AttributeKey, number>>>({});
  const [pbScores, setPbScores] = useState<Record<AttributeKey, number>>(initPbScores());
  const [pending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setStep("ruleset");
    setMethod("manual");
    setArrayAssignments({});
    setPbScores(initPbScores());
  }

  function pbPointsSpent(): number {
    return ATTR_KEYS.reduce((sum, k) => sum + PB_COST[pbScores[k]], 0);
  }

  function pbAdjust(k: AttributeKey, delta: number) {
    const next = pbScores[k] + delta;
    if (next < 8 || next > 15) return;
    const newScores = { ...pbScores, [k]: next };
    const newSpent = ATTR_KEYS.reduce((sum, key) => sum + PB_COST[newScores[key]], 0);
    if (newSpent > PB_BUDGET) return;
    setPbScores(newScores);
  }

  function arrayAllAssigned(): boolean {
    return ATTR_KEYS.every((k) => arrayAssignments[k] !== undefined);
  }

  function handleCreate() {
    const fd = new FormData();
    fd.set("edition", selected.edition);
    fd.set("mode", selected.mode);

    if (selected.mode === "npc" || method === "manual") {
      fd.set("abilityScoreMode", "manual");
    } else if (method === "standardArray") {
      fd.set("abilityScoreMode", "standardArray");
      fd.set("abilityScores", JSON.stringify(arrayAssignments));
    } else {
      fd.set("abilityScoreMode", "pointBuy");
      fd.set("abilityScores", JSON.stringify(pbScores));
    }

    startTransition(() => createAction(fd));
  }

  function onRulesetNext() {
    if (selected.mode === "npc") {
      handleCreate();
    } else {
      setStep("method");
    }
  }

  function onMethodNext() {
    if (method === "manual") {
      handleCreate();
    } else {
      setStep("assign");
    }
  }

  const spent = pbPointsSpent();

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
          <div className="absolute inset-0 bg-black/50" onClick={close} />

          <div className="relative z-10 bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-5">

            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-cinzel font-bold text-lg text-foreground">
                  New Character
                </h2>
                <p className="font-garamond italic text-sm text-muted-foreground mt-0.5">
                  {step === "ruleset" && "Choose your ruleset"}
                  {step === "method" && "Ability scores"}
                  {step === "assign" && method === "standardArray" && "Assign your scores"}
                  {step === "assign" && method === "pointBuy" && "Spend your points"}
                </p>
              </div>
              <button onClick={close} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step 1: Ruleset */}
            {step === "ruleset" && (
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
                      <p className="font-cinzel text-sm font-semibold text-foreground">{opt.label}</p>
                      <p className="font-garamond italic text-xs text-muted-foreground mt-0.5">{opt.subtitle}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 2: Method */}
            {step === "method" && (
              <div className="space-y-2">
                {(
                  [
                    { id: "manual", label: "Manual", subtitle: "Set scores yourself in the editor" },
                    { id: "standardArray", label: "Standard Array", subtitle: "Assign 15, 14, 13, 12, 10, 8 to your stats" },
                    { id: "pointBuy", label: "Point Buy", subtitle: "Spend 27 points — PHB rules" },
                  ] as { id: AbilityScoreMethod; label: string; subtitle: string }[]
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMethod(opt.id)}
                    className={[
                      "w-full text-left rounded-lg border px-4 py-3 transition-colors",
                      method === opt.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:bg-muted",
                    ].join(" ")}
                  >
                    <p className="font-cinzel text-sm font-semibold text-foreground">{opt.label}</p>
                    <p className="font-garamond italic text-xs text-muted-foreground mt-0.5">{opt.subtitle}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Step 3a: Standard Array assignment */}
            {step === "assign" && method === "standardArray" && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {STANDARD_ARRAY.map((v) => {
                    const used = Object.values(arrayAssignments).includes(v);
                    return (
                      <span
                        key={v}
                        className={[
                          "font-cinzel text-xs font-semibold px-2 py-1 rounded border",
                          used
                            ? "border-border text-muted-foreground bg-muted line-through"
                            : "border-primary text-primary bg-primary/10",
                        ].join(" ")}
                      >
                        {v}
                      </span>
                    );
                  })}
                </div>
                <div className="space-y-2">
                  {ATTR_KEYS.map((k) => {
                    const assigned = arrayAssignments[k];
                    return (
                      <div key={k} className="flex items-center gap-3">
                        <span className="font-cinzel text-xs font-semibold text-muted-foreground w-24 shrink-0">
                          {ATTR_LABELS[k]}
                        </span>
                        <select
                          className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm font-cinzel text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          value={assigned ?? ""}
                          onChange={(e) => {
                            const val = e.target.value === "" ? undefined : Number(e.target.value);
                            setArrayAssignments((prev) => {
                              const next = { ...prev };
                              if (val === undefined) {
                                delete next[k];
                              } else {
                                // unassign any stat that had this value
                                for (const key of ATTR_KEYS) {
                                  if (next[key] === val) delete next[key];
                                }
                                next[k] = val;
                              }
                              return next;
                            });
                          }}
                        >
                          <option value="">—</option>
                          {STANDARD_ARRAY.map((v) => {
                            const takenByOther = arrayAssignments[k] !== v && Object.values(arrayAssignments).includes(v);
                            return (
                              <option key={v} value={v} disabled={takenByOther}>
                                {v}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3b: Point Buy */}
            {step === "assign" && method === "pointBuy" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-cinzel text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    Points
                  </span>
                  <span className={[
                    "font-cinzel text-sm font-bold",
                    spent > PB_BUDGET ? "text-destructive" : "text-foreground",
                  ].join(" ")}>
                    {spent} / {PB_BUDGET}
                  </span>
                </div>
                <div className="space-y-2">
                  {ATTR_KEYS.map((k) => {
                    const val = pbScores[k];
                    const canInc = val < 15 && spent + (PB_COST[val + 1] - PB_COST[val]) <= PB_BUDGET;
                    const canDec = val > 8;
                    return (
                      <div key={k} className="flex items-center gap-3">
                        <span className="font-cinzel text-xs font-semibold text-muted-foreground w-24 shrink-0">
                          {ATTR_LABELS[k]}
                        </span>
                        <div className="flex items-center gap-2 flex-1">
                          <button
                            type="button"
                            onClick={() => pbAdjust(k, -1)}
                            disabled={!canDec}
                            className="w-6 h-6 rounded border border-border bg-background text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                          >
                            −
                          </button>
                          <span className="font-cinzel text-sm font-bold text-foreground w-6 text-center">{val}</span>
                          <button
                            type="button"
                            onClick={() => pbAdjust(k, 1)}
                            disabled={!canInc}
                            className="w-6 h-6 rounded border border-border bg-background text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                          >
                            +
                          </button>
                          <span className="font-garamond italic text-xs text-muted-foreground ml-1">
                            {PB_COST[val]} pts
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-between gap-2 pt-1">
              <div>
                {step !== "ruleset" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep(step === "assign" ? "method" : "ruleset")}
                    disabled={pending}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Back
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={close}>
                  Cancel
                </Button>
                {step === "ruleset" && (
                  <Button type="button" size="sm" onClick={onRulesetNext} disabled={pending}>
                    {selected.mode === "npc" ? (pending ? "Creating…" : "Create Character") : "Next"}
                  </Button>
                )}
                {step === "method" && (
                  <Button type="button" size="sm" onClick={onMethodNext} disabled={pending}>
                    {method === "manual" ? (pending ? "Creating…" : "Create Character") : "Next"}
                  </Button>
                )}
                {step === "assign" && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreate}
                    disabled={
                      pending ||
                      (method === "standardArray" && !arrayAllAssigned()) ||
                      (method === "pointBuy" && spent > PB_BUDGET)
                    }
                  >
                    {pending ? "Creating…" : "Create Character"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
