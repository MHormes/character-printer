"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { RotateCcw, CircleDot, Circle, X, Plus, ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AttributeKey, AttributeData, SaveData, ModifierEntry } from "@/lib/types/character"

const ATTR_KEYS: AttributeKey[] = ["str", "dex", "con", "int", "wis", "cha"]
const ATTR_ABBR: Record<AttributeKey, string> = {
  str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA",
}

type SavesBlockProps = {
  saves: Record<AttributeKey, SaveData>
  attributes: Record<AttributeKey, AttributeData>
  globalStack: ModifierEntry[]
  proficiencyBonus: number
  onProficiencyChange: (attr: AttributeKey, proficient: boolean) => void
  onSaveStackChange: (attr: AttributeKey, stack: ModifierEntry[]) => void
  onSaveOverrideChange: (attr: AttributeKey, override: number | null) => void
  onGlobalStackChange: (stack: ModifierEntry[]) => void
}

function ModifierStack({
  stack,
  onChange,
  onToggle,
}: {
  stack: ModifierEntry[]
  onChange: (stack: ModifierEntry[]) => void
  onToggle: (id: string) => void
}) {
  function add() {
    onChange([...stack, { id: crypto.randomUUID(), source: "", value: 0, isActive: true }])
  }
  function remove(id: string) { onChange(stack.filter((m) => m.id !== id)) }
  function updateSource(id: string, source: string) { onChange(stack.map((m) => m.id === id ? { ...m, source } : m)) }
  function updateValue(id: string, value: number) { onChange(stack.map((m) => m.id === id ? { ...m, value } : m)) }

  return (
    <div className="flex flex-col gap-1.5">
      {stack.map((mod) => (
        <div key={mod.id} className={cn("flex items-start gap-1", !mod.isActive && "opacity-40")}>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Input
              type="text"
              value={mod.source}
              onChange={(e) => updateSource(mod.id, e.target.value)}
              placeholder="Source"
              className="h-6 text-xs"
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
                  if (raw === "") { updateValue(mod.id, 0); return }
                  if (raw === "-") return
                  const n = parseInt(raw, 10)
                  if (!isNaN(n)) updateValue(mod.id, n)
                }}
                onBlur={(e) => { if (e.target.value === "-") updateValue(mod.id, 0) }}
                className="h-full min-w-0 flex-1 bg-transparent px-1.5 text-xs placeholder:text-card-foreground/40 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-0.5 flex flex-col gap-0.5">
            <button type="button" onClick={() => remove(mod.id)}
              className="flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
              <X className="size-2.5" />
            </button>
            <button type="button" onClick={() => onToggle(mod.id)}
              className="flex size-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground">
              {mod.isActive ? <CircleDot className="size-2.5" /> : <Circle className="size-2.5" />}
            </button>
          </div>
        </div>
      ))}
      <button type="button" onClick={add}
        className="flex h-6 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
        <Plus className="size-3" />
        Add modifier
      </button>
    </div>
  )
}

