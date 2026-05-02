"use client"

import { useState } from "react"
import { CircleDot, Circle, ChevronDown, ChevronRight, X, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { InventoryItem, ModifierTarget } from "@/lib/types/character"

const CATEGORIES: InventoryItem["category"][] = ["Weapon", "Armor", "Tool", "Consumable", "Wondrous", "Mundane"]
const MOD_TYPES: Array<"Bonus" | "Set To"> = ["Bonus", "Set To"]

const MODIFIER_TARGETS: { key: ModifierTarget; label: string }[] = [
  { key: "combat.ac",           label: "AC" },
  { key: "skill.acrobatics",    label: "Acrobatics" },
  { key: "save.all",            label: "All Saving Throws" },
  { key: "skill.all",           label: "All Skills" },
  { key: "skill.animalHandling",label: "Animal Handling" },
  { key: "skill.arcana",        label: "Arcana" },
  { key: "skill.athletics",     label: "Athletics" },
  { key: "save.cha",            label: "Charisma Save" },
  { key: "attr.cha",            label: "Charisma Score" },
  { key: "save.con",            label: "Constitution Save" },
  { key: "attr.con",            label: "Constitution Score" },
  { key: "skill.deception",     label: "Deception" },
  { key: "save.dex",            label: "Dexterity Save" },
  { key: "attr.dex",            label: "Dexterity Score" },
  { key: "skill.history",       label: "History" },
  { key: "combat.hp",           label: "HP Max" },
  { key: "combat.initiative",   label: "Initiative" },
  { key: "skill.insight",       label: "Insight" },
  { key: "save.int",            label: "Intelligence Save" },
  { key: "attr.int",            label: "Intelligence Score" },
  { key: "skill.intimidation",  label: "Intimidation" },
  { key: "skill.investigation", label: "Investigation" },
  { key: "skill.medicine",      label: "Medicine" },
  { key: "skill.nature",        label: "Nature" },
  { key: "skill.perception",    label: "Perception" },
  { key: "skill.performance",   label: "Performance" },
  { key: "skill.persuasion",    label: "Persuasion" },
  { key: "prof_bonus",          label: "Proficiency Bonus" },
  { key: "skill.religion",      label: "Religion" },
  { key: "skill.sleightOfHand", label: "Sleight of Hand" },
  { key: "combat.speed",        label: "Speed" },
  { key: "spell.attack",        label: "Spell Attack" },
  { key: "spell.dc",            label: "Spell Save DC" },
  { key: "spell.slots.1",       label: "Spell Slots Lvl 1" },
  { key: "spell.slots.2",       label: "Spell Slots Lvl 2" },
  { key: "spell.slots.3",       label: "Spell Slots Lvl 3" },
  { key: "spell.slots.4",       label: "Spell Slots Lvl 4" },
  { key: "spell.slots.5",       label: "Spell Slots Lvl 5" },
  { key: "spell.slots.6",       label: "Spell Slots Lvl 6" },
  { key: "spell.slots.7",       label: "Spell Slots Lvl 7" },
  { key: "spell.slots.8",       label: "Spell Slots Lvl 8" },
  { key: "spell.slots.9",       label: "Spell Slots Lvl 9" },
  { key: "skill.stealth",       label: "Stealth" },
  { key: "save.str",            label: "Strength Save" },
  { key: "attr.str",            label: "Strength Score" },
  { key: "skill.survival",      label: "Survival" },
  { key: "save.wis",            label: "Wisdom Save" },
  { key: "attr.wis",            label: "Wisdom Score" },
]

type InventoryBlockProps = {
  inventory: InventoryItem[]
  onChange: (list: InventoryItem[]) => void
}

export function InventoryBlock({ inventory, onChange }: InventoryBlockProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [weightDraft, setWeightDraft] = useState<Record<string, string>>({})

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function add() {
    onChange([
      ...inventory,
      { id: crypto.randomUUID(), name: "", weight: 0, category: "Mundane", equipped: true, modifiers: [] },
    ])
  }

  function remove(id: string) {
    onChange(inventory.filter((item) => item.id !== id))
    setExpanded((prev) => { const next = new Set(prev); next.delete(id); return next })
  }

  function patch(id: string, p: Partial<InventoryItem>) {
    onChange(inventory.map((item) => item.id === id ? { ...item, ...p } : item))
  }

  function addModifier(item: InventoryItem) {
    patch(item.id, {
      modifiers: [...item.modifiers, { id: crypto.randomUUID(), target: "combat.ac" as ModifierTarget, value: 0, type: "Bonus" }],
    })
  }

  function removeModifier(item: InventoryItem, idx: number) {
    patch(item.id, { modifiers: item.modifiers.filter((_, i) => i !== idx) })
  }

  function patchModifier(
    item: InventoryItem,
    idx: number,
    p: Partial<InventoryItem["modifiers"][number]>,
  ) {
    patch(item.id, {
      modifiers: item.modifiers.map((m, i) => i === idx ? { ...m, ...p } : m),
    })
  }

  const totalWeight = inventory.filter((item) => item.equipped).reduce((s, item) => s + item.weight, 0)

  return (
    <div className="flex flex-col gap-2">
      {/* Header row */}
      <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
        <div className="size-5 shrink-0" />
        <span className="min-w-0 flex-1">Name</span>
        <span className="w-16 shrink-0 text-center">Weight</span>
        <span className="w-28 shrink-0">Category</span>
        <div className="size-5 shrink-0" />
        <div className="size-5 shrink-0" />
      </div>

      {inventory.length === 0 && (
        <p className="px-2 text-xs text-muted-foreground">No items added yet.</p>
      )}

      {inventory.map((item) => {
        const isExpanded = expanded.has(item.id)
        return (
          <div key={item.id} className="rounded-lg border border-border bg-card">
            {/* Main row */}
            <div className="flex items-center gap-2 p-2">
              {/* Equipped toggle */}
              <button
                type="button"
                aria-label={item.equipped ? "Unequip" : "Equip"}
                onClick={() => patch(item.id, { equipped: !item.equipped })}
                className="flex size-5 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.equipped ? <CircleDot className="size-3.5" /> : <Circle className="size-3.5" />}
              </button>

              {/* Name */}
              <Input
                type="text"
                value={item.name}
                placeholder="Item name"
                onChange={(e) => patch(item.id, { name: e.target.value })}
                className={cn("h-7 min-w-0 flex-1 text-xs", item.equipped && "font-medium")}
              />

              {/* Weight */}
              <input
                type="text"
                inputMode="decimal"
                value={weightDraft[item.id] !== undefined ? weightDraft[item.id] : (item.weight === 0 ? "" : String(item.weight))}
                placeholder="0"
                onChange={(e) => {
                  const raw = e.target.value
                  setWeightDraft((d) => ({ ...d, [item.id]: raw }))
                  if (raw === "") { patch(item.id, { weight: 0 }); return }
                  if (/\.$/.test(raw)) return
                  const n = parseFloat(raw)
                  if (!isNaN(n)) patch(item.id, { weight: n })
                }}
                onBlur={(e) => {
                  setWeightDraft((d) => { const next = { ...d }; delete next[item.id]; return next })
                  const n = parseFloat(e.target.value)
                  patch(item.id, { weight: isNaN(n) ? 0 : n })
                }}
                className="h-7 w-16 shrink-0 rounded-md border border-input bg-background text-center text-xs focus:outline-none focus:border-ring"
              />

              {/* Category */}
              <select
                value={item.category}
                onChange={(e) => patch(item.id, { category: e.target.value as InventoryItem["category"] })}
                className="h-7 w-28 shrink-0 rounded-md border border-input bg-background px-1.5 text-xs text-foreground focus:outline-none focus:border-ring"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>

              {/* Expand modifier stack */}
              <button
                type="button"
                onClick={() => toggle(item.id)}
                className="flex size-5 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              >
                {isExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="size-3" />
              </button>
            </div>

            {/* Modifier stack */}
            {isExpanded && (
              <div className="border-t border-border px-3 py-2 space-y-1.5">
                <p className="text-xs text-muted-foreground">Modifiers</p>

                {item.modifiers.length === 0 && (
                  <p className="text-xs text-muted-foreground/60">No modifiers.</p>
                )}

                {item.modifiers.map((mod, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    {/* Target */}
                    <select
                      value={mod.target}
                      onChange={(e) => patchModifier(item, idx, { target: e.target.value as ModifierTarget })}
                      className="h-6 min-w-0 flex-1 rounded-md border border-input bg-background px-1.5 text-xs text-foreground focus:outline-none focus:border-ring"
                    >
                      {MODIFIER_TARGETS.map((t) => (
                        <option key={t.key} value={t.key}>{t.label}</option>
                      ))}
                    </select>

                    {/* Type */}
                    <select
                      value={mod.type}
                      onChange={(e) => patchModifier(item, idx, { type: e.target.value as "Bonus" | "Set To" })}
                      className="h-6 rounded-md border border-input bg-background px-1.5 text-xs text-foreground focus:outline-none focus:border-ring"
                    >
                      {MOD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>

                    {/* Value */}
                    <div className="flex h-6 w-16 items-center rounded-md border border-input bg-background focus-within:border-ring">
                      <span className="select-none pl-2 text-xs text-muted-foreground">+</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={mod.value === 0 ? "" : String(mod.value)}
                        placeholder="0"
                        onChange={(e) => {
                          const raw = e.target.value
                          if (raw === "") { patchModifier(item, idx, { value: 0 }); return }
                          if (raw === "-") return
                          const n = parseInt(raw, 10)
                          if (!isNaN(n)) patchModifier(item, idx, { value: n })
                        }}
                        onBlur={(e) => { if (e.target.value === "-") patchModifier(item, idx, { value: 0 }) }}
                        className="h-full min-w-0 flex-1 bg-transparent px-1.5 text-xs placeholder:text-foreground/30 focus:outline-none"
                      />
                    </div>

                    {/* Delete modifier */}
                    <button
                      type="button"
                      onClick={() => removeModifier(item, idx)}
                      className="flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="size-2.5" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addModifier(item)}
                  className="flex h-6 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Plus className="size-3" />
                  Add modifier
                </button>
              </div>
            )}
          </div>
        )
      })}

      {/* Footer: add + total weight */}
      <div className="flex items-center justify-between px-2 pt-1">
        <button
          type="button"
          onClick={add}
          className="flex h-7 items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <Plus className="size-3.5" />
          Add item
        </button>
        {inventory.length > 0 && (
          <span className="text-xs text-muted-foreground">
            Total: <span className="tabular-nums text-foreground">{totalWeight.toFixed(1)} lb</span>
          </span>
        )}
      </div>
    </div>
  )
}
