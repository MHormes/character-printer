"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { RaceRow, SubraceRow } from "@/lib/actions/5e-data"

type RaceFieldProps = {
  race: string
  subrace: string
  ignoreAutomation: boolean
  onRaceChange: (value: string) => void
  onSubraceChange: (value: string) => void
  onIgnoreAutomationChange: (value: boolean) => void
  availableRaces?: RaceRow[]
  availableSubraces?: SubraceRow[]
}

export function RaceField({
  race,
  subrace,
  ignoreAutomation,
  onRaceChange,
  onSubraceChange,
  onIgnoreAutomationChange,
  availableRaces = [],
  availableSubraces = [],
}: RaceFieldProps) {
  const [raceOpen, setRaceOpen] = useState(false)
  const [subraceOpen, setSubraceOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setRaceOpen(false)
        setSubraceOpen(false)
      }
    }
    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [])

  const matchedRace = availableRaces.find(
    (r) => r.name.toLowerCase() === race.toLowerCase(),
  )

  const filteredRaces = availableRaces.filter((r) =>
    r.name.toLowerCase().includes(race.toLowerCase()),
  )

  const filteredSubraces = availableSubraces.filter((s) => {
    const nameMatch = s.name.toLowerCase().includes(subrace.toLowerCase())
    if (matchedRace) return s.raceId === matchedRace.id && nameMatch
    return nameMatch
  })

  function pickRace(row: RaceRow) {
    onRaceChange(row.name)
    onIgnoreAutomationChange(false)
    setRaceOpen(false)
    // Clear subrace if the new race has no subraces for current subrace value
    const hasCurrentSubrace = availableSubraces.some(
      (s) => s.raceId === row.id && s.name.toLowerCase() === subrace.toLowerCase(),
    )
    if (!hasCurrentSubrace) onSubraceChange("")
  }

  return (
    <div className="contents" ref={containerRef}>
      {/* Race combobox */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Race
        </label>
        <div className="relative">
          <div className="flex h-8 items-center rounded-md border border-input bg-background shadow-sm focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
            <input
              type="text"
              value={race}
              placeholder="e.g. Elf"
              className="min-w-0 flex-1 bg-transparent px-3 text-sm focus:outline-none"
              onChange={(e) => {
                onRaceChange(e.target.value)
                setRaceOpen(true)
              }}
              onFocus={() => setRaceOpen(true)}
            />
            {availableRaces.length > 0 && (
              <button
                type="button"
                tabIndex={-1}
                onMouseDown={(e) => {
                  e.preventDefault()
                  setRaceOpen((v) => !v)
                }}
                className="flex h-full items-center px-2 text-muted-foreground hover:text-foreground"
              >
                <ChevronDown className="size-3.5" />
              </button>
            )}
          </div>

          {raceOpen && availableRaces.length > 0 && (
            <div className="absolute left-0 top-full z-50 mt-0.5 w-full overflow-hidden rounded-md border border-border bg-popover shadow-md">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onIgnoreAutomationChange(true)
                  setRaceOpen(false)
                }}
                className="flex w-full items-center justify-between border-b border-border bg-muted px-3 py-1.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <span>{ignoreAutomation ? "Manual race entry active" : "Use manual race entry"}</span>
                <span className="text-xs text-muted-foreground">No automation</span>
              </button>
              {filteredRaces.slice(0, 12).map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    pickRace(row)
                  }}
                  className={cn(
                    "flex w-full items-center px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
                    race === row.name && "bg-accent/50",
                  )}
                >
                  {row.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Subrace combobox */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Subrace
        </label>
        <div className="relative">
          <div className="flex h-8 items-center rounded-md border border-input bg-background shadow-sm focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
            <input
              type="text"
              value={subrace}
              placeholder={matchedRace ? "Optional subrace" : "e.g. High Elf"}
              className="min-w-0 flex-1 bg-transparent px-3 text-sm focus:outline-none"
              onChange={(e) => {
                onSubraceChange(e.target.value)
                setSubraceOpen(true)
              }}
              onFocus={() => setSubraceOpen(true)}
            />
            {filteredSubraces.length > 0 && (
              <button
                type="button"
                tabIndex={-1}
                onMouseDown={(e) => {
                  e.preventDefault()
                  setSubraceOpen((v) => !v)
                }}
                className="flex h-full items-center px-2 text-muted-foreground hover:text-foreground"
              >
                <ChevronDown className="size-3.5" />
              </button>
            )}
          </div>

          {subraceOpen && filteredSubraces.length > 0 && (
            <div className="absolute left-0 top-full z-50 mt-0.5 w-full overflow-hidden rounded-md border border-border bg-popover shadow-md">
              {filteredSubraces.slice(0, 12).map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    onSubraceChange(row.name)
                    setSubraceOpen(false)
                  }}
                  className={cn(
                    "flex w-full items-center px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
                    subrace === row.name && "bg-accent/50",
                  )}
                >
                  {row.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
