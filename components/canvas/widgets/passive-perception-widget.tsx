"use client";

import { useCharacterStore } from "@/lib/store/character-store";
import { resolvePassivePerception } from "@/lib/character/calculations";
import { DndFrame } from "./dnd-frame";

// ViewBox 138×30 — aspect 4.6 matches widget 9×2 on A4 (≈4.61), so no letterboxing.
// Frame padding is minimal (1.5px) to maximise usable space as requested.
// Default canvas size: w=9, h=2 on 20-col A4 grid.
export function PassivePerceptionWidget() {
  const character = useCharacterStore((s) => s.character);

  if (!character) return null;

  const passivePerception = resolvePassivePerception(character);

  // Text center = midpoint of space after circle (right edge ~x22) to frame right (x134.5)
  const textCX = (22 + 134.5) / 2; // ≈ 78

  return (
    <svg
      viewBox="0 0 138 30"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "100%" }}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Frame: 1.5px margin on all sides — as tight as the corner arcs allow */}
      <DndFrame x={1.5} y={1.5} w={135} h={27} cornerOff={8} />

      {/* Value circle — tucked into left margin */}
      <circle
        cx="14"
        cy="15"
        r="8"
        fill="white"
        stroke="#1a1208"
        strokeWidth="1.2"
      />
      <text
        x="14"
        y="15"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="9"
        fontWeight="700"
        fontFamily="Georgia, 'Times New Roman', serif"
        fill="#1a1208"
      >
        {passivePerception}
      </text>

      {/* Label — centred in the space right of the circle */}
      <text
        x={textCX}
        y="15"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="5"
        fontWeight="700"
        fontFamily="Georgia, 'Times New Roman', serif"
        letterSpacing="0.2"
        fill="#1a1208"
      >
        PASSIVE WISDOM (PERCEPTION)
      </text>
    </svg>
  );
}
