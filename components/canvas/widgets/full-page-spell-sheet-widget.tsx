"use client";

import type { CSSProperties } from "react";
import { useCharacterStore } from "@/lib/store/character-store";
import { SpellcastingInfoWidget } from "./spellcasting-info-widget";
import { SpellLevelBlock, spellLevelSvgH } from "./spell-level-widget";

// Mirrors TemplatePage2 exactly (28 cols × 40 rows, A4 ratio)
const C = 28;
const R = 40;

function slot(col: number, row: number, w: number, h: number, rotation: number = 0): CSSProperties {
  return {
    position: "absolute",
    left: `${(col / C) * 100}%`,
    top: `${(row / R) * 100}%`,
    width: `${(w / C) * 100}%`,
    height: `${(h / R) * 100}%`,
    transform: rotation ? `rotate(${rotation}deg)` : undefined,
  };
}

export function FullPageSpellSheetWidget() {
  const character = useCharacterStore((s) => s.character);
  if (!character) return null;

  const spells = character.spells.list;

  const rowsForCols = (cols: number) => Math.ceil((cols * 297 * 100) / (210 * 100));
  const rows = rowsForCols(C);

  const getH = (lvl: number) => {
    const count = spells.filter((s) => s.level === lvl).length;
    return Math.max(
      count > 0 ? 3 : 2,
      Math.round((spellLevelSvgH(count) * 9 * rows * 210) / (C * 297 * 120)),
    );
  };

  const START_ROW = 3;

  // Calculate row positions for each column to match template logic
  let r0 = START_ROW;
  const col0 = [0, 1, 2].map((lvl) => {
    const h = getH(lvl);
    const pos = r0;
    r0 += h;
    return { lvl, h, row: pos };
  });

  let r1 = START_ROW;
  const col1 = [3, 4, 5].map((lvl) => {
    const h = getH(lvl);
    const pos = r1;
    r1 += h;
    return { lvl, h, row: pos };
  });

  let r2 = START_ROW;
  const col2 = [6, 7, 8, 9].map((lvl) => {
    const h = getH(lvl);
    const pos = r2;
    r2 += h;
    return { lvl, h, row: pos };
  });

  return (
    <div className="h-full w-full relative overflow-hidden">
      <div style={slot(5, 0, 18, 3)}>
        <SpellcastingInfoWidget />
      </div>

      {col0.map((item) => (
        <div key={item.lvl} style={slot(0, item.row, 9, item.h)}>
          <SpellLevelBlock level={item.lvl} />
        </div>
      ))}

      {col1.map((item) => (
        <div key={item.lvl} style={slot(10, item.row, 9, item.h)}>
          <SpellLevelBlock level={item.lvl} />
        </div>
      ))}

      {col2.map((item) => (
        <div key={item.lvl} style={slot(20, item.row, 8, item.h)}>
          <SpellLevelBlock level={item.lvl} />
        </div>
      ))}
    </div>
  );
}
