import { DEFAULT_CANVAS_COLS, type CanvasWidget, type WidgetType } from "@/lib/types/canvas";
import { rowsForCols } from "@/lib/canvas/page-utils";
import {
  SPELL_CARD_GRID_W,
  SPELL_CARD_GRID_H,
} from "@/components/canvas/widgets/spell-card-widget";
import { featureCardGridH } from "@/components/canvas/widgets/feature-card-widget";
import { bioTextSvgH } from "@/components/canvas/widgets/bio-text-widget";
import type { SpellEntry, FeatureEntry } from "@/lib/types/character";

export const TEMPLATE_PAGE1_WIDGETS = [
  { type: "CoreStats", col: 0, row: 0, w: 3, h: 18, rotation: 0, locked: false, printState: "Calculated" },
  { type: "Inspiration", col: 3, row: 0, w: 7, h: 2, rotation: 0, locked: false, printState: "Calculated" },
  { type: "Proficiency", col: 3, row: 2, w: 7, h: 2, rotation: 0, locked: false, printState: "Calculated" },
  { type: "SavingThrows", col: 3, row: 4, w: 5, h: 4, rotation: 0, locked: false, printState: "Calculated" },
  { type: "Skills", col: 3, row: 8, w: 7, h: 13, rotation: 0, locked: false, printState: "Calculated" },
  { type: "PassivePerception", col: 0, row: 21, w: 8, h: 2, rotation: 180, locked: false, printState: "Calculated" },
  { type: "SlimToolProf", col: 0, row: 23, w: 10, h: 3, rotation: 0, locked: false, printState: "Calculated" },
  { type: "SlimOtherProf", col: 0, row: 26, w: 10, h: 4, rotation: 0, locked: false, printState: "Calculated" },
  { type: "ArmorClass", col: 10, row: 0, w: 3, h: 4, rotation: 0, locked: false, printState: "Calculated" },
  { type: "Initiative", col: 13, row: 0, w: 3, h: 4, rotation: 0, locked: false, printState: "Calculated" },
  { type: "Speed", col: 16, row: 0, w: 3, h: 4, rotation: 0, locked: false, printState: "Calculated" },
  { type: "Trackers", col: 19, row: 0, w: 6, h: 7, rotation: 0, locked: false, printState: "Calculated" },
  { type: "CurrentHp", col: 10, row: 4, w: 4, h: 4, rotation: 0, locked: false, printState: "Calculated" },
  { type: "TempHp", col: 15, row: 4, w: 4, h: 4, rotation: 0, locked: false, printState: "Calculated" },
  { type: "HitDice", col: 10, row: 8, w: 4, h: 4, rotation: 0, locked: false, printState: "Calculated" },
  { type: "DeathSaves", col: 15, row: 8, w: 4, h: 4, rotation: 0, locked: false, printState: "Calculated" },
  { type: "SlimAttacks", col: 10, row: 12, w: 9, h: 3, rotation: 0, locked: false, printState: "Calculated" },
  { type: "Features", col: 19, row: 7, w: 6, h: 19, rotation: 0, locked: false, printState: "Calculated" },
  { type: "Equipment", col: 10, row: 15, w: 9, h: 23, rotation: 0, locked: false, printState: "Calculated" },
  { type: "StatBox", col: 25, row: 0, w: 3, h: 4, rotation: 0, locked: false, printState: "Calculated" },
  { type: "StatBox", col: 25, row: 4, w: 3, h: 4, rotation: 0, locked: false, printState: "Calculated" },
  { type: "StatBox", col: 25, row: 8, w: 3, h: 4, rotation: 0, locked: false, printState: "Calculated" },
] as const;

export function buildTemplatePage1(equipmentH: number): Omit<CanvasWidget, "id">[] {
  return TEMPLATE_PAGE1_WIDGETS.map((w) => ({
    ...w,
    ...(w.type === "Equipment" ? { h: equipmentH } : {}),
    printState: w.printState as "Calculated" | "Blank",
  }));
}

export function buildTemplatePage2(
  spellLevelH: (level: number) => number,
): Omit<CanvasWidget, "id">[] {
  const INFO_W = 18;
  const INFO_H = 3;
  const START_ROW = 3;

  const widgets: Omit<CanvasWidget, "id">[] = [
    { type: "SpellcastingInfo", col: 5, row: 0, w: INFO_W, h: INFO_H, rotation: 0, locked: false, printState: "Calculated" },
  ];

  let r0 = START_ROW;
  for (const lvl of [0, 1, 2]) {
    const h = spellLevelH(lvl);
    widgets.push({ type: `SpellLevel${lvl}` as WidgetType, col: 0, row: r0, w: 9, h, rotation: 0, locked: false, printState: "Calculated" });
    r0 += h;
  }

  let r1 = START_ROW;
  for (const lvl of [3, 4, 5]) {
    const h = spellLevelH(lvl);
    widgets.push({ type: `SpellLevel${lvl}` as WidgetType, col: 10, row: r1, w: 9, h, rotation: 0, locked: false, printState: "Calculated" });
    r1 += h;
  }

  let r2 = START_ROW;
  for (const lvl of [6, 7, 8, 9]) {
    const h = spellLevelH(lvl);
    widgets.push({ type: `SpellLevel${lvl}` as WidgetType, col: 20, row: r2, w: 8, h, rotation: 0, locked: false, printState: "Calculated" });
    r2 += h;
  }

  return widgets;
}

