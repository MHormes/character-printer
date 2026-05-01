"use client"

import { RotateCcw, X, Plus, CircleDot, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import type { OtherProficiency, AttributeKey, AttributeData } from "@/lib/types/character"

const CATEGORIES: OtherProficiency["category"][] = ["Tool", "Language", "Vehicle", "Weapon", "Armor"]
const ATTR_KEYS: AttributeKey[] = ["str", "dex", "con", "int", "wis", "cha"]
const ATTR_ABBR: Record<AttributeKey, string> = {
  str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA",
}

const ROLL_CATEGORIES: OtherProficiency["category"][] = ["Tool", "Vehicle"]

function hasRoll(category: OtherProficiency["category"]): boolean {
  return ROLL_CATEGORIES.includes(category)
}

type OtherProficienciesBlockProps = {
  proficiencies: OtherProficiency[]
  attributes: Record<AttributeKey, AttributeData>
  proficiencyBonus: number
  onChange: (list: OtherProficiency[]) => void
}

function attrMod(attr: AttributeKey, attributes: Record<AttributeKey, AttributeData>): number {
  const a = attributes[attr]
  const sum = a.stack.filter((m) => m.isActive).reduce((s, m) => s + m.value, 0)
  const total = a.override ?? (a.base + sum)
  return Math.floor((total - 10) / 2)
}

function calcModifier(prof: OtherProficiency, attributes: Record<AttributeKey, AttributeData>, pb: number): number {
  const statBonus = prof.stat !== null ? attrMod(prof.stat, attributes) : 0
  const trainingBonus = prof.training === "Expertise" ? pb * 2 : pb
  return statBonus + trainingBonus
}

export function OtherProficienciesBlock({
  proficiencies, attributes, proficiencyBonus, onChange,
}: OtherProficienciesBlockProps) {
  function add() {
    onChange([
      ...proficiencies,
      { id: crypto.randomUUID(), name: "", category: "Tool", training: "Proficient", stat: null, override: null },
    ])
  }

  function remove(id: string) {
    onChange(proficiencies.filter((p) => p.id !== id))
  }

  function update(id: string, patch: Partial<OtherProficiency>) {
    onChange(proficiencies.map((p) => p.id === id ? { ...p, ...patch } : p))
  }

  function handleCategoryChange(prof: OtherProficiency, newCategory: OtherProficiency["category"]) {
    const patch: Partial<OtherProficiency> = { category: newCategory }
    if (!hasRoll(newCategory)) {
      patch.stat = null
      patch.override = null
    }
    update(prof.id, patch)
  }

  function toggleTraining(prof: OtherProficiency) {
    const next = prof.training === "Proficient" ? "Expertise" : "Proficient"
    const delta = (next === "Expertise" ? proficiencyBonus * 2 : proficiencyBonus)
               - (prof.training === "Expertise" ? proficiencyBonus * 2 : proficiencyBonus)
    update(prof.id, {
      training: next,
      override: prof.override !== null ? prof.override + delta : null,
    })
  }

  function handleOverrideChange(id: string, raw: string) {
    if (raw === "") { update(id, { override: null }); return }
    const n = parseInt(raw, 10)
    if (!isNaN(n)) update(id, { override: n })
  }

  return (
    <div className="flex flex-col gap-2">
      {proficiencies.length === 0 && (
        <p className="text-xs text-muted-foreground">No proficiencies added yet.</p>
      )}

      {proficiencies.map((prof) => {
        const roll = hasRoll(prof.category)
        const calc = calcModifier(prof, attributes, proficiencyBonus)
        const isOverridden = prof.override !== null

        return (
          <div key={prof.id} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
            {/* Training toggle — only for roll categories */}
            {roll ? (
              <button
                type="button"
                aria-label={`Training: ${prof.training}`}
                onClick={() => toggleTraining(prof)}
                className="flex size-5 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              >
                {prof.training === "Proficient"
                  ? <CircleDot className="size-3.5" />
                  : <CheckCircle2 className="size-3.5" />}
              </button>
            ) : (
              <div className="size-5 shrink-0" />
            )}

            {/* Name */}
            <Input
              type="text"
              value={prof.name}
              placeholder="Name"
              onChange={(e) => update(prof.id, { name: e.target.value })}
              className="h-7 min-w-0 flex-1 text-xs"
            />

            {/* Category */}
            <select
              value={prof.category}
              onChange={(e) => handleCategoryChange(prof, e.target.value as OtherProficiency["category"])}
              className="h-7 rounded-md border border-input bg-background px-1.5 text-xs text-foreground focus:outline-none focus:border-ring"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Stat + modifier — roll categories only */}
            {roll && (
              <>
                <select
                  value={prof.stat ?? ""}
                  onChange={(e) => {
                    const val = e.target.value
                    update(prof.id, { stat: val === "" ? null : val as AttributeKey })
                  }}
                  className="h-7 rounded-md border border-input bg-background px-1.5 text-xs text-foreground focus:outline-none focus:border-ring"
                >
                  <option value="">—</option>
                  {ATTR_KEYS.map((k) => <option key={k} value={k}>{ATTR_ABBR[k]}</option>)}
                </select>

                <div className="relative w-12 shrink-0">
                  <input
                    type="number"
                    value={isOverridden ? prof.override! : ""}
                    placeholder={calc >= 0 ? `+${calc}` : String(calc)}
                    onChange={(e) => handleOverrideChange(prof.id, e.target.value)}
                    className={cn(
                      "h-7 w-full rounded-md border border-input bg-background text-center text-xs transition-colors",
                      "placeholder:text-foreground/30",
                      "focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/50",
                      "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                      isOverridden && "pr-4",
                    )}
                  />
                  {isOverridden && (
                    <button
                      type="button"
                      aria-label="Reset"
                      onClick={() => update(prof.id, { override: null })}
                      className="absolute right-0.5 top-1/2 -translate-y-1/2 flex size-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <RotateCcw className="size-2.5" />
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Delete */}
            <button
              type="button"
              onClick={() => remove(prof.id)}
              className="flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="size-3" />
            </button>
          </div>
        )
      })}

      <button
        type="button"
        onClick={add}
        className="flex h-7 items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <Plus className="size-3.5" />
        Add proficiency
      </button>
    </div>
  )
}
