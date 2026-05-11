"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { ClassChoiceMade, AttributeKey } from "@/lib/types/character"
import type { PendingChoice } from "@/lib/character/derive-pending-choices"
import type { FeatRow } from "@/lib/actions/5e-data"

const ATTR_KEYS: AttributeKey[] = ["str", "dex", "con", "int", "wis", "cha"]
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

// ─── ASI picker ───────────────────────────────────────────────────────────────

type AsiMode = "+2" | "+1+1" | "feat"

function AsiPicker({
  classId,
  className,
  atLevel,
  availableFeats,
  onConfirm,
}: {
  classId: string
  className: string
  atLevel: number
  availableFeats: FeatRow[]
  onConfirm: (choice: ClassChoiceMade) => void
}) {
  const [mode, setMode] = useState<AsiMode>("+2")
  const [stat1, setStat1] = useState<AttributeKey>("str")
  const [stat2, setStat2] = useState<AttributeKey>("dex")
  const [featSearch, setFeatSearch] = useState("")
  const [selectedFeat, setSelectedFeat] = useState<FeatRow | null>(null)
  const [featOpen, setFeatOpen] = useState(false)

  const filteredFeats = availableFeats.filter((f) =>
    f.name.toLowerCase().includes(featSearch.toLowerCase()),
  )

  function confirm() {
    if (mode === "+2") {
      onConfirm({
        id: crypto.randomUUID(),
        classId,
        atLevel,
        type: "asi",
        improvements: [{ attr: stat1, bonus: 2 }],
      })
    } else if (mode === "+1+1") {
      onConfirm({
        id: crypto.randomUUID(),
        classId,
        atLevel,
        type: "asi",
        improvements: [
          { attr: stat1, bonus: 1 },
          { attr: stat2, bonus: 1 },
        ],
      })
    } else if (mode === "feat" && selectedFeat) {
      onConfirm({
        id: crypto.randomUUID(),
        classId,
        atLevel,
        type: "feat",
        featId: selectedFeat.id,
        featName: selectedFeat.name,
        featDescription: selectedFeat.description ?? "",
      })
    }
  }

  const canConfirm =
    mode === "+2" ||
    (mode === "+1+1" && stat1 !== stat2) ||
    (mode === "feat" && !!selectedFeat)

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {className} · Level {atLevel} · Ability Score Improvement
      </p>

      <div className="flex gap-2">
        {(["+2", "+1+1", "feat"] as AsiMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "rounded-md border px-3 py-1 text-sm transition-colors",
              mode === m
                ? "border-ring bg-accent text-accent-foreground"
                : "border-input bg-background text-foreground hover:bg-accent/50",
            )}
          >
            {m === "+2" ? "+2 one stat" : m === "+1+1" ? "+1 / +1 two stats" : "Choose feat"}
          </button>
        ))}
      </div>

      {mode === "+2" && (
        <div className="flex items-center gap-2">
          <select
            value={stat1}
            onChange={(e) => setStat1(e.target.value as AttributeKey)}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm focus:outline-none"
          >
            {ATTR_KEYS.map((k) => (
              <option key={k} value={k}>{ATTR_LABELS[k]}</option>
            ))}
          </select>
          <span className="text-sm font-semibold">+2</span>
        </div>
      )}

      {mode === "+1+1" && (
        <div className="flex items-center gap-2">
          <select
            value={stat1}
            onChange={(e) => setStat1(e.target.value as AttributeKey)}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm focus:outline-none"
          >
            {ATTR_KEYS.map((k) => (
              <option key={k} value={k}>{ATTR_LABELS[k]}</option>
            ))}
          </select>
          <span className="text-sm font-semibold">+1</span>
          <select
            value={stat2}
            onChange={(e) => setStat2(e.target.value as AttributeKey)}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm focus:outline-none"
          >
            {ATTR_KEYS.map((k) => (
              <option key={k} value={k} disabled={k === stat1}>{ATTR_LABELS[k]}</option>
            ))}
          </select>
          <span className="text-sm font-semibold">+1</span>
          {stat1 === stat2 && (
            <span className="text-xs text-destructive">Pick two different stats</span>
          )}
        </div>
      )}

      {mode === "feat" && (
        <div className="relative">
          <input
            type="text"
            value={selectedFeat ? selectedFeat.name : featSearch}
            placeholder="Search feats…"
            className="h-8 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:border-ring"
            onChange={(e) => {
              setFeatSearch(e.target.value)
              setSelectedFeat(null)
              setFeatOpen(true)
            }}
            onFocus={() => setFeatOpen(true)}
          />
          {featOpen && filteredFeats.length > 0 && !selectedFeat && (
            <div className="absolute left-0 top-full z-50 mt-0.5 max-h-48 w-full overflow-y-auto rounded-md border border-border bg-popover shadow-md">
              {filteredFeats.slice(0, 20).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    setSelectedFeat(f)
                    setFeatSearch("")
                    setFeatOpen(false)
                  }}
                  className="flex w-full items-center px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  {f.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <Button
        type="button"
        size="sm"
        disabled={!canConfirm}
        onClick={confirm}
      >
        Confirm
      </Button>
    </div>
  )
}

// ─── Skill picker ─────────────────────────────────────────────────────────────

function SkillPicker({
  classId,
  className,
  skillOptions,
  skillsNeeded,
  onConfirm,
}: {
  classId: string
  className: string
  skillOptions: string[]
  skillsNeeded: number
  onConfirm: (choices: ClassChoiceMade[]) => void
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
        classId,
        atLevel: 1,
        type: "skill" as const,
        skillKey: key,
      })),
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {className} · Skill Proficiencies — choose {skillsNeeded}
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
  pendingChoices: PendingChoice[]
  availableFeats: FeatRow[]
  onConfirmChoice: (choices: ClassChoiceMade | ClassChoiceMade[]) => void
}

export function ClassChoicesPanel({ pendingChoices, availableFeats, onConfirmChoice }: Props) {
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
            <div key={`${pc.classId}:${pc.type}:${pc.atLevel}:${i}`}>
              {pc.type === "asi" ? (
                <AsiPicker
                  classId={pc.classId}
                  className={pc.className}
                  atLevel={pc.atLevel}
                  availableFeats={availableFeats}
                  onConfirm={(c) => onConfirmChoice(c)}
                />
              ) : (
                <SkillPicker
                  classId={pc.classId}
                  className={pc.className}
                  skillOptions={pc.skillOptions ?? []}
                  skillsNeeded={pc.skillsNeeded ?? 1}
                  onConfirm={(cs) => onConfirmChoice(cs)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
