"use client";

import { useCharacterStore } from "@/lib/store/character-store";
import { DndFrame } from "./dnd-frame";

const SVG_W = 96;
const MARGIN = 3;
const HEADER_H = 10;
const ROW_H = 14;
const BOTTOM_PAD = 5;

// Divider between header and rows
const DIV_Y = MARGIN + HEADER_H;

export function attunedItemsSvgH(n: number): number {
  return MARGIN * 2 + HEADER_H + Math.max(1, n) * ROW_H + BOTTOM_PAD;
}

export function AttunedItemsWidget() {
  const character = useCharacterStore((s) => s.character);
  if (!character) return null;

  const items = character.inventory.filter((i) => i.attuned);
  const n = items.length;
  const svgH = attunedItemsSvgH(n);
  const frameH = svgH - MARGIN * 2;
  const ff = "Georgia, 'Times New Roman', serif";

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${svgH}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      <DndFrame
        x={MARGIN}
        y={MARGIN}
        w={SVG_W - MARGIN * 2}
        h={frameH}
        cornerOff={10}
      />

      <text
        x={SVG_W / 2}
        y={MARGIN + HEADER_H / 2 + 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="5.5"
        fontWeight="700"
        fontFamily={ff}
        letterSpacing="0.4"
        fill="#1a1208"
      >
        ATTUNED ITEMS
      </text>

      <line
        x1={MARGIN}
        y1={DIV_Y}
        x2={SVG_W - MARGIN}
        y2={DIV_Y}
        stroke="#1a1208"
        strokeWidth="0.5"
      />

      {n === 0 && (
        <text
          x={SVG_W / 2}
          y={DIV_Y + ROW_H / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="5.5"
          fontStyle="italic"
          fontFamily={ff}
          fill="#6a5a48"
        >
          No attuned items
        </text>
      )}

      {items.map((item, i) => {
        const nameY = DIV_Y + ROW_H * i + 5;
        const catY = DIV_Y + ROW_H * i + 10.5;
        return (
          <g key={item.id}>
            <text
              x={7}
              y={nameY}
              dominantBaseline="middle"
              fontSize="5.5"
              fontWeight="700"
              fontFamily={ff}
              fill="#1a1208"
              style={{ fontVariant: "small-caps" }}
            >
              {item.name}
            </text>
            <text
              x={7}
              y={catY}
              dominantBaseline="middle"
              fontSize="4.5"
              fontStyle="italic"
              fontFamily={ff}
              fill="#6a5a48"
            >
              {item.category}
            </text>
            {i < n - 1 && (
              <line
                x1={MARGIN}
                y1={DIV_Y + ROW_H * (i + 1)}
                x2={SVG_W - MARGIN}
                y2={DIV_Y + ROW_H * (i + 1)}
                stroke="#1a1208"
                strokeWidth="0.2"
                opacity="0.4"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
