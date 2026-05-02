"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, X, Plus, CircleDot, Circle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { ActionEntry, AttributeKey, AttributeData } from "@/lib/types/character"

const ATTR_KEYS: AttributeKey[] = ["str", "dex", "con", "int", "wis", "cha"]
const ATTR_ABBR: Record<AttributeKey, string> = {
  str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA",
}

function sign(n: number): string {
  return n >= 0 ? `+${n}` : String(n)
}

type ActionsBlockProps = {
  actions: ActionEntry[]
  castingStat: AttributeKey | null
  attributes: Record<AttributeKey, AttributeData>
  proficiencyBonus: number
  onChange: (list: ActionEntry[]) => void
  onCastingStatChange: (stat: AttributeKey | null) => void
}

export function ActionsBlock({
  actions, castingStat, attributes, proficiencyBonus, onChange, onCastingStatChange,
}: ActionsBlockProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const castingMod = (() => {
    if (!castingStat) return 0
    const a = attributes[castingStat]
    const sum = a.stack.filter((m) => m.isActive).reduce((s, m) => s + m.value, 0)
    const score = a.override ?? (a.base + sum)
    return Math.floor((score - 10) / 2)
  })()

  const spellDC = 8 + proficiencyBonus + castingMod
  const attackBonus = proficiencyBonus + castingMod

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function patchAction(id: string, patch: Partial<ActionEntry>) {
    onChange(actions.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  }

  function addAction() {
    const id = crypto.randomUUID()
    onChange([...actions, { id, name: "", mode: "Standard", fixedValue: null, damageStack: [], notes: "" }])
    setExpandedIds((prev) => new Set([...prev, id]))
  }

  return (
    <div className="space-y-3">
      {/* Global casting */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Casting stat</span>
          <select
            value={castingStat ?? ""}
            onChange={(e) => onCastingStatChange(e.target.value ? (e.target.value as AttributeKey) : null)}
            className="h-6 rounded-md border border-input bg-background px-1.5 text-xs text-foreground focus:outline-none focus:border-ring"
          >
            <option value="">—</option>
            {ATTR_KEYS.map((k) => (
              <option key={k} value={k}>{ATTR_ABBR[k]}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">Spell DC</span>
          <span className="font-semibold tabular-nums">{spellDC}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">Attack</span>
          <span className="font-semibold tabular-nums">{sign(attackBonus)}</span>
        </div>
      </div>

      {/* Action list */}
      <div className="space-y-1.5">
        {actions.map((action) => {
          const expanded = expandedIds.has(action.id)
          return (
            <div key={action.id} className="rounded-lg border border-border bg-card">
              {/* Header row */}
              <div className="flex items-center gap-2 p-2">
                <button type="button" onClick={() => toggleExpand(action.id)}
                  className="shrink-0 text-muted-foreground transition-colors hover:text-foreground">
                  {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                </button>
                <Input
                  type="text"
                  value={action.name}
                  placeholder="Action name"
                  onChange={(e) => patchAction(action.id, { name: e.target.value })}
                  className="h-6 min-w-0 flex-1 text-xs"
                />
                <span className={cn(
                  "shrink-0 rounded px-1.5 py-0.5 text-[10px]",
                  action.mode === "Standard" ? "bg-foreground/10 text-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {action.mode}
                </span>
                {!expanded && action.mode !== "Standard" && action.fixedValue !== null && (
                  <span className="shrink-0 tabular-nums text-xs text-muted-foreground">{sign(action.fixedValue)}</span>
                )}
                <button type="button"
                  onClick={() => onChange(actions.filter((a) => a.id !== action.id))}
                  className="flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                  <X className="size-3" />
                </button>
              </div>

              {expanded && (
                <div className="space-y-3 border-t border-border p-3">
                  {/* Mode selector */}
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-xs text-muted-foreground">Mode</span>
                    <div className="flex overflow-hidden rounded-md border border-input">
                      {(["Standard", "Fixed", "Manual"] as ActionEntry["mode"][]).map((m) => (
                        <button key={m} type="button"
                          onClick={() => patchAction(action.id, { mode: m, fixedValue: null })}
                          className={cn(
                            "h-5 px-2 text-[10px] transition-colors",
                            m === action.mode
                              ? "bg-foreground text-background"
                              : "text-muted-foreground hover:text-foreground",
                          )}>
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* To Hit / DC */}
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-xs text-muted-foreground">To Hit / DC</span>
                    {action.mode === "Standard" ? (
                      <div className="flex gap-3 text-xs">
                        <span className="text-muted-foreground">DC <span className="font-semibold text-foreground tabular-nums">{spellDC}</span></span>
                        <span className="text-muted-foreground">Hit <span className="font-semibold text-foreground tabular-nums">{sign(attackBonus)}</span></span>
                      </div>
                    ) : (
                      <input
                        type="text" inputMode="numeric"
                        value={action.fixedValue ?? ""}
                        placeholder={sign(attackBonus)}
                        onChange={(e) => {
                          const raw = e.target.value
                          if (raw === "") { patchAction(action.id, { fixedValue: null }); return }
                          if (raw === "-") return
                          if (!/^-?\d+$/.test(raw)) return
                          const n = parseInt(raw, 10)
                          if (!isNaN(n)) patchAction(action.id, { fixedValue: n })
                        }}
                        className="h-6 w-16 rounded-md border border-input bg-background text-center text-xs focus:outline-none focus:border-ring"
                      />
                    )}
                  </div>

                  {/* Damage stack */}
                  <div className="space-y-1.5">
                    <span className="text-xs text-muted-foreground">Damage</span>
                    {action.damageStack.map((dmg, i) => (
                      <div key={i} className={cn("flex items-center gap-1.5", !dmg.active && "opacity-40")}>
                        <input type="text"
                          value={dmg.formula} placeholder="2d6 + Str"
                          onChange={(e) => {
                            const updated = action.damageStack.map((d, j) => j === i ? { ...d, formula: e.target.value } : d)
                            patchAction(action.id, { damageStack: updated })
                          }}
                          className="h-6 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:border-ring"
                        />
                        <input type="text"
                          value={dmg.type} placeholder="Slashing"
                          onChange={(e) => {
                            const updated = action.damageStack.map((d, j) => j === i ? { ...d, type: e.target.value } : d)
                            patchAction(action.id, { damageStack: updated })
                          }}
                          className="h-6 w-20 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:border-ring"
                        />
                        <button type="button"
                          onClick={() => {
                            const updated = action.damageStack.map((d, j) => j === i ? { ...d, active: !d.active } : d)
                            patchAction(action.id, { damageStack: updated })
                          }}
                          className="flex size-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground">
                          {dmg.active ? <CircleDot className="size-2.5" /> : <Circle className="size-2.5" />}
                        </button>
                        <button type="button"
                          onClick={() => patchAction(action.id, { damageStack: action.damageStack.filter((_, j) => j !== i) })}
                          className="flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                          <X className="size-2.5" />
                        </button>
                      </div>
                    ))}
                    <button type="button"
                      onClick={() => patchAction(action.id, { damageStack: [...action.damageStack, { formula: "", type: "", active: true }] })}
                      className="flex h-6 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
                      <Plus className="size-3" />
                      Add damage
                    </button>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Notes</span>
                    <textarea
                      value={action.notes}
                      placeholder="Range, save type, conditions..."
                      onChange={(e) => patchAction(action.id, { notes: e.target.value })}
                      rows={2}
                      className="w-full resize-none rounded-md border border-input bg-background p-2 text-xs focus:outline-none focus:border-ring"
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}

        <button type="button" onClick={addAction}
          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground">
          <Plus className="size-3.5" />
          Add action
        </button>
      </div>
    </div>
  )
}
