"use client";

import { useCharacterStore } from "@/lib/store/character-store";
import { DndFrame } from "./dnd-frame";

// ViewBox 120×28. Horizontal banner with bonus number in a box on left.
// Default canvas size: w=8, h=2 on 20-col A4 grid.
export function ProficiencyWidget() {
  const character = useCharacterStore((s) => s.character);

  if (!character) return null;

  const pb = Math.ceil(character.identity.level / 4) + 1;

  return (
    <svg
      viewBox="0 0 120 28"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "100%" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <DndFrame x={4} y={3} w={112} h={22} cornerOff={9} />

      {/* Proficiency bonus number box */}
      <rect
        x="8"
        y="5"
        width="18"
        height="18"
        rx="2"
        fill="white"
        stroke="#1a1208"
        strokeWidth="1"
      />
      <text
        x="17"
        y="14"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="10"
        fontWeight="700"
        fontFamily="Georgia, 'Times New Roman', serif"
        fill="#1a1208"
      >
        {pb}
      </text>

      <text
        x="71"
        y="14"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="5"
        fontWeight="700"
        fontFamily="Georgia, 'Times New Roman', serif"
        letterSpacing="0.5"
        fill="#1a1208"
      >
        PROFICIENCY BONUS
      </text>
    </svg>
  );
}
