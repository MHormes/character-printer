"use client"

import { useState, useRef, useEffect } from "react"
import { RotateCcw, X, Plus, CircleDot, CheckCircle2, GripVertical, Search, Loader2, Check, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import type { OtherProficiency, AttributeKey, AttributeData } from "@/lib/types/character"
import { resolveAttributeMod } from "@/lib/character/calculations"
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import type { DragEndEvent } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { searchOtherProficiencies } from "@/lib/actions/5e-data"
import type { OtherProfResult } from "@/lib/actions/5e-data"

// ─── Proficiency Picker ───────────────────────────────────────────────────────

function ProficiencyPicker({
  proficiencies,
  system,
  onPick,
  onClose,
}: {
  proficiencies: OtherProficiency[]
  system?: string
  onPick: (result: OtherProfResult) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<OtherProficiency["category"] | "All">("All")
  const [results, setResults] = useState<OtherProfResult[]>([])
  const [loading, setLoading] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function runSearch(q: string, cat: OtherProficiency["category"] | "All") {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      const res = await searchOtherProficiencies({
        name: q || undefined,
        category: cat === "All" ? undefined : cat,
        system,
      })
      setResults(res)
      setLoading(false)
    }, 250)
  }

  useEffect(() => {
    runSearch("", "All")
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleQueryChange(q: string) {
    setQuery(q)
    runSearch(q, category)
  }

  function handleCategoryChange(cat: OtherProficiency["category"] | "All") {
    setCategory(cat)
    runSearch(query, cat)
  }

  return (
    <div className="mt-1 rounded-md border border-border bg-muted/30 p-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
          <Input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search languages, tools…"
            className="h-6 pl-6 text-xs"
          />
        </div>
        <Select
          selectSize="sm"
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value as OtherProficiency["category"] | "All")}
        >
          <option value="All">All</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </Select>
        <button
          type="button"
          onClick={onClose}
          className="flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="size-3" />
        </button>
      </div>

      <div className="max-h-52 overflow-y-auto space-y-0.5">
        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loading && results.length === 0 && (
          <p className="py-3 text-center text-xs text-muted-foreground">No results</p>
        )}
        {!loading && results.map(r => {
          const alreadyAdded = proficiencies.some(p => p.name === r.name && p.category === r.category)
          return (
            <div
              key={`${r.category}:${r.name}`}
              className="flex items-center gap-2 rounded px-1.5 py-1 hover:bg-accent/50"
            >
              <span className="min-w-0 flex-1 truncate text-xs font-medium">{r.name}</span>
              <span className="shrink-0 text-[10px] text-muted-foreground">{r.category}</span>
              <button
                type="button"
                onClick={() => { if (!alreadyAdded) { onPick(r); setQuery(""); runSearch("", category); inputRef.current?.focus() } }}
                disabled={alreadyAdded}
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full transition-colors",
                  alreadyAdded
                    ? "text-muted-foreground/40 cursor-default"
                    : "text-muted-foreground hover:bg-foreground/10 hover:text-foreground",
                )}
              >
                {alreadyAdded ? <Check className="size-3" /> : <Plus className="size-3" />}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

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
  system?: string
  onChange: (list: OtherProficiency[]) => void
}

export function OtherProficienciesBlock({ proficiencies, attributes, proficiencyBonus, system, onChange }: OtherProficienciesBlockProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const [showSearch, setShowSearch] = useState(false)

  function add() {
    onChange([...proficiencies, { id: crypto.randomUUID(), name: "", category: "Tool", training: "Proficient", stat: null, override: null }])
  }

  function addFromSearch(result: OtherProfResult) {
    onChange([...proficiencies, {
      id: crypto.randomUUID(),
      name: result.name,
      category: result.category,
      training: "Proficient",
      stat: hasRoll(result.category) ? "dex" : null,
      override: null,
    }])
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

      {showSearch && (
        <ProficiencyPicker
          proficiencies={proficiencies}
          system={system}
          onPick={(result) => { addFromSearch(result) }}
          onClose={() => setShowSearch(false)}
        />
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={add}
          className="flex h-7 items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <Plus className="size-3.5" />
          Add proficiency
        </button>
        <button
          type="button"
          onClick={() => setShowSearch((v) => !v)}
          className={cn(
            "flex h-7 items-center gap-1.5 text-xs transition-colors",
            showSearch
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Search className="size-3.5" />
          Find
        </button>
      </div>
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
  const isManaged = !!prof.sourceId

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
        {isManaged ? (
          <span className="min-w-0 flex-1 truncate px-2 text-xs text-card-foreground">{prof.name}</span>
        ) : (
          <Input
            type="text"
            value={prof.name}
            placeholder="Name"
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="h-7 min-w-0 flex-1 text-xs"
          />
        )}
        {isManaged ? (
          <Lock className="size-3 shrink-0 text-muted-foreground/50" />
        ) : (
          <button
            type="button"
            onClick={onRemove}
            className="flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="size-3" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {isManaged ? (
          <span className="h-6 min-w-0 flex-[2] px-1.5 text-xs text-muted-foreground flex items-center">{prof.category}</span>
        ) : (
          <Select
            selectSize="sm"
            className="min-w-0 flex-[2]"
            value={prof.category}
            onChange={(e) => onCategoryChange(e.target.value as OtherProficiency["category"])}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        )}

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

            <Select
              selectSize="sm"
              className="min-w-0 flex-1"
              value={prof.stat ?? ""}
              onChange={(e) => onUpdate({ stat: e.target.value === "" ? null : e.target.value as AttributeKey })}
            >
              <option value="">—</option>
              {ATTR_KEYS.map(k => <option key={k} value={k}>{ATTR_ABBR[k]}</option>)}
            </Select>

            <div className="relative min-w-[3rem] flex-1">
              <input
                type="text"
                inputMode="numeric"
                value={isOverridden ? prof.override! : ""}
                placeholder={calc >= 0 ? `+${calc}` : String(calc)}
                onChange={(e) => onOverrideChange(e.target.value)}
                className={cn(
                  "h-6 w-full rounded-md border border-input bg-background text-center text-xs transition-colors",
                  "placeholder:text-card-foreground/40",
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
