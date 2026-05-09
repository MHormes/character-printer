"use client"

import { useDraggable } from "@dnd-kit/core"
import { Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CanvasTemplate } from "@/lib/types/canvas"

type Props = {
  template: CanvasTemplate
  onDelete: (templateId: string) => void
}

export function SavedTemplateTile({ template, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `template-${template.id}`,
    data: { source: "template", templateId: template.id },
  })

  const scale = 6
  const previewW = 4 * scale
  const previewH = 6 * scale

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "flex h-32 cursor-grab flex-col justify-between rounded-lg border border-border bg-card p-2 select-none active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-medium leading-tight text-foreground">
            {template.name}
          </p>
          <p className="text-[9px] text-muted-foreground">{template.cols} cols</p>
        </div>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onDelete(template.id)
          }}
          className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
          title="Delete template"
        >
          <Trash2 className="size-3" />
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div
          className="rounded border border-border bg-muted/50"
          style={{
            width: `${previewW}px`,
            height: `${previewH}px`,
            maxWidth: "100%",
            maxHeight: "100%",
          }}
        />
      </div>

      <div className="text-center">
        <p className="text-[9px] text-muted-foreground">{template.widgets.length} widgets</p>
      </div>
    </div>
  )
}
