"use client";

import { useCharacterStore } from "@/lib/store/character-store";
import { DndFrame } from "./dnd-frame";

const C1    = 90;
const C2    = 115;
const RIGHT = 161;
const HEADER_Y = 17;
const ROW_H = 14;
const FOOTER_H = 23;

const NC1 = C1 - 3;   // 87
const NC2 = C2 - 3;   // 112

function profLabel(training: "Proficient" | "Expertise") {
  return training === "Expertise" ? "E" : "P";
}

export function toolProfSvgH(n: number): number {
  return HEADER_Y + ROW_H * Math.max(1, n) + FOOTER_H;
}

export function ToolProficienciesWidget() {
  const character = useCharacterStore((s) => s.character);
  if (!character) return null;

  const profRows = character.otherProficiencies.filter((p) => p.category === "Tool");

  const svgH = toolProfSvgH(profRows.length);
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
      viewBox={`0 0 164 ${svgH}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      <DndFrame x={3} y={3} w={158} h={svgH - 6} cornerOff={10} />

      {/* Column dividers */}
      <line x1={C1} y1={3} x2={C1} y2={dataBottom} stroke="#1a1208" strokeWidth="0.5" />
      <line x1={C2} y1={3} x2={C2} y2={dataBottom} stroke="#1a1208" strokeWidth="0.5" />

      {/* Header row */}
      <text x={(3 + C1) / 2}    y={12} textAnchor="middle" dominantBaseline="middle" {...tf}>TOOL</text>
      <text x={(C1 + C2) / 2}   y={12} textAnchor="middle" dominantBaseline="middle" {...tf}>PRO</text>
      <text x={(C2 + RIGHT) / 2} y={12} textAnchor="middle" dominantBaseline="middle" {...tf}>ATTR</text>

      {/* Header divider */}
      <line x1={3} y1={HEADER_Y} x2={RIGHT} y2={HEADER_Y} stroke="#1a1208" strokeWidth="0.5" />

      {/* Data rows */}
      {profRows.length === 0 && (
        <text x={7} y={HEADER_Y + ROW_H / 2} dominantBaseline="middle" fontSize="6" fontStyle="italic" {...df} fill="#6a5a48">—</text>
      )}
      {profRows.map((row, i) => {
        const cy = HEADER_Y + ROW_H * i + ROW_H / 2;
        return (
          <g key={row.id}>
            <text x={7}               y={cy} textAnchor="start"  dominantBaseline="middle" fontSize="6.5" fontWeight="400" {...df}>{row.name}</text>
            <text x={(NC1 + NC2) / 2} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="7"   fontWeight="600" {...df}>{profLabel(row.training)}</text>
            <text x={C2 + 2}          y={cy} textAnchor="start"  dominantBaseline="middle" fontSize="6.5" fontWeight="400" {...df}>{row.stat?.toUpperCase() ?? "—"}</text>
            <line x1={3} y1={HEADER_Y + ROW_H * (i + 1)} x2={RIGHT} y2={HEADER_Y + ROW_H * (i + 1)} stroke="#1a1208" strokeWidth="0.3" opacity="0.5" />
          </g>
        );
      })}

      {/* Bottom divider + label */}
      <line x1={6} y1={dataBottom} x2={RIGHT - 3} y2={dataBottom} stroke="#1a1208" strokeWidth="0.5" />
      <text x={82} y={dataBottom + 10} textAnchor="middle" dominantBaseline="middle"
        fontSize="4.5" fontWeight="700"
        fontFamily="Georgia, 'Times New Roman', serif"
        letterSpacing="0.3" fill="#1a1208"
      >
        TOOL PROFICIENCIES &amp; CUSTOM SKILLS
      </text>
    </svg>
  );
}
