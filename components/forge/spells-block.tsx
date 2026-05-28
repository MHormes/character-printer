"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, ChevronRight, GripVertical, X, Plus, RotateCcw, CircleDot, Circle, Search, Loader2, Lock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { SpellEntry, ActionMode, DamageEntry, DieType, AttributeKey, AttributeData, ModifierEntry, CharacterData } from "@/lib/types/character"
import { resolveAttributeMod, resolveSpellDc, resolveSpellAttack, sumStack } from "@/lib/character/calculations"
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import type { DragEndEvent } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { searchSpells } from "@/lib/actions/5e-data"
import type { ClassRow, SpellRow } from "@/lib/actions/5e-data"

type SlotData = { base: number; stack: ModifierEntry[]; override: number | null }

type SpellsBlockProps = {
  slots: Record<string, SlotData>
  list: SpellEntry[]
  castingStat: AttributeKey | null
  attributes: Record<AttributeKey, AttributeData>
  proficiencyBonus: number
  attackStack: ModifierEntry[]
  dcStack: ModifierEntry[]
  availableClasses?: ClassRow[]
  characterClasses?: { name: string }[]
  showManualControls: boolean
  onSlotsChange: (slots: Record<string, SlotData>) => void
  onListChange: (list: SpellEntry[]) => void
}

