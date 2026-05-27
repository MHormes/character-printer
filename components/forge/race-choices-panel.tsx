"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { RaceChoiceMade, LanguageChoiceMade, AttributeKey } from "@/lib/types/character"
import { getRacePendingChoiceKey, getRaceLanguagePendingChoiceKey, type RacePendingChoice, type RaceLanguagePendingChoice } from "@/lib/character/derive-pending-choices"
import { LanguagePicker } from "@/components/forge/language-picker"
import type { LanguageRow } from "@/lib/actions/5e-data"

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
            <Button
              key={abilityScore}
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              aria-pressed={checked}
              onClick={() => toggle(abilityScore)}
            >
              {ATTR_LABELS[abilityScore]} +{bonus}
            </Button>
          )
        })}
      </div>
      <Button
        type="button"
        size="sm"
        contrast
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
            <Button
              key={key}
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              aria-pressed={checked}
              onClick={() => toggle(key)}
            >
              {SKILL_LABELS[key] ?? key}
            </Button>
          )
        })}
      </div>
      <Button
        type="button"
        size="sm"
        contrast
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
  languagePendingChoices: RaceLanguagePendingChoice[]
  languages: LanguageRow[]
  alreadyChosenLanguageIds: string[]
  isOpen: boolean
  onToggle: () => void
  onConfirmChoice: (choices: RaceChoiceMade[]) => void
  onConfirmLanguageChoice: (choices: LanguageChoiceMade[]) => void
  onDismissChoice: (choiceKey: string) => void
}

export function RaceChoicesPanel({
  pendingChoices,
  languagePendingChoices,
  languages,
  alreadyChosenLanguageIds,
  isOpen,
  onToggle,
  onConfirmChoice,
  onConfirmLanguageChoice,
  onDismissChoice,
}: Props) {
  const total = pendingChoices.length + languagePendingChoices.length
  if (total === 0) return null

  return (
    <div className="space-y-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1.5 rounded-md border border-amber-500/50 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
      >
        {total} pending {total === 1 ? "choice" : "choices"}
        {isOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
      </button>

      {isOpen && (
        <div className="mt-3 space-y-6 rounded-lg border border-border bg-muted/30 p-4">
          {pendingChoices.map((pc, i) => (
            <div key={`${pc.raceId}:${pc.type}:${i}`} className="space-y-3">
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
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onDismissChoice(getRacePendingChoiceKey(pc))}
              >
                Dismiss
              </Button>
            </div>
          ))}
          {languagePendingChoices.map((lpc, i) => (
            <div key={`${lpc.sourceId}:lang:${i}`} className="space-y-3">
              <LanguagePicker
                languages={languages}
                alreadyChosen={alreadyChosenLanguageIds}
                chooseCount={lpc.chooseCount}
                sourceName={lpc.sourceName}
                choiceLabel={`${lpc.chooseCount}`}
                onConfirm={(choices) => {
                  onConfirmLanguageChoice(
                    choices.map((c) => ({
                      id: crypto.randomUUID(),
                      sourceId: lpc.sourceId,
                      languageId: c.languageId,
                      languageName: c.languageName,
                    })),
                  )
                }}
                onDismiss={() => onDismissChoice(getRaceLanguagePendingChoiceKey(lpc))}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
