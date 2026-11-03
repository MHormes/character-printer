"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Circle, CircleDot, GripVertical, Plus, RotateCcw, X } from "lucide-react"
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import type { DragEndEvent } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { DynamicValueInput } from "@/components/forge/dynamic-value-input"
import { resolveStatBoxTotal, resolveTrackerBase } from "@/lib/character/calculations"
import { cn } from "@/lib/utils"
import type { AttributeData, AttributeKey, StatBox, TrackerBaseSource } from "@/lib/types/character"

const ATTR_KEYS: AttributeKey[] = ["str", "dex", "con", "int", "wis", "cha"]
const ATTR_LABELS: Record<AttributeKey, string> = {
  str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA",
}

const NUM_INPUT =
  "h-6 rounded-md border border-input bg-background px-1.5 text-xs tabular-nums focus:outline-none focus:border-ring"

function sign(n: number) { return n >= 0 ? `+${n}` : String(n) }

/** Select value: "text" = plain text mode, otherwise a tracker-style base source. */
function statToSelectValue(stat: StatBox): string {
  if (!stat.calculated) return "text"
  const src = stat.baseSource
  if (!src || src.kind === "fixed") return "fixed"
  if (src.kind === "attr_mod") return `attr_mod:${src.attr}`
  return src.kind
}

function valueToSource(s: string): TrackerBaseSource {
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
  return "Prof bonus"
}

function calcLabel(stat: StatBox): string {
  if (!stat.baseSource || stat.baseSource.kind === "fixed") return "Fixed"
  const mult = stat.baseMultiplier ?? 1
  const off = stat.baseOffset ?? 0
  let label = mult !== 1 ? `${mult}×${sourceLabel(stat.baseSource)}` : sourceLabel(stat.baseSource)
  if (off !== 0) label += sign(off)
  return label
}

type SortableStatItemProps = {
  stat: StatBox
  expanded: boolean
  stackExpanded: boolean
  showManualControls: boolean
  attributes: Record<AttributeKey, AttributeData>
  level: number
  pb: number
  onToggleExpand: () => void
  onToggleStack: () => void
  onPatch: (update: Partial<StatBox>) => void
  onDelete: () => void
}

