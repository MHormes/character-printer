"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, X, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { FeatureEntry } from "@/lib/types/character"

type FeaturesBlockProps = {
  features: FeatureEntry[]
  onChange: (list: FeatureEntry[]) => void
}

export function FeaturesBlock({ features, onChange }: FeaturesBlockProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function patch(id: string, update: Partial<FeatureEntry>) {
    onChange(features.map((f) => (f.id === id ? { ...f, ...update } : f)))
  }

  function addFeature() {
    const id = crypto.randomUUID()
    onChange([...features, { id, name: "", source: "", description: "" }])
    setExpandedIds((prev) => new Set([...prev, id]))
  }

  return (
    <div className="space-y-1.5">
      {features.map((feature) => {
        const expanded = expandedIds.has(feature.id)
        return (
          <div key={feature.id} className="rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 p-2">
              <button
                type="button"
                onClick={() => toggleExpand(feature.id)}
                className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              >
                {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              </button>
              <Input
                type="text"
                value={feature.name}
                placeholder="Feature name"
                onChange={(e) => patch(feature.id, { name: e.target.value })}
                className="h-6 min-w-0 flex-1 text-xs"
              />
              {!expanded && feature.source && (
                <span className="shrink-0 rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {feature.source}
                </span>
              )}
              <button
                type="button"
                onClick={() => onChange(features.filter((f) => f.id !== feature.id))}
                className="flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="size-3" />
              </button>
            </div>

            {expanded && (
              <div className="space-y-2 border-t border-border p-3">
                <div className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-xs text-muted-foreground">Source</span>
                  <Input
                    type="text"
                    value={feature.source}
                    placeholder="e.g. High Elf, Fighter 2, Feat"
                    onChange={(e) => patch(feature.id, { source: e.target.value })}
                    className="h-6 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Description</span>
                  <textarea
                    value={feature.description}
                    placeholder="Feature description..."
                    onChange={(e) => patch(feature.id, { description: e.target.value })}
                    rows={3}
                    className="w-full resize-y rounded-md border border-input bg-background p-2 text-xs focus:outline-none focus:border-ring"
                  />
                </div>
              </div>
            )}
          </div>
        )
      })}

      <button
        type="button"
        onClick={addFeature}
        className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
      >
        <Plus className="size-3.5" />
        Add feature
      </button>
    </div>
  )
}