export function buildTemplateSpellCards(
  spells: SpellEntry[],
  cols: number,
  rows: number,
): { cols: number; widgets: Omit<CanvasWidget, "id">[] }[] {
  const sorted = [...spells].sort((a, b) =>
    a.level !== b.level ? a.level - b.level : a.name.localeCompare(b.name),
  );
  const perRow = Math.floor(cols / SPELL_CARD_GRID_W);
  const perPage = perRow * Math.floor(rows / SPELL_CARD_GRID_H);

  const pages: { cols: number; widgets: Omit<CanvasWidget, "id">[] }[] = [];
  for (let i = 0; i < sorted.length; i += perPage) {
    pages.push({
      cols,
      widgets: sorted.slice(i, i + perPage).map((spell, j) => ({
        type: "SpellCard" as WidgetType,
        col: (j % perRow) * SPELL_CARD_GRID_W,
        row: Math.floor(j / perRow) * SPELL_CARD_GRID_H,
        w: SPELL_CARD_GRID_W,
        h: SPELL_CARD_GRID_H,
        rotation: 0 as const,
        locked: false,
        printState: "Calculated" as const,
        spellId: spell.id,
      })),
    });
  }
  return pages;
}

export function buildFullPageSpells(
  spells: SpellEntry[],
  cols: number,
  rows: number,
): { cols: number; widgets: Omit<CanvasWidget, "id">[] }[] {
  const sorted = [...spells].sort((a, b) =>
    a.level !== b.level ? a.level - b.level : a.name.localeCompare(b.name),
  );
  const perRow = Math.floor(cols / SPELL_CARD_GRID_W);
  const perPage = perRow * Math.floor(rows / SPELL_CARD_GRID_H);

  const pages: { cols: number; widgets: Omit<CanvasWidget, "id">[] }[] = [];
  for (let i = 0; i < sorted.length; i += perPage) {
    pages.push({
      cols,
      widgets: [
        {
          type: "FullPageSpells" as WidgetType,
          col: 0,
          row: 0,
          w: cols,
          h: rows,
          rotation: 0 as const,
          locked: false,
          printState: "Calculated" as const,
          spellStartIndex: i,
          spellCount: Math.min(perPage, sorted.length - i),
        },
      ],
    });
  }
  return pages;
}

export function buildTemplateFeatures(
  features: FeatureEntry[],
): { cols?: number; widgets: Omit<CanvasWidget, "id">[] }[] {
  const templateCols = DEFAULT_CANVAS_COLS;
  const templateRows = rowsForCols(templateCols);
  const COL_STARTS = [0, 10, 20];
  const CARD_W = 9;

  const pages: { cols?: number; widgets: Omit<CanvasWidget, "id">[] }[] = [];
  let currentPage: Omit<CanvasWidget, "id">[] = [];
  let currentCol = 0;
  let currentRow = 0;

  for (const feature of features) {
    const cardW = Math.min(CARD_W, templateCols - COL_STARTS[currentCol]);
    const h = Math.min(featureCardGridH(feature.description, cardW, templateCols, templateRows), templateRows);

    if (currentRow + h > templateRows) {
      currentCol++;
      currentRow = 0;
      if (currentCol >= COL_STARTS.length) {
        pages.push({ cols: templateCols, widgets: currentPage });
        currentPage = [];
        currentCol = 0;
      }
    }

    currentPage.push({
      type: "FeatureCard" as WidgetType,
      col: COL_STARTS[currentCol],
      row: currentRow,
      w: Math.min(CARD_W, templateCols - COL_STARTS[currentCol]),
      h,
      rotation: 0 as const,
      locked: false,
      printState: "Calculated" as const,
      featureId: feature.id,
    });
    currentRow += h;
  }

  if (currentPage.length > 0) pages.push({ cols: templateCols, widgets: currentPage });
  return pages;
}

export function buildTemplateBio(
  bio: Record<string, string> | undefined,
): { cols?: number; widgets: Omit<CanvasWidget, "id">[] }[] {
  const BIO_FIELDS = [
    { id: "appearance" },
    { id: "backstory" },
    { id: "allies" },
    { id: "organizations" },
  ];
  const entries = BIO_FIELDS.filter((f) => bio?.[f.id]?.trim());
  if (entries.length === 0) return [];

  const templateCols = DEFAULT_CANVAS_COLS;
  const templateRows = rowsForCols(templateCols);
  const COL_STARTS = [0, 10, 20];
  const CARD_W = 9;

  const pages: { cols?: number; widgets: Omit<CanvasWidget, "id">[] }[] = [];
  let currentPage: Omit<CanvasWidget, "id">[] = [];
  let currentCol = 0;
  let currentRow = 0;

  for (const entry of entries) {
    const cardW = Math.min(CARD_W, templateCols - COL_STARTS[currentCol]);
    const h = Math.min(
      Math.max(
        3,
        Math.round((bioTextSvgH(bio?.[entry.id] ?? "") * cardW * templateRows * 210) / (templateCols * 297 * 96)),
      ),
      templateRows,
    );

    if (currentRow + h > templateRows) {
      currentCol++;
      currentRow = 0;
      if (currentCol >= COL_STARTS.length) {
        pages.push({ cols: templateCols, widgets: currentPage });
        currentPage = [];
        currentCol = 0;
      }
    }

    currentPage.push({
      type: "BioText" as WidgetType,
      col: COL_STARTS[currentCol],
      row: currentRow,
      w: cardW,
      h,
      rotation: 0 as const,
      locked: false,
      printState: "Calculated" as const,
      textSource: entry.id,
    });
    currentRow += h;
  }

  if (currentPage.length > 0) pages.push({ cols: templateCols, widgets: currentPage });
  return pages;
}
