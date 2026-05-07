"use client";

import { useCharacterStore } from "@/lib/store/character-store";
import { DndFrame } from "./dnd-frame";

// Column x-positions in 130-wide viewBox (1.5px frame margin each side)
const C1 = 70; // end of TOOL column
const C2 = 90; // end of PRO column
const RIGHT = 128.5; // frame inner right edge

const HEADER_H = 14;
const ROW_H = 13;

// SVG height formula: 1.5 top + HEADER_H + n×ROW_H + 1.5 bottom
export function slimToolSvgH(n: number) {
  return 17 + ROW_H * n;
}

function profLabel(t: "Proficient" | "Expertise") {
  return t === "Expertise" ? "E" : "P";
}

// No bottom title — height is exact fit for data rows.
// height: auto so SVG occupies only what it needs inside the widget container.
export function SlimToolProfWidget() {
  const character = useCharacterStore((s) => s.character);
  if (!character) return null;

  const rows = character.otherProficiencies.filter(
    (p) => p.category === "Tool",
  );
  const svgH = slimToolSvgH(rows.length);
  const hdrY = 3 + HEADER_H / 2; // header text centre
  const divY = 1.5 + HEADER_H; // divider below header
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

      {/* Column dividers */}
      <line
        x1={C1}
        y1={1.5}
        x2={C1}
        y2={svgH - 1.5}
        stroke="#1a1208"
        strokeWidth="0.5"
      />
      <line
        x1={C2}
        y1={1.5}
        x2={C2}
        y2={svgH - 1.5}
        stroke="#1a1208"
        strokeWidth="0.5"
      />

      {/* Header */}
      <text x={(1.5 + C1) / 2} y={hdrY} {...tf}>
        TOOL
      </text>
      <text x={(C1 + C2) / 2} y={hdrY} {...tf}>
        PRO
      </text>
      <text x={(C2 + RIGHT) / 2} y={hdrY} {...tf}>
        ATTR
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
            fontSize="6.5"
            fontWeight="400"
            {...df}
          >
            {row.name}
          </text>
          <text
            x={(C1 + C2) / 2}
            y={rowCY(i)}
            textAnchor="middle"
            fontSize="7"
            fontWeight="600"
            {...df}
          >
            {profLabel(row.training)}
          </text>
          <text
            x={C2 + 2}
            y={rowCY(i)}
            textAnchor="start"
            fontSize="6.5"
            fontWeight="400"
            {...df}
          >
            {row.stat?.toUpperCase() ?? "—"}
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
