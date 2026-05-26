"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { IntegerField } from "@/components/forge/integer-field"
import { Button } from "@/components/ui/button"
import { X, Plus, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ClassRow, SubclassRow } from "@/lib/actions/5e-data"
import type { CharacterClassEntry } from "@/lib/types/character"

const HIT_DICE = ["d6", "d8", "d10", "d12"] as const

type ClassesFieldProps = {
  classes: CharacterClassEntry[]
  onChange: (classes: CharacterClassEntry[]) => void
  proficiencyBonus: number
  availableClasses?: ClassRow[]
  availableSubclasses?: SubclassRow[]
  onClassPicked?: (dbClass: ClassRow) => void
}

export function ClassesField({
  classes,
  onChange,
  proficiencyBonus,
  availableClasses = [],
  availableSubclasses = [],
  onClassPicked,
}: ClassesFieldProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const [subclassOpenIdx, setSubclassOpenIdx] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpenIdx(null)
        setSubclassOpenIdx(null)
      }
    }
    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [])

  function add() {
    onChange([...classes, { classId: null, name: "", subclass: "", subclassId: null, level: 1, hitDie: "d8", ignoreAutomation: false }])
  }

  function remove(index: number) {
    onChange(classes.filter((_, i) => i !== index))
    if (openIdx === index) setOpenIdx(null)
    if (subclassOpenIdx === index) setSubclassOpenIdx(null)
  }

  function update<K extends keyof CharacterClassEntry>(index: number, key: K, value: CharacterClassEntry[K]) {
    onChange(classes.map((c, i) => (i === index ? { ...c, [key]: value } : c)))
  }

  function pickFromDb(index: number, dbClass: ClassRow) {
    onChange(
      classes.map((c, i) =>
        i === index
          ? { ...c, classId: dbClass.id, name: dbClass.name, hitDie: dbClass.hitDie, subclass: "", subclassId: null, ignoreAutomation: false }
          : c,
      ),
    )
    onClassPicked?.(dbClass)
    setOpenIdx(null)
  }

  function pickSubclassFromDb(index: number, dbSubclass: SubclassRow) {
    onChange(
      classes.map((c, i) =>
        i === index ? { ...c, subclass: dbSubclass.name, subclassId: dbSubclass.id } : c,
      ),
    )
    setSubclassOpenIdx(null)
  }

  function clearSubclass(index: number) {
    onChange(
      classes.map((c, i) =>
        i === index ? { ...c, subclass: "", subclassId: null } : c,
      ),
    )
    setSubclassOpenIdx(null)
  }

  function ignoreAutomation(index: number) {
    onChange(
      classes.map((c, i) =>
        i === index ? { ...c, classId: null, ignoreAutomation: true } : c,
      ),
    )
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
        const isOpen = openIdx === i && availableClasses.length > 0

        const filteredSubclasses = availableSubclasses.filter(
          (s) => s.classId === cls.classId && s.name.toLowerCase().includes(cls.subclass.toLowerCase()),
        )
        const hasDbSubclasses = cls.classId !== null && filteredSubclasses.length > 0
        const isSubclassOpen = subclassOpenIdx === i && hasDbSubclasses

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
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        ignoreAutomation(i)
                      }}
                      className="flex w-full items-center justify-between border-b border-border bg-muted px-3 py-1.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      <span>Use manual class entry</span>
                      <span className="text-xs text-muted-foreground">No automation</span>
                    </button>
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

              {/* Subclass combobox */}
              <div className="relative">
                <div className="flex h-6 items-center rounded-md border border-input bg-background shadow-sm focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
                  <input
                    type="text"
                    value={cls.subclass}
                    placeholder="Subclass"
                    className="min-w-0 flex-1 bg-transparent px-2 text-xs focus:outline-none"
                    onChange={(e) => {
                      onChange(
                        classes.map((c, idx) =>
                          idx === i ? { ...c, subclass: e.target.value, subclassId: null } : c,
                        ),
                      )
                      setSubclassOpenIdx(i)
                    }}
                    onFocus={() => { if (hasDbSubclasses) setSubclassOpenIdx(i) }}
                  />
                  {cls.subclassId && (
                    <button
                      type="button"
                      tabIndex={-1}
                      onMouseDown={(e) => { e.preventDefault(); clearSubclass(i) }}
                      className="flex h-full items-center px-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-2.5" />
                    </button>
                  )}
                  {hasDbSubclasses && !cls.subclassId && (
                    <button
                      type="button"
                      tabIndex={-1}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        setSubclassOpenIdx(subclassOpenIdx === i ? null : i)
                      }}
                      className="flex h-full items-center px-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <ChevronDown className="size-2.5" />
                    </button>
                  )}
                </div>
                {isSubclassOpen && (
                  <div className="absolute left-0 top-full z-50 mt-0.5 w-full overflow-hidden rounded-md border border-border bg-popover shadow-md">
                    {filteredSubclasses.slice(0, 10).map((sc) => (
                      <button
                        key={sc.id}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); pickSubclassFromDb(i, sc) }}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground",
                          cls.subclassId === sc.id && "bg-accent/50",
                        )}
                      >
                        <span>{sc.name}</span>
                        {sc.subclassFlavor && (
                          <span className="text-muted-foreground">{sc.subclassFlavor}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Select
              value={cls.hitDie ?? "d8"}
              onChange={(e) => update(i, "hitDie", e.target.value)}
            >
              {HIT_DICE.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>

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
          <span className="text-xs font-medium uppercase tracking-wide text-card-foreground/60">PB</span>
          <span className="text-sm font-semibold text-card-foreground">+{proficiencyBonus}</span>
        </div>
      </div>
    </div>
  )
}
