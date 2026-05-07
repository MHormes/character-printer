"use client"

import { RotateCcw, X, Plus, CircleDot, CheckCircle2, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import type { OtherProficiency, AttributeKey, AttributeData } from "@/lib/types/character"
import { resolveAttributeMod } from "@/lib/character/calculations"
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import type { DragEndEvent } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

const CATEGORIES: OtherProficiency["category"][] = ["Tool", "Language", "Vehicle", "Weapon", "Armor"]
const ATTR_KEYS: AttributeKey[] = ["str", "dex", "con", "int", "wis", "cha"]
const ATTR_ABBR: Record<AttributeKey, string> = {
  str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA",
}
const ROLL_CATEGORIES: OtherProficiency["category"][] = ["Tool", "Vehicle"]

function hasRoll(category: OtherProficiency["category"]): boolean {
  return ROLL_CATEGORIES.includes(category)
}

function calcModifier(prof: OtherProficiency, attributes: Record<AttributeKey, AttributeData>, pb: number): number {
  const statBonus = prof.stat !== null ? resolveAttributeMod(attributes[prof.stat]) : 0
  const trainingBonus = prof.training === "Expertise" ? pb * 2 : pb
  return statBonus + trainingBonus
}

type OtherProficienciesBlockProps = {
  proficiencies: OtherProficiency[]
  attributes: Record<AttributeKey, AttributeData>
  proficiencyBonus: number
  onChange: (list: OtherProficiency[]) => void
}

export function OtherProficienciesBlock({ proficiencies, attributes, proficiencyBonus, onChange }: OtherProficienciesBlockProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function add() {
    onChange([...proficiencies, { id: crypto.randomUUID(), name: "", category: "Tool", training: "Proficient", stat: null, override: null }])
  }

  function remove(id: string) {
    onChange(proficiencies.filter(p => p.id !== id))
  }

  function update(id: string, patch: Partial<OtherProficiency>) {
    onChange(proficiencies.map(p => p.id === id ? { ...p, ...patch } : p))
  }

  function handleCategoryChange(prof: OtherProficiency, newCategory: OtherProficiency["category"]) {
    const patch: Partial<OtherProficiency> = { category: newCategory }
    if (!hasRoll(newCategory)) { patch.stat = null; patch.override = null }
    update(prof.id, patch)
  }

  function toggleTraining(prof: OtherProficiency) {
    const next = prof.training === "Proficient" ? "Expertise" : "Proficient"
    const delta = (next === "Expertise" ? proficiencyBonus * 2 : proficiencyBonus)
               - (prof.training === "Expertise" ? proficiencyBonus * 2 : proficiencyBonus)
    update(prof.id, { training: next, override: prof.override !== null ? prof.override + delta : null })
  }

  function handleOverrideChange(id: string, raw: string) {
    if (raw === "") { update(id, { override: null }); return }
    if (raw === "-") return
    if (!/^-?\d+$/.test(raw)) return
    const n = parseInt(raw, 10)
    if (!isNaN(n)) update(id, { override: n })
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIdx = proficiencies.findIndex(p => p.id === active.id)
    const newIdx = proficiencies.findIndex(p => p.id === over.id)
    onChange(arrayMove(proficiencies, oldIdx, newIdx))
  }

  return (
    <div className="flex flex-col gap-2">
      {proficiencies.length === 0 && (
        <p className="text-xs text-muted-foreground">No proficiencies added yet.</p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={proficiencies.map(p => p.id)} strategy={verticalListSortingStrategy}>
          {proficiencies.map(prof => (
            <SortableProfItem
              key={prof.id}
              prof={prof}
              attributes={attributes}
              proficiencyBonus={proficiencyBonus}
              onUpdate={(patch) => update(prof.id, patch)}
              onRemove={() => remove(prof.id)}
              onCategoryChange={(cat) => handleCategoryChange(prof, cat)}
              onToggleTraining={() => toggleTraining(prof)}
              onOverrideChange={(raw) => handleOverrideChange(prof.id, raw)}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={add}
        className="flex h-7 items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <Plus className="size-3.5" />
        Add proficiency
      </button>
    </div>
  )
}

type SortableProfItemProps = {
  prof: OtherProficiency
  attributes: Record<AttributeKey, AttributeData>
  proficiencyBonus: number
  onUpdate: (patch: Partial<OtherProficiency>) => void
  onRemove: () => void
  onCategoryChange: (cat: OtherProficiency["category"]) => void
  onToggleTraining: () => void
  onOverrideChange: (raw: string) => void
}

function SortableProfItem({ prof, attributes, proficiencyBonus, onUpdate, onRemove, onCategoryChange, onToggleTraining, onOverrideChange }: SortableProfItemProps) {
  const { attributes: dndAttrs, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: prof.id })
  const roll = hasRoll(prof.category)
  const calc = calcModifier(prof, attributes, proficiencyBonus)
  const isOverridden = prof.override !== null

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex flex-col gap-1.5 rounded-lg border border-border bg-card p-2", isDragging && "opacity-50")}
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          {...listeners}
          {...dndAttrs}
          className="shrink-0 cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="size-3.5" />
        </button>
        <Input
          type="text"
          value={prof.name}
          placeholder="Name"
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="h-7 min-w-0 flex-1 text-xs"
        />
        <button
          type="button"
          onClick={onRemove}
          className="flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="size-3" />
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <select
          value={prof.category}
          onChange={(e) => onCategoryChange(e.target.value as OtherProficiency["category"])}
          className="h-6 min-w-0 flex-[2] rounded-md border border-input bg-background px-1.5 text-xs text-foreground focus:outline-none focus:border-ring"
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {roll && (
          <>
            <button
              type="button"
              aria-label={`Training: ${prof.training}`}
              onClick={onToggleTraining}
              className={cn(
                "flex size-5 shrink-0 items-center justify-center transition-colors",
                prof.training === "Proficient" ? "text-informative" : "text-destructive",
              )}
            >
              {prof.training === "Proficient" ? <CircleDot className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
            </button>

            <select
              value={prof.stat ?? ""}
              onChange={(e) => onUpdate({ stat: e.target.value === "" ? null : e.target.value as AttributeKey })}
              className="h-6 min-w-0 flex-1 rounded-md border border-input bg-background px-1.5 text-xs text-foreground focus:outline-none focus:border-ring"
            >
              <option value="">—</option>
              {ATTR_KEYS.map(k => <option key={k} value={k}>{ATTR_ABBR[k]}</option>)}
            </select>

            <div className="relative min-w-[3rem] flex-1">
              <input
                type="text"
                inputMode="numeric"
                value={isOverridden ? prof.override! : ""}
                placeholder={calc >= 0 ? `+${calc}` : String(calc)}
                onChange={(e) => onOverrideChange(e.target.value)}
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
                  aria-label="Reset"
                  onClick={() => onUpdate({ override: null })}
                  className="absolute right-0.5 top-1/2 -translate-y-1/2 flex size-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                >
                  <RotateCcw className="size-2.5" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
