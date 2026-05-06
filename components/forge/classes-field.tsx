"use client"

import { Input } from "@/components/ui/input"
import { IntegerField } from "@/components/forge/integer-field"
import { Button } from "@/components/ui/button"
import { X, Plus } from "lucide-react"

const HIT_DICE = ["d6", "d8", "d10", "d12"] as const

type ClassEntry = { name: string; level: number; hitDie: string }

type ClassesFieldProps = {
  classes: ClassEntry[]
  onChange: (classes: ClassEntry[]) => void
  proficiencyBonus: number
}

export function ClassesField({ classes, onChange, proficiencyBonus }: ClassesFieldProps) {
  function add() {
    onChange([...classes, { name: "", level: 1, hitDie: "d8" }])
  }

  function remove(index: number) {
    onChange(classes.filter((_, i) => i !== index))
  }

  function updateName(index: number, name: string) {
    onChange(classes.map((c, i) => (i === index ? { ...c, name } : c)))
  }

  function updateLevel(index: number, level: number) {
    onChange(classes.map((c, i) => (i === index ? { ...c, level } : c)))
  }

  function updateHitDie(index: number, hitDie: string) {
    onChange(classes.map((c, i) => (i === index ? { ...c, hitDie } : c)))
  }

  return (
    <div className="flex flex-col gap-0">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Classes
      </span>
      {classes.map((cls, i) => (
        <div key={i} className="relative flex items-end gap-2">
          <div className="flex-1">
            <Input
              type="text"
              value={cls.name}
              onChange={(e) => updateName(i, e.target.value)}
              placeholder="Class name"
            />
          </div>
          <select
            value={cls.hitDie ?? "d8"}
            onChange={(e) => updateHitDie(i, e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm focus:outline-none focus:border-ring"
          >
            {HIT_DICE.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <IntegerField
            label=""
            value={cls.level}
            onChange={(v) => updateLevel(i, v)}
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
      ))}
      <div className="mt-1 flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={add}
          className="gap-1.5"
        >
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