const SCHOOLS = ["Abjuration", "Conjuration", "Divination", "Enchantment", "Evocation", "Illusion", "Necromancy", "Transmutation"]
const ATTR_KEYS: AttributeKey[] = ["str", "dex", "con", "int", "wis", "cha"]
const ATTR_ABBR: Record<AttributeKey, string> = { str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA" }
const DIE_TYPES: DieType[] = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"]
const LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

function sign(n: number) { return n >= 0 ? `+${n}` : String(n) }

// ─── Spell picker ─────────────────────────────────────────────────────────────


function SpellPicker({
  level,
  availableClasses,
  defaultClassId,
  alreadyInList,
  onAdd,
  onClose,
}: {
  level: number
  availableClasses: ClassRow[]
  defaultClassId: string
  alreadyInList: Set<string>
  onAdd: (spell: SpellRow) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState("")
  const [classFilter, setClassFilter] = useState(defaultClassId)
  const [results, setResults] = useState<SpellRow[]>([])
  const [loading, setLoading] = useState(true)
  const [addedNames, setAddedNames] = useState<Set<string>>(new Set())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function runSearch(q: string, cls: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      const res = await searchSpells({
        level,
        name: q || undefined,
        classId: cls || undefined,
      })
      setResults(res)
      setLoading(false)
    }, 250)
  }

  useEffect(() => {
    runSearch(query, classFilter)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleQueryChange(q: string) {
    setQuery(q)
    runSearch(q, classFilter)
  }

  function handleClassChange(cls: string) {
    setClassFilter(cls)
    runSearch(query, cls)
  }

  function handleAdd(spell: SpellRow) {
    onAdd(spell)
    setAddedNames(prev => new Set([...prev, spell.name]))
    setQuery("")
    runSearch("", classFilter)
    inputRef.current?.focus()
  }

  return (
    <div className="mt-1 rounded-md border border-border bg-muted/30 p-2 space-y-2">
      {/* Search controls */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
          <Input
            ref={inputRef}
            autoFocus
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search spells…"
            className="h-6 pl-6 text-xs"
          />
        </div>
        {availableClasses.length > 0 && (
          <Select
            selectSize="sm"
            value={classFilter}
            onChange={(e) => handleClassChange(e.target.value)}
          >
            <option value="">All classes</option>
            {availableClasses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        )}
        <button
          type="button"
          onClick={onClose}
          className="flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="size-3" />
        </button>
      </div>

      {/* Results */}
      <div className="max-h-52 overflow-y-auto space-y-0.5">
        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loading && results.length === 0 && (
          <p className="py-3 text-center text-xs text-muted-foreground">No spells found</p>
        )}
        {!loading && results.map((spell) => {
          const added = addedNames.has(spell.name)
          const duplicate = alreadyInList.has(spell.name)
          return (
            <div
              key={spell.id}
              className="flex items-center gap-2 rounded px-1.5 py-1 hover:bg-accent/50"
            >
              <div className="min-w-0 flex-1">
                <span className="text-xs font-medium">{spell.name}</span>
                {spell.concentration && (
                  <span className="ml-1 text-[10px] text-muted-foreground" title="Concentration">◎</span>
                )}
                {spell.ritual && (
                  <span className="ml-1 text-[10px] text-muted-foreground" title="Ritual">ℝ</span>
                )}
              </div>
              <span className="shrink-0 text-[10px] text-muted-foreground w-20 truncate">{spell.school}</span>
              <span className="shrink-0 text-[10px] text-muted-foreground w-10">
                {[spell.verbal && "V", spell.somatic && "S", spell.material && "M"].filter(Boolean).join(" ")}
              </span>
              <button
                type="button"
                onClick={() => handleAdd(spell)}
                disabled={added}
                className={cn(
                  "flex shrink-0 size-5 items-center justify-center rounded-full text-xs transition-colors",
                  added
                    ? "text-muted-foreground cursor-default"
                    : duplicate
                    ? "text-amber-500 hover:bg-amber-500/10"
                    : "text-muted-foreground hover:bg-foreground/10 hover:text-foreground",
                )}
                title={added ? "Added" : duplicate ? "Already in list (add again?)" : "Add spell"}
              >
                {added ? "✓" : <Plus className="size-3" />}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SpellsBlock({
  slots, list, castingStat, attributes, proficiencyBonus, attackStack, dcStack,
  availableClasses = [],
  characterClasses = [],
  showManualControls,
  onSlotsChange, onListChange,
}: SpellsBlockProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [expandedSlotLevels, setExpandedSlotLevels] = useState<Set<string>>(new Set())
  const [openPickerLevel, setOpenPickerLevel] = useState<number | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const mockChar = {
    attributes,
    spells: { globalCastingStat: castingStat, attackStack, dcStack },
    identity: { level: (proficiencyBonus - 1) * 4 },
    profBonusStack: [],
  } as unknown as CharacterData

  const spellDC = resolveSpellDc(mockChar)
  const spellAttack = resolveSpellAttack(mockChar)

  // Default class for spell picker: match first character class name to DB class
  const defaultPickerClassId = (() => {
    if (!characterClasses.length || !availableClasses.length) return ""
    const firstName = characterClasses[0].name.toLowerCase()
    const match = availableClasses.find((c) => c.name.toLowerCase() === firstName)
    return match?.id ?? ""
  })()

  const existingSpellNames = new Set(list.map((s) => s.name))

  function attrMod(key: AttributeKey): number {
    return resolveAttributeMod(attributes[key])
  }

  function toggleExpand(id: string) {
    setExpandedIds(prev => { const n = new Set(prev); if (n.has(id)) { n.delete(id) } else { n.add(id) } return n })
  }

  function toggleSlotExpand(level: string) {
    setExpandedSlotLevels((prev) => {
      const next = new Set(prev)
      if (next.has(level)) next.delete(level)
      else next.add(level)
      return next
    })
  }

  function patchSlot(level: string, update: Partial<SlotData>) {
    onSlotsChange({ ...slots, [level]: { ...slots[level], ...update } })
  }

  function patchSlotModifier(level: string, id: string, patch: Partial<ModifierEntry>) {
    patchSlot(level, {
      stack: slots[level].stack.map((mod) => (mod.id === id ? { ...mod, ...patch } : mod)),
    })
  }

  function addSlotModifier(level: string) {
    patchSlot(level, {
      stack: [...slots[level].stack, { id: crypto.randomUUID(), source: "", value: 0, isActive: true }],
    })
  }

  function removeSlotModifier(level: string, id: string) {
    patchSlot(level, { stack: slots[level].stack.filter((mod) => mod.id !== id) })
  }

  function patchSpell(id: string, update: Partial<SpellEntry>) {
    onListChange(list.map(s => s.id === id ? { ...s, ...update } : s))
  }

  function handleDragEndForLevel(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIdx = list.findIndex(s => s.id === active.id)
    const newIdx = list.findIndex(s => s.id === over.id)
    onListChange(arrayMove(list, oldIdx, newIdx))
  }

  function addSpell(level: number) {
    const id = crypto.randomUUID()
    onListChange([...list, {
      id, name: "", level, school: "", castingTime: "1 Action",
      range: "", duration: "",
      mode: "Plain", castingStat: null, fixedDC: null, saveStat: null,
      damageStack: [], description: "", upcastDescription: "",
      components: { verbal: false, somatic: false, material: false, materialDesc: "" },
      tags: { ritual: false, concentration: false, prepared: true },
    }])
    setExpandedIds(prev => new Set([...prev, id]))
  }

  function importSpell(spell: SpellRow) {
    const id = crypto.randomUUID()

    const mode: ActionMode =
      spell.attackType ? "Spell"
      : spell.damageTypeName === "Healing" ? "Heal"
      : spell.damageDiceCount ? "DC"
      : "Plain"

    const validDice: DieType[] = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"]
    const damageStack: DamageEntry[] =
      spell.damageDiceCount && spell.damageDieType && validDice.includes(spell.damageDieType as DieType)
        ? [{
            diceCount: spell.damageDiceCount,
            dieType: spell.damageDieType as DieType,
            stat: null,
            flatBonus: 0,
            type: spell.damageTypeName ?? "",
            active: true,
          }]
        : []

    const entry: SpellEntry = {
      id,
      name: spell.name,
      level: spell.level,
      school: spell.school ?? "",
      castingTime: spell.castingTime ?? "",
      range: spell.range ?? "",
      duration: spell.duration ?? "",
      mode,
      castingStat: null,
      fixedDC: null,
      saveStat: (spell.dcSaveStat as AttributeKey) ?? null,
      damageStack,
      description: spell.description,
      upcastDescription: spell.upcastDesc ?? "",
      components: {
        verbal: spell.verbal,
        somatic: spell.somatic,
        material: spell.material,
        materialDesc: spell.materialDesc ?? "",
      },
      tags: {
        ritual: spell.ritual,
        concentration: spell.concentration,
        prepared: true,
      },
    }
    onListChange([...list, entry])
  }

  return (
    <div className="space-y-4">
      {castingStat && (
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>DC <span className="font-semibold text-foreground">{spellDC}</span></span>
          <span>ATK <span className="font-semibold text-foreground">{sign(spellAttack)}</span></span>
          <span className="uppercase">{castingStat}</span>
        </div>
      )}

      {LEVELS.map(lvl => {
        const spellsAtLevel = list.filter(s => s.level === lvl)
        const slot = lvl > 0 ? slots[String(lvl)] : null
        const pickerOpen = openPickerLevel === lvl
        const slotLevelKey = String(lvl)
        const slotExpanded = expandedSlotLevels.has(slotLevelKey)
        const slotStackSum = slot ? sumStack(slot.stack) : 0

        return (
          <div key={lvl} className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground w-16 shrink-0">
                {lvl === 0 ? "Cantrips" : `Level ${lvl}`}
              </span>
              {slot && (
                <div className="flex items-center gap-1.5">
                  {showManualControls ? (
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={slot.override !== null ? String(slot.override) : ""}
                        placeholder={String(slot.base + sumStack(slot.stack))}
                        onChange={e => {
                          const raw = e.target.value
                          if (raw === "") { patchSlot(String(lvl), { override: null }); return }
                          const n = parseInt(raw, 10)
                          if (!isNaN(n)) patchSlot(String(lvl), { override: n })
                        }}
                        className={cn(
                          "h-5 w-10 rounded border text-center text-xs tabular-nums focus:outline-none focus:border-ring",
                          slot.override !== null ? "border-amber-500/50 bg-amber-500/5 text-amber-600 pr-4" : "border-input bg-background",
                          "placeholder:text-card-foreground/40"
                        )}
                      />
                      {slot.override !== null && (
                        <button type="button" onClick={() => patchSlot(slotLevelKey, { override: null })}
                          className="absolute right-0.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          <RotateCcw className="size-2.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-5 w-10 items-center justify-center rounded border border-input bg-background text-xs font-medium tabular-nums text-card-foreground">
                      {slot.override ?? slot.base + sumStack(slot.stack)}
                    </div>
                  )}
                  <span className="text-[10px] text-muted-foreground">slots</span>
                  <div className="flex h-5 items-center rounded border border-input bg-muted/30 px-1.5">
                    <span className="text-[10px] text-muted-foreground uppercase mr-1">Derived</span>
                    <span className="text-[10px] font-medium tabular-nums text-foreground">{slot.base}</span>
                  </div>
                  {showManualControls && (
                    <button
                      type="button"
                      onClick={() => toggleSlotExpand(slotLevelKey)}
                      className="flex h-5 items-center gap-1 rounded border border-input bg-background px-1.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {slotExpanded ? <ChevronDown className="size-2.5" /> : <ChevronRight className="size-2.5" />}
                      Mods
                      {!slotExpanded && slot.stack.length > 0 && (
                        <span className="tabular-nums">{sign(slotStackSum)}</span>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1 pl-3">
              {showManualControls && slot && slotExpanded && (
                <div className="mb-2 flex flex-col gap-1.5 rounded-md border border-border bg-card/60 p-2">
                  {slot.stack.map((mod) =>
                    mod.sourceId ? (
                      <div
                        key={mod.id}
                        className={cn(
                          "flex items-center gap-1 rounded border border-border bg-muted/40 px-1.5 py-0.5",
                          !mod.isActive && "opacity-40",
                        )}
                      >
                        <Lock className="size-2.5 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{mod.source}</span>
                        <span className="shrink-0 tabular-nums text-xs text-foreground">
                          {mod.value >= 0 ? `+${mod.value}` : mod.value}
                        </span>
                        {mod.isActive ? (
                          <CircleDot className="size-2.5 shrink-0 text-muted-foreground" />
                        ) : (
                          <Circle className="size-2.5 shrink-0 text-muted-foreground" />
                        )}
                      </div>
                    ) : (
                      <div
                        key={mod.id}
                        className={cn("flex items-start gap-1", !mod.isActive && "opacity-40")}
                      >
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <Input
                            type="text"
                            value={mod.source}
                            placeholder="Source"
                            className="h-6 text-xs"
                            onChange={(e) => patchSlotModifier(slotLevelKey, mod.id, { source: e.target.value })}
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
                                if (raw === "") {
                                  patchSlotModifier(slotLevelKey, mod.id, { value: 0 })
                                  return
                                }
                                if (raw === "-") return
                                const n = parseInt(raw, 10)
                                if (!isNaN(n)) patchSlotModifier(slotLevelKey, mod.id, { value: n })
                              }}
                              onBlur={(e) => {
                                if (e.target.value === "-") patchSlotModifier(slotLevelKey, mod.id, { value: 0 })
                              }}
                              className="h-full min-w-0 flex-1 bg-transparent px-1.5 text-xs placeholder:text-card-foreground/40 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="mt-0.5 flex flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={() => removeSlotModifier(slotLevelKey, mod.id)}
                            className="flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="size-2.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => patchSlotModifier(slotLevelKey, mod.id, { isActive: !mod.isActive })}
                            className="flex size-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                          >
                            {mod.isActive ? <CircleDot className="size-2.5" /> : <Circle className="size-2.5" />}
                          </button>
                        </div>
                      </div>
                    ),
                  )}
                  <button
                    type="button"
                    onClick={() => addSlotModifier(slotLevelKey)}
                    className="flex h-6 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Plus className="size-3" />
                    Add modifier
                  </button>
                </div>
              )}

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndForLevel}>
                <SortableContext items={spellsAtLevel.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  {spellsAtLevel.map(spell => (
                    <SortableSpellRow key={spell.id} spell={spell}
                      expanded={expandedIds.has(spell.id)}
                      spellDC={spellDC} spellAttack={spellAttack}
                      globalCastingStat={castingStat}
                      attrMod={attrMod}
                      proficiencyBonus={proficiencyBonus}
                      onToggle={() => toggleExpand(spell.id)}
                      onPatch={u => patchSpell(spell.id, u)}
                      onDelete={() => onListChange(list.filter(s => s.id !== spell.id))}
                      onPatchDmg={(idx, u) => patchSpell(spell.id, { damageStack: spell.damageStack.map((d, i) => i === idx ? { ...d, ...u } : d) })}
                      onDeleteDmg={idx => patchSpell(spell.id, { damageStack: spell.damageStack.filter((_, i) => i !== idx) })}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              <div className="flex items-center gap-2">
                <button type="button" onClick={() => addSpell(lvl)}
                  className="flex h-6 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
                  <Plus className="size-3" />
                  {lvl === 0 ? "Add cantrip" : `Add level ${lvl} spell`}
                </button>
                <button
                  type="button"
                  onClick={() => setOpenPickerLevel(pickerOpen ? null : lvl)}
                  className={cn(
                    "flex h-6 items-center gap-1 text-xs transition-colors",
                    pickerOpen
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Search className="size-3" />
                  Find
                </button>
              </div>

              {pickerOpen && (
                <SpellPicker
                  level={lvl}
                  availableClasses={availableClasses}
                  defaultClassId={defaultPickerClassId}
                  alreadyInList={existingSpellNames}
                  onAdd={(spell) => importSpell(spell)}
                  onClose={() => setOpenPickerLevel(null)}
                />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Spell rows (unchanged) ───────────────────────────────────────────────────

type SpellRowProps = {
  spell: SpellEntry
  expanded: boolean
  spellDC: number
  spellAttack: number
  globalCastingStat: AttributeKey | null
  attrMod: (key: AttributeKey) => number
  proficiencyBonus: number
  onToggle: () => void
  onPatch: (u: Partial<SpellEntry>) => void
  onDelete: () => void
  onPatchDmg: (idx: number, u: Partial<DamageEntry>) => void
  onDeleteDmg: (idx: number) => void
  dragHandle?: React.ReactNode
}

function SortableSpellRow(props: Omit<SpellRowProps, "dragHandle">) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.spell.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "opacity-50" : ""}
    >
      <SpellRow
        {...props}
        dragHandle={
          <button type="button" {...listeners} {...attributes}
            className="shrink-0 cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground">
            <GripVertical className="size-3.5" />
          </button>
        }
      />
    </div>
  )
}

function SpellRow({ spell, expanded, spellDC, spellAttack, globalCastingStat, attrMod, onToggle, onPatch, onDelete, onPatchDmg, onDeleteDmg, dragHandle }: SpellRowProps) {
  function resolvedAttack(): number {
    const globalMod = globalCastingStat ? attrMod(globalCastingStat) : 0
    const overrideMod = spell.castingStat ? attrMod(spell.castingStat) : globalMod
    return spellAttack - globalMod + overrideMod
  }

  function resolvedDC(): number {
    if (spell.fixedDC !== null) return spell.fixedDC
    const globalMod = globalCastingStat ? attrMod(globalCastingStat) : 0
    const overrideMod = spell.castingStat ? attrMod(spell.castingStat) : globalMod
    return spellDC - globalMod + overrideMod
  }

  function headerLabel(): string | null {
    if (spell.mode === "Spell") return `Spell ${sign(resolvedAttack())}`
    if (spell.mode === "DC") return `DC ${resolvedDC()}${spell.saveStat ? ` ${ATTR_ABBR[spell.saveStat]}` : ""}`
    return null
  }

  function calcDamageLabel(): string {
    const active = (spell.damageStack ?? []).filter(d => d.active)
    if (active.length === 0) return ""
    return active.map(d => {
      const total = (d.stat ? attrMod(d.stat) : 0) + (d.flatBonus ?? 0)
      const bonusPart = total !== 0 ? sign(total) : ""
      const typePart = d.type ? ` ${d.type}` : ""
      return `${d.diceCount}${d.dieType}${bonusPart}${typePart}`
    }).join(" + ")
  }

  const label = headerLabel()
  const dmgLabel = calcDamageLabel()

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 p-2">
        {dragHandle}
        <button type="button" onClick={onToggle}
          className="shrink-0 text-muted-foreground transition-colors hover:text-foreground">
          {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </button>

        <button type="button"
          onClick={() => onPatch({ tags: { ...spell.tags, prepared: !spell.tags.prepared } })}
          title="Prepared"
          className={`shrink-0 size-2 rounded-full border transition-colors ${spell.tags.prepared ? "border-foreground bg-foreground" : "border-muted-foreground"}`}
        />

        <Input type="text" value={spell.name} placeholder="Spell name"
          onChange={e => onPatch({ name: e.target.value })}
          className="h-6 min-w-0 flex-1 text-xs" />

        {!expanded && (
          <>
            {label && (
              <span className="shrink-0 rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] text-foreground tabular-nums">
                {label}
              </span>
            )}
            {dmgLabel && (
              <span className="shrink-0 rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] text-foreground tabular-nums">
                {dmgLabel}
              </span>
            )}
            {spell.tags.concentration && (
              <span className="shrink-0 text-[10px] text-muted-foreground" title="Concentration">◎</span>
            )}
          </>
        )}

        <button type="button" onClick={onDelete}
          className="flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
          <X className="size-3" />
        </button>
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-border p-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-xs text-muted-foreground">School</span>
              <Select selectSize="sm" className="flex-1" value={spell.school} onChange={e => onPatch({ school: e.target.value })}>
                <option value="">—</option>
                {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-xs text-muted-foreground">Cast</span>
              <Input type="text" value={spell.castingTime} onChange={e => onPatch({ castingTime: e.target.value })}
                placeholder="1 Action" className="h-6 flex-1 text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-xs text-muted-foreground">Range</span>
              <Input type="text" value={spell.range} onChange={e => onPatch({ range: e.target.value })}
                placeholder="60 ft" className="h-6 flex-1 text-xs" />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-xs text-muted-foreground">Duration</span>
              <Input type="text" value={spell.duration} onChange={e => onPatch({ duration: e.target.value })}
                placeholder="Instantaneous" className="h-6 flex-1 text-xs" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-12 shrink-0 text-xs text-muted-foreground">Mode</span>
            <div className="flex overflow-hidden rounded-md border border-input">
              {(["Plain", "DC", "Spell", "Heal"] as ActionMode[]).map(m => (
                <button key={m} type="button"
                  onClick={() => onPatch({ mode: m })}
                  className={cn(
                    "h-5 px-2 text-[10px] transition-colors",
                    spell.mode === m
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground",
                  )}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {spell.mode !== "Heal" && spell.mode !== "Plain" && (
            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-xs text-muted-foreground">
                {spell.mode === "DC" ? "Save DC" : "To Hit"}
              </span>

              {spell.mode === "Spell" && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold tabular-nums text-xs">{sign(resolvedAttack())}</span>
                  <Select
                    selectSize="sm"
                    value={spell.castingStat ?? ""}
                    onChange={e => onPatch({ castingStat: e.target.value ? (e.target.value as AttributeKey) : null })}
                  >
                    <option value="">— default stat</option>
                    {ATTR_KEYS.map(k => <option key={k} value={k}>{ATTR_ABBR[k]}</option>)}
                  </Select>
                </div>
              )}

              {spell.mode === "DC" && (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="text" inputMode="numeric"
                      value={spell.fixedDC !== null ? String(spell.fixedDC) : ""}
                      placeholder={String(resolvedDC())}
                      onChange={e => {
                        const raw = e.target.value
                        if (raw === "") { onPatch({ fixedDC: null }); return }
                        if (raw === "-") return
                        if (!/^-?\d+$/.test(raw)) return
                        const n = parseInt(raw, 10)
                        if (!isNaN(n)) onPatch({ fixedDC: n })
                      }}
                      className={cn(
                        "h-6 w-16 rounded-md border border-input bg-background text-center text-xs",
                        "placeholder:text-card-foreground/40 focus:outline-none focus:border-ring",
                        spell.fixedDC !== null && "pr-5",
                      )}
                    />
                    {spell.fixedDC !== null && (
                      <button type="button" aria-label="Reset"
                        onClick={() => onPatch({ fixedDC: null })}
                        className="absolute right-1 top-1/2 -translate-y-1/2 flex size-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground">
                        <RotateCcw className="size-2.5" />
                      </button>
                    )}
                  </div>
                  <Select
                    selectSize="sm"
                    value={spell.saveStat ?? ""}
                    onChange={e => onPatch({ saveStat: e.target.value ? (e.target.value as AttributeKey) : null })}
                  >
                    <option value="">— save</option>
                    {ATTR_KEYS.map(k => <option key={k} value={k}>{ATTR_ABBR[k]} save</option>)}
                  </Select>
                  <Select
                    selectSize="sm"
                    value={spell.castingStat ?? ""}
                    onChange={e => onPatch({ castingStat: e.target.value ? (e.target.value as AttributeKey) : null })}
                  >
                    <option value="">— default stat</option>
                    {ATTR_KEYS.map(k => <option key={k} value={k}>{ATTR_ABBR[k]}</option>)}
                  </Select>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="w-12 shrink-0 text-xs text-muted-foreground">Comp.</span>
            {(["verbal", "somatic", "material"] as const).map(c => (
              <label key={c} className="flex cursor-pointer items-center gap-1">
                <input type="checkbox"
                  checked={spell.components[c]}
                  onChange={e => onPatch({ components: { ...spell.components, [c]: e.target.checked } })}
                  className="size-3 accent-foreground" />
                <span className="text-xs text-muted-foreground">{c[0].toUpperCase()}</span>
              </label>
            ))}
            <Input
              type="text"
              value={spell.components.materialDesc}
              placeholder="Materials..."
              disabled={!spell.components.material}
              onChange={e => onPatch({ components: { ...spell.components, materialDesc: e.target.value } })}
              className={`h-6 flex-1 text-xs ${!spell.components.material ? "opacity-40 cursor-not-allowed" : ""}`}
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">
              {spell.mode === "Heal" ? "Healing" : "Damage / Effect"}
            </span>
            {(spell.damageStack ?? []).map((dmg, idx) => (
              <div key={idx} className={cn("flex items-center gap-1.5", !dmg.active && "opacity-50")}>
                <input
                  type="text" inputMode="numeric"
                  value={(dmg.diceCount ?? 0) === 0 ? "" : String(dmg.diceCount)}
                  placeholder="1"
                  onChange={e => {
                    const raw = e.target.value
                    if (raw === "") { onPatchDmg(idx, { diceCount: 1 }); return }
                    if (!/^\d+$/.test(raw)) return
                    const n = parseInt(raw, 10)
                    if (!isNaN(n)) onPatchDmg(idx, { diceCount: n })
                  }}
                  className="h-6 w-8 rounded-md border border-input bg-background text-center text-xs placeholder:text-card-foreground/40 focus:outline-none focus:border-ring"
                />
                <Select selectSize="sm" className="px-1" value={dmg.dieType} onChange={e => onPatchDmg(idx, { dieType: e.target.value as DieType })}>
                  {DIE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                </Select>
                <Select selectSize="sm" className="px-1" value={dmg.stat ?? ""} onChange={e => onPatchDmg(idx, { stat: e.target.value ? (e.target.value as AttributeKey) : null })}>
                  <option value="">—</option>
                  {ATTR_KEYS.map(k => <option key={k} value={k}>{ATTR_ABBR[k]}</option>)}
                </Select>
                <div className="flex h-6 items-center rounded-md border border-input bg-background focus-within:border-ring">
                  <span className="select-none pl-2 text-xs text-muted-foreground">+</span>
                  <input
                    type="text" inputMode="numeric"
                    value={(dmg.flatBonus ?? 0) === 0 ? "" : String(dmg.flatBonus)}
                    placeholder="0"
                    onChange={e => {
                      const raw = e.target.value
                      if (raw === "" || raw === "-") { onPatchDmg(idx, { flatBonus: 0 }); return }
                      if (!/^-?\d+$/.test(raw)) return
                      const n = parseInt(raw, 10)
                      if (!isNaN(n)) onPatchDmg(idx, { flatBonus: n })
                    }}
                    className="h-full w-8 bg-transparent px-1 text-center text-xs placeholder:text-card-foreground/40 focus:outline-none"
                  />
                </div>
                <input type="text" value={dmg.type} placeholder={spell.mode === "Heal" ? "Healing" : "Fire"}
                  onChange={e => onPatchDmg(idx, { type: e.target.value })}
                  className="h-6 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:border-ring"
                />
                <button type="button" onClick={() => onPatchDmg(idx, { active: !dmg.active })}
                  className="flex size-4 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground">
                  {dmg.active ? <CircleDot className="size-2.5" /> : <Circle className="size-2.5" />}
                </button>
                <button type="button" onClick={() => onDeleteDmg(idx)}
                  className="flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                  <X className="size-2.5" />
                </button>
              </div>
            ))}
            <button type="button"
              onClick={() => onPatch({ damageStack: [...(spell.damageStack ?? []), { diceCount: 1, dieType: "d6", stat: null, flatBonus: 0, type: "", active: true }] })}
              className="flex h-5 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
              <Plus className="size-3" />
              {spell.mode === "Heal" ? "Add healing" : "Add damage / effect"}
            </button>
          </div>

          <div className="flex gap-3">
            {(["concentration", "ritual"] as const).map(tag => (
              <label key={tag} className="flex cursor-pointer items-center gap-1">
                <input type="checkbox" checked={spell.tags[tag]}
                  onChange={e => onPatch({ tags: { ...spell.tags, [tag]: e.target.checked } })}
                  className="size-3 accent-foreground" />
                <span className="text-xs text-muted-foreground capitalize">{tag}</span>
              </label>
            ))}
          </div>

          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Description</span>
            <textarea value={spell.description} placeholder="Spell description..."
              onChange={e => onPatch({ description: e.target.value })}
              rows={3}
              className="w-full resize-y rounded-md border border-input bg-background p-2 text-xs focus:outline-none focus:border-ring"
            />
          </div>

          {spell.level > 0 && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">At Higher Levels</span>
              <textarea value={spell.upcastDescription} placeholder="When cast using a higher level slot..."
                onChange={e => onPatch({ upcastDescription: e.target.value })}
                rows={2}
                className="w-full resize-y rounded-md border border-input bg-background p-2 text-xs focus:outline-none focus:border-ring"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
