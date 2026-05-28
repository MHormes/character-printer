"use client";

import { useCharacterStore } from "@/lib/store/character-store";
import { DndFrame } from "./dnd-frame";

// Matches OtherProficienciesWidget viewBox width (185) so text scales identically
const COL_DIV = 67;
const RIGHT = 182;

const ROW_H = 11;

const DIV_Y = 17; // 3 top margin + HEADER_H

// SVG height: 3 top + 14 header + n×11 rows + 1 padding
export function slimOtherSvgH(n: number) {
  return 18 + ROW_H * Math.max(1, n);
}

export function SlimOtherProfWidget() {
  const character = useCharacterStore((s) => s.character);
  if (!character) return null;

  const rows = character.otherProficiencies.filter(
    (p) => p.category !== "Tool",
  );
  const n = Math.max(1, rows.length);
  const svgH = slimOtherSvgH(rows.length);
  const frameH = svgH - 4; // 3 top margin + 1 padding
  const frameBot = 3 + frameH;
  const rowCY = (i: number) => DIV_Y + ROW_H * i + ROW_H / 2;

  const tf = {
    fontSize: "5.5",
    fontWeight: "700",
    fontFamily: "Georgia, 'Times New Roman', serif",
    letterSpacing: "0.3",
    fill: "#1a1208",
  } as const;
  const df = {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fill: "#1a1208",
  } as const;

  return (
    <svg
      viewBox={`0 0 185 ${svgH}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      <DndFrame x={3} y={3} w={179} h={frameH} cornerOff={10} />

      <line
        x1={COL_DIV}
        y1={3}
        x2={COL_DIV}
        y2={frameBot}
        stroke="#1a1208"
        strokeWidth="0.5"
      />

      <text
        x={(3 + COL_DIV) / 2}
        y={12}
        textAnchor="middle"
        dominantBaseline="middle"
        {...tf}
      >
        TYPE
      </text>
      <text
        x={(COL_DIV + RIGHT) / 2}
        y={12}
        textAnchor="middle"
        dominantBaseline="middle"
        {...tf}
      >
        PROFICIENCY
      </text>
      <line
        x1={3}
        y1={DIV_Y}
        x2={RIGHT}
        y2={DIV_Y}
        stroke="#1a1208"
        strokeWidth="0.5"
      />

      {rows.length === 0 && (
        <text
          x={6}
          y={DIV_Y + ROW_H / 2}
          textAnchor="start"
          dominantBaseline="middle"
          fontSize="6"
          fontStyle="italic"
          {...df}
          fill="#6a5a48"
        >
          —
        </text>
      )}
      {rows.map((row, i) => (
        <g key={row.id}>
          <text
            x={7}
            y={rowCY(i)}
            textAnchor="start"
            dominantBaseline="middle"
            fontSize="6"
            fontWeight="700"
            {...df}
          >
            {row.category.toUpperCase()}
          </text>
          <text
            x={COL_DIV + 2}
            y={rowCY(i)}
            textAnchor="start"
            dominantBaseline="middle"
            fontSize="5.5"
            fontWeight="400"
            {...df}
          >
            {row.name}
          </text>
          {i < rows.length - 1 && (
            <line
              x1={3}
              y1={DIV_Y + ROW_H * (i + 1)}
              x2={RIGHT}
              y2={DIV_Y + ROW_H * (i + 1)}
              stroke="#1a1208"
              strokeWidth="0.3"
              opacity="0.5"
            />
          )}
        </g>
      ))}

      {/* Final bottom divider */}
      <line
        x1={3}
        y1={DIV_Y + ROW_H * n}
        x2={RIGHT}
        y2={DIV_Y + ROW_H * n}
        stroke="#1a1208"
        strokeWidth="0.5"
      />
    </svg>
  );
}
