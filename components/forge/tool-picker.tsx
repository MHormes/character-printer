"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ItemRow } from "@/lib/actions/5e-data"

type Props = {
  tools: ItemRow[]
  category: string
  label: string
  sourceName: string
  onConfirm: (toolName: string) => void
  onDismiss: () => void
}

const CATEGORY_FILTERS: Record<string, (name: string) => boolean> = {
  gaming: (name) => name.toLowerCase().includes("set") || name.toLowerCase().includes("chess"),
  artisan: (name) => name.toLowerCase().includes("tools") || name.toLowerCase().includes("supplies") || name.toLowerCase().includes("utensils"),
  instrument: (name) => [
    "bagpipes", "drum", "dulcimer", "flute", "horn", "lute", "lyre", "pan flute", "shawm", "viol",
  ].some((inst) => name.toLowerCase().includes(inst)),
}

export function ToolPicker({ tools, category, label, sourceName, onConfirm, onDismiss }: Props) {
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const categoryFilter = CATEGORY_FILTERS[category]
    const q = search.toLowerCase()
    return tools.filter((t) => {
      const nameMatch = t.name.toLowerCase().includes(q)
      const catMatch = categoryFilter ? categoryFilter(t.name) : true
      return nameMatch && (search.length > 0 || catMatch)
    })
  }, [tools, category, search])

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {sourceName} · Tool Proficiency — choose {label}
      </p>

      <Input
        placeholder="Search tools…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-8 text-sm"
      />

      <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
        {filtered.map((tool) => {
          const checked = selected === tool.name
          return (
            <Button
              key={tool.id}
              type="button"
              variant="outline"
              size="sm"
              aria-pressed={checked}
              onClick={() => setSelected(checked ? null : tool.name)}
              className={checked ? "border-primary bg-primary/10" : ""}
            >
              {tool.name}
            </Button>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground">No tools found. Try searching above.</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          contrast
          disabled={!selected}
          onClick={() => { if (selected) onConfirm(selected) }}
        >
          Confirm
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  )
}
