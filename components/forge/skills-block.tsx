"use client";

import { useState } from "react";
import {
  RotateCcw,
  Circle,
  CircleDot,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  X,
  Plus,
  Lock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  AttributeKey,
  AttributeData,
  SkillData,
  SkillState,
  ModifierEntry,
  DerivedValueData,
} from "@/lib/types/character";

import {
  resolveSkillBonus,
  resolvePb,
  resolvePassivePerception,
} from "@/lib/character/calculations";

type SkillMeta = { label: string; attr: AttributeKey };

const SKILLS: { key: string; meta: SkillMeta }[] = [
  { key: "acrobatics", meta: { label: "Acrobatics", attr: "dex" } },
  { key: "animalHandling", meta: { label: "Animal Handling", attr: "wis" } },
  { key: "arcana", meta: { label: "Arcana", attr: "int" } },
  { key: "athletics", meta: { label: "Athletics", attr: "str" } },
  { key: "deception", meta: { label: "Deception", attr: "cha" } },
  { key: "history", meta: { label: "History", attr: "int" } },
  { key: "insight", meta: { label: "Insight", attr: "wis" } },
  { key: "intimidation", meta: { label: "Intimidation", attr: "cha" } },
  { key: "investigation", meta: { label: "Investigation", attr: "int" } },
  { key: "medicine", meta: { label: "Medicine", attr: "wis" } },
  { key: "nature", meta: { label: "Nature", attr: "int" } },
  { key: "perception", meta: { label: "Perception", attr: "wis" } },
  { key: "performance", meta: { label: "Performance", attr: "cha" } },
  { key: "persuasion", meta: { label: "Persuasion", attr: "cha" } },
  { key: "religion", meta: { label: "Religion", attr: "int" } },
  { key: "sleightOfHand", meta: { label: "Sleight of Hand", attr: "dex" } },
  { key: "stealth", meta: { label: "Stealth", attr: "dex" } },
  { key: "survival", meta: { label: "Survival", attr: "wis" } },
];

const NEXT_STATE: Record<SkillState, SkillState> = {
  None: "Proficient",
  Proficient: "Expertise",
  Expertise: "None",
};

function stateBonus(state: SkillState, pb: number): number {
  if (state === "Proficient") return pb;
  if (state === "Expertise") return pb * 2;
  return 0;
}

type SkillsBlockProps = {
  skills: Record<string, SkillData>;
  attributes: Record<AttributeKey, AttributeData>;
  proficiencyBonus: number;
  jackOfAllTrades: boolean;
  globalStack: ModifierEntry[];
  passivePerception: DerivedValueData;
  showManualControls: boolean;
  onStateChange: (key: string, state: SkillState) => void;
  onOverrideChange: (key: string, override: number | null) => void;
  onJackOfAllTradesChange: (value: boolean) => void;
  onGlobalStackChange: (stack: ModifierEntry[]) => void;
  onPassivePerceptionStackChange: (stack: ModifierEntry[]) => void;
  onPassivePerceptionOverrideChange: (override: number | null) => void;
};

