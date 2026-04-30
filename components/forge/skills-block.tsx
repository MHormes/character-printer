"use client"

import { RotateCcw, Circle, CircleDot, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AttributeKey, AttributeData, SkillData, SkillState } from "@/lib/types/character"

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
  onStateChange: (key: string, state: SkillState) => void
  onOverrideChange: (key: string, override: number | null) => void
}

export function SkillsBlock({
  skills, attributes, proficiencyBonus, onStateChange, onOverrideChange,
}: SkillsBlockProps) {
  function attrMod(attr: AttributeKey): number {
    const a = attributes[attr]
    const sum = a.stack.filter((m) => m.isActive).reduce((s, m) => s + m.value, 0)
    const total = a.override ?? (a.base + sum)
    return Math.floor((total - 10) / 2)
  }

  function calculated(key: string, attr: AttributeKey, state: SkillState): number {
    return attrMod(attr) + stateBonus(state, proficiencyBonus)
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

  return (
    <div className="flex flex-col gap-1">
      {SKILLS.map(({ key, meta }) => {
        const skill = skills[key]
        if (!skill) return null
        const calc = calculated(key, meta.attr, skill.state)
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
    </div>
  )
}
