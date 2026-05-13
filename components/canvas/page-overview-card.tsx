"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { rowsForCols } from "@/lib/canvas/page-utils";
import type { CanvasPage } from "@/lib/types/canvas";

type Props = {
  page: CanvasPage;
  index: number;
  isActive: boolean;
  canDelete: boolean;
  onClick: () => void;
  onDelete: () => void;
};

function PageThumbnail({ page }: { page: CanvasPage }) {
  const cols = page.cols;
  const rows = rowsForCols(cols);
  return (
    <div className="relative h-full w-full bg-card">
      {page.widgets.map((w) => (
        <div
          key={w.id}
          className="absolute rounded-[1px] bg-muted-foreground/20 border border-border/40"
          style={{
            left: `${(w.col / cols) * 100}%`,
            top: `${(w.row / rows) * 100}%`,
            width: `${(w.w / cols) * 100}%`,
            height: `${(w.h / rows) * 100}%`,
          }}
        />
      ))}
    </div>
  );
}

export function PageOverviewCard({
  page,
  index,
  isActive,
  canDelete,
  onClick,
  onDelete,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex flex-col gap-1.5 rounded-lg p-1",
        isDragging && "opacity-40",
      )}
    >
      {/* Page number */}
      <span className="text-center text-[10px] text-muted-foreground">
        Page {index + 1}
      </span>

      {/* Thumbnail */}
      <div
        className={cn(
          "relative aspect-[210/297] w-36 cursor-pointer overflow-hidden rounded border-2 shadow-sm transition-colors",
          isActive ? "border-primary" : "border-border hover:border-muted-foreground",
        )}
        onClick={onClick}
      >
        <PageThumbnail page={page} />
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between px-0.5">
        {/* Drag handle */}
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3.5" />
        </button>

        {/* Delete */}
        {canDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-muted-foreground/50 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
