"use client";

import { useRef, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  type Modifier,
} from "@dnd-kit/core";
import { useState } from "react";
import { useCanvasStore } from "@/lib/store/canvas-store";
import { useCharacterStore } from "@/lib/store/character-store";
import type { WidgetType } from "@/lib/types/canvas";
import { PaletteTile } from "@/components/canvas/palette-tile";
import { PlacedWidget } from "@/components/canvas/placed-widget";
import { slimToolSvgH } from "@/components/canvas/widgets/slim-tool-prof-widget";
import { slimOtherSvgH } from "@/components/canvas/widgets/slim-other-prof-widget";

const centerOnCursor: Modifier = ({
  activatorEvent,
  activeNodeRect,
  draggingNodeRect,
  transform,
}) => {
  if (
    draggingNodeRect &&
    activeNodeRect &&
    activatorEvent &&
    "clientX" in activatorEvent
  ) {
    const e = activatorEvent as PointerEvent;
    return {
      ...transform,
      x:
        transform.x +
        e.clientX -
        activeNodeRect.left -
        draggingNodeRect.width / 2,
      y:
        transform.y +
        e.clientY -
        activeNodeRect.top -
        draggingNodeRect.height / 2,
    };
  }
  return transform;
};

type ActiveData = {
  source: "palette" | "canvas";
  type?: string;
  w?: number;
  h?: number;
  widgetId?: string;
};

const SLIM_W = 10;

