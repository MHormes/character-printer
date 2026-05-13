"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, GripVertical, X, Plus, CircleDot, Circle, RotateCcw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { TrackerEntry, TrackerBaseSource, AttributeKey, AttributeData } from "@/lib/types/character"
import { resolveTrackerBase } from "@/lib/character/calculations"
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import type { DragEndEvent } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

function sign(n: number) { return n >= 0 ? `+${n}` : String(n) }

type TrackersBlockProps = {
  trackers: TrackerEntry[]
  showManualControls: boolean
  attributes: Record<AttributeKey, AttributeData>
  level: number
  pb: number
  onChange: (list: TrackerEntry[]) => void
}

const RESET_CONDITIONS = ["Short Rest", "Long Rest", "Dawn", "Special"] as const

const ATTR_KEYS: AttributeKey[] = ["str", "dex", "con", "int", "wis", "cha"]
const ATTR_LABELS: Record<AttributeKey, string> = {
  str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA",
}

function sourceToValue(src?: TrackerBaseSource): string {
  if (!src || src.kind === "fixed") return "fixed"
  if (src.kind === "attr_mod") return `attr_mod:${src.attr}`
  return src.kind
}

function valueToSource(s: string): TrackerBaseSource {
  if (s === "fixed") return { kind: "fixed" }
  if (s.startsWith("attr_mod:")) return { kind: "attr_mod", attr: s.split(":")[1] as AttributeKey }
  if (s === "level") return { kind: "level" }
  if (s === "half_level_up") return { kind: "half_level_up" }
  if (s === "half_level_down") return { kind: "half_level_down" }
  if (s === "prof_bonus") return { kind: "prof_bonus" }
  return { kind: "fixed" }
}

function sourceLabel(src?: TrackerBaseSource): string {
  if (!src || src.kind === "fixed") return "Fixed"
  if (src.kind === "attr_mod") return `${ATTR_LABELS[src.attr]} mod`
  if (src.kind === "level") return "Level"
  if (src.kind === "half_level_up") return "½ level ↑"
  if (src.kind === "half_level_down") return "½ level ↓"
  if (src.kind === "prof_bonus") return "Prof bonus"
  return "Fixed"
}

type SortableTrackerItemProps = {
  tracker: TrackerEntry
  expanded: boolean
  stackExpanded: boolean
  showManualControls: boolean
  attributes: Record<AttributeKey, AttributeData>
  level: number
  pb: number
  onToggleExpand: () => void
  onToggleStack: () => void
  onPatch: (update: Partial<TrackerEntry>) => void
  onDelete: () => void
}

