"use client"

import { useDraggable } from "@dnd-kit/core"
import { RotateCw, Lock, Unlock, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CanvasWidget, WidgetType } from "@/lib/types/canvas"
import { CoreStatsWidget } from "@/components/canvas/widgets/core-stats-widget"
import { InspirationWidget } from "@/components/canvas/widgets/inspiration-widget"
import { ProficiencyWidget } from "@/components/canvas/widgets/proficiency-widget"
import { SavingThrowsWidget } from "@/components/canvas/widgets/saving-throws-widget"
import { SkillsWidget } from "@/components/canvas/widgets/skills-widget"
import { PassivePerceptionWidget } from "@/components/canvas/widgets/passive-perception-widget"
import { ToolProficienciesWidget } from "@/components/canvas/widgets/tool-proficiencies-widget"
import { OtherProficienciesWidget } from "@/components/canvas/widgets/other-proficiencies-widget"
import { SlimToolProfWidget } from "@/components/canvas/widgets/slim-tool-prof-widget"
import { SlimOtherProfWidget } from "@/components/canvas/widgets/slim-other-prof-widget"

function WidgetContent({ type }: { type: WidgetType }) {
  if (type === "CoreStats")          return <CoreStatsWidget />
  if (type === "Inspiration")        return <InspirationWidget />
  if (type === "Proficiency")        return <ProficiencyWidget />
  if (type === "SavingThrows")       return <SavingThrowsWidget />
  if (type === "Skills")             return <SkillsWidget />
  if (type === "PassivePerception")  return <PassivePerceptionWidget />
  if (type === "ToolProficiencies")  return <ToolProficienciesWidget />
  if (type === "OtherProficiencies") return <OtherProficienciesWidget />
  if (type === "SlimToolProf")       return <SlimToolProfWidget />
  if (type === "SlimOtherProf")      return <SlimOtherProfWidget />
  return null
}

type Props = {
  widget: CanvasWidget
  cols: number
  rows: number
  selected: boolean
  onSelect: (e: React.MouseEvent) => void
  onRotate: () => void
  onToggleLock: () => void
  onDelete: () => void
}

export function PlacedWidget({ widget, cols, rows, selected, onSelect, onRotate, onToggleLock, onDelete }: Props) {
  const { setNodeRef, listeners, attributes, transform, isDragging } = useDraggable({
    id: widget.id,
    data: { source: "canvas", widgetId: widget.id },
    disabled: widget.locked,
  })

  return (
    <div
      ref={setNodeRef}
      {...(widget.locked ? {} : listeners)}
      {...attributes}
      style={{
        position: "absolute",
        left: `${(widget.col / cols) * 100}%`,
        top: `${(widget.row / rows) * 100}%`,
        width: `${(widget.w / cols) * 100}%`,
        height: `${(widget.h / rows) * 100}%`,
        zIndex: selected ? 10 : 1,
        opacity: isDragging ? 0.25 : 1,
      }}
      onClick={onSelect}
    >
      <div
        className={cn(
          "relative h-full w-full rounded border-2 bg-card/80 transition-colors overflow-hidden",
          selected ? "border-primary" : "border-border",
          !widget.locked && "cursor-grab active:cursor-grabbing",
        )}
      >
        <WidgetContent type={widget.type} />
        {widget.locked && (
          <Lock className="absolute left-1 top-1 size-3 text-muted-foreground" />
        )}
      </div>

      {/* Toolbar — rendered outside rotation wrapper so it stays upright */}
      {selected && (
        <div className="absolute -top-7 left-0 z-20 flex items-center gap-0.5 rounded border border-border bg-card px-1 py-0.5 shadow-sm">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); if (!widget.locked) onRotate() }}
            disabled={widget.locked}
            className="flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
            title="Rotate 90°"
          >
            <RotateCw className="size-3" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleLock() }}
            className="flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
            title={widget.locked ? "Unlock" : "Lock"}
          >
            {widget.locked ? <Unlock className="size-3" /> : <Lock className="size-3" />}
          </button>
          {!widget.locked && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:text-destructive"
              title="Delete"
            >
              <Trash2 className="size-3" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
