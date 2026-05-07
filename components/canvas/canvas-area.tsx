"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
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
import { useCanvasStore } from "@/lib/store/canvas-store";
import { useCharacterStore } from "@/lib/store/character-store";
import type { CanvasWidget, WidgetType } from "@/lib/types/canvas";
import { PaletteTile } from "@/components/canvas/palette-tile";
import { PlacedWidget } from "@/components/canvas/placed-widget";
import {
  SPELL_CARD_GRID_H,
  SPELL_CARD_GRID_W,
} from "@/components/canvas/widgets/spell-card-widget";
import { slimToolSvgH } from "@/components/canvas/widgets/slim-tool-prof-widget";
import { slimOtherSvgH } from "@/components/canvas/widgets/slim-other-prof-widget";
import { attacksSvgH } from "@/components/canvas/widgets/attacks-widget";
import { slimAttacksSvgH } from "@/components/canvas/widgets/slim-attacks-widget";
import { equipmentSvgH } from "@/components/canvas/widgets/equipment-widget";
import { trackerSvgH } from "@/components/canvas/widgets/tracker-widget";
import { featuresSvgH } from "@/components/canvas/widgets/features-widget";
import { featureCardGridH } from "@/components/canvas/widgets/feature-card-widget";
import { spellLevelSvgH } from "@/components/canvas/widgets/spell-level-widget";
import { FullPageMainWidget } from "@/components/canvas/widgets/full-page-main-widget";

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
  fullPage?: boolean;
};

const SLIM_W = 10;

const TEMPLATE_PAGE1_WIDGETS = [
  {
    type: "CoreStats",
    col: 0,
    row: 0,
    w: 3,
    h: 18,
    rotation: 0,
    locked: false,
    printState: "Calculated",
  },
  {
    type: "Inspiration",
    col: 3,
    row: 0,
    w: 7,
    h: 2,
    rotation: 0,
    locked: false,
    printState: "Calculated",
  },
  {
    type: "Proficiency",
    col: 3,
    row: 2,
    w: 7,
    h: 2,
    rotation: 0,
    locked: false,
    printState: "Calculated",
  },
  {
    type: "SavingThrows",
    col: 3,
    row: 4,
    w: 5,
    h: 4,
    rotation: 0,
    locked: false,
    printState: "Calculated",
  },
  {
    type: "Skills",
    col: 3,
    row: 8,
    w: 7,
    h: 13,
    rotation: 0,
    locked: false,
    printState: "Calculated",
  },
  {
    type: "PassivePerception",
    col: 0,
    row: 21,
    w: 8,
    h: 2,
    rotation: 180,
    locked: false,
    printState: "Calculated",
  },
  {
    type: "SlimToolProf",
    col: 0,
    row: 23,
    w: 10,
    h: 3,
    rotation: 0,
    locked: false,
    printState: "Calculated",
  },
  {
    type: "SlimOtherProf",
    col: 0,
    row: 26,
    w: 10,
    h: 4,
    rotation: 0,
    locked: false,
    printState: "Calculated",
  },
  {
    type: "ArmorClass",
    col: 10,
    row: 0,
    w: 3,
    h: 4,
    rotation: 0,
    locked: false,
    printState: "Calculated",
  },
  {
    type: "Initiative",
    col: 13,
    row: 0,
    w: 3,
    h: 4,
    rotation: 0,
    locked: false,
    printState: "Calculated",
  },
  {
    type: "Speed",
    col: 16,
    row: 0,
    w: 3,
    h: 4,
    rotation: 0,
    locked: false,
    printState: "Calculated",
  },
  {
    type: "Trackers",
    col: 19,
    row: 0,
    w: 6,
    h: 7,
    rotation: 0,
    locked: false,
    printState: "Calculated",
  },
  {
    type: "CurrentHp",
    col: 10,
    row: 4,
    w: 4,
    h: 4,
    rotation: 0,
    locked: false,
    printState: "Calculated",
  },
  {
    type: "TempHp",
    col: 15,
    row: 4,
    w: 4,
    h: 4,
    rotation: 0,
    locked: false,
    printState: "Calculated",
  },
  {
    type: "HitDice",
    col: 10,
    row: 8,
    w: 4,
    h: 4,
    rotation: 0,
    locked: false,
    printState: "Calculated",
  },
  {
    type: "DeathSaves",
    col: 15,
    row: 8,
    w: 4,
    h: 4,
    rotation: 0,
    locked: false,
    printState: "Calculated",
  },
  {
    type: "SlimAttacks",
    col: 10,
    row: 12,
    w: 9,
    h: 3,
    rotation: 0,
    locked: false,
    printState: "Calculated",
  },
  {
    type: "Features",
    col: 19,
    row: 7,
    w: 6,
    h: 19,
    rotation: 0,
    locked: false,
    printState: "Calculated",
  },
  {
    type: "Equipment",
    col: 10,
    row: 15,
    w: 9,
    h: 25,
    rotation: 0,
    locked: true,
    printState: "Calculated",
  },
] as const;