function SortableTrackerItem({
  tracker, expanded, stackExpanded, showManualControls, attributes, level, pb,
  onToggleExpand, onToggleStack, onPatch, onDelete,
}: SortableTrackerItemProps) {
  const { attributes: dndAttrs, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tracker.id })

  const resolvedBase = resolveTrackerBase(tracker, attributes, level, pb)
  const ghostTotal = resolvedBase + tracker.stack.filter(m => m.isActive).reduce((s, m) => s + m.value, 0)
  const total = tracker.override ?? ghostTotal
  const isFixed = !tracker.baseSource || tracker.baseSource.kind === "fixed"

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("rounded-lg border border-border bg-card", isDragging && "opacity-50")}
    >
      <div className="flex items-center gap-2 p-2">
        <button type="button" {...dndAttrs} {...listeners}
          className="shrink-0 cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground">
          <GripVertical className="size-3.5" />
        </button>
        <button type="button" onClick={onToggleExpand}
          className="shrink-0 text-muted-foreground transition-colors hover:text-foreground">
          {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </button>
        <Input type="text" value={tracker.name} placeholder="Resource name"
          onChange={e => onPatch({ name: e.target.value })}
          className="h-6 min-w-0 flex-1 text-xs" />
        {!expanded && (
          <>
            {!isFixed && (
              <span className="shrink-0 rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {sourceLabel(tracker.baseSource)}
              </span>
            )}
            <span className="shrink-0 rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {tracker.reset}
            </span>
          </>
        )}
        <span className={`shrink-0 tabular-nums text-sm font-semibold ${tracker.override !== null ? "text-amber-500" : ""}`}>
          {total}
        </span>
        <button type="button" onClick={onDelete}
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
              onChange={e => onPatch({ reset: e.target.value as TrackerEntry["reset"] })}
              className="h-6 flex-1 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:border-ring"
            >
              {RESET_CONDITIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-xs text-muted-foreground">Base</span>
            <select
              value={sourceToValue(tracker.baseSource)}
              onChange={e => onPatch({ baseSource: valueToSource(e.target.value), override: null })}
              className="h-6 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:border-ring"
            >
              <option value="fixed">Fixed</option>
              <optgroup label="Attribute modifier">
                {ATTR_KEYS.map(k => (
                  <option key={k} value={`attr_mod:${k}`}>{ATTR_LABELS[k]} modifier</option>
                ))}
              </optgroup>
              <optgroup label="Level">
                <option value="level">Character level</option>
                <option value="half_level_up">Half level (round up)</option>
                <option value="half_level_down">Half level (round down)</option>
              </optgroup>
              <optgroup label="Other">
                <option value="prof_bonus">Proficiency bonus</option>
              </optgroup>
            </select>
            {isFixed ? (
              <input type="number" value={tracker.base} min={0}
                onChange={e => onPatch({ base: parseInt(e.target.value) || 0, override: null })}
                className="h-6 w-16 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:border-ring"
              />
            ) : (
              <span className="flex h-6 w-16 items-center justify-center rounded-md border border-input bg-muted/40 px-2 text-xs tabular-nums text-muted-foreground">
                {resolvedBase}
              </span>
            )}
          </div>

          {showManualControls && (
            <>
              <button type="button" onClick={onToggleStack}
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
                          onChange={e => onPatch({ stack: tracker.stack.map(m => m.id === mod.id ? { ...m, source: e.target.value } : m) })}
                          className="h-6 text-xs" />
                        <div className="flex h-6 items-center rounded-md border border-input bg-background focus-within:border-ring">
                          <span className="select-none pl-2 text-xs text-muted-foreground">+</span>
                          <input type="text" inputMode="numeric"
                            value={mod.value === 0 ? "" : String(mod.value)} placeholder="0"
                            onChange={e => {
                              const raw = e.target.value
                              if (raw === "" || raw === "-") return
                              const n = parseInt(raw, 10)
                              if (!isNaN(n)) onPatch({ stack: tracker.stack.map(m => m.id === mod.id ? { ...m, value: n } : m) })
                            }}
                            className="h-full min-w-0 flex-1 bg-transparent px-1.5 text-xs placeholder:text-card-foreground/40 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="mt-0.5 flex flex-col gap-0.5">
                        <button type="button"
                          onClick={() => onPatch({ stack: tracker.stack.filter(m => m.id !== mod.id) })}
                          className="flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                          <X className="size-2.5" />
                        </button>
                        <button type="button"
                          onClick={() => onPatch({ stack: tracker.stack.map(m => m.id === mod.id ? { ...m, isActive: !m.isActive } : m) })}
                          className="flex size-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground">
                          {mod.isActive ? <CircleDot className="size-2.5" /> : <Circle className="size-2.5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                  <button type="button"
                    onClick={() => onPatch({ stack: [...tracker.stack, { id: crypto.randomUUID(), source: "", value: 0, isActive: true }] })}
                    className="flex h-6 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
                    <Plus className="size-3" />
                    Add modifier
                  </button>
                </div>
              )}
            </>
          )}

          <div className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-xs text-muted-foreground">Total</span>
            {showManualControls ? (
              <div className="flex items-center gap-1">
                <input type="text" inputMode="numeric"
                  value={tracker.override !== null ? String(tracker.override) : String(ghostTotal)}
                  onChange={e => {
                    const raw = e.target.value
                    if (raw === "") { onPatch({ override: null }); return }
                    const n = parseInt(raw, 10)
                    if (!isNaN(n)) onPatch({ override: n })
                  }}
                  className={`h-6 w-14 rounded-md border bg-background px-2 text-xs tabular-nums focus:outline-none focus:border-ring ${tracker.override !== null ? "border-amber-500/50 text-amber-600" : "border-input"}`}
                />
                {tracker.override !== null && (
                  <button type="button" onClick={() => onPatch({ override: null })}
                    title="Revert to calculated"
                    className="text-muted-foreground transition-colors hover:text-foreground">
                    <RotateCcw className="size-3" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex h-6 min-w-14 items-center justify-center rounded-md border border-input bg-background px-2 text-xs font-medium tabular-nums text-foreground">
                {total}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function TrackersBlock({ trackers, showManualControls, attributes, level, pb, onChange }: TrackersBlockProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [stackExpandedIds, setStackExpandedIds] = useState<Set<string>>(new Set())

  const sensors = useSensors(useSensor(PointerSensor))

  function toggleExpand(id: string) {
    setExpandedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleStack(id: string) {
    setStackExpandedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function patch(id: string, update: Partial<TrackerEntry>) {
    onChange(trackers.map(t => t.id === id ? { ...t, ...update } : t))
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIdx = trackers.findIndex(t => t.id === active.id)
    const newIdx = trackers.findIndex(t => t.id === over.id)
    onChange(arrayMove(trackers, oldIdx, newIdx))
  }

  function addTracker() {
    const id = crypto.randomUUID()
    onChange([...trackers, { id, name: "", base: 0, baseSource: { kind: "fixed" }, stack: [], reset: "Long Rest", override: null, valueLabel: "" }])
    setExpandedIds(prev => new Set([...prev, id]))
  }

  return (
    <div className="space-y-1.5">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={trackers.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {trackers.map(tracker => (
            <SortableTrackerItem
              key={tracker.id}
              tracker={tracker}
              expanded={expandedIds.has(tracker.id)}
              stackExpanded={stackExpandedIds.has(tracker.id)}
              showManualControls={showManualControls}
              attributes={attributes}
              level={level}
              pb={pb}
              onToggleExpand={() => toggleExpand(tracker.id)}
              onToggleStack={() => toggleStack(tracker.id)}
              onPatch={update => patch(tracker.id, update)}
              onDelete={() => onChange(trackers.filter(t => t.id !== tracker.id))}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button type="button" onClick={addTracker}
        className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground">
        <Plus className="size-3.5" />
        Add tracker
      </button>
    </div>
  )
}
