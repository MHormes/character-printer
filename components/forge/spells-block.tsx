"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, X, Plus, RotateCcw, CircleDot, Circle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { SpellEntry, ActionMode, DamageEntry, DieType, AttributeKey, AttributeData } from "@/lib/types/character"

type SlotData = { base: number; stack: { id: string; source: string; value: number; isActive: boolean }[]; override: number | null }

type SpellsBlockProps = {
  slots: Record<string, SlotData>
  list: SpellEntry[]
  castingStat: AttributeKey | null
  attributes: Record<AttributeKey, AttributeData>
  proficiencyBonus: number
  onSlotsChange: (slots: Record<string, SlotData>) => void
  onListChange: (list: SpellEntry[]) => void
}

const SCHOOLS = ["Abjuration", "Conjuration", "Divination", "Enchantment", "Evocation", "Illusion", "Necromancy", "Transmutation"]
const ATTR_KEYS: AttributeKey[] = ["str", "dex", "con", "int", "wis", "cha"]
const ATTR_ABBR: Record<AttributeKey, string> = { str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA" }
const DIE_TYPES: DieType[] = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"]
const LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

function resolveAttrMod(data: AttributeData): number {
  const sum = data.stack.filter(m => m.isActive).reduce((s, m) => s + m.value, 0)
  const score = data.override ?? (data.base + sum)
  return Math.floor((score - 10) / 2)
}

function sign(n: number) { return n >= 0 ? `+${n}` : String(n) }

export function SpellsBlock({
  slots, list, castingStat, attributes, proficiencyBonus,
  onSlotsChange, onListChange,
}: SpellsBlockProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const castingMod = castingStat ? resolveAttrMod(attributes[castingStat]) : 0
  const spellDC = 8 + proficiencyBonus + castingMod
  const spellAttack = proficiencyBonus + castingMod

  function attrMod(key: AttributeKey): number {
    return resolveAttrMod(attributes[key])
  }

  function toggleExpand(id: string) {
    setExpandedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function patchSlot(level: string, update: Partial<SlotData>) {
    onSlotsChange({ ...slots, [level]: { ...slots[level], ...update } })
  }

  function patchSpell(id: string, update: Partial<SpellEntry>) {
    onListChange(list.map(s => s.id === id ? { ...s, ...update } : s))
  }

  function addSpell(level: number) {
    const id = crypto.randomUUID()
    onListChange([...list, {
      id, name: "", level, school: "", castingTime: "1 Action",
      range: "", duration: "",
      mode: "DC", attackStat: null, attackProficient: true, attackBonus: 0, fixedDC: null,
      damageStack: [], description: "", upcastDescription: "",
      components: { verbal: false, somatic: false, material: false, materialDesc: "" },
      tags: { ritual: false, concentration: false, prepared: true },
    }])
    setExpandedIds(prev => new Set([...prev, id]))
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

        return (
          <div key={lvl} className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground w-16 shrink-0">
                {lvl === 0 ? "Cantrips" : `Level ${lvl}`}
              </span>
              {slot && (
                <div className="flex items-center gap-1">
                  <input
                    type="number" min={0} max={99}
                    value={slot.override !== null ? slot.override : slot.base}
                    onChange={e => patchSlot(String(lvl), { base: parseInt(e.target.value) || 0, override: null })}
                    className={`h-5 w-10 rounded border text-center text-xs tabular-nums focus:outline-none focus:border-ring ${slot.override !== null ? "border-amber-500/50 bg-amber-500/5 text-amber-600" : "border-input bg-background"}`}
                  />
                  <span className="text-[10px] text-muted-foreground">slots</span>
                  {slot.override !== null && (
                    <button type="button" onClick={() => patchSlot(String(lvl), { override: null })}
                      className="text-muted-foreground hover:text-foreground">
                      <RotateCcw className="size-2.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1 pl-3">
              {spellsAtLevel.map(spell => (
                <SpellRow key={spell.id} spell={spell}
                  expanded={expandedIds.has(spell.id)}
                  spellDC={spellDC} spellAttack={spellAttack}
                  attrMod={attrMod}
                  proficiencyBonus={proficiencyBonus}
                  onToggle={() => toggleExpand(spell.id)}
                  onPatch={u => patchSpell(spell.id, u)}
                  onDelete={() => onListChange(list.filter(s => s.id !== spell.id))}
                  onPatchDmg={(idx, u) => patchSpell(spell.id, { damageStack: spell.damageStack.map((d, i) => i === idx ? { ...d, ...u } : d) })}
                  onDeleteDmg={idx => patchSpell(spell.id, { damageStack: spell.damageStack.filter((_, i) => i !== idx) })}
                />
              ))}

              <button type="button" onClick={() => addSpell(lvl)}
                className="flex h-6 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
                <Plus className="size-3" />
                {lvl === 0 ? "Add cantrip" : `Add level ${lvl} spell`}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

type SpellRowProps = {
  spell: SpellEntry
  expanded: boolean
  spellDC: number
  spellAttack: number
  attrMod: (key: AttributeKey) => number
  proficiencyBonus: number
  onToggle: () => void
  onPatch: (u: Partial<SpellEntry>) => void
  onDelete: () => void
  onPatchDmg: (idx: number, u: Partial<DamageEntry>) => void
  onDeleteDmg: (idx: number) => void
}

function SpellRow({ spell, expanded, spellDC, spellAttack, attrMod, proficiencyBonus, onToggle, onPatch, onDelete, onPatchDmg, onDeleteDmg }: SpellRowProps) {
  function calcToHit(): number {
    const mod = spell.attackStat ? attrMod(spell.attackStat) : 0
    return mod + (spell.attackProficient ? proficiencyBonus : 0) + (spell.attackBonus ?? 0)
  }

  function headerLabel(): string | null {
    if (spell.mode === "Spell") return `Spell ${sign(spellAttack)}`
    if (spell.mode === "DC") return `DC ${spell.fixedDC ?? spellDC}`
    if (spell.mode === "Attack") return `ATK ${sign(calcToHit())}`
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
          {/* School / Cast */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-xs text-muted-foreground">School</span>
              <select value={spell.school} onChange={e => onPatch({ school: e.target.value })}
                className="h-6 flex-1 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:border-ring">
                <option value="">—</option>
                {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-xs text-muted-foreground">Cast</span>
              <Input type="text" value={spell.castingTime} onChange={e => onPatch({ castingTime: e.target.value })}
                placeholder="1 Action" className="h-6 flex-1 text-xs" />
            </div>
          </div>

          {/* Range / Duration */}
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

          {/* Mode */}
          <div className="flex items-center gap-2">
            <span className="w-12 shrink-0 text-xs text-muted-foreground">Mode</span>
            <div className="flex overflow-hidden rounded-md border border-input">
              {(["Attack", "Spell", "DC", "Heal"] as ActionMode[]).map(m => (
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

          {/* To Hit / DC — hidden for Heal */}
          {spell.mode !== "Heal" && (
            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-xs text-muted-foreground">
                {spell.mode === "DC" ? "Save DC" : "To Hit"}
              </span>

              {spell.mode === "Spell" && (
                <span className="font-semibold tabular-nums text-xs">{sign(spellAttack)}</span>
              )}

              {spell.mode === "DC" && (
                <div className="relative">
                  <input
                    type="text" inputMode="numeric"
                    value={spell.fixedDC !== null ? String(spell.fixedDC) : ""}
                    placeholder={String(spellDC)}
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
                      "placeholder:text-foreground/30 focus:outline-none focus:border-ring",
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
              )}

              {spell.mode === "Attack" && (
                <div className="flex items-center gap-2">
                  <select
                    value={spell.attackStat ?? ""}
                    onChange={e => onPatch({ attackStat: e.target.value ? (e.target.value as AttributeKey) : null })}
                    className="h-6 rounded-md border border-input bg-background px-1.5 text-xs text-foreground focus:outline-none focus:border-ring"
                  >
                    <option value="">—</option>
                    {ATTR_KEYS.map(k => <option key={k} value={k}>{ATTR_ABBR[k]}</option>)}
                  </select>
                  <button type="button"
                    onClick={() => onPatch({ attackProficient: !spell.attackProficient })}
                    className={cn(
                      "flex h-6 items-center gap-1 rounded-md border px-2 text-[10px] transition-colors",
                      spell.attackProficient
                        ? "border-foreground/30 bg-foreground/10 text-foreground"
                        : "border-input text-muted-foreground hover:text-foreground",
                    )}>
                    Prof
                  </button>
                  <div className="flex h-6 items-center rounded-md border border-input bg-background focus-within:border-ring">
                    <span className="select-none pl-2 text-xs text-muted-foreground">+</span>
                    <input
                      type="text" inputMode="numeric"
                      value={(spell.attackBonus ?? 0) === 0 ? "" : String(spell.attackBonus)}
                      placeholder="0"
                      onChange={e => {
                        const raw = e.target.value
                        if (raw === "" || raw === "-") { onPatch({ attackBonus: 0 }); return }
                        if (!/^-?\d+$/.test(raw)) return
                        const n = parseInt(raw, 10)
                        if (!isNaN(n)) onPatch({ attackBonus: n })
                      }}
                      className="h-full w-8 bg-transparent px-1 text-center text-xs placeholder:text-foreground/30 focus:outline-none"
                    />
                  </div>
                  <span className="font-semibold tabular-nums text-xs">{sign(calcToHit())}</span>
                </div>
              )}
            </div>
          )}

          {/* Components */}
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

          {/* Damage stack */}
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
                  className="h-6 w-8 rounded-md border border-input bg-background text-center text-xs placeholder:text-foreground/30 focus:outline-none focus:border-ring"
                />
                <select
                  value={dmg.dieType}
                  onChange={e => onPatchDmg(idx, { dieType: e.target.value as DieType })}
                  className="h-6 rounded-md border border-input bg-background px-1 text-xs text-foreground focus:outline-none focus:border-ring"
                >
                  {DIE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select
                  value={dmg.stat ?? ""}
                  onChange={e => onPatchDmg(idx, { stat: e.target.value ? (e.target.value as AttributeKey) : null })}
                  className="h-6 rounded-md border border-input bg-background px-1 text-xs text-foreground focus:outline-none focus:border-ring"
                >
                  <option value="">—</option>
                  {ATTR_KEYS.map(k => <option key={k} value={k}>{ATTR_ABBR[k]}</option>)}
                </select>
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
                    className="h-full w-8 bg-transparent px-1 text-center text-xs placeholder:text-foreground/30 focus:outline-none"
                  />
                </div>
                <input
                  type="text"
                  value={dmg.type}
                  placeholder={spell.mode === "Heal" ? "Healing" : "Fire"}
                  onChange={e => onPatchDmg(idx, { type: e.target.value })}
                  className="h-6 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:border-ring"
                />
                <button type="button"
                  onClick={() => onPatchDmg(idx, { active: !dmg.active })}
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

          {/* Tags */}
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

          {/* Description */}
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Description</span>
            <textarea value={spell.description} placeholder="Spell description..."
              onChange={e => onPatch({ description: e.target.value })}
              rows={3}
              className="w-full resize-y rounded-md border border-input bg-background p-2 text-xs focus:outline-none focus:border-ring"
            />
          </div>

          {/* Upcast */}
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
