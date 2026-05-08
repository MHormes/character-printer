"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { IntegerField } from "@/components/forge/integer-field"
import { Button } from "@/components/ui/button"
import { X, Plus, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ClassRow } from "@/lib/actions/5e-data"
import type { CharacterClassEntry } from "@/lib/types/character"

const HIT_DICE = ["d6", "d8", "d10", "d12"] as const

type ClassesFieldProps = {
  classes: CharacterClassEntry[]
  onChange: (classes: CharacterClassEntry[]) => void
  proficiencyBonus: number
  availableClasses?: ClassRow[]
  onClassPicked?: (dbClass: ClassRow) => void
}

export function ClassesField({
  classes,
  onChange,
  proficiencyBonus,
  availableClasses = [],
  onClassPicked,
}: ClassesFieldProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpenIdx(null)
    }
    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [])

  function add() {
    onChange([...classes, { classId: null, name: "", subclass: "", level: 1, hitDie: "d8" }])
  }

  function remove(index: number) {
    onChange(classes.filter((_, i) => i !== index))
    if (openIdx === index) setOpenIdx(null)
  }

  function update<K extends keyof CharacterClassEntry>(index: number, key: K, value: CharacterClassEntry[K]) {
    onChange(classes.map((c, i) => (i === index ? { ...c, [key]: value } : c)))
  }

  function pickFromDb(index: number, dbClass: ClassRow) {
    onChange(
      classes.map((c, i) =>
        i === index
          ? { ...c, classId: dbClass.id, name: dbClass.name, hitDie: dbClass.hitDie }
          : c,
      ),
    )
    onClassPicked?.(dbClass)
    setOpenIdx(null)
  }

  return (
    <div className="flex flex-col gap-0" ref={containerRef}>
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Classes
      </span>

      {classes.map((cls, i) => {
        const filtered = availableClasses.filter((c) =>
          c.name.toLowerCase().includes(cls.name.toLowerCase()),
        )
        const isOpen = openIdx === i && filtered.length > 0

        return (
          <div key={i} className="relative flex items-end gap-2">
            <div className="flex flex-1 flex-col gap-1">
              {/* Class name combobox */}
              <div className="relative">
                <div className="flex h-8 items-center rounded-md border border-input bg-background shadow-sm focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
                  <input
                    type="text"
                    value={cls.name}
                    placeholder="Class name"
                    className="min-w-0 flex-1 bg-transparent px-3 text-sm focus:outline-none"
                    onChange={(e) => {
                      onChange(
                        classes.map((c, idx) =>
                          idx === i ? { ...c, classId: null, name: e.target.value } : c,
                        ),
                      )
                      setOpenIdx(i)
                    }}
                    onFocus={() => setOpenIdx(i)}
                  />
                  {availableClasses.length > 0 && (
                    <button
                      type="button"
                      tabIndex={-1}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        setOpenIdx(openIdx === i ? null : i)
                      }}
                      className="flex h-full items-center px-2 text-muted-foreground hover:text-foreground"
                    >
                      <ChevronDown className="size-3.5" />
                    </button>
                  )}
                </div>

                {isOpen && (
                  <div className="absolute left-0 top-full z-50 mt-0.5 w-full overflow-hidden rounded-md border border-border bg-popover shadow-md">
                    {filtered.slice(0, 10).map((dbClass) => (
                      <button
                        key={dbClass.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          pickFromDb(i, dbClass)
                        }}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
                          cls.name === dbClass.name && "bg-accent/50",
                        )}
                      >
                        <span>{dbClass.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {dbClass.hitDie}
                          {dbClass.spellcastingStat && (
                            <span className="ml-1 uppercase">{dbClass.spellcastingStat}</span>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Input
                type="text"
                value={cls.subclass}
                onChange={(e) => update(i, "subclass", e.target.value)}
                placeholder="Subclass"
                className="h-6 text-xs"
              />
            </div>

            <select
              value={cls.hitDie ?? "d8"}
              onChange={(e) => update(i, "hitDie", e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm focus:outline-none focus:border-ring"
            >
              {HIT_DICE.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <IntegerField
              label=""
              value={cls.level}
              onChange={(v) => update(i, "level", v)}
              min={1}
              max={20}
              className="w-28 shrink-0"
            />

            <button
              type="button"
              aria-label="Remove class"
              onClick={() => remove(i)}
              className="mb-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )
      })}

      <div className="mt-1 flex items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={add} className="gap-1.5">
          <Plus className="size-3.5" />
          Add class
        </Button>
        <div className="flex h-8 items-center gap-1 rounded-md border border-border bg-muted px-3">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">PB</span>
          <span className="text-sm font-semibold text-foreground">+{proficiencyBonus}</span>
        </div>
      </div>
    </div>
  )
}
