"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, GripVertical, X, Plus, CircleDot, Circle, RotateCcw, Lock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { ActionEntry, ActionMode, DieType, DamageEntry, AttributeKey, AttributeData, ModifierEntry, CharacterData } from "@/lib/types/character"
import { resolveAttributeMod, resolveSpellDc, resolveSpellAttack } from "@/lib/character/calculations"
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import type { DragEndEvent } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

const ATTR_KEYS: AttributeKey[] = ["str", "dex", "con", "int", "wis", "cha"]
const ATTR_ABBR: Record<AttributeKey, string> = {
  str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA",
}
const DIE_TYPES: DieType[] = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"]

function sign(n: number): string {
  return n >= 0 ? `+${n}` : String(n)
}

type ActionsBlockProps = {
  actions: ActionEntry[]
  castingStat: AttributeKey | null
  attributes: Record<AttributeKey, AttributeData>
  proficiencyBonus: number
  attackStack: ModifierEntry[]
  dcStack: ModifierEntry[]
  showManualControls?: boolean
  onChange: (list: ActionEntry[]) => void
  onCastingStatChange: (stat: AttributeKey | null) => void
}

export function ActionsBlock({
  actions, castingStat, attributes, proficiencyBonus, attackStack, dcStack, showManualControls = false, onChange, onCastingStatChange,
}: ActionsBlockProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const mockChar = {
    attributes,
    spells: { globalCastingStat: castingStat, attackStack, dcStack },
    identity: { level: (proficiencyBonus - 1) * 4 },
    profBonusStack: [],
  } as unknown as CharacterData

  const spellDC = resolveSpellDc(mockChar)
  const spellAttackBonus = resolveSpellAttack(mockChar)

  function calcAttackToHit(action: ActionEntry): number {
    const mod = action.attackStat ? resolveAttributeMod(attributes[action.attackStat]) : 0
    return mod + (action.attackProficient ? proficiencyBonus : 0) + (action.attackBonus ?? 0)
  }

  function headerLabel(action: ActionEntry): string {
    if (action.mode === "Spell") return `Spell ${sign(spellAttackBonus)}`
    if (action.mode === "DC") return `DC ${action.fixedDC ?? spellDC}`
    if (action.mode === "Heal") return "Heal"
    return `ATK ${sign(calcAttackToHit(action))}`
  }

  function calcDamageLabel(action: ActionEntry): string {
    const active = action.damageStack.filter(d => d.active)
    if (active.length === 0) return ""
    return active.map(d => {
      const dice = `${d.diceCount}${d.dieType}`
      const total = (d.stat ? resolveAttributeMod(attributes[d.stat]) : 0) + (d.flatBonus ?? 0)
      const bonusPart = total !== 0 ? sign(total) : ""
      const typePart = d.type ? ` ${d.type}` : ""
      return `${dice}${bonusPart}${typePart}`
    }).join(" + ")
  }

  function toggleExpand(id: string) {
    setExpandedIds(prev => { const next = new Set(prev); if (next.has(id)) { next.delete(id) } else { next.add(id) } return next })
  }

  function patchAction(id: string, patch: Partial<ActionEntry>) {
    onChange(actions.map(a => a.id === id ? { ...a, ...patch } : a))
  }

  function addAction() {
    const id = crypto.randomUUID()
    onChange([...actions, { id, name: "", mode: "Attack", attackStat: "str", attackProficient: true, attackBonus: 0, fixedDC: null, damageStack: [], notes: "" }])
    setExpandedIds(prev => new Set([...prev, id]))
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIdx = actions.findIndex(a => a.id === active.id)
    const newIdx = actions.findIndex(a => a.id === over.id)
    onChange(arrayMove(actions, oldIdx, newIdx))
  }

  return (
    <div className="space-y-3">
      {/* Global casting header */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Casting stat</span>
          <Select
            selectSize="sm"
            value={castingStat ?? ""}
            onChange={(e) => onCastingStatChange(e.target.value ? e.target.value as AttributeKey : null)}
          >
            <option value="">—</option>
            {ATTR_KEYS.map(k => <option key={k} value={k}>{ATTR_ABBR[k]}</option>)}
          </Select>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">Spell DC</span>
          <span className="font-semibold tabular-nums">{spellDC}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">Spell Attack</span>
          <span className="font-semibold tabular-nums">{sign(spellAttackBonus)}</span>
        </div>
      </div>

      {/* Action list */}
      <div className="space-y-1.5">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={actions.map(a => a.id)} strategy={verticalListSortingStrategy}>
            {actions.map(action => (
              <SortableActionItem
                key={action.id}
                action={action}
                expanded={expandedIds.has(action.id)}
                spellDC={spellDC}
                spellAttackBonus={spellAttackBonus}
                headerLabel={headerLabel(action)}
                damageLabel={calcDamageLabel(action)}
                calcAttackToHit={calcAttackToHit(action)}
                manualMode={showManualControls}
                onToggle={() => toggleExpand(action.id)}
                onPatch={(p) => patchAction(action.id, p)}
                onDelete={() => onChange(actions.filter(a => a.id !== action.id))}
                attributes={attributes}
                proficiencyBonus={proficiencyBonus}
              />
            ))}
          </SortableContext>
        </DndContext>

        <button type="button" onClick={addAction}
          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground">
          <Plus className="size-3.5" />
          Add action
        </button>
      </div>
    </div>
  )
}

type SortableActionItemProps = {
  action: ActionEntry
  expanded: boolean
  spellDC: number
  spellAttackBonus: number
  headerLabel: string
  damageLabel: string
  calcAttackToHit: number
  manualMode?: boolean
  onToggle: () => void
  onPatch: (p: Partial<ActionEntry>) => void
  onDelete: () => void
  attributes: Record<AttributeKey, AttributeData>
  proficiencyBonus: number
}

function SortableActionItem({
  action, expanded, spellDC, spellAttackBonus, headerLabel, damageLabel, calcAttackToHit,
  manualMode = false, onToggle, onPatch, onDelete,
}: SortableActionItemProps) {
  const { attributes: dndAttrs, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: action.id })
  const isManaged = !!action.sourceId

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("rounded-lg border border-border bg-card", isDragging && "opacity-50")}
    >
      <div className="flex items-center gap-2 p-2">
        <button type="button" {...listeners} {...dndAttrs}
          className="shrink-0 cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground">
          <GripVertical className="size-3.5" />
        </button>
        <button type="button" onClick={onToggle}
          className="shrink-0 text-muted-foreground transition-colors hover:text-foreground">
          {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </button>
        {isManaged ? (
          <span className="h-6 min-w-0 flex-1 truncate px-2 text-xs text-card-foreground flex items-center">{action.name}</span>
        ) : (
          <Input
            type="text"
            value={action.name}
            placeholder="Action name"
            onChange={(e) => onPatch({ name: e.target.value })}
            className="h-6 min-w-0 flex-1 text-xs"
          />
        )}
        {!expanded && (
          <>
            <span className="shrink-0 rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] text-foreground tabular-nums">
              {headerLabel}
            </span>
            {damageLabel && (
              <span className="shrink-0 rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] text-foreground tabular-nums">
                {damageLabel}
              </span>
            )}
          </>
        )}
        {isManaged && !manualMode ? (
          <span className="flex size-5 shrink-0 items-center justify-center text-muted-foreground/40">
            <Lock className="size-3" />
          </span>
        ) : (
          <button type="button" onClick={onDelete}
            className="flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
            <X className="size-3" />
          </button>
        )}
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-border p-3">
          {/* Mode selector */}
          <div className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-xs text-muted-foreground">Mode</span>
            <div className="flex overflow-hidden rounded-md border border-input">
              {(["Spell", "DC", "Attack", "Heal"] as ActionMode[]).map(m => (
                <button key={m} type="button"
                  onClick={() => onPatch({ mode: m, fixedDC: null, attackStat: m === "Attack" ? (action.attackStat ?? "str") : action.attackStat, attackProficient: action.attackProficient })}
                  className={cn(
                    "h-5 px-2 text-[10px] transition-colors",
                    m === action.mode ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                  )}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {action.mode !== "Heal" && (
            <div className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-xs text-muted-foreground">
                {action.mode === "DC" ? "Save DC" : "To Hit"}
              </span>
              {action.mode === "Spell" && (
                <span className="font-semibold tabular-nums text-xs">{sign(spellAttackBonus)}</span>
              )}
              {action.mode === "DC" && (
                <div className="relative">
                  <input
                    type="text" inputMode="numeric"
                    value={action.fixedDC !== null ? String(action.fixedDC) : ""}
                    placeholder={String(spellDC)}
                    onChange={(e) => {
                      const raw = e.target.value
                      if (raw === "") { onPatch({ fixedDC: null }); return }
                      if (raw === "-" || !/^-?\d+$/.test(raw)) return
                      const n = parseInt(raw, 10)
                      if (!isNaN(n)) onPatch({ fixedDC: n })
                    }}
                    className={cn(
                      "h-6 w-16 rounded-md border border-input bg-background text-center text-xs",
                      "placeholder:text-card-foreground/40 focus:outline-none focus:border-ring",
                      action.fixedDC !== null && "pr-5",
                    )}
                  />
                  {action.fixedDC !== null && (
                    <button type="button" aria-label="Reset" onClick={() => onPatch({ fixedDC: null })}
                      className="absolute right-1 top-1/2 -translate-y-1/2 flex size-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground">
                      <RotateCcw className="size-2.5" />
                    </button>
                  )}
                </div>
              )}
              {action.mode === "Attack" && (
                <div className="flex items-center gap-2">
                  <Select
                    selectSize="sm"
                    value={action.attackStat ?? ""}
                    onChange={(e) => onPatch({ attackStat: e.target.value ? e.target.value as AttributeKey : null })}
                  >
                    <option value="">—</option>
                    {ATTR_KEYS.map(k => <option key={k} value={k}>{ATTR_ABBR[k]}</option>)}
                  </Select>
                  <button type="button"
                    onClick={() => onPatch({ attackProficient: !action.attackProficient })}
                    className={cn(
                      "flex h-6 items-center gap-1 rounded-md border px-2 text-[10px] transition-colors",
                      action.attackProficient ? "border-foreground/30 bg-foreground/10 text-foreground" : "border-input text-muted-foreground hover:text-foreground",
                    )}>
                    Prof
                  </button>
                  <div className="flex h-6 items-center rounded-md border border-input bg-background focus-within:border-ring">
                    <span className="select-none pl-2 text-xs text-muted-foreground">+</span>
                    <input
                      type="text" inputMode="numeric"
                      value={(action.attackBonus ?? 0) === 0 ? "" : String(action.attackBonus)}
                      placeholder="0"
                      onChange={(e) => {
                        const raw = e.target.value
                        if (raw === "" || raw === "-") { onPatch({ attackBonus: 0 }); return }
                        if (!/^-?\d+$/.test(raw)) return
                        const n = parseInt(raw, 10)
                        if (!isNaN(n)) onPatch({ attackBonus: n })
                      }}
                      className="h-full w-8 bg-transparent px-1 text-center text-xs placeholder:text-card-foreground/40 focus:outline-none"
                    />
                  </div>
                  <span className="font-semibold tabular-nums text-xs">{sign(calcAttackToHit)}</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">{action.mode === "Heal" ? "Healing" : "Damage / Effect"}</span>
            {action.damageStack.map((dmg, i) => {
              function patchDmg(patch: Partial<DamageEntry>) {
                onPatch({ damageStack: action.damageStack.map((d, j) => j === i ? { ...d, ...patch } : d) })
              }
              return (
                <div key={i} className={cn("flex flex-wrap items-center gap-1.5", !dmg.active && "opacity-50")}>
                  <input
                    type="text" inputMode="numeric"
                    value={(dmg.diceCount ?? 0) === 0 ? "" : String(dmg.diceCount)}
                    placeholder="1"
                    onChange={(e) => {
                      const raw = e.target.value
                      if (raw === "") { patchDmg({ diceCount: 1 }); return }
                      if (!/^\d+$/.test(raw)) return
                      const n = parseInt(raw, 10)
                      if (!isNaN(n)) patchDmg({ diceCount: n })
                    }}
                    className="h-6 w-8 rounded-md border border-input bg-background text-center text-xs placeholder:text-card-foreground/40 focus:outline-none focus:border-ring"
                  />
                  <Select selectSize="sm" className="px-1" value={dmg.dieType} onChange={(e) => patchDmg({ dieType: e.target.value as DieType })}>
                    {DIE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                  </Select>
                  <Select selectSize="sm" className="px-1" value={dmg.stat ?? ""} onChange={(e) => patchDmg({ stat: e.target.value ? e.target.value as AttributeKey : null })}>
                    <option value="">—</option>
                    {ATTR_KEYS.map(k => <option key={k} value={k}>{ATTR_ABBR[k]}</option>)}
                  </Select>
                  <div className="flex h-6 items-center rounded-md border border-input bg-background focus-within:border-ring">
                    <span className="select-none pl-2 text-xs text-muted-foreground">+</span>
                    <input
                      type="text" inputMode="numeric"
                      value={(dmg.flatBonus ?? 0) === 0 ? "" : String(dmg.flatBonus)}
                      placeholder="0"
                      onChange={(e) => {
                        const raw = e.target.value
                        if (raw === "" || raw === "-") { patchDmg({ flatBonus: 0 }); return }
                        if (!/^-?\d+$/.test(raw)) return
                        const n = parseInt(raw, 10)
                        if (!isNaN(n)) patchDmg({ flatBonus: n })
                      }}
                      className="h-full w-8 bg-transparent px-1 text-center text-xs placeholder:text-card-foreground/40 focus:outline-none"
                    />
                  </div>
                  <div className="flex basis-full md:basis-auto items-center gap-1.5 min-w-0">
                    <input
                      type="text" value={dmg.type}
                      placeholder={action.mode === "Heal" ? "Healing" : "Slashing"}
                      onChange={(e) => patchDmg({ type: e.target.value })}
                      className="h-6 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:border-ring"
                    />
                    <button type="button" onClick={() => patchDmg({ active: !dmg.active })}
                      className="flex size-4 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground">
                      {dmg.active ? <CircleDot className="size-2.5" /> : <Circle className="size-2.5" />}
                    </button>
                    <button type="button"
                      onClick={() => onPatch({ damageStack: action.damageStack.filter((_, j) => j !== i) })}
                      className="flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                      <X className="size-2.5" />
                    </button>
                  </div>
                </div>
              )
            })}
            <button type="button"
              onClick={() => onPatch({ damageStack: [...action.damageStack, { diceCount: 1, dieType: "d6", stat: null, flatBonus: 0, type: "", active: true }] })}
              className="flex h-6 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
              <Plus className="size-3" />
              {action.mode === "Heal" ? "Add healing" : "Add damage"}
            </button>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Notes</span>
            <textarea
              value={action.notes}
              placeholder="Range, save type, conditions..."
              onChange={(e) => onPatch({ notes: e.target.value })}
              rows={2}
              className="w-full resize-none rounded-md border border-input bg-background p-2 text-xs focus:outline-none focus:border-ring"
            />
          </div>
        </div>
      )}
    </div>
  )
}
