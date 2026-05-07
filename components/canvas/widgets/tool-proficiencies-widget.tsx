"use client";

import { useCharacterStore } from "@/lib/store/character-store";
import { DndFrame } from "./dnd-frame";

// ViewBox 164×80 — matches w=10, h=5 grid cell aspect ratio (~2.05)
const C1    = 90   // end of TOOL column
const C2    = 115  // end of PRO column
const RIGHT = 161  // frame inner right edge (164-3)

const HEADER_Y = 17
const DATA_Y   = 17
const DATA_H   = 40
const DIV_Y    = 57
const LABEL_Y  = 67

const ROW_H = 14

const NC1 = C1 - 3   // 87
const NC2 = C2 - 3   // 112
const NW  = RIGHT - 3 // 158

function profLabel(training: "Proficient" | "Expertise") {
  return training === "Expertise" ? "E" : "P";
}

export function ToolProficienciesWidget() {
  const character = useCharacterStore((s) => s.character);
  if (!character) return null;

  const rows = character.otherProficiencies.filter((p) => p.category === "Tool");

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
      viewBox="0 0 164 80"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "100%" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <DndFrame x={3} y={3} w={158} h={74} cornerOff={10} />

      {/* Column dividers */}
      <line x1={C1} y1={3}  x2={C1} y2={DIV_Y} stroke="#1a1208" strokeWidth="0.5" />
      <line x1={C2} y1={3}  x2={C2} y2={DIV_Y} stroke="#1a1208" strokeWidth="0.5" />

      {/* Header row */}
      <text x={(3 + C1) / 2}   y={12} textAnchor="middle" dominantBaseline="middle" {...tf}>TOOL</text>
      <text x={(C1 + C2) / 2}  y={12} textAnchor="middle" dominantBaseline="middle" {...tf}>PRO</text>
      <text x={(C2 + RIGHT) / 2} y={12} textAnchor="middle" dominantBaseline="middle" {...tf}>ATTR</text>

      {/* Header divider */}
      <line x1={3} y1={HEADER_Y} x2={RIGHT} y2={HEADER_Y} stroke="#1a1208" strokeWidth="0.5" />

      {/* Data rows clipped via nested SVG */}
      <svg x={3} y={DATA_Y} width={NW} height={DATA_H} overflow="hidden">
        {rows.length === 0 && (
          <text x={4} y={ROW_H / 2} dominantBaseline="middle" fontSize="6" fontStyle="italic" {...df} fill="#6a5a48">—</text>
        )}
        {rows.map((row, i) => {
          const cy = ROW_H * i + ROW_H / 2;
          return (
            <g key={row.id}>
              <text x={4}              y={cy} textAnchor="start"  dominantBaseline="middle" fontSize="6.5" fontWeight="400" {...df}>{row.name}</text>
              <text x={(NC1 + NC2) / 2} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="7"   fontWeight="600" {...df}>{profLabel(row.training)}</text>
              <text x={NC2 + 2}        y={cy} textAnchor="start"  dominantBaseline="middle" fontSize="6.5" fontWeight="400" {...df}>{row.stat?.toUpperCase() ?? "—"}</text>
              <line x1={0} y1={ROW_H * (i + 1)} x2={NW} y2={ROW_H * (i + 1)} stroke="#1a1208" strokeWidth="0.3" opacity="0.5" />
            </g>
          );
        })}
      </svg>

      {/* Bottom divider + label */}
      <line x1={6} y1={DIV_Y} x2={RIGHT - 3} y2={DIV_Y} stroke="#1a1208" strokeWidth="0.5" />
      <text x={82} y={LABEL_Y} textAnchor="middle" dominantBaseline="middle"
        fontSize="4.5" fontWeight="700"
        fontFamily="Georgia, 'Times New Roman', serif"
        letterSpacing="0.3" fill="#1a1208"
      >
        TOOL PROFICIENCIES &amp; CUSTOM SKILLS
      </text>
    </svg>
  );
}
