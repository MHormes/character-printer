"use client";

import { useCharacterStore } from "@/lib/store/character-store";
import { DndFrame } from "./dnd-frame";

const COL_DIV = 46; // end of TYPE column
const RIGHT = 128.5;

const HEADER_H = 14;
const ROW_H = 11;

export function slimOtherSvgH(n: number) {
  return 17 + ROW_H * n;
}

// No bottom title — height is exact fit for data rows.
export function SlimOtherProfWidget() {
  const character = useCharacterStore((s) => s.character);
  if (!character) return null;

  const rows = character.otherProficiencies.filter(
    (p) => p.category !== "Tool",
  );
  const svgH = slimOtherSvgH(rows.length);
  const hdrY = 3 + HEADER_H / 2;
  const divY = 1.5 + HEADER_H;
  const rowCY = (i: number) => divY + ROW_H * i + ROW_H / 2;

  const tf = {
    textAnchor: "middle" as const,
    dominantBaseline: "middle" as const,
    fontSize: "5.5",
    fontWeight: "700",
    fontFamily: "Georgia, 'Times New Roman', serif",
    letterSpacing: "0.3",
    fill: "#1a1208",
  };
  const df = {
    dominantBaseline: "middle" as const,
    fontFamily: "Georgia, 'Times New Roman', serif",
    fill: "#1a1208",
  };

  return (
    <svg
      viewBox={`0 0 130 ${svgH}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      <DndFrame x={1.5} y={1.5} w={127} h={svgH - 3} cornerOff={9} />

      {/* Column divider */}
      <line
        x1={COL_DIV}
        y1={1.5}
        x2={COL_DIV}
        y2={svgH - 1.5}
        stroke="#1a1208"
        strokeWidth="0.5"
      />

      {/* Header */}
      <text x={(1.5 + COL_DIV) / 2} y={hdrY} {...tf}>
        TYPE
      </text>
      <text x={(COL_DIV + RIGHT) / 2} y={hdrY} {...tf}>
        PROFICIENCY
      </text>
      <line
        x1={1.5}
        y1={divY}
        x2={RIGHT}
        y2={divY}
        stroke="#1a1208"
        strokeWidth="0.5"
      />

      {/* Data rows */}
      {rows.length === 0 && (
        <text
          x={4}
          y={divY + ROW_H / 2}
          textAnchor="start"
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
            x={6}
            y={rowCY(i)}
            textAnchor="start"
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
            fontSize="5.5"
            fontWeight="400"
            {...df}
          >
            {row.name}
          </text>
          {i < rows.length - 1 && (
            <line
              x1={1.5}
              y1={divY + ROW_H * (i + 1)}
              x2={RIGHT}
              y2={divY + ROW_H * (i + 1)}
              stroke="#1a1208"
              strokeWidth="0.3"
              opacity="0.5"
            />
          )}
        </g>
      ))}
    </svg>
  );
}