export function SavesBlock({
  saves, attributes, globalStack, proficiencyBonus,
  onProficiencyChange, onSaveStackChange, onSaveOverrideChange, onGlobalStackChange,
}: SavesBlockProps) {
  const [expandedAttr, setExpandedAttr] = useState<AttributeKey | null>(null)
  const [globalExpanded, setGlobalExpanded] = useState(false)

  function attrTotal(attr: AttributeKey) {
    const a = attributes[attr]
    const sum = a.stack.filter((m) => m.isActive).reduce((s, m) => s + m.value, 0)
    return a.override ?? (a.base + sum)
  }

  function saveCalc(attr: AttributeKey) {
    const attrMod = Math.floor((attrTotal(attr) - 10) / 2)
    const saveStack = saves[attr].stack.filter((m) => m.isActive).reduce((s, m) => s + m.value, 0)
    const globalSum = globalStack.filter((m) => m.isActive).reduce((s, m) => s + m.value, 0)
    return attrMod + (saves[attr].proficient ? proficiencyBonus : 0) + saveStack + globalSum
  }

  function handleOverrideChange(attr: AttributeKey, raw: string) {
    if (raw === "") { onSaveOverrideChange(attr, null); return }
    const n = parseInt(raw, 10)
    if (!isNaN(n)) onSaveOverrideChange(attr, n)
  }

  function toggleProficiency(attr: AttributeKey) {
    const save = saves[attr]
    const delta = save.proficient ? -proficiencyBonus : proficiencyBonus
    onProficiencyChange(attr, !save.proficient)
    if (save.override !== null) onSaveOverrideChange(attr, save.override + delta)
  }

  function toggleSaveModifier(attr: AttributeKey, id: string) {
    const save = saves[attr]
    const mod = save.stack.find((m) => m.id === id)
    if (!mod) return
    const delta = mod.isActive ? -mod.value : mod.value
    onSaveStackChange(attr, save.stack.map((m) => m.id === id ? { ...m, isActive: !m.isActive } : m))
    if (save.override !== null) onSaveOverrideChange(attr, save.override + delta)
  }

  return (
    <div className="flex flex-col gap-2">
      {ATTR_KEYS.map((attr) => {
        const save = saves[attr]
        const calc = saveCalc(attr)
        const isOverridden = save.override !== null
        const expanded = expandedAttr === attr
        const stackTotal = save.stack.filter((m) => m.isActive).reduce((s, m) => s + m.value, 0)

        return (
          <div key={attr} className="flex flex-col gap-1">
            {/* Save row */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={save.proficient ? "Remove proficiency" : "Add proficiency"}
                onClick={() => toggleProficiency(attr)}
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center transition-colors",
                  save.proficient ? "text-informative" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {save.proficient ? <CircleDot className="size-3" /> : <Circle className="size-3" />}
              </button>

              <span className="w-7 shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                {ATTR_ABBR[attr]}
              </span>

              <div className="relative min-w-0 flex-1">
                <input
                  type="number"
                  value={isOverridden ? save.override! : ""}
                  placeholder={calc.toString()}
                  onChange={(e) => handleOverrideChange(attr, e.target.value)}
                  className={cn(
                    "h-6 w-full rounded-md border border-input bg-background text-center text-xs transition-colors",
                    "placeholder:text-card-foreground/40",
                    "focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/50",
                    "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                    isOverridden && "pr-5",
                  )}
                />
                {isOverridden && (
                  <button type="button" aria-label="Reset" onClick={() => onSaveOverrideChange(attr, null)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 flex size-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground">
                    <RotateCcw className="size-2.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Modifiers toggle */}
            <button
              type="button"
              onClick={() => setExpandedAttr(expanded ? null : attr)}
              className="flex h-5 items-center gap-1 pl-6 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
              Modifiers
              {!expanded && save.stack.length > 0 && (
                <span className="ml-auto tabular-nums">
                  {stackTotal >= 0 ? `+${stackTotal}` : stackTotal}
                </span>
              )}
            </button>

            {expanded && (
              <div className="pl-6">
                <ModifierStack
                  stack={save.stack}
                  onChange={(stack) => onSaveStackChange(attr, stack)}
                  onToggle={(id) => toggleSaveModifier(attr, id)}
                />
              </div>
            )}
          </div>
        )
      })}

      {/* Global modifier stack */}
      <div className="mt-1 flex flex-col gap-1">
        <button
          type="button"
          onClick={() => setGlobalExpanded((v) => !v)}
          className="flex h-5 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {globalExpanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
          Global modifier
          {!globalExpanded && globalStack.length > 0 && (
            <span className="ml-auto tabular-nums">
              {globalStack.filter(m => m.isActive).reduce((s, m) => s + m.value, 0) >= 0
                ? `+${globalStack.filter(m => m.isActive).reduce((s, m) => s + m.value, 0)}`
                : globalStack.filter(m => m.isActive).reduce((s, m) => s + m.value, 0)}
            </span>
          )}
        </button>
        {globalExpanded && (
          <ModifierStack
            stack={globalStack}
            onChange={onGlobalStackChange}
            onToggle={(id) => {
              const mod = globalStack.find((m) => m.id === id)
              if (!mod) return
              onGlobalStackChange(globalStack.map((m) => m.id === id ? { ...m, isActive: !m.isActive } : m))
            }}
          />
        )}
      </div>
    </div>
  )
}
