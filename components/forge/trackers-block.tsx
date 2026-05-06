"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, X, Plus, CircleDot, Circle, RotateCcw } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { TrackerEntry } from "@/lib/types/character"

function sign(n: number) { return n >= 0 ? `+${n}` : String(n) }

type TrackersBlockProps = {
  trackers: TrackerEntry[]
  onChange: (list: TrackerEntry[]) => void
}

const RESET_CONDITIONS = ["Short Rest", "Long Rest", "Dawn", "Special"] as const

export function TrackersBlock({ trackers, onChange }: TrackersBlockProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [stackExpandedIds, setStackExpandedIds] = useState<Set<string>>(new Set())

  function toggleExpand(id: string) {
    setExpandedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleStack(id: string) {
    setStackExpandedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function patch(id: string, update: Partial<TrackerEntry>) {
    onChange(trackers.map(t => t.id === id ? { ...t, ...update } : t))
  }

  function addTracker() {
    const id = crypto.randomUUID()
    onChange([...trackers, { id, name: "", base: 0, stack: [], reset: "Long Rest", override: null }])
    setExpandedIds(prev => new Set([...prev, id]))
  }

  return (
    <div className="space-y-1.5">
      {trackers.map(tracker => {
        const ghostTotal = tracker.base + tracker.stack.filter(m => m.isActive).reduce((s, m) => s + m.value, 0)
        const total = tracker.override ?? ghostTotal
        const expanded = expandedIds.has(tracker.id)
        const stackExpanded = stackExpandedIds.has(tracker.id)

        return (
          <div key={tracker.id} className="rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 p-2">
              <button type="button" onClick={() => toggleExpand(tracker.id)}
                className="shrink-0 text-muted-foreground transition-colors hover:text-foreground">
                {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              </button>
              <Input type="text" value={tracker.name} placeholder="Resource name"
                onChange={e => patch(tracker.id, { name: e.target.value })}
                className="h-6 min-w-0 flex-1 text-xs" />
              {!expanded && (
                <span className="shrink-0 rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {tracker.reset}
                </span>
              )}
              <span className={`shrink-0 tabular-nums text-sm font-semibold ${tracker.override !== null ? "text-amber-500" : ""}`}>
                {total}
              </span>
              <button type="button" onClick={() => onChange(trackers.filter(t => t.id !== tracker.id))}
                className="flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                <X className="size-3" />
              </button>
            </div>

            {expanded && (
              <div className="space-y-2 border-t border-border p-3">
                <div className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-xs text-muted-foreground">Resets on</span>
                  <select
                    value={tracker.reset}
                    onChange={e => patch(tracker.id, { reset: e.target.value as TrackerEntry["reset"] })}
                    className="h-6 flex-1 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:border-ring"
                  >
                    {RESET_CONDITIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-xs text-muted-foreground">Base</span>
                  <input type="number" value={tracker.base} min={0}
                    onChange={e => patch(tracker.id, { base: parseInt(e.target.value) || 0, override: null })}
                    className="h-6 w-20 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:border-ring"
                  />
                </div>

                <button type="button" onClick={() => toggleStack(tracker.id)}
                  className="flex h-5 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
                  {stackExpanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                  Modifiers
                  {!stackExpanded && tracker.stack.length > 0 && (
                    <span className="ml-1 tabular-nums">
                      {sign(tracker.stack.filter(m => m.isActive).reduce((s, m) => s + m.value, 0))}
                    </span>
                  )}
                </button>

                {stackExpanded && (
                  <div className="flex flex-col gap-1.5 pl-4">
                    {tracker.stack.map(mod => (
                      <div key={mod.id} className="flex items-start gap-1">
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <Input type="text" value={mod.source} placeholder="Source"
                            onChange={e => patch(tracker.id, { stack: tracker.stack.map(m => m.id === mod.id ? { ...m, source: e.target.value } : m) })}
                            className="h-6 text-xs" />
                          <div className="flex h-6 items-center rounded-md border border-input bg-background focus-within:border-ring">
                            <span className="select-none pl-2 text-xs text-muted-foreground">+</span>
                            <input type="text" inputMode="numeric"
                              value={mod.value === 0 ? "" : String(mod.value)} placeholder="0"
                              onChange={e => {
                                const raw = e.target.value
                                if (raw === "" || raw === "-") return
                                const n = parseInt(raw, 10)
                                if (!isNaN(n)) patch(tracker.id, { stack: tracker.stack.map(m => m.id === mod.id ? { ...m, value: n } : m) })
                              }}
                              className="h-full min-w-0 flex-1 bg-transparent px-1.5 text-xs placeholder:text-foreground/30 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="mt-0.5 flex flex-col gap-0.5">
                          <button type="button"
                            onClick={() => patch(tracker.id, { stack: tracker.stack.filter(m => m.id !== mod.id) })}
                            className="flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                            <X className="size-2.5" />
                          </button>
                          <button type="button"
                            onClick={() => patch(tracker.id, { stack: tracker.stack.map(m => m.id === mod.id ? { ...m, isActive: !m.isActive } : m) })}
                            className="flex size-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground">
                            {mod.isActive ? <CircleDot className="size-2.5" /> : <Circle className="size-2.5" />}
                          </button>
                        </div>
                      </div>
                    ))}
                    <button type="button"
                      onClick={() => patch(tracker.id, { stack: [...tracker.stack, { id: crypto.randomUUID(), source: "", value: 0, isActive: true }] })}
                      className="flex h-6 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
                      <Plus className="size-3" />
                      Add modifier
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-xs text-muted-foreground">Total</span>
                  <div className="flex items-center gap-1">
                    <input type="text" inputMode="numeric"
                      value={tracker.override !== null ? String(tracker.override) : String(ghostTotal)}
                      onChange={e => {
                        const raw = e.target.value
                        if (raw === "") { patch(tracker.id, { override: null }); return }
                        const n = parseInt(raw, 10)
                        if (!isNaN(n)) patch(tracker.id, { override: n })
                      }}
                      className={`h-6 w-14 rounded-md border bg-background px-2 text-xs tabular-nums focus:outline-none focus:border-ring ${tracker.override !== null ? "border-amber-500/50 text-amber-600" : "border-input"}`}
                    />
                    {tracker.override !== null && (
                      <button type="button" onClick={() => patch(tracker.id, { override: null })}
                        title="Revert to calculated"
                        className="text-muted-foreground transition-colors hover:text-foreground">
                        <RotateCcw className="size-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}

      <button type="button" onClick={addTracker}
        className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground">
        <Plus className="size-3.5" />
        Add tracker
      </button>
    </div>
  )
}
