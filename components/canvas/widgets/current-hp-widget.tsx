"use client";

import { useCharacterStore } from "@/lib/store/character-store";
import { resolveHpMax } from "@/lib/character/calculations";
import { DndFrame } from "./dnd-frame";

// viewBox 90×90 — matches w=4, h=4 grid cells (each cell ~10.5×10.2mm on A4)
export function CurrentHpWidget() {
  const character = useCharacterStore((s) => s.character);
  if (!character) return null;

  const hpMax = resolveHpMax(character);

  const ff = "Georgia, 'Times New Roman', serif";

  return (
    <svg
      viewBox="0 0 90 90"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "100%" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <DndFrame x={3} y={3} w={84} h={84} cornerOff={9} />

      {/* Hit Point Maximum label + value */}
      <text
        x="7"
        y="12"
        dominantBaseline="middle"
        fontSize="6"
        fontStyle="italic"
        fontFamily={ff}
        fill="#6a5a48"
      >
        Hit Point Maximum
      </text>
      <text
        x="80"
        y="12"
        textAnchor="end"
        dominantBaseline="middle"
        fontSize="9"
        fontWeight="500"
        fontFamily={ff}
        fill="#1a1208"
      >
        {hpMax}
      </text>

      {/* Bottom divider + label */}
      <line x1="6" y1="71" x2="84" y2="71" stroke="#1a1208" strokeWidth="0.5" />
      <text
        x="45"
        y="80"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="6"
        fontWeight="700"
        fontFamily={ff}
        letterSpacing="0.3"
        fill="#1a1208"
      >
        CURRENT HP
      </text>
    </svg>
  );
}
