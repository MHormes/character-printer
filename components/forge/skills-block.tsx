"use client"

import { useState } from "react"
import { RotateCcw, Circle, CircleDot, CheckCircle2, ChevronDown, ChevronRight, X, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { AttributeKey, AttributeData, SkillData, SkillState, ModifierEntry } from "@/lib/types/character"

type SkillMeta = { label: string; attr: AttributeKey }

const SKILLS: { key: string; meta: SkillMeta }[] = [
  { key: "acrobatics",     meta: { label: "Acrobatics",      attr: "dex" } },
  { key: "animalHandling", meta: { label: "Animal Handling",  attr: "wis" } },
  { key: "arcana",         meta: { label: "Arcana",           attr: "int" } },
  { key: "athletics",      meta: { label: "Athletics",        attr: "str" } },
  { key: "deception",      meta: { label: "Deception",        attr: "cha" } },
  { key: "history",        meta: { label: "History",          attr: "int" } },
  { key: "insight",        meta: { label: "Insight",          attr: "wis" } },
  { key: "intimidation",   meta: { label: "Intimidation",     attr: "cha" } },
  { key: "investigation",  meta: { label: "Investigation",    attr: "int" } },
  { key: "medicine",       meta: { label: "Medicine",         attr: "wis" } },
  { key: "nature",         meta: { label: "Nature",           attr: "int" } },
  { key: "perception",     meta: { label: "Perception",       attr: "wis" } },
  { key: "performance",    meta: { label: "Performance",      attr: "cha" } },
  { key: "persuasion",     meta: { label: "Persuasion",       attr: "cha" } },
  { key: "religion",       meta: { label: "Religion",         attr: "int" } },
  { key: "sleightOfHand",  meta: { label: "Sleight of Hand",  attr: "dex" } },
  { key: "stealth",        meta: { label: "Stealth",          attr: "dex" } },
  { key: "survival",       meta: { label: "Survival",         attr: "wis" } },
]

const NEXT_STATE: Record<SkillState, SkillState> = {
  None: "Proficient",
  Proficient: "Expertise",
  Expertise: "None",
}

function stateBonus(state: SkillState, pb: number): number {
  if (state === "Proficient") return pb
  if (state === "Expertise") return pb * 2
  return 0
}

type SkillsBlockProps = {
  skills: Record<string, SkillData>
  attributes: Record<AttributeKey, AttributeData>
  proficiencyBonus: number
  jackOfAllTrades: boolean
  globalStack: ModifierEntry[]
  onStateChange: (key: string, state: SkillState) => void
  onOverrideChange: (key: string, override: number | null) => void
  onJackOfAllTradesChange: (value: boolean) => void
  onGlobalStackChange: (stack: ModifierEntry[]) => void
}

export function SkillsBlock({
  skills, attributes, proficiencyBonus, jackOfAllTrades, globalStack,
  onStateChange, onOverrideChange, onJackOfAllTradesChange, onGlobalStackChange,
}: SkillsBlockProps) {
  const [globalExpanded, setGlobalExpanded] = useState(false)

  function attrMod(attr: AttributeKey): number {
    const a = attributes[attr]
    const sum = a.stack.filter((m) => m.isActive).reduce((s, m) => s + m.value, 0)
    const total = a.override ?? (a.base + sum)
    return Math.floor((total - 10) / 2)
  }

  const globalSum = globalStack.filter((m) => m.isActive).reduce((s, m) => s + m.value, 0)
  const joatBonus = Math.floor(proficiencyBonus / 2)

  function calculated(attr: AttributeKey, state: SkillState): number {
    const base = attrMod(attr) + stateBonus(state, proficiencyBonus) + globalSum
    if (jackOfAllTrades && state === "None") return base + joatBonus
    return base
  }

  function handleStateClick(key: string, current: SkillState, override: number | null) {
    const next = NEXT_STATE[current]
    const delta = stateBonus(next, proficiencyBonus) - stateBonus(current, proficiencyBonus)
    onStateChange(key, next)
    if (override !== null) onOverrideChange(key, override + delta)
  }

  function handleOverrideChange(key: string, raw: string) {
    if (raw === "") { onOverrideChange(key, null); return }
    const n = parseInt(raw, 10)
    if (!isNaN(n)) onOverrideChange(key, n)
  }

  function addGlobalMod() {
    onGlobalStackChange([...globalStack, { id: crypto.randomUUID(), source: "", value: 0, isActive: true }])
  }

  function removeGlobalMod(id: string) {
    onGlobalStackChange(globalStack.filter((m) => m.id !== id))
  }

  function updateGlobalMod(id: string, patch: Partial<ModifierEntry>) {
    onGlobalStackChange(globalStack.map((m) => m.id === id ? { ...m, ...patch } : m))
  }

  return (
    <div className="flex flex-col gap-1">
      {/* Jack of All Trades toggle */}
      <button
        type="button"
        onClick={() => onJackOfAllTradesChange(!jackOfAllTrades)}
        className={cn(
          "mb-1 flex h-6 items-center gap-1.5 rounded px-1 text-xs transition-colors",
          jackOfAllTrades ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground",
        )}
      >
        {jackOfAllTrades ? <CircleDot className="size-3" /> : <Circle className="size-3" />}
        Jack of All Trades
        {jackOfAllTrades && (
          <span className="ml-1 font-normal text-muted-foreground">+{joatBonus}</span>
        )}
      </button>

      {/* Skill rows */}
      {SKILLS.map(({ key, meta }) => {
        const skill = skills[key]
        if (!skill) return null
        const calc = calculated(meta.attr, skill.state)
        const isOverridden = skill.override !== null

        return (
          <div key={key} className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label={`Cycle proficiency: currently ${skill.state}`}
              onClick={() => handleStateClick(key, skill.state, skill.override)}
              className="flex size-4 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            >
              {skill.state === "None"       && <Circle       className="size-3" />}
              {skill.state === "Proficient" && <CircleDot    className="size-3" />}
              {skill.state === "Expertise"  && <CheckCircle2 className="size-3" />}
            </button>

            <span className={cn(
              "flex-1 truncate text-xs",
              skill.state === "None" ? "text-muted-foreground" : "text-foreground font-medium",
            )}>
              {meta.label}
            </span>

            <span className="w-6 shrink-0 text-center text-xs text-muted-foreground tabular-nums">
              {meta.attr.toUpperCase()}
            </span>

            <div className="relative w-12 shrink-0">
              <input
                type="number"
                value={isOverridden ? skill.override! : ""}
                placeholder={calc.toString()}
                onChange={(e) => handleOverrideChange(key, e.target.value)}
                className={cn(
                  "h-6 w-full rounded-md border border-input bg-background text-center text-xs transition-colors",
                  "placeholder:text-foreground/30",
                  "focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/50",
                  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                  isOverridden && "pr-4",
                )}
              />
              {isOverridden && (
                <button
                  type="button"
                  aria-label="Reset to calculated value"
                  onClick={() => onOverrideChange(key, null)}
                  className="absolute right-0.5 top-1/2 -translate-y-1/2 flex size-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                >
                  <RotateCcw className="size-2.5" />
                </button>
              )}
            </div>
          </div>
        )
      })}

      {/* Global modifier stack */}
      <div className="mt-2 flex flex-col gap-1">
        <button
          type="button"
          onClick={() => setGlobalExpanded((v) => !v)}
          className="flex h-5 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {globalExpanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
          Global modifier
          {!globalExpanded && globalSum !== 0 && (
            <span className="ml-auto tabular-nums">
              {globalSum >= 0 ? `+${globalSum}` : globalSum}
            </span>
          )}
        </button>

        {globalExpanded && (
          <div className="flex flex-col gap-1.5">
            {globalStack.map((mod) => (
              <div key={mod.id} className={cn("flex items-start gap-1", !mod.isActive && "opacity-40")}>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Input
                    type="text"
                    value={mod.source}
                    placeholder="Source"
                    className="h-6 text-xs"
                    onChange={(e) => updateGlobalMod(mod.id, { source: e.target.value })}
                  />
                  <div className="flex h-6 items-center rounded-md border border-input bg-background focus-within:border-ring">
                    <span className="select-none pl-2 text-xs text-muted-foreground">+</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={mod.value === 0 ? "" : String(mod.value)}
                      placeholder="0"
                      onChange={(e) => {
                        const raw = e.target.value
                        if (raw === "") { updateGlobalMod(mod.id, { value: 0 }); return }
                        if (raw === "-") return
                        const n = parseInt(raw, 10)
                        if (!isNaN(n)) updateGlobalMod(mod.id, { value: n })
                      }}
                      onBlur={(e) => { if (e.target.value === "-") updateGlobalMod(mod.id, { value: 0 }) }}
                      className="h-full min-w-0 flex-1 bg-transparent px-1.5 text-xs placeholder:text-foreground/30 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="mt-0.5 flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => removeGlobalMod(mod.id)}
                    className="flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="size-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateGlobalMod(mod.id, { isActive: !mod.isActive })}
                    className="flex size-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {mod.isActive ? <CircleDot className="size-2.5" /> : <Circle className="size-2.5" />}
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addGlobalMod}
              className="flex h-6 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Plus className="size-3" />
              Add modifier
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