export function CanvasArea() {
  const {
    cols,
    pages,
    currentPageIndex,
    widgets,
    selectedId,
    addWidget,
    addWidgets,
    addWidgetsMultiPage,
    moveWidget,
    rotateWidget,
    toggleLock,
    removeWidget,
    setSelected,
    addPage,
    deletePage,
    setPage,
  } = useCanvasStore();
  const rows = Math.ceil((cols * 297) / 210);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedId) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }

        const widget = widgets.find((w) => w.id === selectedId);
        if (widget && !widget.locked) {
          removeWidget(selectedId);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, widgets, removeWidget]);

  const character = useCharacterStore((s) => s.character);
  const toolCount =
    character?.otherProficiencies.filter((p) => p.category === "Tool").length ??
    0;
  const otherCount =
    character?.otherProficiencies.filter((p) => p.category !== "Tool").length ??
    0;
  const actionsCount = character?.actions.length ?? 0;
  const inventoryCount = character?.inventory.length ?? 0;
  const trackersCount = character?.trackers.length ?? 0;
  const featuresCount = character?.features.length ?? 0;

  // h = rows × (w/cols) × (210/297) × (svgH/viewBoxW)
  const slimToolH = Math.max(
    2,
    Math.round(
      (slimToolSvgH(toolCount) * SLIM_W * rows * 210) / (cols * 297 * 164),
    ),
  );
  const slimOtherH = Math.max(
    2,
    Math.round(
      (slimOtherSvgH(otherCount) * SLIM_W * rows * 210) / (cols * 297 * 185),
    ),
  );
  const attacksH = Math.max(
    2,
    Math.round(
      (attacksSvgH(actionsCount) * 12 * rows * 210) / (cols * 297 * 176),
    ),
  );
  const slimAttacksH = Math.max(
    2,
    Math.round(
      (slimAttacksSvgH(actionsCount) * 12 * rows * 210) / (cols * 297 * 176),
    ),
  );
  const equipmentH = Math.max(
    4,
    Math.round(
      (equipmentSvgH(inventoryCount) * 12 * rows * 210) / (cols * 297 * 176),
    ),
  );
  const trackersH = Math.max(
    2,
    Math.round(
      (trackerSvgH(trackersCount) * 6 * rows * 210) / (cols * 297 * 171),
    ),
  );
  const featuresH = Math.max(
    2,
    Math.round(
      (featuresSvgH(featuresCount) * 6 * rows * 210) / (cols * 297 * 96),
    ),
  );

  const spellLevelH = (level: number) => {
    const count =
      character?.spells.list.filter((s) => s.level === level).length ?? 0;
    return Math.max(
      1,
      Math.round((spellLevelSvgH(count) * 8 * rows * 210) / (cols * 297 * 120)),
    );
  };

  const PALETTE_ITEMS = [
    { type: "CharacterName" as const, label: "Character Name", w: 15, h: 3 },
    {
      type: "CharacterInfoDetailed" as const,
      label: "Info: Detailed",
      w: 17,
      h: 3,
    },
    {
      type: "CharacterInfoCompact" as const,
      label: "Info: Compact",
      w: 17,
      h: 3,
    },
    { type: "CharacterAppearance" as const, label: "Appearance", w: 17, h: 3 },
    { type: "CoreStats" as const, label: "Core Stats", w: 3, h: 18 },
    { type: "Inspiration" as const, label: "Inspiration", w: 7, h: 2 },
    { type: "Proficiency" as const, label: "Prof. Bonus", w: 7, h: 2 },
    {
      type: "PassivePerception" as const,
      label: "Passive Perception",
      w: 8,
      h: 2,
    },
    { type: "SavingThrows" as const, label: "Saving Throws", w: 5, h: 4 },
    { type: "Skills" as const, label: "Skills", w: 7, h: 13 },
    { type: "ToolProficiencies" as const, label: "Tool Prof.", w: 10, h: 5 },
    { type: "OtherProficiencies" as const, label: "Other Prof.", w: 10, h: 5 },
    {
      type: "SlimToolProf" as const,
      label: "Slim Tools",
      w: SLIM_W,
      h: slimToolH,
    },
    {
      type: "SlimOtherProf" as const,
      label: "Slim Other Prof.",
      w: SLIM_W,
      h: slimOtherH,
    },
    // Combat stats
    { type: "ArmorClass" as const, label: "Armor Class", w: 3, h: 4 },
    { type: "Initiative" as const, label: "Initiative", w: 3, h: 4 },
    { type: "Speed" as const, label: "Speed", w: 3, h: 4 },
    { type: "CurrentHp" as const, label: "Current HP", w: 4, h: 4 },
    { type: "TempHp" as const, label: "Temp HP", w: 4, h: 4 },
    { type: "HitDice" as const, label: "Hit Dice", w: 4, h: 4 },
    { type: "DeathSaves" as const, label: "Death Saves", w: 4, h: 4 },
    // Actions & inventory
    { type: "Attacks" as const, label: "Attacks", w: 12, h: attacksH },
    {
      type: "SlimAttacks" as const,
      label: "Slim Attacks",
      w: 12,
      h: slimAttacksH,
    },
    { type: "Equipment" as const, label: "Equipment", w: 9, h: equipmentH },
    // Trackers & features
    { type: "Trackers" as const, label: "Trackers", w: 6, h: trackersH },
    { type: "Features" as const, label: "Features", w: 6, h: featuresH },
    { type: "FeatureCard" as const, label: "Feature Card", w: 9, h: 5 },
    { type: "StatBox" as const, label: "Stat Box", w: 3, h: 4 },
  ];

  const FULL_PAGE_ITEMS = [
    {
      type: "TemplatePage1" as const,
      label: "Template: Main Sheet",
      fullPage: true as const,
    },
    {
      type: "FullPageMain" as const,
      label: "Complete: Main Sheet",
      fullPage: true as const,
    },
    {
      type: "TemplatePage2" as const,
      label: "Template: Spell Sheet",
      fullPage: true as const,
    },
    {
      type: "FullPageSpellSheet" as const,
      label: "Complete: Spell Sheet",
      fullPage: true as const,
    },
    {
      type: "TemplateFeatures" as const,
      label: "Template: Features",
      fullPage: true as const,
    },
    {
      type: "FullPageFeatures" as const,
      label: "Complete: Features",
      fullPage: true as const,
    },
    {
      type: "TemplateSpellCards" as const,
      label: "Template: Spell Cards",
      fullPage: true as const,
    },
    {
      type: "FullPageSpells" as const,
      label: "Complete: Spell Cards",
      fullPage: true as const,
    },
  ];

  const SPELL_PALETTE_ITEMS = [
    {
      type: "SpellCard" as const,
      label: "Spell Card",
      w: SPELL_CARD_GRID_W,
      h: SPELL_CARD_GRID_H,
    },
    { type: "SpellcastingInfo" as const, label: "Casting Info", w: 18, h: 3 },
    {
      type: "SpellLevel0" as const,
      label: "Cantrips",
      w: 8,
      h: spellLevelH(0),
    },
    { type: "SpellLevel1" as const, label: "Level 1", w: 8, h: spellLevelH(1) },
    { type: "SpellLevel2" as const, label: "Level 2", w: 8, h: spellLevelH(2) },
    { type: "SpellLevel3" as const, label: "Level 3", w: 8, h: spellLevelH(3) },
    { type: "SpellLevel4" as const, label: "Level 4", w: 8, h: spellLevelH(4) },
    { type: "SpellLevel5" as const, label: "Level 5", w: 8, h: spellLevelH(5) },
    { type: "SpellLevel6" as const, label: "Level 6", w: 8, h: spellLevelH(6) },
    { type: "SpellLevel7" as const, label: "Level 7", w: 8, h: spellLevelH(7) },
    { type: "SpellLevel8" as const, label: "Level 8", w: 8, h: spellLevelH(8) },
    { type: "SpellLevel9" as const, label: "Level 9", w: 8, h: spellLevelH(9) },
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

      if (data.type === "TemplatePage1") {
        addWidgets(
          TEMPLATE_PAGE1_WIDGETS.map((w) => ({
            ...w,
            printState: w.printState as "Calculated" | "Blank",
          })),
        );
        return;
      }

      if (data.type === "TemplatePage2") {
        const INFO_H = 2;
        const START_ROW = INFO_H;

        function buildSpellColumn(
          levels: number[],
          colStart: number,
          colW: number,
        ) {
          let currentRow = START_ROW;
          return levels.map((level) => {
            const h = spellLevelH(level);
            const widget = {
              type: `SpellLevel${level}` as WidgetType,
              col: colStart,
              row: currentRow,
              w: colW,
              h,
              rotation: 0 as const,
              locked: false,
              printState: "Calculated" as const,
            };
            currentRow += h;
            return widget;
          });
        }

        addWidgets([
          {
            type: "SpellcastingInfo",
            col: 0,
            row: 0,
            w: 28,
            h: INFO_H,
            rotation: 0,
            locked: false,
            printState: "Calculated",
          },
          ...buildSpellColumn([0, 1, 2], 0, 9),
          ...buildSpellColumn([3, 4, 5], 10, 9),
          ...buildSpellColumn([6, 7, 8, 9], 20, 8),
        ]);
        return;
      }

      if (data.type === "TemplateSpellCards") {
        const spells = character?.spells.list ?? [];
        if (spells.length === 0) return;

        const CARD_W = SPELL_CARD_GRID_W;
        const CARD_H = SPELL_CARD_GRID_H;
        const perRow = Math.floor(cols / CARD_W);
        const rowsPerPage = Math.floor(rows / CARD_H);
        const perPage = perRow * rowsPerPage;

        const pageWidgets: Omit<CanvasWidget, "id">[][] = [];
        for (let i = 0; i < spells.length; i += perPage) {
          const chunk = spells.slice(i, i + perPage);
          pageWidgets.push(
            chunk.map((spell, j) => ({
              type: "SpellCard" as WidgetType,
              col: (j % perRow) * CARD_W,
              row: Math.floor(j / perRow) * CARD_H,
              w: CARD_W,
              h: CARD_H,
              rotation: 0 as const,
              locked: false,
              printState: "Calculated" as const,
              spellId: spell.id,
            })),
          );
        }
        addWidgetsMultiPage(pageWidgets);
        return;
      }

      if (data.type === "TemplateFeatures") {
        const features = character?.features ?? [];
        if (features.length === 0) return;

        // 3 columns: col 0, 10, 20 — each 9 wide (last capped at page edge)
        const COL_STARTS = [0, 10, 20];
        const CARD_W = 9;

        const pageWidgets: Omit<CanvasWidget, "id">[][] = [];
        let currentPage: Omit<CanvasWidget, "id">[] = [];
        let currentCol = 0;
        let currentRow = 0;

        for (const feature of features) {
          const cardW = Math.min(CARD_W, cols - COL_STARTS[currentCol]);
          const h = Math.min(featureCardGridH(feature.description, cardW, cols, rows), rows);

          if (currentRow + h > rows) {
            // Column full — advance to next column
            currentCol++;
            currentRow = 0;
            if (currentCol >= COL_STARTS.length) {
              // All columns full — new page
              pageWidgets.push(currentPage);
              currentPage = [];
              currentCol = 0;
            }
          }

          currentPage.push({
            type: "FeatureCard" as WidgetType,
            col: COL_STARTS[currentCol],
            row: currentRow,
            w: Math.min(CARD_W, cols - COL_STARTS[currentCol]),
            h,
            rotation: 0 as const,
            locked: false,
            printState: "Calculated" as const,
            featureId: feature.id,
          });
          currentRow += h;
        }
        if (currentPage.length > 0) pageWidgets.push(currentPage);
        addWidgetsMultiPage(pageWidgets);
        return;
      }

      if (data.fullPage) {
        addWidget({
          type: data.type as WidgetType,
          col: 0,
          row: 0,
          w: cols,
          h: rows,
          rotation: 0,
          locked: false,
          printState: "Calculated",
        });
        return;
      }

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

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex min-h-0 items-start overflow-visible">
        {/* Sidebar palette */}
        <aside className="sticky top-0 h-screen w-1/4 shrink-0 self-start overflow-y-auto border-r border-border bg-section p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Full Page
          </p>
          <div className="grid grid-cols-2 gap-2">
            {FULL_PAGE_ITEMS.map((item) => (
              <PaletteTile key={item.type} {...item} />
            ))}
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground pt-1">
            Elements
          </p>
          <div className="grid grid-cols-3 gap-2">
            {PALETTE_ITEMS.map((item) => (
              <PaletteTile key={item.type} {...item} />
            ))}
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground pt-1">
            Spells
          </p>
          <div className="grid grid-cols-3 gap-2">
            {SPELL_PALETTE_ITEMS.map((item) => (
              <PaletteTile key={item.type} {...item} />
            ))}
          </div>
        </aside>

        {/* Canvas column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Page actions bar — top right */}
          <div className="flex shrink-0 items-center justify-end gap-1 border-b border-border bg-section px-3 py-1">
            <button
              type="button"
              onClick={addPage}
              className="flex items-center gap-1.5 rounded px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Plus className="size-3" />
              Add page
            </button>
            {pages.length > 1 && (
              <button
                type="button"
                onClick={() => deletePage(currentPageIndex)}
                className="flex items-center gap-1.5 rounded px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="size-3" />
                Delete page
              </button>
            )}
          </div>

          {/* Canvas display with floating nav arrows */}
          <div
            className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center bg-muted/30 p-8"
            onClick={() => setSelected(null)}
          >
            <div
              id="canvas-editor"
              ref={setGridRef}
              className="relative aspect-[210/297] w-full max-w-5xl overflow-hidden bg-card shadow-lg"
              style={{
                backgroundImage: [
                  "linear-gradient(to right, var(--color-border) 1px, transparent 1px)",
                  "linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)",
                ].join(", "),
                backgroundSize: `${100 / cols}% ${100 / rows}%`,
              }}
              onClick={(e) => e.stopPropagation()}
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

            {/* Floating prev arrow */}
            {currentPageIndex > 0 && (
              <button
                type="button"
                onClick={() => setPage(currentPageIndex - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-full border border-border bg-card/90 text-muted-foreground shadow-sm transition-colors hover:text-foreground"
              >
                <ChevronLeft className="size-4" />
              </button>
            )}

            {/* Floating next arrow */}
            {currentPageIndex < pages.length - 1 && (
              <button
                type="button"
                onClick={() => setPage(currentPageIndex + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-full border border-border bg-card/90 text-muted-foreground shadow-sm transition-colors hover:text-foreground"
              >
                <ChevronRight className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Print portal — all pages, hidden normally, shown by globals.css @media print */}
        {mounted &&
          createPortal(
            <div id="print-all-pages">
              {pages.map((page) => {
                const fullPageWidget = page.widgets.find(
                  (w) =>
                    w.type === "FullPageMain" ||
                    w.type === "FullPageFeatures" ||
                    w.type === "FullPageSpells" ||
                    w.type === "FullPageSpellSheet",
                );
                if (fullPageWidget) {
                  return (
                    <div key={page.id} className="full-page-print">
                      <PlacedWidget
                        widget={fullPageWidget}
                        cols={cols}
                        rows={rows}
                        selected={false}
                        printMode
                        onSelect={() => {}}
                        onRotate={() => {}}
                        onToggleLock={() => {}}
                        onDelete={() => {}}
                      />
                    </div>
                  );
                }
                return (
                  <div key={page.id} className="print-page">
                    {page.widgets.map((widget) => (
                      <PlacedWidget
                        key={widget.id}
                        widget={widget}
                        cols={cols}
                        rows={rows}
                        selected={false}
                        printMode
                        onSelect={() => {}}
                        onRotate={() => {}}
                        onToggleLock={() => {}}
                        onDelete={() => {}}
                      />
                    ))}
                  </div>
                );
              })}
            </div>,
            document.body,
          )}
      </div>

      <DragOverlay dropAnimation={null} modifiers={[centerOnCursor]}>
        {activeData?.source === "palette" && (
          <div
            className="rounded border-2 border-primary bg-card/80 opacity-80"
            style={
              activeData.fullPage
                ? { width: "80px", height: "113px" }
                : {
                    width: `${(activeData.w ?? 1) * 32}px`,
                    height: `${(activeData.h ?? 1) * 32}px`,
                  }
            }
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
