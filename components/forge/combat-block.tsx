"use client";

import { useState } from "react";
import {
  RotateCcw,
  CircleDot,
  Circle,
  ChevronDown,
  ChevronRight,
  X,
  Plus,
  Lock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  CombatData,
  AttributeKey,
  AttributeData,
  ModifierEntry,
  AcMode,
} from "@/lib/types/character";

import {
  resolveAc,
  resolveInitiative,
  resolveSpeed,
  resolveHpMax,
  resolveAttributeMod,
  resolveAttributeScore,
} from "@/lib/character/calculations";

const ATTR_KEYS: AttributeKey[] = ["str", "dex", "con", "int", "wis", "cha"];
const ATTR_ABBR: Record<AttributeKey, string> = {
  str: "STR",
  dex: "DEX",
  con: "CON",
  int: "INT",
  wis: "WIS",
  cha: "CHA",
};

function sign(n: number): string {
  return n >= 0 ? `+${n}` : String(n);
}

function ModStack({
  stack,
  expanded,
  onToggle,
  onStackChange,
}: {
  stack: ModifierEntry[];
  expanded: boolean;
  onToggle: () => void;
  onStackChange: (s: ModifierEntry[]) => void;
}) {
  const sum = stack.filter((m) => m.isActive).reduce((s, m) => s + m.value, 0);

  function patch(id: string, p: Partial<ModifierEntry>) {
    onStackChange(stack.map((m) => (m.id === id ? { ...m, ...p } : m)));
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={onToggle}
        className="flex h-5 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        {expanded ? (
          <ChevronDown className="size-3" />
        ) : (
          <ChevronRight className="size-3" />
        )}
        Modifiers
        {!expanded && stack.length > 0 && (
          <span className="ml-auto tabular-nums">{sign(sum)}</span>
        )}
      </button>
      {expanded && (
        <div className="flex flex-col gap-1.5">
          {stack.map((mod) =>
            mod.sourceId ? (
              <div
                key={mod.id}
                className={cn(
                  "flex items-center gap-1 rounded border border-border bg-muted/40 px-1.5 py-0.5",
                  !mod.isActive && "opacity-40",
                )}
              >
                <Lock className="size-2.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                  {mod.source}
                </span>
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
                className={cn(
                  "flex items-start gap-1",
                  !mod.isActive && "opacity-40",
                )}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Input
                    type="text"
                    value={mod.source}
                    placeholder="Source"
                    className="h-6 text-xs"
                    onChange={(e) => patch(mod.id, { source: e.target.value })}
                  />
                  <div className="flex h-6 items-center rounded-md border border-input bg-background focus-within:border-ring">
                    <span className="select-none pl-2 text-xs text-muted-foreground">
                      +
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={mod.value === 0 ? "" : String(mod.value)}
                      placeholder="0"
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "") {
                          patch(mod.id, { value: 0 });
                          return;
                        }
                        if (raw === "-") return;
                        const n = parseInt(raw, 10);
                        if (!isNaN(n)) patch(mod.id, { value: n });
                      }}
                      onBlur={(e) => {
                        if (e.target.value === "-") patch(mod.id, { value: 0 });
                      }}
                      className="h-full min-w-0 flex-1 bg-transparent px-1.5 text-xs placeholder:text-foreground/30 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="mt-0.5 flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      onStackChange(stack.filter((m) => m.id !== mod.id))
                    }
                    className="flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="size-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => patch(mod.id, { isActive: !mod.isActive })}
                    className="flex size-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {mod.isActive ? (
                      <CircleDot className="size-2.5" />
                    ) : (
                      <Circle className="size-2.5" />
                    )}
                  </button>
                </div>
              </div>
            ),
          )}
          <button
            type="button"
            onClick={() =>
              onStackChange([
                ...stack,
                {
                  id: crypto.randomUUID(),
                  source: "",
                  value: 0,
                  isActive: true,
                },
              ])
            }
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

type ClassEntry = { name: string; level: number; hitDie: string };

type CombatBlockProps = {
  data: CombatData;
  attributes: Record<AttributeKey, AttributeData>;
  classes: ClassEntry[];
  proficiencyBonus: number;
  jackOfAllTrades: boolean;
  showManualControls: boolean;
  onAcChange: (ac: CombatData["ac"]) => void;
  onInitiativeChange: (initiative: CombatData["initiative"]) => void;
  onSpeedChange: (speed: CombatData["speed"]) => void;
  onHpChange: (hp: CombatData["hp"]) => void;
};

