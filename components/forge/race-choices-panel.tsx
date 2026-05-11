"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { RaceChoiceMade, AttributeKey } from "@/lib/types/character"
import type { RacePendingChoice } from "@/lib/character/derive-pending-choices"

const ATTR_LABELS: Record<AttributeKey, string> = {
  str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA",
}

const SKILL_LABELS: Record<string, string> = {
  acrobatics: "Acrobatics", animalHandling: "Animal Handling", arcana: "Arcana",
  athletics: "Athletics", deception: "Deception", history: "History",
  insight: "Insight", intimidation: "Intimidation", investigation: "Investigation",
  medicine: "Medicine", nature: "Nature", perception: "Perception",
  performance: "Performance", persuasion: "Persuasion", religion: "Religion",
  sleightOfHand: "Sleight of Hand", stealth: "Stealth", survival: "Survival",
}

// ─── Race ASI picker ──────────────────────────────────────────────────────────

function RaceAsiPicker({
  raceId,
  raceName,
  asiOptions,
  asiChooseCount,
  onConfirm,
}: {
  raceId: string
  raceName: string
  asiOptions: { abilityScore: AttributeKey; bonus: number }[]
  asiChooseCount: number
  onConfirm: (choices: RaceChoiceMade[]) => void
}) {
  const [selected, setSelected] = useState<AttributeKey[]>([])

  function toggle(key: AttributeKey) {
    if (selected.includes(key)) {
      setSelected(selected.filter((k) => k !== key))
    } else if (selected.length < asiChooseCount) {
      setSelected([...selected, key])
    }
  }

  function confirm() {
    onConfirm(
      selected.map((key) => {
        const opt = asiOptions.find((o) => o.abilityScore === key)!
        return {
          id: crypto.randomUUID(),
          raceId,
          type: "asi" as const,
          abilityScore: key,
          bonus: opt.bonus,
        }
      }),
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {raceName} · Ability Score Improvement — choose {asiChooseCount}
      </p>
      <div className="flex flex-wrap gap-2">
        {asiOptions.map(({ abilityScore, bonus }) => {
          const checked = selected.includes(abilityScore)
          const disabled = !checked && selected.length >= asiChooseCount
          return (
            <button
              key={abilityScore}
              type="button"
              disabled={disabled}
              onClick={() => toggle(abilityScore)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-sm transition-colors",
                checked
                  ? "border-ring bg-accent text-accent-foreground"
                  : "border-input bg-background text-foreground hover:bg-accent/50",
                disabled && "cursor-not-allowed opacity-40",
              )}
            >
              {ATTR_LABELS[abilityScore]} +{bonus}
            </button>
          )
        })}
      </div>
      <Button
        type="button"
        size="sm"
        disabled={selected.length !== asiChooseCount}
        onClick={confirm}
      >
        Confirm ({selected.length}/{asiChooseCount})
      </Button>
    </div>
  )
}

// ─── Race skill picker ────────────────────────────────────────────────────────

function RaceSkillPicker({
  raceId,
  raceName,
  skillOptions,
  skillsNeeded,
  onConfirm,
}: {
  raceId: string
  raceName: string
  skillOptions: string[]
  skillsNeeded: number
  onConfirm: (choices: RaceChoiceMade[]) => void
}) {
  const [selected, setSelected] = useState<string[]>([])

  function toggle(key: string) {
    if (selected.includes(key)) {
      setSelected(selected.filter((k) => k !== key))
    } else if (selected.length < skillsNeeded) {
      setSelected([...selected, key])
    }
  }

  function confirm() {
    onConfirm(
      selected.map((key) => ({
        id: crypto.randomUUID(),
        raceId,
        type: "skill" as const,
        skillKey: key,
      })),
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {raceName} · Skill Proficiencies — choose {skillsNeeded}
      </p>
      <div className="flex flex-wrap gap-2">
        {skillOptions.map((key) => {
          const checked = selected.includes(key)
          const disabled = !checked && selected.length >= skillsNeeded
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => toggle(key)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-sm transition-colors",
                checked
                  ? "border-ring bg-accent text-accent-foreground"
                  : "border-input bg-background text-foreground hover:bg-accent/50",
                disabled && "cursor-not-allowed opacity-40",
              )}
            >
              {SKILL_LABELS[key] ?? key}
            </button>
          )
        })}
      </div>
      <Button
        type="button"
        size="sm"
        disabled={selected.length !== skillsNeeded}
        onClick={confirm}
      >
        Confirm ({selected.length}/{skillsNeeded})
      </Button>
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

type Props = {
  pendingChoices: RacePendingChoice[]
  onConfirmChoice: (choices: RaceChoiceMade[]) => void
}

export function RaceChoicesPanel({ pendingChoices, onConfirmChoice }: Props) {
  const [open, setOpen] = useState(false)

  if (pendingChoices.length === 0) return null

  return (
    <div className="space-y-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md border border-amber-500/50 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
      >
        {pendingChoices.length} pending {pendingChoices.length === 1 ? "choice" : "choices"}
        {open ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
      </button>

      {open && (
        <div className="mt-3 space-y-6 rounded-lg border border-border bg-muted/30 p-4">
          {pendingChoices.map((pc, i) => (
            <div key={`${pc.raceId}:${pc.type}:${i}`}>
              {pc.type === "asi" ? (
                <RaceAsiPicker
                  raceId={pc.raceId}
                  raceName={pc.raceName}
                  asiOptions={pc.asiOptions ?? []}
                  asiChooseCount={pc.asiChooseCount ?? 1}
                  onConfirm={onConfirmChoice}
                />
              ) : (
                <RaceSkillPicker
                  raceId={pc.raceId}
                  raceName={pc.raceName}
                  skillOptions={pc.skillOptions ?? []}
                  skillsNeeded={pc.skillsNeeded ?? 1}
                  onConfirm={onConfirmChoice}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
