"use client";

import { useCharacterStore } from "@/lib/store/character-store";
import { sumStack } from "@/lib/character/calculations";
import type { TrackerEntry } from "@/lib/types/character";
import { DndFrame } from "./dnd-frame";

const CARD_W = 80;
const CARD_H = 90;
const COL_GAP = 5;
const ROW_GAP = 5;
const MARGIN = 3;
const COLS = 2;
const SVG_W = MARGIN * 2 + COLS * CARD_W + (COLS - 1) * COL_GAP; // 171

export function trackerSvgH(n: number): number {
  const numRows = Math.max(1, Math.ceil(n / COLS));
  return MARGIN * 2 + numRows * CARD_H + (numRows - 1) * ROW_GAP;
}

function resolveDisplay(t: TrackerEntry): string {
  if (t.valueLabel) return t.valueLabel;
  if (t.override !== null) return String(t.override);
  return String(t.base + sumStack(t.stack));
}

function TrackerCard({
  t,
  ox,
  oy,
}: {
  t: TrackerEntry;
  ox: number;
  oy: number;
}) {
  const ff = "Georgia, 'Times New Roman', serif";
  const value = resolveDisplay(t);

  return (
    <g>
      <DndFrame x={ox} y={oy} w={CARD_W} h={CARD_H} cornerOff={8} />

      {/* "Total" label */}
      <text
        x={ox + 5}
        y={oy + 10}
        dominantBaseline="middle"
        fontSize="5"
        fontStyle="italic"
        fontFamily={ff}
        fill="#6a5a48"
      >
        Total
      </text>

      {/* Value */}
      <text
        x={ox + 70}
        y={oy + 10}
        textAnchor="end"
        dominantBaseline="middle"
        fontSize="11"
        fontWeight="700"
        fontFamily={ff}
        fill="#1a1208"
      >
        {value}
      </text>

      {/* Bottom divider + label */}
      <line
        x1={ox + 3}
        y1={oy + 75}
        x2={ox + 77}
        y2={oy + 75}
        stroke="#1a1208"
        strokeWidth="0.5"
      />
      <text
        x={ox + 40}
        y={oy + 83}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="5"
        fontWeight="700"
        fontFamily={ff}
        letterSpacing="0.3"
        fill="#1a1208"
      >
        {t.name.toUpperCase()}
      </text>
    </g>
  );
}

export function TrackerWidget() {
  const character = useCharacterStore((s) => s.character);
  if (!character) return null;

  const trackers = character.trackers;
  const svgH = trackerSvgH(trackers.length);
  const ff = "Georgia, 'Times New Roman', serif";

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${svgH}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      {trackers.length === 0 && (
        <text
          x={SVG_W / 2}
          y={svgH / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="6"
          fontStyle="italic"
          fontFamily={ff}
          fill="#6a5a48"
        >
          No trackers
        </text>
      )}
      {trackers.map((t, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const ox = MARGIN + col * (CARD_W + COL_GAP);
        const oy = MARGIN + row * (CARD_H + ROW_GAP);
        return <TrackerCard key={t.id} t={t} ox={ox} oy={oy} />;
      })}
    </svg>
  );
}
