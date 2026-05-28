"use client";

import { Plus } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useCanvasStore } from "@/lib/store/canvas-store";
import { PageOverviewCard } from "@/components/canvas/page-overview-card";

type Props = {
  onClose: () => void;
};

export function PageOverview({ onClose }: Props) {
  const pages = useCanvasStore((s) => s.pages);
  const currentPageIndex = useCanvasStore((s) => s.currentPageIndex);
  const setPage = useCanvasStore((s) => s.setPage);
  const deletePage = useCanvasStore((s) => s.deletePage);
  const reorderPages = useCanvasStore((s) => s.reorderPages);
  const insertPageAt = useCanvasStore((s) => s.insertPageAt);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = pages.findIndex((p) => p.id === active.id);
    const toIndex = pages.findIndex((p) => p.id === over.id);
    if (fromIndex !== -1 && toIndex !== -1) {
      reorderPages(fromIndex, toIndex);
    }
  }

  function handlePageClick(index: number) {
    setPage(index);
    onClose();
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col bg-muted/30">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-section px-4 py-2">
        <span className="text-sm font-medium text-foreground">
          Page Overview — {pages.length} {pages.length === 1 ? "page" : "pages"}
        </span>
      </div>

      {/* Page grid */}
      <div className="flex flex-1 items-start justify-center overflow-x-auto p-8">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext
            items={pages.map((p) => p.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex flex-wrap items-start gap-0">
              {/* Insert before first page */}
              <InsertButton onClick={() => insertPageAt(0)} />

              {pages.map((page, index) => (
                <div key={page.id} className="flex items-start">
                  <PageOverviewCard
                    page={page}
                    index={index}
                    isActive={index === currentPageIndex}
                    canDelete={pages.length > 1}
                    onClick={() => handlePageClick(index)}
                    onDelete={() => deletePage(index)}
                  />
                  {/* Insert after this page */}
                  <InsertButton onClick={() => insertPageAt(index + 1)} />
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

function InsertButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex h-full items-center self-stretch py-6">
      <button
        type="button"
        onClick={onClick}
        className="group flex size-6 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground/40 transition-colors hover:border-primary hover:text-primary"
        title="Insert page here"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
