"use client";

import { useCharacterStore } from "@/lib/store/character-store";
import { DndFrame } from "./dnd-frame";

// ViewBox 185×90 — matches w=10, h=5 grid cell aspect ratio (~2.05)
const COL_DIV = 67; // end of TYPE column
const RIGHT = 182; // frame inner right edge (185-3)

const HEADER_Y = 17;
const DATA_H = 50;
const DIV_Y = 67;
const LABEL_Y = 77;

const ROW_H = 12;

const NCOL_DIV = COL_DIV - 3; // 64
const NW = RIGHT - 3; // 179

export function OtherProficienciesWidget() {
  const character = useCharacterStore((s) => s.character);
  if (!character) return null;

  const rows = character.otherProficiencies.filter(
    (p) => p.category !== "Tool",
  );

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
      viewBox="0 0 185 90"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "100%" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <DndFrame x={3} y={3} w={179} h={84} cornerOff={10} />

      {/* Column divider */}
      <line
        x1={COL_DIV}
        y1={3}
        x2={COL_DIV}
        y2={DIV_Y}
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

      {/* Data rows — clipped via nested SVG */}
      <svg x={3} y={HEADER_Y} width={NW} height={DATA_H} overflow="hidden">
        {rows.length === 0 && (
          <text
            x={4}
            y={ROW_H / 2}
            dominantBaseline="middle"
            fontSize="6"
            fontStyle="italic"
            {...df}
            fill="#6a5a48"
          >
            —
          </text>
        )}
        {rows.map((row, i) => {
          const cy = ROW_H * i + ROW_H / 2;
          return (
            <g key={row.id}>
              <text
                x={4}
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
                x={NCOL_DIV + 2}
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
                x1={0}
                y1={ROW_H * (i + 1)}
                x2={NW}
                y2={ROW_H * (i + 1)}
                stroke="#1a1208"
                strokeWidth="0.3"
                opacity="0.5"
              />
            </g>
          );
        })}
      </svg>

      {/* Bottom divider + label */}
      <line
        x1={6}
        y1={DIV_Y}
        x2={RIGHT - 3}
        y2={DIV_Y}
        stroke="#1a1208"
        strokeWidth="0.5"
      />
      <text
        x={92.5}
        y={LABEL_Y}
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
