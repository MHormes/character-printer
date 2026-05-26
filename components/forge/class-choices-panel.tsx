"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { ClassChoiceMade, AttributeKey, InventoryItem } from "@/lib/types/character"
import { getClassPendingChoiceKey, getEquipmentPendingChoiceKey, type PendingChoice, type EquipmentPendingChoice, type StartingEquipAlternative } from "@/lib/character/derive-pending-choices"
import { searchItems, type FeatRow, type ItemRow } from "@/lib/actions/5e-data"

export type ResolvedEquipmentItem = {
  inventoryItem: InventoryItem
  srdItem?: ItemRow | null
}

const ATTR_KEYS: AttributeKey[] = ["str", "dex", "con", "int", "wis", "cha"]
const ATTR_LABELS: Record<AttributeKey, string> = {
  str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA",
}

const SKILL_LABELS: Record<string, string> = {
  acrobatics: "Acrobatics", animalHandling: "Animal Handling", arcana: "Arcana",
  athletics: "Athletics", deception: "Deception", history: "History",
  insight: "Insight", intimidation: "Intimidation", investigation: "Investigation",
  medicine: "Medicine", nature: "Nature", perception: "Perception",
  performance: "Performance", persuasion: "Persuasion", religion: "Religion",
  sleightOfHand: "Sleight of Hand", stealth: "Stealth", survival: "Survival",
}

// ─── ASI picker ───────────────────────────────────────────────────────────────

type AsiMode = "+2" | "+1+1" | "feat"