export function CanvasArea() {
  const {
    cols,
    widgets,
    selectedId,
    addWidget,
    moveWidget,
    rotateWidget,
    toggleLock,
    removeWidget,
    setSelected,
  } = useCanvasStore();
  const rows = Math.ceil((cols * 297) / 210);

  const character = useCharacterStore((s) => s.character);
  const toolCount  = character?.otherProficiencies.filter((p) => p.category === "Tool").length ?? 0;
  const otherCount = character?.otherProficiencies.filter((p) => p.category !== "Tool").length ?? 0;

  // h = rows × (SLIM_W/cols) × (210/297) × (svgH/130)
  const slimToolH  = Math.max(2, Math.round(slimToolSvgH(toolCount)  * SLIM_W * rows * 210 / (cols * 297 * 130)));
  const slimOtherH = Math.max(2, Math.round(slimOtherSvgH(otherCount) * SLIM_W * rows * 210 / (cols * 297 * 130)));

  const PALETTE_ITEMS = [
    { type: "CoreStats" as const,          label: "Core Stats",        w: 3,      h: 18 },
    { type: "Inspiration" as const,        label: "Inspiration",       w: 7,      h: 2  },
    { type: "Proficiency" as const,        label: "Prof. Bonus",       w: 7,      h: 2  },
    { type: "PassivePerception" as const,  label: "Passive Perception",w: 8,      h: 2  },
    { type: "SavingThrows" as const,       label: "Saving Throws",     w: 5,      h: 4  },
    { type: "Skills" as const,             label: "Skills",            w: 7,      h: 13 },
    { type: "ToolProficiencies" as const,  label: "Tool Prof.",        w: 10,     h: 5  },
    { type: "OtherProficiencies" as const, label: "Other Prof.",       w: 10,     h: 5  },
    { type: "SlimToolProf" as const,       label: "Slim Tools",        w: SLIM_W, h: slimToolH  },
    { type: "SlimOtherProf" as const,      label: "Slim Other Prof.",  w: SLIM_W, h: slimOtherH },
  ];

  const gridDomRef = useRef<HTMLDivElement>(null);
  const [activeData, setActiveData] = useState<ActiveData | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const { setNodeRef: setDropRef } = useDroppable({ id: "canvas-grid" });

  const setGridRef = useCallback(
    (el: HTMLDivElement | null) => {
      gridDomRef.current = el;
      setDropRef(el);
    },
    [setDropRef],
  );

  function handleDragStart(e: DragStartEvent) {
    setActiveData(e.active.data.current as ActiveData);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveData(null);
    const { active, delta } = e;
    const data = active.data.current as ActiveData;
    if (!gridDomRef.current) return;

    const gridRect = gridDomRef.current.getBoundingClientRect();
    const cellW = gridRect.width / cols;
    const cellH = gridRect.height / rows;

    if (data.source === "palette") {
      const translated = active.rect.current?.translated;
      if (!translated) return;
      const midX = translated.left + translated.width / 2;
      const midY = translated.top + translated.height / 2;
      if (
        midX < gridRect.left ||
        midX > gridRect.right ||
        midY < gridRect.top ||
        midY > gridRect.bottom
      )
        return;
      const w = data.w ?? 1;
      const h = data.h ?? 1;
      const dropCol = Math.max(
        0,
        Math.min(Math.floor((midX - gridRect.left) / cellW), cols - w),
      );
      const dropRow = Math.max(
        0,
        Math.min(Math.floor((midY - gridRect.top) / cellH), rows - h),
      );
      addWidget({
        type: data.type as WidgetType,
        col: dropCol,
        row: dropRow,
        w,
        h,
        rotation: 0,
        locked: false,
        printState: "Calculated",
      });
    } else if (data.source === "canvas" && data.widgetId) {
      const widget = widgets.find((w) => w.id === data.widgetId);
      if (!widget || widget.locked) return;
      const deltaCols = Math.round(delta.x / cellW);
      const deltaRows = Math.round(delta.y / cellH);
      const newCol = Math.max(
        0,
        Math.min(widget.col + deltaCols, cols - widget.w),
      );
      const newRow = Math.max(
        0,
        Math.min(widget.row + deltaRows, rows - widget.h),
      );
      moveWidget(widget.id, newCol, newRow);
    }
  }

  const activeWidget =
    activeData?.source === "canvas" && activeData.widgetId
      ? widgets.find((w) => w.id === activeData.widgetId)
      : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar palette */}
        <aside className="w-1/4 shrink-0 overflow-y-auto border-r border-border bg-section p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Elements</p>
          <div className="grid grid-cols-3 gap-2">
            {PALETTE_ITEMS.map((item) => (
              <PaletteTile key={item.type} {...item} />
            ))}
          </div>
        </aside>

        {/* Canvas */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-muted/30 p-8">
          <style jsx global>{`
            @media print {
              #print-canvas {
                background-image: none !important;
                box-shadow: none !important;
              }
            }
          `}</style>
          <div
            id="print-canvas"
            ref={setGridRef}
            className="aspect-[210/297] h-full max-w-full relative bg-card shadow-lg overflow-hidden"
            style={{
              backgroundImage: [
                "linear-gradient(to right, var(--color-border) 1px, transparent 1px)",
                "linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)",
              ].join(", "),
              backgroundSize: `${100 / cols}% ${100 / rows}%`,
            }}
            onClick={() => setSelected(null)}
          >
            {widgets.map((widget) => (
              <PlacedWidget
                key={widget.id}
                widget={widget}
                cols={cols}
                rows={rows}
                selected={selectedId === widget.id}
                onSelect={(e) => {
                  e.stopPropagation();
                  setSelected(widget.id);
                }}
                onRotate={() => rotateWidget(widget.id)}
                onToggleLock={() => toggleLock(widget.id)}
                onDelete={() => removeWidget(widget.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null} modifiers={[centerOnCursor]}>
        {activeData?.source === "palette" && (
          <div
            className="rounded border-2 border-primary bg-card/80 opacity-80"
            style={{
              width: `${(activeData.w ?? 1) * 32}px`,
              height: `${(activeData.h ?? 1) * 32}px`,
            }}
          />
        )}
        {activeWidget && (
          <div
            className="rounded border-2 border-primary bg-card/80 opacity-80"
            style={{
              width: `${activeWidget.w * 32}px`,
              height: `${activeWidget.h * 32}px`,
            }}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
