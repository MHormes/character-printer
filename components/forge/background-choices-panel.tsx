"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { BackgroundChoiceMade, LanguageChoiceMade, ToolChoiceMade, AttributeKey, InventoryItem } from "@/lib/types/character"
import {
  getBackgroundPendingChoiceKey,
  type BackgroundPendingChoice,
} from "@/lib/character/derive-pending-choices"
import { LanguagePicker } from "@/components/forge/language-picker"
import { ToolPicker } from "@/components/forge/tool-picker"
import type { LanguageRow, ItemRow, BackgroundRow } from "@/lib/actions/5e-data"
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

// ─── Background ASI picker (2024 edition) ─────────────────────────────────────

function BackgroundAsiPicker({
  backgroundId,
  backgroundName,
  asiPool,
  onConfirm,
}: {
  backgroundId: string
  backgroundName: string
  asiPool: AttributeKey[]
  onConfirm: (choice: BackgroundChoiceMade) => void
}) {
  const [plusTwo, setPlusTwo] = useState<AttributeKey | null>(null)
  const [plusOne, setPlusOne] = useState<AttributeKey | null>(null)

  function pickPlusTwo(attr: AttributeKey) {
    if (plusTwo === attr) {
      setPlusTwo(null)
    } else {
      setPlusTwo(attr)
      if (plusOne === attr) setPlusOne(null)
    }
  }

  function pickPlusOne(attr: AttributeKey) {
    if (plusOne === attr) {
      setPlusOne(null)
    } else {
      setPlusOne(attr)
      if (plusTwo === attr) setPlusTwo(null)
    }
  }

  function confirm() {
    const improvements: { attr: AttributeKey; bonus: number }[] = []
    if (plusTwo) improvements.push({ attr: plusTwo, bonus: 2 })
    if (plusOne) improvements.push({ attr: plusOne, bonus: 1 })
    onConfirm({ id: crypto.randomUUID(), backgroundId, type: "asi", improvements })
  }

  const ready = plusTwo !== null && plusOne !== null

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {backgroundName} · Ability Score Improvement
      </p>
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">+2 to one:</p>
        <div className="flex flex-wrap gap-2">
          {asiPool.map((attr) => (
            <Button
              key={attr}
              type="button"
              variant="outline"
              size="sm"
              aria-pressed={plusTwo === attr}
              disabled={plusOne === attr}
              onClick={() => pickPlusTwo(attr)}
              className={plusTwo === attr ? "border-primary bg-primary/10" : ""}
            >
              {ATTR_LABELS[attr]} +2
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">+1 to another:</p>
        <div className="flex flex-wrap gap-2">
          {asiPool.map((attr) => (
            <Button
              key={attr}
              type="button"
              variant="outline"
              size="sm"
              aria-pressed={plusOne === attr}
              disabled={plusTwo === attr}
              onClick={() => pickPlusOne(attr)}
              className={plusOne === attr ? "border-primary bg-primary/10" : ""}
            >
              {ATTR_LABELS[attr]} +1
            </Button>
          ))}
        </div>
      </div>
      <Button type="button" size="sm" contrast disabled={!ready} onClick={confirm}>
        Confirm
      </Button>
    </div>
  )
}

// ─── Item list picker (specific named options, no DB search) ─────────────────

function ItemListPicker({
  backgroundName,
  options,
  label,
  onConfirm,
  onDismiss,
}: {
  backgroundName: string
  options: { name: string }[]
  label: string
  onConfirm: (itemName: string) => void
  onDismiss: () => void
}) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {backgroundName} · Starting Equipment — choose {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map(({ name }) => (
          <Button
            key={name}
            type="button"
            variant="outline"
            size="sm"
            aria-pressed={selected === name}
            onClick={() => setSelected(selected === name ? null : name)}
            className={selected === name ? "border-primary bg-primary/10" : ""}
          >
            {name}
          </Button>
        ))}
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
  pendingChoices: BackgroundPendingChoice[]
  languages: LanguageRow[]
  tools: ItemRow[]
  alreadyChosenLanguageIds: string[]
  isOpen: boolean
  onToggle: () => void
  onConfirmAsi: (choice: BackgroundChoiceMade) => void
  onConfirmLanguage: (choices: LanguageChoiceMade[], backgroundId: string) => void
  onConfirmTool: (choice: ToolChoiceMade) => void
  onDismissChoice: (choiceKey: string) => void
  // gained benefits
  backgroundChoices?: BackgroundChoiceMade[]
  languageChoices?: LanguageChoiceMade[]
  toolChoices?: ToolChoiceMade[]
  dismissedBackgroundChoiceKeys?: string[]
  selectedBackground?: BackgroundRow
  charInventory?: InventoryItem[]
  gainedIsOpen?: boolean
  onGainedToggle?: () => void
  onRevert?: (key: string) => void
}

export function BackgroundChoicesPanel({
  pendingChoices,
  languages,
  tools,
  alreadyChosenLanguageIds,
  isOpen,
  onToggle,
  onConfirmAsi,
  onConfirmLanguage,
  onConfirmTool,
  onDismissChoice,
  backgroundChoices = [],
  languageChoices = [],
  toolChoices = [],
  dismissedBackgroundChoiceKeys = [],
  selectedBackground,
  charInventory = [],
  gainedIsOpen = false,
  onGainedToggle,
  onRevert,
}: Props) {
  const { autoGrants, madeChoices, dismissedBenefits } = useMemo(() => {
    const bgName = selectedBackground?.name ?? ""
    const bgId = selectedBackground?.id ?? ""

    const autoGrants: GainedBenefit[] = []
    if (selectedBackground?.skillGrants) {
      const grants: string[] = typeof selectedBackground.skillGrants === "string"
        ? JSON.parse(selectedBackground.skillGrants)
        : (selectedBackground.skillGrants as string[])
      if (grants.length > 0) {
        const labels = grants.map((k) => SKILL_LABELS[k] ?? k).join(", ")
        autoGrants.push({ key: `${bgId}:skills`, label: `${bgName}: Skills — ${labels}` })
      }
    }

    // Narrative features (e.g. "By Popular Demand", "Researcher")
    if (selectedBackground?.featuresJson) {
      const features: { name: string; description: string }[] = typeof selectedBackground.featuresJson === "string"
        ? JSON.parse(selectedBackground.featuresJson)
        : (selectedBackground.featuresJson as { name: string; description: string }[])
      for (const f of features) {
        autoGrants.push({ key: `${bgId}:feature:${f.name}`, label: `${bgName}: Feature — ${f.name}` })
      }
    }

    // Fixed proficiency grants (tools, vehicles, etc. from fixedProficienciesJson)
    if (selectedBackground?.fixedProficienciesJson) {
      const profs: { name: string; category: string }[] = typeof selectedBackground.fixedProficienciesJson === "string"
        ? JSON.parse(selectedBackground.fixedProficienciesJson)
        : (selectedBackground.fixedProficienciesJson as { name: string; category: string }[])
      for (const p of profs) {
        autoGrants.push({ key: `${bgId}:fixedprof:${p.name}`, label: `${bgName}: ${p.category} — ${p.name}` })
      }
    }

    // Fixed starting equipment (items added to inventory with sourceId "bg-start:<bgId>")
    if (bgId) {
      const bgEquipKey = `bg-start:${bgId}`
      const bgItems = charInventory.filter((i) => i.sourceId === bgEquipKey)
      if (bgItems.length > 0) {
        const names = bgItems.map((i) => `${i.name}${(i.quantity ?? 1) > 1 ? ` ×${i.quantity}` : ""}`).join(", ")
        autoGrants.push({ key: bgEquipKey, label: `${bgName}: Starting gear — ${names}` })
      }
    }

    const madeChoices: GainedBenefit[] = []

    for (const c of backgroundChoices) {
      if (c.type === "asi" && c.improvements?.length) {
        const parts = c.improvements.map((i) => `${ATTR_LABELS[i.attr]} +${i.bonus}`).join(", ")
        madeChoices.push({ key: c.id, label: `${bgName}: ${parts}` })
      }
    }

    for (const c of languageChoices) {
      if (c.sourceId.startsWith("background:")) {
        madeChoices.push({ key: c.id, label: `${bgName}: Language — ${c.languageName}` })
      }
    }

    for (const c of toolChoices) {
      if (!bgId || c.backgroundId === bgId) {
        madeChoices.push({ key: c.id, label: `${bgName}: Tool — ${c.toolName}` })
      }
    }

    const dismissedBenefits: DismissedBenefit[] = []

    for (const key of dismissedBackgroundChoiceKeys) {
      const parts = key.split(":")
      const type = parts[parts.length - 1]
      if (type === "asi") {
        dismissedBenefits.push({ key, label: `${bgName}: ASI choice` })
      } else if (type === "language") {
        dismissedBenefits.push({ key, label: `${bgName}: Language choice` })
      } else if (/^\d+$/.test(type)) {
        dismissedBenefits.push({ key, label: `${bgName}: Tool choice (option ${Number(type) + 1})` })
      } else {
        dismissedBenefits.push({ key, label: `${bgName}: ${type}` })
      }
    }

    return { autoGrants, madeChoices, dismissedBenefits }
  }, [backgroundChoices, languageChoices, toolChoices, dismissedBackgroundChoiceKeys, selectedBackground, charInventory])

  if (pendingChoices.length === 0 && autoGrants.length === 0 && madeChoices.length === 0 && dismissedBenefits.length === 0) return null

  return (
    <div className="space-y-2">
      {pendingChoices.length > 0 && (
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-1.5 rounded-md border border-amber-500/50 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-500/20"
        >
          {pendingChoices.length} pending background {pendingChoices.length === 1 ? "choice" : "choices"}
          {isOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </button>
      )}

      {pendingChoices.length > 0 && isOpen && (
        <div className="mt-3 space-y-6 rounded-lg border border-border bg-muted/30 p-4">
          {pendingChoices.map((pc, i) => {
            const key = getBackgroundPendingChoiceKey(pc as Parameters<typeof getBackgroundPendingChoiceKey>[0])
            return (
              <div key={`${pc.backgroundId}:${pc.type}:${i}`} className="space-y-3">
                {pc.type === "asi" && (
                  <BackgroundAsiPicker
                    backgroundId={pc.backgroundId}
                    backgroundName={pc.backgroundName}
                    asiPool={pc.asiPool}
                    onConfirm={(choice) => {
                      onConfirmAsi(choice)
                    }}
                  />
                )}
                {pc.type === "language" && (
                  <LanguagePicker
                    languages={languages}
                    alreadyChosen={alreadyChosenLanguageIds}
                    chooseCount={pc.chooseCount}
                    sourceName={pc.backgroundName}
                    choiceLabel={`${pc.chooseCount}`}
                    onConfirm={(choices) => {
                      onConfirmLanguage(
                        choices.map((c) => ({
                          id: crypto.randomUUID(),
                          sourceId: `background:${pc.backgroundId}`,
                          languageId: c.languageId,
                          languageName: c.languageName,
                        })),
                        pc.backgroundId,
                      )
                    }}
                    onDismiss={() => onDismissChoice(key)}
                  />
                )}
                {pc.type === "tool" && pc.inventoryOnly && pc.options && (
                  <ItemListPicker
                    backgroundName={pc.backgroundName}
                    options={pc.options}
                    label={pc.label}
                    onConfirm={(toolName) => {
                      onConfirmTool({
                        id: crypto.randomUUID(),
                        backgroundId: pc.backgroundId,
                        choiceIndex: pc.choiceIndex,
                        toolName,
                      })
                    }}
                    onDismiss={() => onDismissChoice(key)}
                  />
                )}
                {pc.type === "tool" && pc.inventoryOnly && !pc.options && (
                  <ToolPicker
                    tools={tools}
                    category={pc.category ?? ""}
                    label={pc.label}
                    sourceName={pc.backgroundName}
                    profLabel="Starting Equipment"
                    onConfirm={(toolName) => {
                      onConfirmTool({
                        id: crypto.randomUUID(),
                        backgroundId: pc.backgroundId,
                        choiceIndex: pc.choiceIndex,
                        toolName,
                      })
                    }}
                    onDismiss={() => onDismissChoice(key)}
                  />
                )}
                {pc.type === "tool" && !pc.inventoryOnly && (
                  <ToolPicker
                    tools={tools}
                    category={pc.category ?? ""}
                    label={pc.label}
                    sourceName={pc.backgroundName}
                    profLabel={pc.addToInventory ? "Tool Proficiency & Equipment" : "Tool Proficiency"}
                    onConfirm={(toolName) => {
                      onConfirmTool({
                        id: crypto.randomUUID(),
                        backgroundId: pc.backgroundId,
                        choiceIndex: pc.choiceIndex,
                        toolName,
                      })
                    }}
                    onDismiss={() => onDismissChoice(key)}
                  />
                )}
                {pc.type === "asi" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onDismissChoice(key)}
                  >
                    Dismiss
                  </Button>
                )}
              </div>
            )
          })}
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
