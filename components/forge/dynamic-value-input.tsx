"use client"

import { Sigma } from "lucide-react"
import { Select } from "@/components/ui/select"
import type { TrackerBaseSource, AttributeKey, AttributeData } from "@/lib/types/character"
import { resolveModifierValue } from "@/lib/character/calculations"

const ATTR_KEYS: AttributeKey[] = ["str", "dex", "con", "int", "wis", "cha"]
const ATTR_LABELS: Record<AttributeKey, string> = {
  str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA",
}

function sourceToValue(src?: TrackerBaseSource): string {
  if (!src || src.kind === "fixed") return "fixed"
  if (src.kind === "attr_mod") return `attr_mod:${src.attr}`
  return src.kind
}

function valueToSource(s: string): TrackerBaseSource {
  if (s.startsWith("attr_mod:")) return { kind: "attr_mod", attr: s.split(":")[1] as AttributeKey }
  if (s === "level") return { kind: "level" }
  if (s === "half_level_up") return { kind: "half_level_up" }
  if (s === "half_level_down") return { kind: "half_level_down" }
  if (s === "prof_bonus") return { kind: "prof_bonus" }
  return { kind: "fixed" }
}

type DynamicValueInputProps = {
  value: number
  valueSource?: TrackerBaseSource
  attrs: Record<AttributeKey, AttributeData>
  level: number
  pb: number
  onChange: (value: number, valueSource?: TrackerBaseSource) => void
  disabled?: boolean
}

export function DynamicValueInput({
  value, valueSource, attrs, level, pb, onChange, disabled,
}: DynamicValueInputProps) {
  const isDynamic = !!valueSource && valueSource.kind !== "fixed"
  const resolved = resolveModifierValue({ value, valueSource }, attrs, level, pb)

  if (disabled) {
    return (
      <div className="flex h-6 items-center rounded-md border border-input bg-background">
        <span className="select-none pl-2 text-xs text-muted-foreground">+</span>
        <span className="px-1.5 text-xs tabular-nums">{value}</span>
      </div>
    )
  }

  if (isDynamic) {
    return (
      <div className="flex items-center gap-1">
        <div className="flex h-6 flex-1 items-center gap-1 rounded-md border border-ring/40 bg-background px-1.5">
          <span className="select-none text-xs text-muted-foreground">+</span>
          <Select
            selectSize="sm"
            value={sourceToValue(valueSource)}
            onChange={e => onChange(resolved, valueToSource(e.target.value))}
            className="h-5 flex-1 border-0 bg-transparent p-0 text-xs focus:ring-0"
          >
            <optgroup label="Attribute modifier">
              {ATTR_KEYS.map(k => (
                <option key={k} value={`attr_mod:${k}`}>{ATTR_LABELS[k]} mod</option>
              ))}
            </optgroup>
            <optgroup label="Level">
              <option value="level">Level</option>
              <option value="half_level_up">½ level ↑</option>
              <option value="half_level_down">½ level ↓</option>
            </optgroup>
            <optgroup label="Other">
              <option value="prof_bonus">Prof bonus</option>
            </optgroup>
          </Select>
          <span className="shrink-0 tabular-nums text-xs text-muted-foreground">={resolved}</span>
        </div>
        <button type="button" onClick={() => onChange(resolved, undefined)}
          title="Switch to static value"
          className="flex size-4 items-center justify-center text-ring/70 transition-colors hover:text-muted-foreground">
          <Sigma className="size-2.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex h-6 flex-1 items-center rounded-md border border-input bg-background focus-within:border-ring">
        <span className="select-none pl-2 text-xs text-muted-foreground">+</span>
        <input
          type="text"
          inputMode="numeric"
          value={value === 0 ? "" : String(value)}
          placeholder="0"
          onChange={(e) => {
            const raw = e.target.value
            if (raw === "" || raw === "-") return
            const n = parseInt(raw, 10)
            if (!isNaN(n)) onChange(n, undefined)
          }}
          onBlur={(e) => {
            if (e.target.value === "-") onChange(0, undefined)
          }}
          className="h-full min-w-0 flex-1 bg-transparent px-1.5 text-xs placeholder:text-card-foreground/40 focus:outline-none"
        />
      </div>
      <button type="button" onClick={() => onChange(value, { kind: "level" })}
        title="Base on stat"
        className="flex size-4 items-center justify-center text-muted-foreground/40 transition-colors hover:text-muted-foreground">
        <Sigma className="size-2.5" />
      </button>
    </div>
  )
}