export function CombatBlock({
  data,
  attributes,
  classes,
  proficiencyBonus,
  jackOfAllTrades,
  showManualControls,
  onAcChange,
  onInitiativeChange,
  onSpeedChange,
  onHpChange,
}: CombatBlockProps) {
  const [acExpanded, setAcExpanded] = useState(false);
  const [initExpanded, setInitExpanded] = useState(false);
  const [speedExpanded, setSpeedExpanded] = useState(false);
  const [hpExpanded, setHpExpanded] = useState(false);
  const [initRaw, setInitRaw] = useState<string | null>(null);

  const totalLevel = classes.reduce((sum, cls) => sum + cls.level, 0);

  // Partial character object for the resolver
  const mockChar = {
    identity: { classes, level: totalLevel },
    attributes,
    combat: data,
    jackOfAllTrades,
    profBonusStack: [], // resolvePb fallback
  } as any;

  const dexMod = resolveAttributeMod(attributes.dex);
  const dexScore = resolveAttributeScore(attributes.dex);

  const acStackSum = data.ac.stack
    .filter((m) => m.isActive)
    .reduce((s, m) => s + m.value, 0);

  const acCalc = resolveAc(mockChar);
  const acOverridden = data.ac.override !== null;

  const initCalc = resolveInitiative(mockChar);
  const initOverridden = data.initiative.override !== null;

  const speedCalc = resolveSpeed(mockChar);
  const speedOverridden = data.speed.override !== null;

  const hpCalc = resolveHpMax(mockChar);
  const hpOverridden = data.hp.max !== null;

  return (
    <div className="flex flex-wrap gap-4">
      {/* Armor Class */}
      <div className="w-52 shrink-0 space-y-3 rounded-lg border border-border bg-card p-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Armor Class
        </h3>

        {/* Mode selector */}
        <div className="flex overflow-hidden rounded-md border border-input">
          {(["Standard", "Formula"] as AcMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onAcChange({ ...data.ac, mode })}
              className={cn(
                "flex-1 h-6 text-xs transition-colors",
                mode === data.ac.mode
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Formula inputs — only in Formula mode */}
        {data.ac.mode === "Formula" && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-10 shrink-0 text-xs text-muted-foreground">
                Base
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={data.ac.base === 0 ? "" : String(data.ac.base)}
                placeholder="10"
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  onAcChange({ ...data.ac, base: isNaN(n) ? 0 : n });
                }}
                className="h-6 min-w-0 flex-1 rounded-md border border-input bg-background text-center text-xs focus:outline-none focus:border-ring"
              />
            </div>
            {(["statA", "statB"] as const).map((key) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className="w-10 shrink-0 text-xs text-muted-foreground">
                  + Stat
                </span>
                <select
                  value={data.ac[key] ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    onAcChange({
                      ...data.ac,
                      [key]: val === "" ? null : (val as AttributeKey),
                    });
                  }}
                  className="h-6 min-w-0 flex-1 rounded-md border border-input bg-background px-1.5 text-xs text-foreground focus:outline-none focus:border-ring"
                >
                  <option value="">—</option>
                  {ATTR_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {ATTR_ABBR[k]} ({sign(resolveAttributeMod(attributes[k]))})
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        {/* Standard mode hint */}
        {data.ac.mode === "Standard" && (
          <p className="text-xs text-muted-foreground">
            10 + DEX ({sign(dexMod)})
            {acStackSum > 0 && ` + ${acStackSum}`}
            {acStackSum < 0 && ` - ${Math.abs(acStackSum)}`}
          </p>
        )}

        {/* Stack total hint — shown when manual controls hidden and stack is non-zero */}
        {!showManualControls && acStackSum !== 0 && data.ac.mode === "Formula" && (
          <p className="text-xs text-muted-foreground">
            {acStackSum > 0 ? `+ ${acStackSum}` : `- ${Math.abs(acStackSum)}`} from modifiers
          </p>
        )}

        {/* Modifier stack — both modes */}
        {showManualControls && (
          <ModStack
            stack={data.ac.stack}
            expanded={acExpanded}
            onToggle={() => setAcExpanded((v) => !v)}
            onStackChange={(stack) => onAcChange({ ...data.ac, stack })}
          />
        )}

        {/* Ghost total */}
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-xs text-muted-foreground">Total</span>
          {showManualControls ? (
            <div className="relative min-w-0 flex-1">
              <input
                type="text"
                inputMode="numeric"
                value={acOverridden ? data.ac.override! : ""}
                placeholder={String(acCalc)}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    onAcChange({ ...data.ac, override: null });
                    return;
                  }
                  if (raw === "-") return;
                  if (!/^-?\d+$/.test(raw)) return;
                  const n = parseInt(raw, 10);
                  if (!isNaN(n)) onAcChange({ ...data.ac, override: n });
                }}
                className={cn(
                  "h-6 w-full rounded-md border border-input bg-background text-center text-xs transition-colors",
                  "placeholder:text-foreground/30 focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/50",
                  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                  acOverridden && "pr-5",
                )}
              />
              {acOverridden && (
                <button
                  type="button"
                  aria-label="Reset"
                  onClick={() => onAcChange({ ...data.ac, override: null })}
                  className="absolute right-1 top-1/2 -translate-y-1/2 flex size-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                >
                  <RotateCcw className="size-2.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex h-6 min-w-0 flex-1 items-center justify-center rounded-md border border-input bg-background px-2 text-xs font-medium tabular-nums text-foreground">
              {data.ac.override ?? acCalc}
            </div>
          )}
        </div>
      </div>

      {/* Initiative */}
      <div className="w-40 shrink-0 space-y-2 rounded-lg border border-border bg-card p-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Initiative
        </h3>

        {showManualControls && (
          <ModStack
            stack={data.initiative.stack}
            expanded={initExpanded}
            onToggle={() => setInitExpanded((v) => !v)}
            onStackChange={(stack) =>
              onInitiativeChange({ ...data.initiative, stack })
            }
          />
        )}

        <div className="flex items-center gap-2">
          <span className="shrink-0 text-xs text-muted-foreground">Total</span>
          {showManualControls ? (
            <div className="relative min-w-0 flex-1">
              <input
                type="text"
                inputMode="decimal"
                value={
                  initRaw ??
                  (initOverridden ? String(data.initiative.override!) : "")
                }
                placeholder={`${initCalc}.${dexScore}`}
                onChange={(e) => {
                  const raw = e.target.value;
                  setInitRaw(raw);
                  if (raw === "") {
                    onInitiativeChange({ ...data.initiative, override: null });
                    setInitRaw(null);
                    return;
                  }
                  if (/^-?$/.test(raw) || /^-?\d*\.$/.test(raw)) return;
                  if (!/^-?\d*\.?\d*$/.test(raw)) {
                    setInitRaw(null);
                    return;
                  }
                  const n = parseFloat(raw);
                  if (!isNaN(n))
                    onInitiativeChange({ ...data.initiative, override: n });
                }}
                onBlur={() => setInitRaw(null)}
                className={cn(
                  "h-6 w-full rounded-md border border-input bg-background text-center text-xs transition-colors",
                  "placeholder:text-foreground/30 focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/50",
                  initOverridden && "pr-5",
                )}
              />
              {initOverridden && (
                <button
                  type="button"
                  aria-label="Reset"
                  onClick={() =>
                    onInitiativeChange({ ...data.initiative, override: null })
                  }
                  className="absolute right-1 top-1/2 -translate-y-1/2 flex size-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                >
                  <RotateCcw className="size-2.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex h-6 min-w-0 flex-1 items-center justify-center rounded-md border border-input bg-background px-2 text-xs font-medium tabular-nums text-foreground">
              {data.initiative.override ?? initCalc}
            </div>
          )}
        </div>
      </div>

      {/* Speed */}
      <div className="w-40 shrink-0 space-y-2 rounded-lg border border-border bg-card p-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Speed
        </h3>

        <div className="flex items-center gap-1.5">
          <span className="shrink-0 text-xs text-muted-foreground">Base</span>
          <input
            type="text"
            inputMode="numeric"
            value={data.speed.base === 0 ? "" : String(data.speed.base)}
            placeholder="30"
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === "") {
                onSpeedChange({ ...data.speed, base: 0 });
                return;
              }
              const n = parseInt(raw, 10);
              if (!isNaN(n)) onSpeedChange({ ...data.speed, base: n });
            }}
            className="h-6 min-w-0 flex-1 rounded-md border border-input bg-background text-center text-xs focus:outline-none focus:border-ring"
          />
          <span className="shrink-0 text-xs text-muted-foreground">ft</span>
        </div>

        {showManualControls && (
          <ModStack
            stack={data.speed.stack}
            expanded={speedExpanded}
            onToggle={() => setSpeedExpanded((v) => !v)}
            onStackChange={(stack) => onSpeedChange({ ...data.speed, stack })}
          />
        )}

        <div className="flex items-center gap-2">
          <span className="shrink-0 text-xs text-muted-foreground">Total</span>
          {showManualControls ? (
            <div className="relative min-w-0 flex-1">
              <input
                type="text"
                inputMode="numeric"
                value={speedOverridden ? data.speed.override! : ""}
                placeholder={`${speedCalc}`}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    onSpeedChange({ ...data.speed, override: null });
                    return;
                  }
                  if (raw === "-") return;
                  if (!/^-?\d+$/.test(raw)) return;
                  const n = parseInt(raw, 10);
                  if (!isNaN(n)) onSpeedChange({ ...data.speed, override: n });
                }}
                className={cn(
                  "h-6 w-full rounded-md border border-input bg-background text-center text-xs transition-colors",
                  "placeholder:text-foreground/30 focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/50",
                  speedOverridden && "pr-5",
                )}
              />
              {speedOverridden && (
                <button
                  type="button"
                  aria-label="Reset"
                  onClick={() => onSpeedChange({ ...data.speed, override: null })}
                  className="absolute right-1 top-1/2 -translate-y-1/2 flex size-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                >
                  <RotateCcw className="size-2.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex h-6 min-w-0 flex-1 items-center justify-center rounded-md border border-input bg-background px-2 text-xs font-medium tabular-nums text-foreground">
              {data.speed.override ?? speedCalc}
            </div>
          )}
          <span className="shrink-0 text-xs text-muted-foreground">ft</span>
        </div>
      </div>

      {/* Hit Points */}
      <div className="min-w-0 max-w-72 flex-1 space-y-3 rounded-lg border border-border bg-card p-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Hit Points
        </h3>

        <div className="flex items-end gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Max HP</span>
            {showManualControls ? (
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={hpOverridden ? String(data.hp.max!) : ""}
                  placeholder={String(hpCalc)}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") {
                      onHpChange({ ...data.hp, max: null });
                      return;
                    }
                    if (raw === "-") return;
                    if (!/^-?\d+$/.test(raw)) return;
                    const n = parseInt(raw, 10);
                    if (!isNaN(n)) onHpChange({ ...data.hp, max: n });
                  }}
                  className={cn(
                    "h-9 w-20 rounded-md border border-input bg-background text-center text-lg font-semibold focus:outline-none focus:border-ring",
                    "placeholder:text-foreground/30",
                    hpOverridden && "pr-5",
                  )}
                />
                {hpOverridden && (
                  <button
                    type="button"
                    aria-label="Reset"
                    onClick={() => onHpChange({ ...data.hp, max: null })}
                    className="absolute right-1 top-1/2 -translate-y-1/2 flex size-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <RotateCcw className="size-2.5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex h-9 w-20 items-center justify-center rounded-md border border-input bg-background px-2 text-lg font-semibold tabular-nums text-foreground">
                {data.hp.max ?? hpCalc}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {showManualControls && (
              <ModStack
                stack={data.hp.stack}
                expanded={hpExpanded}
                onToggle={() => setHpExpanded((v) => !v)}
                onStackChange={(stack) => onHpChange({ ...data.hp, stack })}
              />
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground">Hit Dice</span>
          {classes.length === 0 ? (
            <p className="text-xs italic text-muted-foreground">
              No classes defined
            </p>
          ) : (
            classes.map((cls, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <span className="font-medium tabular-nums text-foreground">
                  {cls.level}
                  {cls.hitDie}
                </span>
                {cls.name && (
                  <span className="text-muted-foreground">({cls.name})</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
