"use client";

import { useCharacterStore } from "@/lib/store/character-store";
import { DndFrame } from "./dnd-frame";

const COL_DIV = 67;
const RIGHT = 182;
const HEADER_Y = 17;
const ROW_H = 12;
const FOOTER_H = 23;

const NW = RIGHT - 3; // 179

export function otherProfSvgH(n: number): number {
  return HEADER_Y + ROW_H * Math.max(1, n) + FOOTER_H;
}

export function OtherProficienciesWidget() {
  const character = useCharacterStore((s) => s.character);
  if (!character) return null;

  const profRows = character.otherProficiencies.filter(
    (p) => p.category !== "Tool",
  );

  const svgH = otherProfSvgH(profRows.length);
  const dataBottom = HEADER_Y + ROW_H * Math.max(1, profRows.length);

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
      <DndFrame x={3} y={3} w={179} h={svgH - 6} cornerOff={10} />

      {/* Column divider */}
      <line
        x1={COL_DIV}
        y1={3}
        x2={COL_DIV}
        y2={dataBottom}
        stroke="#1a1208"
        strokeWidth="0.5"
      />

      {/* Header row */}
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

      {/* Header divider */}
      <line
        x1={3}
        y1={HEADER_Y}
        x2={RIGHT}
        y2={HEADER_Y}
        stroke="#1a1208"
        strokeWidth="0.5"
      />

      {/* Data rows */}
      {profRows.length === 0 && (
        <text
          x={7}
          y={HEADER_Y + ROW_H / 2}
          dominantBaseline="middle"
          fontSize="6"
          fontStyle="italic"
          {...df}
          fill="#6a5a48"
        >
          —
        </text>
      )}
      {profRows.map((row, i) => {
        const cy = HEADER_Y + ROW_H * i + ROW_H / 2;
        return (
          <g key={row.id}>
            <text
              x={7}
              y={cy}
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
              y={cy}
              textAnchor="start"
              dominantBaseline="middle"
              fontSize="6"
              fontWeight="400"
              {...df}
            >
              {row.name}
            </text>
            <line
              x1={3}
              y1={HEADER_Y + ROW_H * (i + 1)}
              x2={NW + 3}
              y2={HEADER_Y + ROW_H * (i + 1)}
              stroke="#1a1208"
              strokeWidth="0.3"
              opacity="0.5"
            />
          </g>
        );
      })}

      {/* Bottom divider + label */}
      <line
        x1={6}
        y1={dataBottom}
        x2={RIGHT - 3}
        y2={dataBottom}
        stroke="#1a1208"
        strokeWidth="0.5"
      />
      <text
        x={92.5}
        y={dataBottom + 10}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="4.5"
        fontWeight="700"
        fontFamily="Georgia, 'Times New Roman', serif"
        letterSpacing="0.3"
        fill="#1a1208"
      >
        OTHER PROFICIENCIES &amp; LANGUAGES
      </text>
    </svg>
  );
}
