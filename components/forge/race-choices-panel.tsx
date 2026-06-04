"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { RaceChoiceMade, LanguageChoiceMade, RaceToolChoiceMade, RaceCantripChoiceMade, AttributeKey } from "@/lib/types/character"
import {
  getRacePendingChoiceKey,
  getRaceLanguagePendingChoiceKey,
  getRaceToolPendingChoiceKey,
  getRaceCantripPendingChoiceKey,
  type RacePendingChoice,
  type RaceLanguagePendingChoice,
  type RaceToolPendingChoice,
  type RaceCantripPendingChoice,
} from "@/lib/character/derive-pending-choices"
import { LanguagePicker } from "@/components/forge/language-picker"
import { ToolPicker } from "@/components/forge/tool-picker"
import type { LanguageRow, ItemRow, SpellRow, RaceAbilityBonusRow, RaceProficiencyRow, RaceRow, SubraceRow } from "@/lib/actions/5e-data"
import { GainedBenefitsSection, type GainedBenefit, type DismissedBenefit } from "@/components/forge/gained-benefits-section"

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

// ─── Cantrip picker ───────────────────────────────────────────────────────────

function CantripPicker({
  sourceName,
  cantrips,
  onConfirm,
  onDismiss,
}: {
  sourceName: string
  cantrips: SpellRow[]
  onConfirm: (spell: SpellRow) => void
  onDismiss: () => void
}) {
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<SpellRow | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return cantrips.filter((s) => s.name.toLowerCase().includes(q))
  }, [cantrips, search])

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {sourceName} · Racial Cantrip — choose one
      </p>
      <Input
        placeholder="Search cantrips…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-8 text-sm"
      />
      <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
        {filtered.map((spell) => {
          const checked = selected?.id === spell.id
          return (
            <Button
              key={spell.id}
              type="button"
              variant="outline"
              size="sm"
              aria-pressed={checked}
              onClick={() => setSelected(checked ? null : spell)}
              className={checked ? "border-primary bg-primary/10" : ""}
            >
              {spell.name}
            </Button>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground">No cantrips found.</p>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          contrast
          disabled={!selected}
          onClick={() => { if (selected) onConfirm(selected) }}
        >
          Confirm
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

type Props = {
  pendingChoices: RacePendingChoice[]
  languagePendingChoices: RaceLanguagePendingChoice[]
  toolPendingChoices: RaceToolPendingChoice[]
  cantripPendingChoices: RaceCantripPendingChoice[]
  languages: LanguageRow[]
  tools: ItemRow[]
  cantrips: SpellRow[]
  alreadyChosenLanguageIds: string[]
  isOpen: boolean
  onToggle: () => void
  onConfirmChoice: (choices: RaceChoiceMade[]) => void
  onConfirmLanguageChoice: (choices: LanguageChoiceMade[]) => void
  onConfirmToolChoice: (choice: RaceToolChoiceMade) => void
  onConfirmCantripChoice: (choice: RaceCantripChoiceMade) => void
  onDismissChoice: (choiceKey: string) => void
  // gained benefits
  raceChoices?: RaceChoiceMade[]
  languageChoices?: LanguageChoiceMade[]
  raceToolChoices?: RaceToolChoiceMade[]
  raceCantripChoices?: RaceCantripChoiceMade[]
  dismissedRaceChoiceKeys?: string[]
  allRaceAsiBonusRows?: RaceAbilityBonusRow[]
  allRaceProficiencyRows?: RaceProficiencyRow[]
  availableRaces?: RaceRow[]
  availableSubraces?: SubraceRow[]
  currentRaceId?: string
  currentSubraceId?: string
  gainedIsOpen?: boolean
  onGainedToggle?: () => void
  onRevert?: (key: string) => void
}

export function RaceChoicesPanel({
  pendingChoices,
  languagePendingChoices,
  toolPendingChoices,
  cantripPendingChoices,
  languages,
  tools,
  cantrips,
  alreadyChosenLanguageIds,
  isOpen,
  onToggle,
  onConfirmChoice,
  onConfirmLanguageChoice,
  onConfirmToolChoice,
  onConfirmCantripChoice,
  onDismissChoice,
  raceChoices = [],
  languageChoices = [],
  raceToolChoices = [],
  raceCantripChoices = [],
  dismissedRaceChoiceKeys = [],
  allRaceAsiBonusRows = [],
  allRaceProficiencyRows = [],
  availableRaces = [],
  availableSubraces = [],
  currentRaceId,
  currentSubraceId,
  gainedIsOpen = false,
  onGainedToggle,
  onRevert,
}: Props) {
  const total = pendingChoices.length + languagePendingChoices.length + toolPendingChoices.length + cantripPendingChoices.length

  const { autoGrants, madeChoices, dismissedBenefits } = useMemo(() => {
    function raceNameFor(id: string) {
      return availableRaces.find((r) => r.id === id)?.name
        ?? availableSubraces.find((s) => s.id === id)?.name
        ?? id
    }

    const asiBySource = new Map<string, string[]>()
    for (const r of allRaceAsiBonusRows.filter((r) =>
      (currentRaceId && r.raceId === currentRaceId) ||
      (currentSubraceId && r.subraceId === currentSubraceId),
    )) {
      const sourceName = r.subraceId ? raceNameFor(r.subraceId) : raceNameFor(r.raceId ?? "")
      const part = `${ATTR_LABELS[r.abilityScore as AttributeKey] ?? r.abilityScore} +${r.bonus}`
      asiBySource.set(sourceName, [...(asiBySource.get(sourceName) ?? []), part])
    }
    const autoGrants: GainedBenefit[] = []
    for (const [sourceName, parts] of asiBySource) {
      autoGrants.push({ key: `race:asi:${sourceName}`, label: `${sourceName}: ${parts.join(", ")}` })
    }

    const profBySourceAndType = new Map<string, string[]>()
    for (const p of allRaceProficiencyRows.filter(
      (r) => (currentRaceId && r.raceId === currentRaceId && !r.subraceId) ||
              (currentSubraceId && r.subraceId === currentSubraceId),
    )) {
      const sourceName = p.subraceId ? raceNameFor(p.subraceId) : raceNameFor(p.raceId ?? "")
      const groupKey = `${sourceName}::${p.profType}`
      profBySourceAndType.set(groupKey, [...(profBySourceAndType.get(groupKey) ?? []), p.name])
    }
    for (const [groupKey, names] of profBySourceAndType) {
      const [sourceName, profType] = groupKey.split("::")
      autoGrants.push({ key: `race:prof:${groupKey}`, label: `${sourceName}: ${profType} — ${names.join(", ")}` })
    }

    const madeChoices: GainedBenefit[] = []

    for (const c of raceChoices) {
      const raceName = raceNameFor(c.raceId)
      if (c.type === "asi" && c.abilityScore) {
        madeChoices.push({ key: c.id, label: `${raceName}: ${ATTR_LABELS[c.abilityScore] ?? c.abilityScore} +${c.bonus}` })
      } else if (c.type === "skill" && c.skillKey) {
        madeChoices.push({ key: c.id, label: `${raceName}: Skill — ${SKILL_LABELS[c.skillKey] ?? c.skillKey}` })
      }
    }

    for (const c of languageChoices) {
      if (c.sourceId.startsWith("race:") || c.sourceId.startsWith("subrace:")) {
        const sourceId = c.sourceId.slice(c.sourceId.indexOf(":") + 1)
        const sourceName = raceNameFor(sourceId)
        madeChoices.push({ key: c.id, label: `${sourceName}: Language — ${c.languageName}` })
      }
    }

    for (const c of raceToolChoices) {
      const sourceId = c.sourceId.slice(c.sourceId.indexOf(":") + 1)
      const sourceName = raceNameFor(sourceId)
      madeChoices.push({ key: c.id, label: `${sourceName}: Tool — ${c.toolName}` })
    }

    for (const c of raceCantripChoices) {
      const sourceId = c.sourceId.slice(c.sourceId.indexOf(":") + 1)
      const sourceName = raceNameFor(sourceId)
      madeChoices.push({ key: c.id, label: `${sourceName}: Cantrip — ${c.spellName}` })
    }

    const dismissedBenefits: DismissedBenefit[] = []

    for (const key of dismissedRaceChoiceKeys) {
      if (key.includes(":language")) {
        const sourceId = key.replace(":language", "").replace(/^(race|subrace):/, "")
        const sourceName = raceNameFor(sourceId)
        dismissedBenefits.push({ key, label: `${sourceName}: Language choice` })
      } else if (key.includes(":cantrip")) {
        const sourceId = key.replace(":cantrip", "").replace(/^(race|subrace):/, "")
        const sourceName = raceNameFor(sourceId)
        dismissedBenefits.push({ key, label: `${sourceName}: Cantrip choice` })
      } else if (key.includes(":tool:")) {
        const sourceId = key.replace(/:tool:\d+$/, "").replace(/^(race|subrace):/, "")
        const sourceName = raceNameFor(sourceId)
        dismissedBenefits.push({ key, label: `${sourceName}: Tool choice` })
      } else {
        const parts = key.split(":")
        const type = parts[parts.length - 1]
        const raceId = parts.slice(0, parts.length - 1).join(":")
        const raceName = raceNameFor(raceId)
        if (type === "asi") {
          dismissedBenefits.push({ key, label: `${raceName}: ASI choice` })
        } else if (type === "skill") {
          dismissedBenefits.push({ key, label: `${raceName}: Skill choice` })
        } else {
          dismissedBenefits.push({ key, label: `${raceName}: ${type}` })
        }
      }
    }

    return { autoGrants, madeChoices, dismissedBenefits }
  }, [raceChoices, languageChoices, raceToolChoices, raceCantripChoices, dismissedRaceChoiceKeys, allRaceAsiBonusRows, allRaceProficiencyRows, availableRaces, availableSubraces, currentRaceId, currentSubraceId])

  if (total === 0 && autoGrants.length === 0 && madeChoices.length === 0 && dismissedBenefits.length === 0) return null

  return (
    <div className="space-y-2">
      {total > 0 && (
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-1.5 rounded-md border border-amber-500/50 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-500/20"
        >
          {total} pending {total === 1 ? "choice" : "choices"}
          {isOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </button>
      )}

      {total > 0 && isOpen && (
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
          {toolPendingChoices.map((tpc) => (
            <div key={getRaceToolPendingChoiceKey(tpc)} className="space-y-3">
              <ToolPicker
                tools={tools}
                category={tpc.category ?? ""}
                label={tpc.label}
                sourceName={tpc.sourceName}
                profLabel={tpc.addToInventory ? "Tool Proficiency & Equipment" : "Tool Proficiency"}
                onConfirm={(toolName) => {
                  onConfirmToolChoice({
                    id: crypto.randomUUID(),
                    sourceId: tpc.sourceId,
                    choiceIndex: tpc.choiceIndex,
                    toolName,
                  })
                }}
                onDismiss={() => onDismissChoice(getRaceToolPendingChoiceKey(tpc))}
              />
            </div>
          ))}
          {cantripPendingChoices.map((cpc) => (
            <div key={getRaceCantripPendingChoiceKey(cpc)} className="space-y-3">
              <CantripPicker
                sourceName={cpc.sourceName}
                cantrips={cantrips}
                onConfirm={(spell) => {
                  onConfirmCantripChoice({
                    id: crypto.randomUUID(),
                    sourceId: cpc.sourceId,
                    spellId: spell.id,
                    spellName: spell.name,
                    spellLevel: spell.level,
                    spellSchool: spell.school ?? "",
                    spellCastingTime: spell.castingTime ?? "",
                    spellRange: spell.range ?? "",
                    spellDuration: spell.duration ?? "",
                    spellDescription: spell.description ?? "",
                    spellComponents: {
                      verbal: spell.verbal ?? false,
                      somatic: spell.somatic ?? false,
                      material: spell.material ?? false,
                      materialDesc: spell.materialDesc ?? "",
                    },
                    spellTags: {
                      ritual: spell.ritual ?? false,
                      concentration: spell.concentration ?? false,
                    },
                  })
                }}
                onDismiss={() => onDismissChoice(getRaceCantripPendingChoiceKey(cpc))}
              />
            </div>
          ))}
        </div>
      )}

      <GainedBenefitsSection
        autoGrants={autoGrants}
        madeChoices={madeChoices}
        dismissedBenefits={dismissedBenefits}
        isOpen={gainedIsOpen}
        onToggle={() => onGainedToggle?.()}
        onRevert={(key) => onRevert?.(key)}
      />
    </div>
  )
}
