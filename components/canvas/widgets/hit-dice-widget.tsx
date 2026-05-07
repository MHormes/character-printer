"use client";

import { useCharacterStore } from "@/lib/store/character-store";
import { DndFrame } from "./dnd-frame";

// viewBox 90×90 — matches w=4, h=4 grid cells (square, same as CurrentHpWidget)
export function HitDiceWidget() {
  const character = useCharacterStore((s) => s.character);
  if (!character) return null;

  const { identity } = character;
  const totalLevel = identity.level;
  const uniqueDice = [
    ...new Set(identity.classes.map((c) => c.hitDie.toUpperCase())),
  ];
  const diceLabel = `HIT DICE (${uniqueDice.join(" + ")})`;

  const ff = "Georgia, 'Times New Roman', serif";

  return (
    <svg
      viewBox="0 0 90 90"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "100%" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <DndFrame x={3} y={3} w={84} h={84} cornerOff={9} />

      {/* Total label + value top-right */}
      <text
        x="7"
        y="12"
        dominantBaseline="middle"
        fontSize="6"
        fontStyle="italic"
        fontFamily={ff}
        fill="#6a5a48"
      >
        Total
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
        {totalLevel}
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
        {diceLabel}
      </text>
    </svg>
  );
}
