"use client";

import {
  useRef,
  useCallback,
  useSyncExternalStore,
  useState,
  useEffect,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Plus,
  Trash2,
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
  type Modifier,
} from "@dnd-kit/core";
import { rowsForCols, sanitizeTemplateWidgets } from "@/lib/canvas/page-utils";
import {
  buildTemplatePage1,
  buildTemplatePage2,
  buildTemplateSpellCards,
  buildFullPageSpells,
  buildTemplateFeatures,
  buildTemplateBio,
} from "@/lib/canvas/template-builders";
import { computeIdealWidgetH } from "@/lib/canvas/widget-heights";
import { useCanvasStore } from "@/lib/store/canvas-store";
import { useCharacterStore } from "@/lib/store/character-store";
import {
  DEFAULT_CANVAS_COLS,
  type CanvasTemplate,
  type WidgetType,
} from "@/lib/types/canvas";
import { PaletteTile } from "@/components/canvas/palette-tile";
import { PlacedWidget } from "@/components/canvas/placed-widget";
import { SavedTemplateTile } from "@/components/canvas/saved-template-tile";
import { PageOverview } from "@/components/canvas/page-overview";
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
import { characteristicsSvgH } from "@/components/canvas/widgets/characteristics-widget";
import { spellLevelSvgH } from "@/components/canvas/widgets/spell-level-widget";
import { otherProfSvgH } from "@/components/canvas/widgets/other-proficiencies-widget";
import { toolProfSvgH } from "@/components/canvas/widgets/tool-proficiencies-widget";

const topLeftOnCursor: Modifier = ({
  activatorEvent,
  activeNodeRect,
  transform,
}) => {
  if (activeNodeRect && activatorEvent && "clientX" in activatorEvent) {
    const e = activatorEvent as PointerEvent;
    return {
      ...transform,
      x: transform.x + e.clientX - activeNodeRect.left,
      y: transform.y + e.clientY - activeNodeRect.top,
    };
  }
  return transform;
};

type ActiveData = {
  source: "palette" | "canvas" | "template";
  type?: string;
  w?: number;
  h?: number;
  widgetId?: string;
  fullPage?: boolean;
  templateId?: string;
};

const SLIM_W = 10;

type Props = {
  templates: CanvasTemplate[];
  onDeleteTemplate: (templateId: string) => void;
  isMobile?: boolean;
};