function AsiPicker({
  classId,
  className,
  atLevel,
  availableFeats,
  onConfirm,
}: {
  classId: string
  className: string
  atLevel: number
  availableFeats: FeatRow[]
  onConfirm: (choice: ClassChoiceMade) => void
}) {
  const [mode, setMode] = useState<AsiMode>("+2")
  const [stat1, setStat1] = useState<AttributeKey>("str")
  const [stat2, setStat2] = useState<AttributeKey>("dex")
  const [featSearch, setFeatSearch] = useState("")
  const [selectedFeat, setSelectedFeat] = useState<FeatRow | null>(null)
  const [featOpen, setFeatOpen] = useState(false)

  const filteredFeats = availableFeats.filter((f) =>
    f.name.toLowerCase().includes(featSearch.toLowerCase()),
  )

  function confirm() {
    if (mode === "+2") {
      onConfirm({
        id: crypto.randomUUID(),
        classId,
        atLevel,
        type: "asi",
        improvements: [{ attr: stat1, bonus: 2 }],
      })
    } else if (mode === "+1+1") {
      onConfirm({
        id: crypto.randomUUID(),
        classId,
        atLevel,
        type: "asi",
        improvements: [
          { attr: stat1, bonus: 1 },
          { attr: stat2, bonus: 1 },
        ],
      })
    } else if (mode === "feat" && selectedFeat) {
      onConfirm({
        id: crypto.randomUUID(),
        classId,
        atLevel,
        type: "feat",
        featId: selectedFeat.id,
        featName: selectedFeat.name,
        featDescription: selectedFeat.description ?? "",
      })
    }
  }

  const canConfirm =
    mode === "+2" ||
    (mode === "+1+1" && stat1 !== stat2) ||
    (mode === "feat" && !!selectedFeat)

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {className} · Level {atLevel} · Ability Score Improvement
      </p>

      <div className="flex gap-2">
        {(["+2", "+1+1", "feat"] as AsiMode[]).map((m) => (
          <Button
            key={m}
            type="button"
            variant="outline"
            size="sm"
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
          >
            {m === "+2" ? "+2 one stat" : m === "+1+1" ? "+1 / +1 two stats" : "Choose feat"}
          </Button>
        ))}
      </div>

      {mode === "+2" && (
        <div className="flex items-center gap-2">
          <Select
            value={stat1}
            onChange={(e) => setStat1(e.target.value as AttributeKey)}
          >
            {ATTR_KEYS.map((k) => (
              <option key={k} value={k}>{ATTR_LABELS[k]}</option>
            ))}
          </Select>
          <span className="text-sm font-semibold">+2</span>
        </div>
      )}

      {mode === "+1+1" && (
        <div className="flex items-center gap-2">
          <Select
            value={stat1}
            onChange={(e) => setStat1(e.target.value as AttributeKey)}
          >
            {ATTR_KEYS.map((k) => (
              <option key={k} value={k}>{ATTR_LABELS[k]}</option>
            ))}
          </Select>
          <span className="text-sm font-semibold">+1</span>
          <Select
            value={stat2}
            onChange={(e) => setStat2(e.target.value as AttributeKey)}
          >
            {ATTR_KEYS.map((k) => (
              <option key={k} value={k} disabled={k === stat1}>{ATTR_LABELS[k]}</option>
            ))}
          </Select>
          <span className="text-sm font-semibold">+1</span>
          {stat1 === stat2 && (
            <span className="text-xs text-destructive">Pick two different stats</span>
          )}
        </div>
      )}

      {mode === "feat" && (
        <div className="relative">
          <input
            type="text"
            value={selectedFeat ? selectedFeat.name : featSearch}
            placeholder="Search feats…"
            className="h-8 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:border-ring"
            onChange={(e) => {
              setFeatSearch(e.target.value)
              setSelectedFeat(null)
              setFeatOpen(true)
            }}
            onFocus={() => setFeatOpen(true)}
          />
          {featOpen && filteredFeats.length > 0 && !selectedFeat && (
            <div className="absolute left-0 top-full z-50 mt-0.5 max-h-48 w-full overflow-y-auto rounded-md border border-border bg-popover shadow-md">
              {filteredFeats.slice(0, 20).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    setSelectedFeat(f)
                    setFeatSearch("")
                    setFeatOpen(false)
                  }}
                  className="flex w-full items-center px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  {f.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <Button
        type="button"
        size="sm"
        contrast
        disabled={!canConfirm}
        onClick={confirm}
      >
        Confirm
      </Button>
    </div>
  )
}

// ─── Skill picker ─────────────────────────────────────────────────────────────

function SkillPicker({
  classId,
  className,
  skillOptions,
  skillsNeeded,
  onConfirm,
}: {
  classId: string
  className: string
  skillOptions: string[]
  skillsNeeded: number
  onConfirm: (choices: ClassChoiceMade[]) => void
}) {
  const [selected, setSelected] = useState<string[]>([])

  function toggle(key: string) {
    if (selected.includes(key)) {
      setSelected(selected.filter((k) => k !== key))
    } else if (selected.length < skillsNeeded) {
      setSelected([...selected, key])
    }
  }

  function confirm() {
    onConfirm(
      selected.map((key) => ({
        id: crypto.randomUUID(),
        classId,
        atLevel: 1,
        type: "skill" as const,
        skillKey: key,
      })),
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {className} · Skill Proficiencies — choose {skillsNeeded}
      </p>
      <div className="flex flex-wrap gap-2">
        {skillOptions.map((key) => {
          const checked = selected.includes(key)
          const disabled = !checked && selected.length >= skillsNeeded
          return (
            <Button
              key={key}
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              aria-pressed={checked}
              onClick={() => toggle(key)}
            >
              {SKILL_LABELS[key] ?? key}
            </Button>
          )
        })}
      </div>
      <Button
        type="button"
        size="sm"
        contrast
        disabled={selected.length !== skillsNeeded}
        onClick={confirm}
      >
        Confirm ({selected.length}/{skillsNeeded})
      </Button>
    </div>
  )
}

// ─── Equipment choice picker ──────────────────────────────────────────────────

function equipCategoryToInventoryCategory(cat: string): InventoryItem["category"] {
  if (cat === "Weapon") return "Weapon"
  if (cat === "Armor") return "Armor"
  const l = cat.toLowerCase()
  if (l.includes("tool")) return "Tool"
  if (l.includes("potion") || l.includes("ammunition")) return "Consumable"
  return "Mundane"
}

function buildInventoryItem(
  name: string,
  quantity: number,
  sourceId: string,
  srdRow?: ItemRow | null,
): InventoryItem {
  return {
    id: crypto.randomUUID(),
    name,
    quantity,
    weight: srdRow?.weight ?? 0,
    category: srdRow
      ? equipCategoryToInventoryCategory(srdRow.equipmentCategory)
      : "Mundane",
    equipped: true,
    modifiers: [],
    sourceId,
    ...(srdRow?.acMaxDex !== undefined && { acMaxDex: srdRow.acMaxDex }),
    ...(srdRow?.stealthDisadvantage !== undefined && { stealthDisadvantage: srdRow.stealthDisadvantage }),
    ...(srdRow?.strMinimum !== undefined && { strMinimum: srdRow.strMinimum }),
  }
}

function EquipmentChoicePicker({
  choice,
  onConfirm,
}: {
  choice: EquipmentPendingChoice
  onConfirm: (items: ResolvedEquipmentItem[]) => void
}) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [catSearch, setCatSearch] = useState("")
  const [catResults, setCatResults] = useState<ItemRow[]>([])
  const [catPicked, setCatPicked] = useState<ItemRow | null>(null)
  const [catOpen, setCatOpen] = useState(false)

  const selectedAlt: StartingEquipAlternative | null =
    selectedIdx !== null ? choice.options[selectedIdx] : null
  const selectedAltType = selectedAlt?.type ?? null
  let catCategory: string | null = null
  if (selectedAlt?.type === "category") {
    catCategory = selectedAlt.category
  } else if (selectedAlt?.type === "bundle") {
    catCategory = selectedAlt.categoryPick.category
  }

  const needsCatPick =
    selectedAltType === "category" ||
    (selectedAltType === "bundle" && !catPicked)

  useEffect(() => {
    setCatSearch("")
    setCatResults([])
    setCatPicked(null)
    setCatOpen(false)
  }, [selectedIdx])

  useEffect(() => {
    if (!catCategory || !selectedAltType || catPicked) return
    const trimmed = catSearch.trim()
    searchItems({ equipmentCategory: catCategory, name: trimmed || undefined }).then(setCatResults)
    setCatOpen(true)
  }, [catCategory, catPicked, catSearch, selectedAltType])

  async function confirm() {
    if (selectedAlt === null) return
    const sourceId = `class-start:${choice.classId}`

    if (selectedAlt.type === "items") {
      const items = await Promise.all(
        selectedAlt.items.map(async (it) => {
          const rows = await searchItems({ name: it.name })
          const srd = rows.find((r) => r.id === it.itemId) ?? rows[0]
          return {
            inventoryItem: buildInventoryItem(it.name, it.quantity, sourceId, srd),
            srdItem: srd,
          }
        }),
      )
      onConfirm(items)
      return
    }

    if (selectedAlt.type === "category" && catPicked) {
      onConfirm([{
        inventoryItem: buildInventoryItem(catPicked.name, selectedAlt.count, sourceId, catPicked),
        srdItem: catPicked,
      }])
      return
    }

    if (selectedAlt.type === "bundle" && catPicked) {
      const fixedItems = await Promise.all(
        selectedAlt.fixedItems.map(async (it) => {
          const rows = await searchItems({ name: it.name })
          const srd = rows.find((r) => r.id === it.itemId) ?? rows[0]
          return {
            inventoryItem: buildInventoryItem(it.name, it.quantity, sourceId, srd),
            srdItem: srd,
          }
        }),
      )
      const catItem = {
        inventoryItem: buildInventoryItem(
          catPicked.name,
          selectedAlt.categoryPick.count,
          sourceId,
          catPicked,
        ),
        srdItem: catPicked,
      }
      onConfirm([...fixedItems, catItem])
    }
  }

  const canConfirm =
    selectedAlt !== null &&
    (selectedAlt.type === "items" ||
      (selectedAlt.type === "category" && catPicked !== null) ||
      (selectedAlt.type === "bundle" && catPicked !== null))

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {choice.className} · Starting Equipment
      </p>
      <p className="text-sm text-foreground">{choice.description}</p>

      <div className="flex flex-wrap gap-2">
        {choice.options.map((opt, i) => (
          <Button
            key={i}
            type="button"
            variant="outline"
            size="sm"
            aria-pressed={selectedIdx === i}
            onClick={() => setSelectedIdx(i === selectedIdx ? null : i)}
            className="justify-start"
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {needsCatPick && catCategory && (
        <div className="relative">
          <input
            type="text"
            value={catPicked ? catPicked.name : catSearch}
            placeholder={`Search ${catCategory}…`}
            className="h-8 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:border-ring"
            onChange={(e) => {
              setCatSearch(e.target.value)
              setCatPicked(null)
              setCatOpen(true)
            }}
            onFocus={() => setCatOpen(true)}
          />
          {catOpen && catResults.length > 0 && !catPicked && (
            <div className="absolute left-0 top-full z-50 mt-0.5 max-h-48 w-full overflow-y-auto rounded-md border border-border bg-popover shadow-md">
              {catResults.slice(0, 20).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    setCatPicked(r)
                    setCatSearch("")
                    setCatOpen(false)
                  }}
                  className="flex w-full items-center justify-between px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <span>{r.name}</span>
                  {r.cost && <span className="text-xs text-muted-foreground">{r.cost}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <Button type="button" size="sm" contrast disabled={!canConfirm} onClick={confirm}>
        Take this equipment
      </Button>
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

type Props = {
  pendingChoices: PendingChoice[]
  equipmentPendingChoices: EquipmentPendingChoice[]
  availableFeats: FeatRow[]
  onConfirmChoice: (choices: ClassChoiceMade | ClassChoiceMade[]) => void
  onDismissChoice: (choiceKey: string) => void
  onConfirmEquipmentChoice: (classId: string, choiceIndex: number, items: ResolvedEquipmentItem[]) => void
  onDismissEquipmentChoice: (choiceKey: string) => void
}

export function ClassChoicesPanel({
  pendingChoices,
  equipmentPendingChoices,
  availableFeats,
  onConfirmChoice,
  onDismissChoice,
  onConfirmEquipmentChoice,
  onDismissEquipmentChoice,
}: Props) {
  const [open, setOpen] = useState(false)

  const totalPending = pendingChoices.length + equipmentPendingChoices.length
  if (totalPending === 0) return null

  return (
    <div className="space-y-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md border border-amber-500/50 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
      >
        {totalPending} pending {totalPending === 1 ? "choice" : "choices"}
        {open ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
      </button>

      {open && (
        <div className="mt-3 space-y-6 rounded-lg border border-border bg-muted/30 p-4">
          {equipmentPendingChoices.map((ec) => (
            <div key={`${ec.classId}:equip:${ec.choiceIndex}`} className="space-y-3">
              <EquipmentChoicePicker
                choice={ec}
                onConfirm={(items) => onConfirmEquipmentChoice(ec.classId, ec.choiceIndex, items)}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onDismissEquipmentChoice(getEquipmentPendingChoiceKey(ec))}
              >
                Dismiss
              </Button>
            </div>
          ))}
          {pendingChoices.map((pc, i) => (
            <div key={`${pc.classId}:${pc.type}:${pc.atLevel}:${i}`} className="space-y-3">
              {pc.type === "asi" ? (
                <AsiPicker
                  classId={pc.classId}
                  className={pc.className}
                  atLevel={pc.atLevel}
                  availableFeats={availableFeats}
                  onConfirm={(c) => onConfirmChoice(c)}
                />
              ) : (
                <SkillPicker
                  classId={pc.classId}
                  className={pc.className}
                  skillOptions={pc.skillOptions ?? []}
                  skillsNeeded={pc.skillsNeeded ?? 1}
                  onConfirm={(cs) => onConfirmChoice(cs)}
                />
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onDismissChoice(getClassPendingChoiceKey(pc))}
              >
                Dismiss
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