function SortableStatItem({
  stat, expanded, stackExpanded, showManualControls, attributes, level, pb,
  onToggleExpand, onToggleStack, onPatch, onDelete,
}: SortableStatItemProps) {
  const { attributes: dndAttrs, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stat.id })

  const isCalc = !!stat.calculated
  const stack = stat.stack ?? []
  const isFixed = !stat.baseSource || stat.baseSource.kind === "fixed"
  const resolvedBase = resolveTrackerBase(
    { base: stat.base ?? 0, baseSource: stat.baseSource, baseMultiplier: stat.baseMultiplier, baseOffset: stat.baseOffset },
    attributes, level, pb,
  )
  const ghostTotal = resolveStatBoxTotal({ ...stat, override: null }, attributes, level, pb)
  const hasOverride = stat.override != null
  const total = hasOverride ? stat.override! : ghostTotal

  function handleModeChange(v: string) {
    if (v === "text") {
      onPatch({ calculated: false })
      return
    }
    onPatch({
      calculated: true,
      base: stat.base ?? (parseInt(stat.value, 10) || 0),
      baseSource: valueToSource(v),
      baseMultiplier: 1,
      baseOffset: 0,
      stack: stat.stack ?? [],
      override: null,
    })
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("rounded-lg border border-border bg-card", isDragging && "opacity-50")}
    >
      <div className="flex items-center gap-2 p-2">
        <button type="button" {...dndAttrs} {...listeners}
          className="shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing">
          <GripVertical className="size-3.5" />
        </button>
        <button type="button" onClick={onToggleExpand}
          className="shrink-0 text-muted-foreground transition-colors hover:text-foreground">
          {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </button>
        <Input type="text" value={stat.title} placeholder="Title (e.g. Bardic Die)"
          onChange={(e) => onPatch({ title: e.target.value })}
          className="h-6 min-w-0 flex-1 text-xs" />
        {isCalc ? (
          <>
            {!expanded && (
              <span className="shrink-0 rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {calcLabel(stat)}
              </span>
            )}
            <span className="shrink-0 tabular-nums text-sm font-semibold">{total}</span>
          </>
        ) : (
          <Input type="text" value={stat.value} placeholder="Value (e.g. d8)"
            onChange={(e) => onPatch({ value: e.target.value })}
            className="h-6 w-24 shrink-0 text-xs" />
        )}
        <button type="button" onClick={onDelete}
          className="flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
          <X className="size-3" />
        </button>
      </div>

      {expanded && (
        <div className="space-y-2 border-t border-border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-16 shrink-0 text-xs text-muted-foreground">Value</span>
            <Select selectSize="sm" value={statToSelectValue(stat)} onChange={(e) => handleModeChange(e.target.value)}>
              <option value="text">Text</option>
              <option value="fixed">Fixed number</option>
              <optgroup label="Attribute modifier">
                {ATTR_KEYS.map((k) => (
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
            </Select>
            {isCalc && (isFixed ? (
              <input type="number" value={stat.base ?? 0}
                onChange={(e) => onPatch({ base: parseInt(e.target.value) || 0, override: null })}
                className={`${NUM_INPUT} w-16`} />
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">×</span>
                <input type="number" value={stat.baseMultiplier ?? 1}
                  onChange={(e) => onPatch({ baseMultiplier: parseFloat(e.target.value) || 1, override: null })}
                  className={`${NUM_INPUT} w-10`} />
                <span className="text-xs text-muted-foreground">+</span>
                <input type="number" value={stat.baseOffset ?? 0}
                  onChange={(e) => onPatch({ baseOffset: parseInt(e.target.value) || 0, override: null })}
                  className={`${NUM_INPUT} w-10`} />
                <span className="flex h-6 items-center justify-center rounded-md border border-input bg-muted/40 px-2 text-xs tabular-nums text-muted-foreground">
                  ={resolvedBase}
                </span>
              </div>
            ))}
          </div>

          {isCalc && showManualControls && (
            <>
              <button type="button" onClick={onToggleStack}
                className="flex h-5 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
                {stackExpanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                Modifiers
                {!stackExpanded && stack.length > 0 && (
                  <span className="ml-1 tabular-nums">{sign(ghostTotal - resolvedBase)}</span>
                )}
              </button>

              {stackExpanded && (
                <div className="flex flex-col gap-1.5 pl-4">
                  {stack.map((mod) => (
                    <div key={mod.id} className="flex items-start gap-1">
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <Input type="text" value={mod.source} placeholder="Source"
                          onChange={(e) => onPatch({ stack: stack.map((m) => m.id === mod.id ? { ...m, source: e.target.value } : m) })}
                          className="h-6 text-xs" />
                        <DynamicValueInput
                          value={mod.value}
                          valueSource={mod.valueSource}
                          valueMultiplier={mod.valueMultiplier}
                          valueOffset={mod.valueOffset}
                          attrs={attributes}
                          level={level}
                          pb={pb}
                          onChange={(v, vs, vm, vo) => onPatch({ stack: stack.map((m) => m.id === mod.id ? { ...m, value: v, valueSource: vs, valueMultiplier: vm, valueOffset: vo } : m) })}
                        />
                      </div>
                      <div className="mt-0.5 flex flex-col gap-0.5">
                        <button type="button"
                          onClick={() => onPatch({ stack: stack.filter((m) => m.id !== mod.id) })}
                          className="flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                          <X className="size-2.5" />
                        </button>
                        <button type="button"
                          onClick={() => onPatch({ stack: stack.map((m) => m.id === mod.id ? { ...m, isActive: !m.isActive } : m) })}
                          className="flex size-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground">
                          {mod.isActive ? <CircleDot className="size-2.5" /> : <Circle className="size-2.5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                  <button type="button"
                    onClick={() => onPatch({ stack: [...stack, { id: crypto.randomUUID(), source: "", value: 0, isActive: true }] })}
                    className="flex h-6 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
                    <Plus className="size-3" />
                    Add modifier
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="w-16 shrink-0 text-xs text-muted-foreground">Total</span>
                <input type="text" inputMode="numeric"
                  value={hasOverride ? String(stat.override) : String(ghostTotal)}
                  onChange={(e) => {
                    const raw = e.target.value
                    if (raw === "") { onPatch({ override: null }); return }
                    const n = parseInt(raw, 10)
                    if (!isNaN(n)) onPatch({ override: n })
                  }}
                  className={`${NUM_INPUT} w-14 px-2`} />
                {hasOverride && (
                  <button type="button" onClick={() => onPatch({ override: null })}
                    title="Revert to calculated"
                    className="text-muted-foreground transition-colors hover:text-foreground">
                    <RotateCcw className="size-3" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

type Props = {
  statBoxes: StatBox[]
  showManualControls: boolean
  attributes: Record<AttributeKey, AttributeData>
  level: number
  pb: number
  onChange: (list: StatBox[]) => void
}

export function StatBoxesBlock({ statBoxes, showManualControls, attributes, level, pb, onChange }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [stackExpandedIds, setStackExpandedIds] = useState<Set<string>>(new Set())

  const sensors = useSensors(useSensor(PointerSensor))

  function toggleIn(set: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) {
    set((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  function patch(id: string, update: Partial<StatBox>) {
    onChange(statBoxes.map((s) => (s.id === id ? { ...s, ...update } : s)))
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIdx = statBoxes.findIndex((s) => s.id === active.id)
    const newIdx = statBoxes.findIndex((s) => s.id === over.id)
    onChange(arrayMove(statBoxes, oldIdx, newIdx))
  }

  return (
    <div className="space-y-1.5">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={statBoxes.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {statBoxes.map((stat) => (
            <SortableStatItem
              key={stat.id}
              stat={stat}
              expanded={expandedIds.has(stat.id)}
              stackExpanded={stackExpandedIds.has(stat.id)}
              showManualControls={showManualControls}
              attributes={attributes}
              level={level}
              pb={pb}
              onToggleExpand={() => toggleIn(setExpandedIds, stat.id)}
              onToggleStack={() => toggleIn(setStackExpandedIds, stat.id)}
              onPatch={(update) => patch(stat.id, update)}
              onDelete={() => onChange(statBoxes.filter((s) => s.id !== stat.id))}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button type="button"
        onClick={() => onChange([...statBoxes, { id: crypto.randomUUID(), title: "", value: "" }])}
        className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground">
        <Plus className="size-3.5" />
        Add stat
      </button>
    </div>
  )
}