export function CanvasArea({ templates, onDeleteTemplate, isMobile = false }: Props) {
  const {
    cols,
    pages,
    currentPageIndex,
    widgets,
    selectedIds,
    lastSelectedId,
    addWidget,
    addWidgetsMultiPage,
    moveWidget,
    moveWidgets,
    rotateWidget,
    setSelected,
    toggleSelected,
    clearSelected,
    removeSelected,
    toggleLockSelected,
    undo,
    redo,
    addPage,
    deletePage,
    setPage,
    replaceCurrentPage,
    batchUpdateHeights,
  } = useCanvasStore();
  const rows = rowsForCols(cols);
  const [overviewMode, setOverviewMode] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        if (inInput) return;
        e.preventDefault();
        undo();
        return;
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        if (inInput) return;
        e.preventDefault();
        redo();
        return;
      }

      if (selectedIds.size === 0) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        if (inInput) return;
        removeSelected();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, removeSelected, undo, redo]);

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
  const validSpellIds = new Set(
    character?.spells.list.map((spell) => spell.id) ?? [],
  );
  const validFeatureIds = new Set(
    character?.features.map((feature) => feature.id) ?? [],
  );
  const validStatIds = new Set(
    character?.statBoxes?.map((stat) => stat.id) ?? [],
  );

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
      (attacksSvgH(actionsCount) * 9 * rows * 210) / (cols * 297 * 176),
    ),
  );
  const slimAttacksH = Math.max(
    2,
    Math.round(
      (slimAttacksSvgH(actionsCount) * 9 * rows * 210) / (cols * 297 * 176),
    ),
  );
  const equipmentH = Math.max(
    4,
    Math.round(
      (equipmentSvgH(inventoryCount) * 9 * rows * 210) / (cols * 297 * 132),
    ),
  );
  const trackersH = Math.max(
    trackersCount <= 2 ? 4 : 2,
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
  const characteristicsH = Math.max(
    4,
    Math.round(
      (characteristicsSvgH(character?.characteristics) * 6 * rows * 210) /
        (cols * 297 * 96),
    ),
  );

  const toolProfH = Math.max(
    2,
    Math.round(
      (toolProfSvgH(toolCount) * 10 * rows * 210) / (cols * 297 * 164),
    ),
  );
  const otherProfH = Math.max(
    2,
    Math.round(
      (otherProfSvgH(otherCount) * 10 * rows * 210) / (cols * 297 * 185),
    ),
  );

  const spellLevelH = (level: number) => {
    const count =
      character?.spells.list.filter((s) => s.level === level).length ?? 0;
    return Math.max(
      count > 0 ? 3 : 2,
      Math.round((spellLevelSvgH(count) * 9 * rows * 210) / (cols * 297 * 120)),
    );
  };

  const staleUpdates = useMemo(() => {
    const updates: { id: string; h: number }[] = [];
    for (const widget of widgets) {
      const ideal = computeIdealWidgetH(widget, character, cols, rows);
      if (ideal !== null && ideal !== widget.h)
        updates.push({ id: widget.id, h: ideal });
    }
    return updates;
  }, [widgets, character, cols, rows]);

  const [autoResizedIds, setAutoResizedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (staleUpdates.length === 0) return;
    batchUpdateHeights(staleUpdates);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAutoResizedIds((prev) => {
      const next = new Set(prev);
      staleUpdates.forEach((u) => next.add(u.id));
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staleUpdates]);

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
    { type: "CharacterPortrait" as const, label: "Portrait", w: 5, h: 7 },
    {
      type: "Characteristics" as const,
      label: "Characteristics",
      w: 6,
      h: characteristicsH,
    },
    {
      type: "CharacteristicCard" as const,
      label: "Characteristic Card",
      w: 6,
      h: 5,
    },
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
    {
      type: "ToolProficiencies" as const,
      label: "Tool Prof.",
      w: 10,
      h: toolProfH,
    },
    {
      type: "OtherProficiencies" as const,
      label: "Other Prof.",
      w: 10,
      h: otherProfH,
    },
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
    { type: "Attacks" as const, label: "Attacks", w: 9, h: attacksH },
    {
      type: "SlimAttacks" as const,
      label: "Slim Attacks",
      w: 9,
      h: slimAttacksH,
    },
    { type: "Equipment" as const, label: "Equipment", w: 9, h: equipmentH },
    // Trackers & features
    { type: "Trackers" as const, label: "Trackers", w: 6, h: trackersH },
    { type: "TrackerCard" as const, label: "Tracker Card", w: 3, h: 4 },
    { type: "Features" as const, label: "Features", w: 6, h: featuresH },
    { type: "FeatureCard" as const, label: "Feature Card", w: 9, h: 5 },

    { type: "BioText" as const, label: "Bio Card", w: 6, h: 5 },
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
    {
      type: "TemplateBio" as const,
      label: "Template: Bio",
      fullPage: true as const,
    },
    {
      type: "FullPageBio" as const,
      label: "Complete: Bio",
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
      w: 9,
      h: spellLevelH(0),
    },
    { type: "SpellLevel1" as const, label: "Level 1", w: 9, h: spellLevelH(1) },
    { type: "SpellLevel2" as const, label: "Level 2", w: 9, h: spellLevelH(2) },
    { type: "SpellLevel3" as const, label: "Level 3", w: 9, h: spellLevelH(3) },
    { type: "SpellLevel4" as const, label: "Level 4", w: 9, h: spellLevelH(4) },
    { type: "SpellLevel5" as const, label: "Level 5", w: 9, h: spellLevelH(5) },
    { type: "SpellLevel6" as const, label: "Level 6", w: 8, h: spellLevelH(6) },
    { type: "SpellLevel7" as const, label: "Level 7", w: 8, h: spellLevelH(7) },
    { type: "SpellLevel8" as const, label: "Level 8", w: 8, h: spellLevelH(8) },
    { type: "SpellLevel9" as const, label: "Level 9", w: 8, h: spellLevelH(9) },
  ];

  const gridDomRef = useRef<HTMLDivElement>(null);
  const [activeCellSize, setActiveCellSize] = useState({ w: 32, h: 32 });
  const [activeData, setActiveData] = useState<ActiveData | null>(null);
  const [dropPreview, setDropPreview] = useState<{
    col: number;
    row: number;
    w: number;
    h: number;
  } | null>(null);
  const [groupDropPreviews, setGroupDropPreviews] = useState<
    {
      id: string;
      col: number;
      row: number;
      w: number;
      h: number;
    }[]
  >([]);

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
    const data = e.active.data.current as ActiveData;
    setActiveData(data);
    setDropPreview(null);
    setGroupDropPreviews([]);
    if (gridDomRef.current) {
      const rect = gridDomRef.current.getBoundingClientRect();
      setActiveCellSize({ w: rect.width / cols, h: rect.height / rows });
    }
    if (
      data.source === "canvas" &&
      data.widgetId &&
      !selectedIds.has(data.widgetId)
    ) {
      setSelected(data.widgetId);
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveData(null);
    setDropPreview(null);
    setGroupDropPreviews([]);
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
        replaceCurrentPage(DEFAULT_CANVAS_COLS, buildTemplatePage1(equipmentH));
        return;
      }

      if (data.type === "TemplatePage2") {
        replaceCurrentPage(DEFAULT_CANVAS_COLS, buildTemplatePage2(spellLevelH));
        return;
      }

      if (data.type === "TemplateSpellCards") {
        const spells = character?.spells.list ?? [];
        if (spells.length === 0) return;
        addWidgetsMultiPage(buildTemplateSpellCards(spells, cols, rows));
        return;
      }

      if (data.type === "TemplateFeatures") {
        const features = character?.features ?? [];
        if (features.length === 0) return;
        addWidgetsMultiPage(buildTemplateFeatures(features));
        return;
      }

      if (data.type === "TemplateBio") {
        const pages = buildTemplateBio(character?.bio as Record<string, string> | undefined);
        if (pages.length === 0) return;
        addWidgetsMultiPage(pages);
        return;
      }

      if (data.type === "FullPageSpells") {
        const spells = character?.spells.list ?? [];
        if (spells.length === 0) return;
        addWidgetsMultiPage(buildFullPageSpells(spells, cols, rows));
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
    } else if (data.source === "template" && data.templateId) {
      const translated = active.rect.current?.translated;
      if (!translated) return;
      const midX = translated.left + translated.width / 2;
      const midY = translated.top + translated.height / 2;
      if (
        midX < gridRect.left ||
        midX > gridRect.right ||
        midY < gridRect.top ||
        midY > gridRect.bottom
      ) {
        return;
      }
      const template = templates.find((item) => item.id === data.templateId);
      if (!template) return;
      replaceCurrentPage(
        template.cols,
        sanitizeTemplateWidgets(
          template.widgets,
          validSpellIds,
          validFeatureIds,
          validStatIds,
        ),
      );
    } else if (data.source === "canvas" && data.widgetId) {
      const draggedId = data.widgetId;
      const isGroupDrag = selectedIds.has(draggedId) && selectedIds.size > 1;

      if (isGroupDrag) {
        const selected = widgets.filter((w) => selectedIds.has(w.id));
        if (selected.some((w) => w.locked)) return;
        const deltaCols = Math.round(delta.x / cellW);
        const deltaRows = Math.round(delta.y / cellH);
        const moves = selected.map((w) => ({
          id: w.id,
          col: Math.max(0, Math.min(w.col + deltaCols, cols - w.w)),
          row: Math.max(0, Math.min(w.row + deltaRows, rows - w.h)),
        }));
        moveWidgets(moves);
      } else {
        const widget = widgets.find((w) => w.id === draggedId);
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
  }

  function handleDragMove(e: DragMoveEvent) {
    const { active, delta } = e;
    const data = active.data.current as ActiveData;
    if (!gridDomRef.current) return;

    const gridRect = gridDomRef.current.getBoundingClientRect();
    const cellW = gridRect.width / cols;
    const cellH = gridRect.height / rows;

    if (data.source === "palette") {
      const translated = active.rect.current?.translated;
      if (!translated) {
        setDropPreview(null);
        return;
      }
      const midX = translated.left + translated.width / 2;
      const midY = translated.top + translated.height / 2;
      if (
        midX < gridRect.left ||
        midX > gridRect.right ||
        midY < gridRect.top ||
        midY > gridRect.bottom
      ) {
        setDropPreview(null);
        return;
      }
      const w = data.w ?? 1;
      const h = data.h ?? 1;
      setDropPreview({
        col: Math.max(
          0,
          Math.min(Math.floor((midX - gridRect.left) / cellW), cols - w),
        ),
        row: Math.max(
          0,
          Math.min(Math.floor((midY - gridRect.top) / cellH), rows - h),
        ),
        w,
        h,
      });
    } else if (data.source === "canvas" && data.widgetId) {
      const draggedId = data.widgetId;
      const isGroupDrag = selectedIds.has(draggedId) && selectedIds.size > 1;

      if (isGroupDrag) {
        const selected = widgets.filter((w) => selectedIds.has(w.id));
        if (selected.some((w) => w.locked)) {
          setDropPreview(null);
          setGroupDropPreviews([]);
          return;
        }
        const deltaCols = Math.round(delta.x / cellW);
        const deltaRows = Math.round(delta.y / cellH);
        const previews = selected.map((w) => ({
          id: w.id,
          col: Math.max(0, Math.min(w.col + deltaCols, cols - w.w)),
          row: Math.max(0, Math.min(w.row + deltaRows, rows - w.h)),
          w: w.w,
          h: w.h,
        }));
        setDropPreview(null);
        setGroupDropPreviews(previews);
      } else {
        const widget = widgets.find((w) => w.id === draggedId);
        if (!widget || widget.locked) {
          setDropPreview(null);
          return;
        }
        setGroupDropPreviews([]);
        setDropPreview({
          col: Math.max(
            0,
            Math.min(widget.col + Math.round(delta.x / cellW), cols - widget.w),
          ),
          row: Math.max(
            0,
            Math.min(widget.row + Math.round(delta.y / cellH), rows - widget.h),
          ),
          w: widget.w,
          h: widget.h,
        });
      }
    } else {
      setDropPreview(null);
      setGroupDropPreviews([]);
    }
  }

  const mounted = useSyncExternalStore(
    (cb) => {
      cb();
      return () => {};
    },
    () => true,
    () => false,
  );

  return (
    <DndContext
      sensors={isMobile ? [] : sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div className="flex min-h-0 items-start overflow-visible">
        {/* Sidebar palette */}
        {!isMobile && <aside className="sticky top-0 h-screen w-1/4 shrink-0 self-start overflow-y-auto border-r border-border bg-section p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Your Templates
          </p>
          {templates.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {templates.map((template) => (
                <SavedTemplateTile
                  key={template.id}
                  template={template}
                  onDelete={onDeleteTemplate}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Save a page to reuse it here.
            </p>
          )}
          <p className="pt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
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
        </aside>}

        {/* Canvas column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Page actions bar — top right */}
          {!isMobile && (
            <div className="flex shrink-0 items-center justify-end gap-1 border-b border-border bg-section px-3 py-1">
              <button
                type="button"
                onClick={() => setOverviewMode((v) => !v)}
                className="flex items-center gap-1.5 rounded px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <LayoutGrid className="size-3" />
                {overviewMode ? "Back to editor" : "Page overview"}
              </button>
              {!overviewMode && (
                <>
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
                </>
              )}
            </div>
          )}

          {/* Overview mode */}
          {overviewMode && (
            <PageOverview onClose={() => setOverviewMode(false)} />
          )}

          {/* Canvas display with floating nav arrows */}
          {!overviewMode && (
            <>
            <div
              className="relative flex md:min-h-[calc(100vh-8rem)] items-start md:items-center justify-center bg-muted/30 p-2 md:p-8"
              onClick={() => clearSelected()}
            >
              <div
                className="relative aspect-[210/297] w-full bg-card shadow-lg py-[4mm] px-[2.828mm] box-border"
                style={{ maxWidth: 'clamp(1024px, 53vw, 1600px)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  id="canvas-editor"
                  ref={setGridRef}
                  className="relative h-full w-full overflow-visible"
                  onClick={() => clearSelected()}
                  style={{
                    backgroundImage: [
                      "linear-gradient(to right, var(--color-border) 1px, transparent 1px)",
                      "linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)",
                    ].join(", "),
                    backgroundSize: `${100 / cols}% ${100 / rows}%`,
                  }}
                >
                  {widgets.map((widget) => (
                    <PlacedWidget
                      key={widget.id}
                      widget={widget}
                      cols={cols}
                      rows={rows}
                      selected={selectedIds.has(widget.id)}
                      isToolbarHost={lastSelectedId === widget.id}
                      wasAutoResized={autoResizedIds.has(widget.id)}
                      isMobile={isMobile}
                      onSelect={(e) => {
                        if (isMobile) return;
                        e.stopPropagation();
                        if (e.ctrlKey || e.metaKey) {
                          toggleSelected(widget.id);
                        } else {
                          setSelected(widget.id);
                        }
                      }}
                      onRotate={() => rotateWidget(widget.id)}
                      onToggleLock={() => toggleLockSelected()}
                      onDelete={() => removeSelected()}
                    />
                  ))}
                  {dropPreview && (
                    <div
                      className="pointer-events-none absolute z-20 rounded border-2 border-primary bg-primary/10"
                      style={{
                        left: `${(dropPreview.col / cols) * 100}%`,
                        top: `${(dropPreview.row / rows) * 100}%`,
                        width: `${(dropPreview.w / cols) * 100}%`,
                        height: `${(dropPreview.h / rows) * 100}%`,
                      }}
                    />
                  )}
                  {groupDropPreviews.map((p) => (
                    <div
                      key={p.id}
                      className="pointer-events-none absolute z-20 rounded border-2 border-primary bg-primary/10"
                      style={{
                        left: `${(p.col / cols) * 100}%`,
                        top: `${(p.row / rows) * 100}%`,
                        width: `${(p.w / cols) * 100}%`,
                        height: `${(p.h / rows) * 100}%`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Floating prev arrow — desktop only */}
              {currentPageIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setPage(currentPageIndex - 1)}
                  className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 size-8 items-center justify-center rounded-full border border-border bg-card/90 text-muted-foreground shadow-sm transition-colors hover:text-foreground"
                >
                  <ChevronLeft className="size-4" />
                </button>
              )}

              {/* Floating next arrow — desktop only */}
              {currentPageIndex < pages.length - 1 && (
                <button
                  type="button"
                  onClick={() => setPage(currentPageIndex + 1)}
                  className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 size-8 items-center justify-center rounded-full border border-border bg-card/90 text-muted-foreground shadow-sm transition-colors hover:text-foreground"
                >
                  <ChevronRight className="size-4" />
                </button>
              )}
            </div>

            </>
          )}
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
                    w.type === "FullPageSpellSheet" ||
                    w.type === "FullPageBio",
                );
                if (fullPageWidget) {
                  const pageRows = rowsForCols(page.cols);
                  return (
                    <div key={page.id} className="full-page-print">
                      <div className="print-page-inner">
                        <PlacedWidget
                          widget={fullPageWidget}
                          cols={page.cols}
                          rows={pageRows}
                          selected={false}
                          isToolbarHost={false}
                          printMode
                          onSelect={() => {}}
                          onRotate={() => {}}
                          onToggleLock={() => {}}
                          onDelete={() => {}}
                        />
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={page.id} className="print-page">
                    <div className="print-page-inner">
                      {(() => {
                        const pageRows = rowsForCols(page.cols);
                        return page.widgets.map((widget) => (
                          <PlacedWidget
                            key={widget.id}
                            widget={widget}
                            cols={page.cols}
                            rows={pageRows}
                            selected={false}
                            isToolbarHost={false}
                            printMode
                            onSelect={() => {}}
                            onRotate={() => {}}
                            onToggleLock={() => {}}
                            onDelete={() => {}}
                          />
                        ));
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>,
            document.body,
          )}
      </div>

      <DragOverlay dropAnimation={null} modifiers={[topLeftOnCursor]}>
        {activeData?.source === "palette" && !dropPreview && (
          <div
            className="rounded border-2 border-primary bg-card/80 opacity-80"
            style={
              activeData.fullPage
                ? { width: "80px", height: "113px" }
                : {
                    width: `${(activeData.w ?? 1) * activeCellSize.w}px`,
                    height: `${(activeData.h ?? 1) * activeCellSize.h}px`,
                  }
            }
          />
        )}
        {activeData?.source === "template" && (
          <div
            className="rounded border-2 border-primary bg-card/80 opacity-80"
            style={{ width: "80px", height: "113px" }}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
