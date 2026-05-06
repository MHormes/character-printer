"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { X, Plus, RotateCcw, CircleDot, Circle, ChevronDown, ChevronRight, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SaveData, ModifierEntry } from "@/lib/types/character"

type SaveBlockProps = {
  label: string
  data: SaveData
  attrMod: number
  proficiencyBonus: number
  globalStack: ModifierEntry[]
  onProficiencyChange: (proficient: boolean) => void
  onStackChange: (stack: ModifierEntry[]) => void
  onOverrideChange: (override: number | null) => void
}

export function SaveBlock({
  label, data, attrMod, proficiencyBonus, globalStack,
  onProficiencyChange, onStackChange, onOverrideChange,
}: SaveBlockProps) {
  const [expanded, setExpanded] = useState(false)

  const stackTotal = data.stack.filter((m) => m.isActive).reduce((s, m) => s + m.value, 0)
  const globalTotal = globalStack.filter((m) => m.isActive).reduce((s, m) => s + m.value, 0)
  const calculated = attrMod + (data.proficient ? proficiencyBonus : 0) + stackTotal + globalTotal
  const isOverridden = data.override !== null

  function toggleProficiency() {
    const delta = data.proficient ? -proficiencyBonus : proficiencyBonus
    onProficiencyChange(!data.proficient)
    if (data.override !== null) onOverrideChange(data.override + delta)
  }

  function addModifier() {
    onStackChange([...data.stack, { id: crypto.randomUUID(), source: "", value: 0, isActive: true }])
  }

  function removeModifier(id: string) {
    onStackChange(data.stack.filter((m) => m.id !== id))
  }

  function updateSource(id: string, source: string) {
    onStackChange(data.stack.map((m) => m.id === id ? { ...m, source } : m))
  }

  function updateValue(id: string, value: number) {
    onStackChange(data.stack.map((m) => m.id === id ? { ...m, value } : m))
  }

  function toggleModifier(id: string) {
    const mod = data.stack.find((m) => m.id === id)
    if (!mod) return
    const delta = mod.isActive ? -mod.value : mod.value
    onStackChange(data.stack.map((m) => m.id === id ? { ...m, isActive: !m.isActive } : m))
    if (data.override !== null) onOverrideChange(data.override + delta)
  }

  function handleTotalChange(raw: string) {
    if (raw === "") { onOverrideChange(null); return }
    if (raw === "-") return
    if (!/^-?\d+$/.test(raw)) return
    const n = parseInt(raw, 10)
    if (!isNaN(n)) onOverrideChange(n)
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <button
          type="button"
          aria-label={data.proficient ? "Remove proficiency" : "Add proficiency"}
          onClick={toggleProficiency}
          className="flex size-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        >
          {data.proficient ? <CircleDot className="size-3" /> : <Circle className="size-3" />}
        </button>
      </div>

      {/* Modifier stack — collapsable */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex h-5 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        Modifiers
        {!expanded && data.stack.length > 0 && (
          <span className="ml-auto tabular-nums">
            {stackTotal >= 0 ? `+${stackTotal}` : stackTotal}
          </span>
        )}
      </button>

      {expanded && (
        <div className="flex flex-col gap-1.5">
          {data.stack.map((mod) =>
            mod.sourceId ? (
              <div key={mod.id} className={cn("flex items-center gap-1 rounded border border-border bg-muted/40 px-1.5 py-0.5", !mod.isActive && "opacity-40")}>
                <Lock className="size-2.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{mod.source}</span>
                <span className="shrink-0 tabular-nums text-xs text-foreground">
                  {mod.value >= 0 ? `+${mod.value}` : mod.value}
                </span>
                {mod.isActive ? <CircleDot className="size-2.5 shrink-0 text-muted-foreground" /> : <Circle className="size-2.5 shrink-0 text-muted-foreground" />}
              </div>
            ) : (
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
                      className="h-full min-w-0 flex-1 bg-transparent px-1.5 text-xs placeholder:text-foreground/30 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="mt-0.5 flex flex-col gap-0.5">
                  <button type="button" onClick={() => removeModifier(mod.id)}
                    className="flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                    <X className="size-2.5" />
                  </button>
                  <button type="button" onClick={() => toggleModifier(mod.id)}
                    className="flex size-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground">
                    {mod.isActive ? <CircleDot className="size-2.5" /> : <Circle className="size-2.5" />}
                  </button>
                </div>
              </div>
            )
          )}
          <button type="button" onClick={addModifier}
            className="flex h-6 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <Plus className="size-3" />
            Add modifier
          </button>
        </div>
      )}

      {/* Total — inline */}
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-xs text-muted-foreground">Total</span>
        <div className="relative min-w-0 flex-1">
          <input
            type="text"
            inputMode="numeric"
            value={isOverridden ? data.override! : ""}
            placeholder={calculated.toString()}
            onChange={(e) => handleTotalChange(e.target.value)}
            className={cn(
              "h-6 w-full rounded-md border border-input bg-background text-center text-xs transition-colors",
              "placeholder:text-foreground/30",
              "focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/50",
              "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
              isOverridden && "pr-5",
            )}
          />
          {isOverridden && (
            <button type="button" aria-label="Reset" onClick={() => onOverrideChange(null)}
              className="absolute right-1 top-1/2 -translate-y-1/2 flex size-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground">
              <RotateCcw className="size-2.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
