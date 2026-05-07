"use client"

import { useDraggable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import type { WidgetType } from "@/lib/types/canvas"

type Props = {
  type: WidgetType
  label: string
  w: number
  h: number
}

export function PaletteTile({ type, label, w, h }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { source: "palette", type, w, h },
  })

  const scale = 6;
  const previewW = w * scale;
  const previewH = h * scale;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "flex cursor-grab flex-col items-center gap-2 rounded-lg border border-border bg-card p-2 select-none active:cursor-grabbing h-32 justify-between",
        isDragging && "opacity-40",
      )}
    >
      <div className="flex flex-1 items-center justify-center w-full min-h-0">
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
      <div className="text-center shrink-0">
        <p className="text-[10px] font-medium leading-tight text-foreground line-clamp-2">{label}</p>
        <p className="text-[9px] text-muted-foreground">{w}×{h}</p>
      </div>
    </div>
  )
}
