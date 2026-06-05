"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, CircleDot, Circle, X, Plus, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DynamicValueInput } from "@/components/forge/dynamic-value-input";
import type { AttributeKey, AttributeData, ModifierEntry } from "@/lib/types/character";

type Props = {
  stack: ModifierEntry[];
  onChange: (stack: ModifierEntry[]) => void;
  isVisible: boolean;
  attrs: Record<AttributeKey, AttributeData>;
  level: number;
  pb: number;
};

export function GlobalSaveModifierPanel({ stack, onChange, isVisible, attrs, level, pb }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!isVisible) return null;

  const activeTotal = stack.filter((m) => m.isActive).reduce((s, m) => s + m.value, 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex h-5 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        {expanded ? (
          <ChevronDown className="size-3" />
        ) : (
          <ChevronUp className="size-3" />
        )}
        Global modifier
        {!expanded && stack.length > 0 && (
          <span className="ml-auto tabular-nums">
            {activeTotal >= 0 ? `+${activeTotal}` : activeTotal}
          </span>
        )}
      </button>
      {expanded && (
        <div className="flex flex-col gap-1.5">
          {stack.map((mod) =>
            mod.sourceId ? (
              <div
                key={mod.id}
                className={`flex items-center gap-1 rounded border border-border bg-muted/40 px-1.5 py-0.5${!mod.isActive ? " opacity-40" : ""}`}
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
              <div key={mod.id} className="flex items-start gap-1">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Input
                    type="text"
                    value={mod.source}
                    placeholder="Source"
                    className="h-6 text-xs"
                    onChange={(e) =>
                      onChange(stack.map((m) => (m.id === mod.id ? { ...m, source: e.target.value } : m)))
                    }
                  />
                  <DynamicValueInput
                    value={mod.value}
                    valueSource={mod.valueSource}
                    valueMultiplier={mod.valueMultiplier}
                    valueOffset={mod.valueOffset}
                    attrs={attrs}
                    level={level}
                    pb={pb}
                    onChange={(v, vs, vm, vo) =>
                      onChange(
                        stack.map((m) =>
                          m.id === mod.id
                            ? { ...m, value: v, valueSource: vs, valueMultiplier: vm, valueOffset: vo }
                            : m,
                        ),
                      )
                    }
                  />
                </div>
                <div className="mt-0.5 flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => onChange(stack.filter((m) => m.id !== mod.id))}
                    className="flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="size-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onChange(stack.map((m) => (m.id === mod.id ? { ...m, isActive: !m.isActive } : m)))
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
            onClick={() =>
              onChange([
                ...stack,
                { id: crypto.randomUUID(), source: "", value: 0, isActive: true },
              ])
            }
            className="flex h-6 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <Plus className="size-3" />
            Add modifier
          </button>
        </div>
      )}
    </>
  );
}
