"use client"

import { cn } from "@/lib/utils"

type IntegerFieldProps = {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  compact?: boolean
  className?: string
}

export function IntegerField({
  label,
  value,
  onChange,
  min,
  max,
  compact = false,
  className,
}: IntegerFieldProps) {
  function clamp(n: number) {
    if (min !== undefined && n < min) return min
    if (max !== undefined && n > max) return max
    return n
  }

  function handleRaw(raw: string) {
    const n = parseInt(raw, 10)
    if (!isNaN(n)) onChange(clamp(n))
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <div
        className={cn(
          "flex items-center rounded-md border border-input bg-background shadow-sm",
          "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
          compact ? "h-12 w-24" : "h-8"
        )}
      >
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(clamp(value - 1))}
          disabled={min !== undefined && value <= min}
          className={cn(
            "flex shrink-0 items-center justify-center text-card-foreground/60",
            "disabled:pointer-events-none disabled:opacity-40",
            compact ? "h-full w-8 text-lg" : "h-full w-7 text-sm"
          )}
        >
          −
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => handleRaw(e.target.value)}
          min={min}
          max={max}
          className={cn(
            "min-w-0 flex-1 bg-transparent text-center text-card-foreground",
            "focus:outline-none [appearance:textfield]",
            "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
            compact ? "text-2xl font-bold" : "text-sm"
          )}
        />
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(clamp(value + 1))}
          disabled={max !== undefined && value >= max}
          className={cn(
            "flex shrink-0 items-center justify-center text-card-foreground/60",
            "disabled:pointer-events-none disabled:opacity-40",
            compact ? "h-full w-8 text-lg" : "h-full w-7 text-sm"
          )}
        >
          +
        </button>
      </div>
    </div>
  )
}
