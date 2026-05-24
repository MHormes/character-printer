"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BackgroundRow } from "@/lib/actions/5e-data"

const ATTR_LABEL: Record<string, string> = {
  str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA",
}

type BackgroundFieldProps = {
  value: string
  ignoreAutomation: boolean
  selectedBackground?: BackgroundRow
  onChange: (value: string) => void
  onIgnoreAutomationChange: (value: boolean) => void
  availableBackgrounds?: BackgroundRow[]
}

export function BackgroundField({
  value,
  ignoreAutomation,
  selectedBackground,
  onChange,
  onIgnoreAutomationChange,
  availableBackgrounds = [],
}: BackgroundFieldProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [])

  const filtered = availableBackgrounds.filter((b) =>
    b.name.toLowerCase().includes(value.toLowerCase()),
  )

  return (
    <div className="flex flex-col gap-1" ref={containerRef}>
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Background
      </label>
      <div className="relative">
        <div className="flex h-8 items-center rounded-md border border-input bg-background shadow-sm focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
          <input
            type="text"
            value={value}
            placeholder="e.g. Soldier"
            className="min-w-0 flex-1 bg-transparent px-3 text-sm focus:outline-none"
            onChange={(e) => {
              onChange(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
          />
          {availableBackgrounds.length > 0 && (
            <button
              type="button"
              tabIndex={-1}
              onMouseDown={(e) => {
                e.preventDefault()
                setOpen((v) => !v)
              }}
              className="flex h-full items-center px-2 text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className="size-3.5" />
            </button>
          )}
        </div>

        {open && availableBackgrounds.length > 0 && (
          <div className="absolute left-0 top-full z-50 mt-0.5 w-full overflow-hidden rounded-md border border-border bg-popover shadow-md">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                onIgnoreAutomationChange(true)
                setOpen(false)
              }}
              className="flex w-full items-center justify-between border-b border-border bg-muted px-3 py-1.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <span>{ignoreAutomation ? "Manual background entry active" : "Use manual background entry"}</span>
              <span className="text-xs text-muted-foreground">No automation</span>
            </button>
            {filtered.slice(0, 12).map((row) => (
              <button
                key={row.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onChange(row.name)
                  onIgnoreAutomationChange(false)
                  setOpen(false)
                }}
                className={cn(
                  "flex w-full items-center px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
                  value === row.name && "bg-accent/50",
                )}
              >
                {row.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2024: ASI pool + feat grant display */}
      {selectedBackground && !ignoreAutomation && (selectedBackground.asiGrants || selectedBackground.featGrant) && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {selectedBackground.asiGrants && (() => {
            const pool: string[] = typeof selectedBackground.asiGrants === "string" ? JSON.parse(selectedBackground.asiGrants) : selectedBackground.asiGrants as unknown as string[]
            if (pool.length === 0) return null
            return (
              <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                +2/+1: {pool.map((s) => ATTR_LABEL[s] ?? s.toUpperCase()).join(", ")}
              </span>
            )
          })()}
          {selectedBackground.featGrant && (
            <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              Feat: {selectedBackground.featGrant}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
