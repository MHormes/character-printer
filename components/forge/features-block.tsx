"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, GripVertical, X, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { FeatureEntry } from "@/lib/types/character"
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import type { DragEndEvent } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

type FeaturesBlockProps = {
  features: FeatureEntry[]
  onChange: (list: FeatureEntry[]) => void
}

export function FeaturesBlock({ features, onChange }: FeaturesBlockProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

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

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIdx = features.findIndex(f => f.id === active.id)
    const newIdx = features.findIndex(f => f.id === over.id)
    onChange(arrayMove(features, oldIdx, newIdx))
  }

  return (
    <div className="space-y-1.5">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={features.map(f => f.id)} strategy={verticalListSortingStrategy}>
          {features.map((feature) => (
            <SortableFeatureItem
              key={feature.id}
              feature={feature}
              expanded={expandedIds.has(feature.id)}
              onToggle={() => toggleExpand(feature.id)}
              onPatch={(u) => patch(feature.id, u)}
              onDelete={() => onChange(features.filter((f) => f.id !== feature.id))}
            />
          ))}
        </SortableContext>
      </DndContext>

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

type SortableFeatureItemProps = {
  feature: FeatureEntry
  expanded: boolean
  onToggle: () => void
  onPatch: (u: Partial<FeatureEntry>) => void
  onDelete: () => void
}

function SortableFeatureItem({ feature, expanded, onToggle, onPatch, onDelete }: SortableFeatureItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: feature.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("rounded-lg border border-border bg-card", isDragging && "opacity-50")}
    >
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          {...listeners}
          {...attributes}
          className="shrink-0 cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
        >
          {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </button>
        <Input
          type="text"
          value={feature.name}
          placeholder="Feature name"
          onChange={(e) => onPatch({ name: e.target.value })}
          className="h-6 min-w-0 flex-1 text-xs"
        />
        {!expanded && feature.source && (
          <span className="shrink-0 rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {feature.source}
          </span>
        )}
        <button
          type="button"
          onClick={onDelete}
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
              onChange={(e) => onPatch({ source: e.target.value })}
              className="h-6 text-xs"
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Description</span>
            <textarea
              value={feature.description}
              placeholder="Feature description..."
              onChange={(e) => onPatch({ description: e.target.value })}
              rows={3}
              className="w-full resize-y rounded-md border border-input bg-background p-2 text-xs focus:outline-none focus:border-ring"
            />
          </div>
        </div>
      )}
    </div>
  )
}
