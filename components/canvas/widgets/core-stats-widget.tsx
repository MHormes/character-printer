"use client";

import { useCharacterStore } from "@/lib/store/character-store";
import type { AttributeKey } from "@/lib/types/character";
import { resolveAttributeScore, resolveAttributeMod } from "@/lib/character/calculations";

const ATTRIBUTE_KEYS: AttributeKey[] = [
  "str",
  "dex",
  "con",
  "int",
  "wis",
  "cha",
];

const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  str: "STRENGTH",
  dex: "DEXTERITY",
  con: "CONSTITUTION",
  int: "INTELLIGENCE",
  wis: "WISDOM",
  cha: "CHARISMA",
};

function formatMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

// ViewBox 60×56 per block. Oval (cy=44, ry=7.5) is centered at the rect
// bottom so it overlaps half-inside / half-outside — the classic D&D look.
// 6 blocks stacked → total ratio 60:336 → h ≈ 5.6 × w → default w=3, h=17.
function StatSvg({
  name,
  modifier,
  score,
}: {
  name: string;
  modifier: number;
  score: number;
}) {
  return (
    <svg
      viewBox="0 0 60 56"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "100%" }}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Main white fill rectangle — y=3 to y=44 */}
      <rect
        x="5"
        y="3"
        width="50"
        height="41"
        rx="2"
        fill="white"
        stroke="#1a1208"
        strokeWidth="1.5"
      />
      {/* Inner border */}
      <rect
        x="7.5"
        y="5.5"
        width="45"
        height="36"
        rx="1.5"
        fill="none"
        stroke="#1a1208"
        strokeWidth="0.5"
      />

      {/* Corner flourishes */}
      <path
        d="M5,13 Q3,3 16,3"
        stroke="#1a1208"
        strokeWidth="1.1"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M55,13 Q57,3 44,3"
        stroke="#1a1208"
        strokeWidth="1.1"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M5,38 Q3,44 16,44"
        stroke="#1a1208"
        strokeWidth="1.1"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M55,38 Q57,44 44,44"
        stroke="#1a1208"
        strokeWidth="1.1"
        fill="none"
        strokeLinecap="round"
      />

      {/* Side flourishes at rect vertical midpoint (y≈23.5) */}
      <path
        d="M5,19.5 Q2,23.5 5,27.5"
        stroke="#1a1208"
        strokeWidth="0.9"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M55,19.5 Q58,23.5 55,27.5"
        stroke="#1a1208"
        strokeWidth="0.9"
        fill="none"
        strokeLinecap="round"
      />

      {/* Divider below stat name */}
      <line x1="9" y1="15" x2="51" y2="15" stroke="#1a1208" strokeWidth="0.6" />

      {/* Bottom oval — centered at rect bottom (cy=44), half inside half outside */}
      <ellipse
        cx="30"
        cy="44"
        rx="13"
        ry="7.5"
        fill="white"
        stroke="#1a1208"
        strokeWidth="1.5"
      />

      {/* Stat name — centered in y=3..15 region */}
      <text
        x="30"
        y="9"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="5"
        fontWeight="700"
        fontFamily="Georgia, 'Times New Roman', serif"
        letterSpacing="0.3"
        fill="#1a1208"
      >
        {name}
      </text>

      {/* Modifier — centered in y=15..36.5 region */}
      <text
        x="30"
        y="26"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="19"
        fontWeight="700"
        fontFamily="Georgia, 'Times New Roman', serif"
        fill="#1a1208"
      >
        {formatMod(modifier)}
      </text>

      {/* Base score — centered in oval */}
      <text
        x="30"
        y="44"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="9"
        fontWeight="600"
        fontFamily="Georgia, 'Times New Roman', serif"
        fill="#1a1208"
      >
        {score}
      </text>
    </svg>
  );
}

export function CoreStatsWidget() {
  const character = useCharacterStore((s) => s.character);

  if (!character) return null;

  return (
    <div className="w-full h-full flex flex-col">
      {ATTRIBUTE_KEYS.map((key) => {
        const total = resolveAttributeScore(character.attributes[key]);
        const mod = resolveAttributeMod(character.attributes[key]);
        return (
          <div key={key} className="flex-1 min-h-0">
            <StatSvg
              name={ATTRIBUTE_LABELS[key]}
              modifier={mod}
              score={total}
            />
          </div>
        );
      })}
    </div>
  );
}
