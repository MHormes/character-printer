"use client"

import { Plus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { StatBox } from "@/lib/types/character"

type Props = {
  statBoxes: StatBox[]
  onChange: (list: StatBox[]) => void
}

export function StatBoxesBlock({ statBoxes, onChange }: Props) {
  function patch(id: string, update: Partial<StatBox>) {
    onChange(statBoxes.map((s) => (s.id === id ? { ...s, ...update } : s)))
  }

  return (
    <div className="space-y-2">
      {statBoxes.map((stat) => (
        <div key={stat.id} className="flex items-center gap-2">
          <Input
            type="text"
            value={stat.title}
            placeholder="Title (e.g. Bardic Die)"
            onChange={(e) => patch(stat.id, { title: e.target.value })}
            className="h-7 flex-1 text-xs"
          />
          <Input
            type="text"
            value={stat.value}
            placeholder="Value (e.g. d8)"
            onChange={(e) => patch(stat.id, { value: e.target.value })}
            className="h-7 w-28 text-xs"
          />
          <button
            type="button"
            onClick={() => onChange(statBoxes.filter((s) => s.id !== stat.id))}
            className="flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="size-3" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([...statBoxes, { id: crypto.randomUUID(), title: "", value: "" }])
        }
        className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
      >
        <Plus className="size-3.5" />
        Add stat
      </button>
    </div>
  )
}
