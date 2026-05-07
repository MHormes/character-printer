"use client";

import { useCharacterStore } from "@/lib/store/character-store";

export function CharacterNameWidget() {
  const character = useCharacterStore((s) => s.character);
  if (!character) return null;

  const name = character.identity.name || "—";
  const ff = "Georgia, 'Times New Roman', serif";
  const ink = "#1a1208";
  const gold = "#c8920a";

  return (
    <svg
      viewBox="0 0 15 3"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "100%" }}
      preserveAspectRatio="none"
    >
      {/* main white body */}
      <rect
        x="0.1"
        y="0.1"
        width="14.8"
        height="2.8"
        rx="0.1"
        fill="white"
        stroke={ink}
        strokeWidth="0.1"
      />

      {/* character name */}
      <text
        x="7.5"
        y="1.5"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="1.2"
        fontWeight="600"
        fontFamily={ff}
        fill={ink}
      >
        {name}
      </text>
    </svg>
  );
}
