"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { BackgroundChoiceMade, LanguageChoiceMade, ToolChoiceMade, AttributeKey } from "@/lib/types/character"
import {
  getBackgroundPendingChoiceKey,
  type BackgroundPendingChoice,
} from "@/lib/character/derive-pending-choices"
import { LanguagePicker } from "@/components/forge/language-picker"
import { ToolPicker } from "@/components/forge/tool-picker"
import type { LanguageRow, ItemRow } from "@/lib/actions/5e-data"

const ATTR_LABELS: Record<AttributeKey, string> = {
  str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA",
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
}: Props) {
  if (pendingChoices.length === 0) return null

  return (
    <div className="space-y-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1.5 rounded-md border border-amber-500/50 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
      >
        {pendingChoices.length} pending background {pendingChoices.length === 1 ? "choice" : "choices"}
        {isOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
      </button>

      {isOpen && (
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
    </div>
  )
}