export function SkillsBlock({
  skills,
  attributes,
  proficiencyBonus,
  jackOfAllTrades,
  globalStack,
  passivePerception,
  showManualControls,
  onStateChange,
  onOverrideChange,
  onJackOfAllTradesChange,
  onGlobalStackChange,
  onPassivePerceptionStackChange,
  onPassivePerceptionOverrideChange,
}: SkillsBlockProps) {
  const [globalExpanded, setGlobalExpanded] = useState(false);
  const [passiveExpanded, setPassiveExpanded] = useState(false);

  const mockChar = {
    skills,
    attributes,
    jackOfAllTrades,
    skillGlobalStack: globalStack,
    passivePerception,
    identity: { level: (proficiencyBonus - 1) * 4 }, // Hacky PB fallback
    profBonusStack: [],
  } as any;

  const globalSum = globalStack
    .filter((m) => m.isActive)
    .reduce((s, m) => s + m.value, 0);
  const pb = resolvePb(mockChar);
  const joatBonus = Math.floor(pb / 2);
  const passiveSum = passivePerception.stack
    .filter((m) => m.isActive)
    .reduce((s, m) => s + m.value, 0);
  const passiveValue = resolvePassivePerception(mockChar);
  const passiveOverridden = passivePerception.override !== null;

  function calculated(key: string, attr: AttributeKey): number {
    return resolveSkillBonus(mockChar, key, attr);
  }

  function handleStateClick(
    key: string,
    current: SkillState,
    override: number | null,
  ) {
    const next = NEXT_STATE[current];
    const delta = stateBonus(next, pb) - stateBonus(current, pb);
    onStateChange(key, next);
    if (override !== null) onOverrideChange(key, override + delta);
  }

  function handleOverrideChange(key: string, raw: string) {
    if (raw === "") {
      onOverrideChange(key, null);
      return;
    }
    if (raw === "-") return;
    if (!/^-?\d+$/.test(raw)) return;
    const n = parseInt(raw, 10);
    if (!isNaN(n)) onOverrideChange(key, n);
  }

  function addGlobalMod() {
    onGlobalStackChange([
      ...globalStack,
      { id: crypto.randomUUID(), source: "", value: 0, isActive: true },
    ]);
  }

  function removeGlobalMod(id: string) {
    onGlobalStackChange(globalStack.filter((m) => m.id !== id));
  }

  function updateGlobalMod(id: string, patch: Partial<ModifierEntry>) {
    onGlobalStackChange(
      globalStack.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    );
  }

  function addPassiveMod() {
    onPassivePerceptionStackChange([
      ...passivePerception.stack,
      { id: crypto.randomUUID(), source: "", value: 0, isActive: true },
    ]);
  }

  function removePassiveMod(id: string) {
    onPassivePerceptionStackChange(
      passivePerception.stack.filter((m) => m.id !== id),
    );
  }

  function updatePassiveMod(id: string, patch: Partial<ModifierEntry>) {
    onPassivePerceptionStackChange(
      passivePerception.stack.map((m) =>
        m.id === id ? { ...m, ...patch } : m,
      ),
    );
  }

  function handlePassiveOverrideChange(raw: string) {
    if (raw === "") {
      onPassivePerceptionOverrideChange(null);
      return;
    }
    if (raw === "-") return;
    if (!/^-?\d+$/.test(raw)) return;
    const n = parseInt(raw, 10);
    if (!isNaN(n)) onPassivePerceptionOverrideChange(n);
  }

  return (
    <div className="flex flex-col gap-1">
      {/* Jack of All Trades toggle */}
      <button
        type="button"
        onClick={() => onJackOfAllTradesChange(!jackOfAllTrades)}
        className={cn(
          "mb-1 flex h-6 items-center gap-1.5 rounded px-1 text-xs transition-colors",
          jackOfAllTrades
            ? "text-foreground font-medium"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {jackOfAllTrades ? (
          <CircleDot className="size-3" />
        ) : (
          <Circle className="size-3" />
        )}
        Jack of All Trades
        {jackOfAllTrades && (
          <span className="ml-1 font-normal text-muted-foreground">
            +{joatBonus}
          </span>
        )}
      </button>

      {/* Skill rows */}
      {SKILLS.map(({ key, meta }) => {
        const skill = skills[key];
        if (!skill) return null;
        const calc = calculated(key, meta.attr);
        const isOverridden = skill.override !== null;
        const total = skill.override ?? calc;

        return (
          <div key={key} className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label={`Cycle proficiency: currently ${skill.state}`}
              onClick={() => handleStateClick(key, skill.state, skill.override)}
              className={cn(
                "flex size-4 shrink-0 items-center justify-center transition-colors",
                skill.state === "None" &&
                  "text-muted-foreground hover:text-foreground",
                skill.state === "Proficient" && "text-informative",
                skill.state === "Expertise" && "text-destructive",
              )}
            >
              {skill.state === "None" && <Circle className="size-3" />}
              {skill.state === "Proficient" && (
                <Circle fill="text-informative" className="size-3" />
              )}
              {skill.state === "Expertise" && (
                <Circle fill="text-destructive" className="size-3" />
              )}
            </button>

            <span
              className={cn(
                "flex-1 truncate text-xs",
                skill.state === "None"
                  ? "text-muted-foreground"
                  : "text-foreground font-medium",
              )}
            >
              {meta.label}
            </span>

            <span className="w-6 shrink-0 text-center text-xs text-muted-foreground tabular-nums">
              {meta.attr.toUpperCase()}
            </span>

            {showManualControls ? (
              <div className="relative w-12 shrink-0">
                <input
                  type="text"
                  inputMode="numeric"
                  value={isOverridden ? skill.override! : ""}
                  placeholder={calc.toString()}
                  onChange={(e) => handleOverrideChange(key, e.target.value)}
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
                    aria-label="Reset to calculated value"
                    onClick={() => onOverrideChange(key, null)}
                    className="absolute right-0.5 top-1/2 -translate-y-1/2 flex size-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <RotateCcw className="size-2.5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex h-6 w-12 shrink-0 items-center justify-center rounded-md border border-input bg-background text-xs font-medium tabular-nums text-card-foreground">
                {total}
              </div>
            )}
          </div>
        );
      })}

      <div className="mt-2 flex flex-col gap-1 rounded-md border border-border bg-card/60 p-2">
        <div className="flex items-center gap-2">
          <span className="flex-1 text-xs font-medium text-card-foreground">
            Passive Perception
          </span>
          {showManualControls ? (
            <div className="relative w-12 shrink-0">
              <input
                type="text"
                inputMode="numeric"
                value={passiveOverridden ? passivePerception.override! : ""}
                placeholder={passiveValue.toString()}
                onChange={(e) => handlePassiveOverrideChange(e.target.value)}
                className={cn(
                  "h-6 w-full rounded-md border border-input bg-background text-center text-xs transition-colors",
                  "placeholder:text-card-foreground/40",
                  "focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/50",
                  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                  passiveOverridden && "pr-4",
                )}
              />
              {passiveOverridden && (
                <button
                  type="button"
                  aria-label="Reset to calculated value"
                  onClick={() => onPassivePerceptionOverrideChange(null)}
                  className="absolute right-0.5 top-1/2 -translate-y-1/2 flex size-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                >
                  <RotateCcw className="size-2.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex h-6 w-12 shrink-0 items-center justify-center rounded-md border border-input bg-background text-xs font-medium tabular-nums text-card-foreground">
              {passivePerception.override ?? passiveValue}
            </div>
          )}
        </div>

        {showManualControls && (
          <>
            <button
              type="button"
              onClick={() => setPassiveExpanded((v) => !v)}
              className="flex h-5 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {passiveExpanded ? (
                <ChevronDown className="size-3" />
              ) : (
                <ChevronRight className="size-3" />
              )}
              Modifiers
              {!passiveExpanded && passiveSum !== 0 && (
                <span className="ml-auto tabular-nums">
                  {passiveSum >= 0 ? `+${passiveSum}` : passiveSum}
                </span>
              )}
            </button>

            {passiveExpanded && (
              <div className="flex flex-col gap-1.5">
                {passivePerception.stack.map((mod) =>
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
                          onChange={(e) =>
                            updatePassiveMod(mod.id, { source: e.target.value })
                          }
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
                                updatePassiveMod(mod.id, { value: 0 });
                                return;
                              }
                              if (raw === "-") return;
                              const n = parseInt(raw, 10);
                              if (!isNaN(n))
                                updatePassiveMod(mod.id, { value: n });
                            }}
                            onBlur={(e) => {
                              if (e.target.value === "-")
                                updatePassiveMod(mod.id, { value: 0 });
                            }}
                            className="h-full min-w-0 flex-1 bg-transparent px-1.5 text-xs placeholder:text-card-foreground/40 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="mt-0.5 flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => removePassiveMod(mod.id)}
                          className="flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="size-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updatePassiveMod(mod.id, {
                              isActive: !mod.isActive,
                            })
                          }
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
                  onClick={addPassiveMod}
                  className="flex h-6 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Plus className="size-3" />
                  Add modifier
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showManualControls && (
        <div className="mt-2 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setGlobalExpanded((v) => !v)}
            className="flex h-5 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {globalExpanded ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
            Global modifier
            {!globalExpanded && globalSum !== 0 && (
              <span className="ml-auto tabular-nums">
                {globalSum >= 0 ? `+${globalSum}` : globalSum}
              </span>
            )}
          </button>

          {globalExpanded && (
            <div className="flex flex-col gap-1.5">
              {globalStack.map((mod) =>
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
                        onChange={(e) =>
                          updateGlobalMod(mod.id, { source: e.target.value })
                        }
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
                              updateGlobalMod(mod.id, { value: 0 });
                              return;
                            }
                            if (raw === "-") return;
                            const n = parseInt(raw, 10);
                            if (!isNaN(n))
                              updateGlobalMod(mod.id, { value: n });
                          }}
                          onBlur={(e) => {
                            if (e.target.value === "-")
                              updateGlobalMod(mod.id, { value: 0 });
                          }}
                          className="h-full min-w-0 flex-1 bg-transparent px-1.5 text-xs placeholder:text-card-foreground/40 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="mt-0.5 flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => removeGlobalMod(mod.id)}
                        className="flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="size-2.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateGlobalMod(mod.id, { isActive: !mod.isActive })
                        }
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
                onClick={addGlobalMod}
                className="flex h-6 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <Plus className="size-3" />
                Add modifier
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
