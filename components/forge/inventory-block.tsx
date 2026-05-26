"use client";

import { useState, useRef, useEffect } from "react";
import {
  CircleDot,
  Circle,
  ChevronDown,
  ChevronRight,
  GripVertical,
  X,
  Plus,
  Search,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { InventoryItem, ModifierTarget } from "@/lib/types/character";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { searchItems } from "@/lib/actions/5e-data";
import type { ItemRow } from "@/lib/actions/5e-data";

const CATEGORIES: InventoryItem["category"][] = [
  "Weapon",
  "Armor",
  "Tool",
  "Consumable",
  "Wondrous",
  "Mundane",
];
const MOD_TYPES: Array<"Bonus" | "Set To"> = ["Bonus", "Set To"];

const MODIFIER_TARGETS: { key: ModifierTarget; label: string }[] = [
  { key: "combat.ac", label: "AC" },
  { key: "skill.acrobatics", label: "Acrobatics" },
  { key: "save.all", label: "All Saving Throws" },
  { key: "skill.all", label: "All Skills" },
  { key: "skill.animalHandling", label: "Animal Handling" },
  { key: "skill.arcana", label: "Arcana" },
  { key: "skill.athletics", label: "Athletics" },
  { key: "save.cha", label: "Charisma Save" },
  { key: "attr.cha", label: "Charisma Score" },
  { key: "save.con", label: "Constitution Save" },
  { key: "attr.con", label: "Constitution Score" },
  { key: "skill.deception", label: "Deception" },
  { key: "save.dex", label: "Dexterity Save" },
  { key: "attr.dex", label: "Dexterity Score" },
  { key: "skill.history", label: "History" },
  { key: "combat.hp", label: "HP Max" },
  { key: "combat.initiative", label: "Initiative" },
  { key: "skill.insight", label: "Insight" },
  { key: "save.int", label: "Intelligence Save" },
  { key: "attr.int", label: "Intelligence Score" },
  { key: "skill.intimidation", label: "Intimidation" },
  { key: "skill.investigation", label: "Investigation" },
  { key: "skill.medicine", label: "Medicine" },
  { key: "skill.nature", label: "Nature" },
  { key: "sense.passivePerception", label: "Passive Perception" },
  { key: "skill.perception", label: "Perception" },
  { key: "skill.performance", label: "Performance" },
  { key: "skill.persuasion", label: "Persuasion" },
  { key: "prof_bonus", label: "Proficiency Bonus" },
  { key: "skill.religion", label: "Religion" },
  { key: "skill.sleightOfHand", label: "Sleight of Hand" },
  { key: "combat.speed", label: "Speed" },
  { key: "spell.attack", label: "Spell Attack" },
  { key: "spell.dc", label: "Spell Save DC" },
  { key: "spell.slots.1", label: "Spell Slots Lvl 1" },
  { key: "spell.slots.2", label: "Spell Slots Lvl 2" },
  { key: "spell.slots.3", label: "Spell Slots Lvl 3" },
  { key: "spell.slots.4", label: "Spell Slots Lvl 4" },
  { key: "spell.slots.5", label: "Spell Slots Lvl 5" },
  { key: "spell.slots.6", label: "Spell Slots Lvl 6" },
  { key: "spell.slots.7", label: "Spell Slots Lvl 7" },
  { key: "spell.slots.8", label: "Spell Slots Lvl 8" },
  { key: "spell.slots.9", label: "Spell Slots Lvl 9" },
  { key: "skill.stealth", label: "Stealth" },
  { key: "save.str", label: "Strength Save" },
  { key: "attr.str", label: "Strength Score" },
  { key: "skill.survival", label: "Survival" },
  { key: "save.wis", label: "Wisdom Save" },
  { key: "attr.wis", label: "Wisdom Score" },
];

const ITEM_CATEGORY_FILTERS = [
  { value: "", label: "All categories" },
  { value: "Weapon", label: "Weapons" },
  { value: "Armor", label: "Armor" },
  { value: "Wondrous Items", label: "Wondrous Items" },
  { value: "Adventuring Gear", label: "Adventuring Gear" },
  { value: "Tools", label: "Tools" },
  { value: "Mounts and Vehicles", label: "Mounts & Vehicles" },
];

function mapEquipmentCategory(eq: string): InventoryItem["category"] {
  const lower = eq.toLowerCase();
  if (lower.includes("weapon")) return "Weapon";
  if (lower.includes("armor")) return "Armor";
  if (
    lower.includes("tool") ||
    lower.includes("instrument") ||
    lower.includes("gaming set")
  )
    return "Tool";
  if (
    lower.includes("ammunition") ||
    lower.includes("potion") ||
    lower.includes("scroll")
  )
    return "Consumable";
  if (
    lower.includes("wondrous") ||
    lower.includes("ring") ||
    lower.includes("rod") ||
    lower.includes("staff") ||
    lower.includes("wand")
  )
    return "Wondrous";
  return "Mundane";
}

function buildInventoryItem(item: ItemRow): InventoryItem {
  const isShield = item.armorCategory === "Shield";
  const isWeapon = item.equipmentCategory === "Weapon";
  return {
    id: crypto.randomUUID(),
    name: item.name,
    weight: item.weight ?? 0,
    category: mapEquipmentCategory(item.equipmentCategory),
    equipped: true,
    modifiers: isShield
      ? [
          {
            id: crypto.randomUUID(),
            target: "combat.ac" as ModifierTarget,
            value: 2,
            type: "Bonus" as const,
          },
        ]
      : item.modifiersJson
        ? (JSON.parse(item.modifiersJson) as { target: ModifierTarget; value: number; type: "Bonus" | "Set To" }[]).map(
            (m) => ({ ...m, id: crypto.randomUUID() }),
          )
        : [],
    acSetsFormula: isShield ? false : (item.acBase != null ? true : null),
    acBase: isShield ? null : (item.acBase ?? null),
    acDexBonus: isShield ? null : (item.acDexBonus ?? null),
    acMaxDex: isShield ? null : (item.acMaxDex ?? null),
    stealthDisadvantage: item.stealthDisadvantage ?? null,
    strMinimum: item.strMinimum ?? null,
  };
}

function itemSummary(item: ItemRow): string {
  if (item.damageDiceCount && item.damageDieType) {
    return `${item.damageDiceCount}${item.damageDieType} ${item.damageType ?? ""}`;
  }
  if (item.acBase) {
    return `AC ${item.acBase}${item.acDexBonus ? " + DEX" : ""}`;
  }
  return item.equipmentCategory;
}

// ─── Item Picker ──────────────────────────────────────────────────────────────

function ItemPicker({
  onPick,
  onClose,
}: {
  onPick: (item: ItemRow) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [results, setResults] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function runSearch(q: string, cat: string) {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      const res = await searchItems({
        name: q || undefined,
        equipmentCategory: cat || undefined,
      });
      setResults(res);
      setLoading(false);
    }, 250);
  }

  useEffect(() => {
    runSearch("", "");
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleQueryChange(q: string) {
    setQuery(q);
    runSearch(q, categoryFilter);
  }

  function handleCategoryChange(cat: string) {
    setCategoryFilter(cat);
    runSearch(query, cat);
  }

  return (
    <div className="mt-1 rounded-md border border-border bg-muted/30 p-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
          <Input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search equipment…"
            className="h-6 pl-6 text-xs"
          />
        </div>
        <Select
          selectSize="sm"
          value={categoryFilter}
          onChange={(e) => handleCategoryChange(e.target.value)}
        >
          {ITEM_CATEGORY_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
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
          <p className="py-3 text-center text-xs text-muted-foreground">
            No items found
          </p>
        )}
        {!loading &&
          results.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded px-1.5 py-1 hover:bg-accent/50"
            >
              <div className="min-w-0 flex-1">
                <span className="text-xs font-medium">{item.name}</span>
              </div>
              <span className="shrink-0 text-[10px] text-muted-foreground w-28 truncate text-right">
                {itemSummary(item)}
              </span>
              {item.cost && (
                <span className="shrink-0 text-[10px] text-muted-foreground w-12 text-right">
                  {item.cost}
                </span>
              )}
              <button
                type="button"
                onClick={() => onPick(item)}
                className="flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
              >
                <Plus className="size-3" />
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}

// ─── Main block ───────────────────────────────────────────────────────────────

type InventoryBlockProps = {
  inventory: InventoryItem[];
  onChange: (list: InventoryItem[]) => void;
  onSrdItemSelected?: (item: ItemRow, invItem: InventoryItem) => void;
};

export function InventoryBlock({
  inventory,
  onChange,
  onSrdItemSelected,
}: InventoryBlockProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showPicker, setShowPicker] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function add() {
    onChange([
      ...inventory,
      {
        id: crypto.randomUUID(),
        name: "",
        weight: 0,
        category: "Mundane",
        equipped: true,
        modifiers: [],
      },
    ]);
  }

  function remove(id: string) {
    onChange(inventory.filter((item) => item.id !== id));
    setExpanded((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function patch(id: string, p: Partial<InventoryItem>) {
    onChange(
      inventory.map((item) => (item.id === id ? { ...item, ...p } : item)),
    );
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = inventory.findIndex((i) => i.id === active.id);
    const newIdx = inventory.findIndex((i) => i.id === over.id);
    onChange(arrayMove(inventory, oldIdx, newIdx));
  }

  function handlePickSrdItem(srdItem: ItemRow) {
    const invItem = buildInventoryItem(srdItem);
    if (onSrdItemSelected) {
      onSrdItemSelected(srdItem, invItem);
    } else {
      onChange([...inventory, invItem]);
    }
    setShowPicker(false);
  }

  const totalWeight = inventory
    .filter((item) => item.equipped)
    .reduce((s, item) => s + item.weight, 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
        <div className="size-3.5 shrink-0" />
        <div className="size-5 shrink-0" />
        <div className="size-5 shrink-0" />
        <span className="min-w-0 flex-[3]">Name</span>
        <span className="min-w-[4rem] flex-1 text-center">Weight</span>
        <span className="min-w-[7rem] flex-[2]">Category</span>
        <div className="size-5 shrink-0" />
        <div className="size-5 shrink-0" />
      </div>

      {inventory.length === 0 && !showPicker && (
        <p className="px-2 text-xs text-muted-foreground">
          No items added yet.
        </p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={inventory.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {inventory.map((item) => (
            <SortableInventoryItem
              key={item.id}
              item={item}
              isExpanded={expanded.has(item.id)}
              onToggle={() => toggle(item.id)}
              onPatch={(p) => patch(item.id, p)}
              onRemove={() => remove(item.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {showPicker && (
        <ItemPicker
          onPick={handlePickSrdItem}
          onClose={() => setShowPicker(false)}
        />
      )}

      <div className="flex items-center justify-between px-2 pt-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={add}
            className="flex h-7 items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <Plus className="size-3.5" />
            Add item
          </button>
          <button
            type="button"
            onClick={() => setShowPicker((v) => !v)}
            className={cn(
              "flex h-7 items-center gap-1.5 text-xs transition-colors",
              showPicker
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Search className="size-3.5" />
            Find
          </button>
        </div>
        {inventory.length > 0 && (
          <span className="text-xs text-muted-foreground">
            Total:{" "}
            <span className="tabular-nums text-foreground">
              {totalWeight.toFixed(1)} lb
            </span>
          </span>
        )}
      </div>
    </div>
  );
}

type SortableInventoryItemProps = {
  item: InventoryItem;
  isExpanded: boolean;
  onToggle: () => void;
  onPatch: (p: Partial<InventoryItem>) => void;
  onRemove: () => void;
};

function SortableInventoryItem({
  item,
  isExpanded,
  onToggle,
  onPatch,
  onRemove,
}: SortableInventoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });
  const [weightDraft, setWeightDraft] = useState<string | undefined>(undefined);

  function addModifier() {
    onPatch({
      modifiers: [
        ...item.modifiers,
        {
          id: crypto.randomUUID(),
          target: "combat.ac" as ModifierTarget,
          value: 0,
          type: "Bonus",
        },
      ],
    });
  }

  function removeModifier(idx: number) {
    onPatch({ modifiers: item.modifiers.filter((_, i) => i !== idx) });
  }

  function patchModifier(
    idx: number,
    p: Partial<InventoryItem["modifiers"][number]>,
  ) {
    onPatch({
      modifiers: item.modifiers.map((m, i) => (i === idx ? { ...m, ...p } : m)),
    });
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "rounded-lg border transition-colors",
        item.equipped
          ? "border-border bg-card"
          : "border-border/70 bg-muted/30",
        isDragging && "opacity-50",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 p-2",
          !item.equipped && "text-muted-foreground",
        )}
      >
        <button
          type="button"
          {...listeners}
          {...attributes}
          className={cn(
            "shrink-0 cursor-grab active:cursor-grabbing touch-none transition-colors hover:text-foreground",
            item.equipped
              ? "text-muted-foreground"
              : "text-muted-foreground/80",
          )}
        >
          <GripVertical className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label={item.equipped ? "Unequip" : "Equip"}
          onClick={() => onPatch({ equipped: !item.equipped })}
          className={cn(
            "flex size-5 shrink-0 items-center justify-center transition-colors hover:text-foreground",
            item.equipped ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {item.equipped ? (
            <Circle fill="black" className="size-3.5" />
          ) : (
            <Circle className="size-3.5" />
          )}
        </button>
        <Input
          type="text"
          value={item.name}
          placeholder="Item name"
          onChange={(e) => onPatch({ name: e.target.value })}
          className={cn(
            "h-7 min-w-0 flex-[3] text-xs",
            item.equipped
              ? "font-medium"
              : "border-input/70 bg-muted/20 text-muted-foreground",
          )}
        />
        <input
          type="text"
          inputMode="decimal"
          value={
            weightDraft !== undefined
              ? weightDraft
              : item.weight === 0
                ? ""
                : String(item.weight)
          }
          placeholder="0"
          onChange={(e) => {
            const raw = e.target.value;
            setWeightDraft(raw);
            if (raw === "") {
              onPatch({ weight: 0 });
              return;
            }
            if (/\.$/.test(raw)) return;
            const n = parseFloat(raw);
            if (!isNaN(n)) onPatch({ weight: n });
          }}
          onBlur={(e) => {
            setWeightDraft(undefined);
            const n = parseFloat(e.target.value);
            onPatch({ weight: isNaN(n) ? 0 : n });
          }}
          className={cn(
            "h-7 min-w-[4rem] flex-1 rounded-md border text-center text-xs focus:outline-none focus:border-ring",
            item.equipped
              ? "border-input bg-background text-foreground"
              : "border-input/70 bg-muted/20 text-muted-foreground",
          )}
        />
        <Select
          selectSize="sm"
          className={cn(
            "h-7 min-w-[7rem] flex-[2]",
            item.equipped ? "" : "border-input/70 bg-muted/20 text-muted-foreground",
          )}
          value={item.category}
          onChange={(e) =>
            onPatch({ category: e.target.value as InventoryItem["category"] })
          }
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "flex size-5 shrink-0 items-center justify-center transition-colors hover:text-foreground",
            item.equipped
              ? "text-muted-foreground"
              : "text-muted-foreground/80",
          )}
        >
          {isExpanded ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronRight className="size-3.5" />
          )}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="size-3" />
        </button>
      </div>

      {isExpanded && (
        <div
          className={cn(
            "border-t px-3 py-2 space-y-2",
            item.equipped ? "border-border" : "border-border/70",
          )}
        >
          {/* Armor AC configuration — only for Armor category */}
          {item.category === "Armor" && item.acSetsFormula !== false && (
            <div className="space-y-1.5 border-b border-border/60 pb-2">
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={item.acSetsFormula === true}
                  onChange={(e) => {
                    if (!e.target.checked) {
                      onPatch({ acSetsFormula: false, acBase: null, acDexBonus: null, acMaxDex: null });
                    } else {
                      onPatch({ acSetsFormula: true });
                    }
                  }}
                  className="size-3"
                />
                Sets armor class formula
              </label>
              {item.acSetsFormula === true && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Base</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={item.acBase ?? ""}
                      placeholder="—"
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "") {
                          onPatch({ acBase: null });
                          return;
                        }
                        const n = parseInt(raw, 10);
                        if (!isNaN(n)) onPatch({ acBase: n });
                      }}
                      className="h-6 w-12 rounded-md border border-input bg-background text-center text-xs focus:outline-none focus:border-ring"
                    />
                  </div>
                  <label className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={item.acDexBonus ?? true}
                      onChange={(e) => onPatch({ acDexBonus: e.target.checked })}
                      className="size-3"
                    />
                    + DEX
                  </label>
                  {(item.acDexBonus ?? true) && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">max</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={item.acMaxDex ?? ""}
                        placeholder="—"
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === "") {
                            onPatch({ acMaxDex: null });
                            return;
                          }
                          const n = parseInt(raw, 10);
                          if (!isNaN(n)) onPatch({ acMaxDex: n });
                        }}
                        className="h-6 w-10 rounded-md border border-input bg-background text-center text-xs focus:outline-none focus:border-ring"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground">Modifiers</p>
          {item.modifiers.length === 0 && (
            <p className="text-xs text-muted-foreground/60">No modifiers.</p>
          )}
          {item.modifiers.map((mod, idx) => {
            const availableTypes =
              mod.target === "combat.ac" ? (["Bonus"] as const) : MOD_TYPES;
            return (
              <div key={idx} className="flex items-center gap-1.5">
                <Select
                  selectSize="sm"
                  className="min-w-0 flex-1"
                  value={mod.target}
                  onChange={(e) =>
                    patchModifier(idx, {
                      target: e.target.value as ModifierTarget,
                    })
                  }
                >
                  {MODIFIER_TARGETS.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </Select>
                <Select
                  selectSize="sm"
                  value={mod.type}
                  onChange={(e) =>
                    patchModifier(idx, {
                      type: e.target.value as "Bonus" | "Set To",
                    })
                  }
                >
                  {availableTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
                <div className="flex h-6 w-16 items-center rounded-md border border-input bg-background focus-within:border-ring">
                  <span className="select-none pl-2 text-xs text-muted-foreground">
                    {mod.type === "Set To" ? "=" : "+"}
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={mod.value === 0 ? "" : String(mod.value)}
                    placeholder="0"
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        patchModifier(idx, { value: 0 });
                        return;
                      }
                      if (raw === "-") return;
                      const n = parseInt(raw, 10);
                      if (!isNaN(n)) patchModifier(idx, { value: n });
                    }}
                    onBlur={(e) => {
                      if (e.target.value === "-")
                        patchModifier(idx, { value: 0 });
                    }}
                    className="h-full min-w-0 flex-1 bg-transparent px-1.5 text-xs placeholder:text-card-foreground/40 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeModifier(idx)}
                  className="flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="size-2.5" />
                </button>
              </div>
            );
          })}
          <button
            type="button"
            onClick={addModifier}
            className="flex h-6 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <Plus className="size-3" />
            Add modifier
          </button>
        </div>
      )}
    </div>
  );
}
