"use client"

import { useCharacterStore } from "@/lib/store/character-store"
import type { AttributeKey } from "@/lib/types/character"
import { resolveSaveBonus } from "@/lib/character/calculations"
import { DndFrame } from "./dnd-frame"
import { ATTRIBUTE_KEYS } from "@/lib/character/defaults"

const SAVE_LABELS: Record<AttributeKey, string> = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
}

function fmt(v: number) { return v >= 0 ? `+${v}` : `${v}` }

// ViewBox 88×76. 6 rows + bottom label.
// Default canvas size: w=5, h=6 on 20-col A4 grid.
export function SavingThrowsWidget() {
  const character = useCharacterStore((s) => s.character)
  const ROW_H = 8.5
  const ROW_START = 12

  if (!character) return null

  return (
    <svg
      viewBox="0 0 88 76"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "100%" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <DndFrame x={2.5} y={3} w={83} h={70} cornerOff={10} />

      {/* Rows */}
      {ATTRIBUTE_KEYS.map((key, i) => {
        const cy = ROW_START + i * ROW_H
        const save = character.saves[key]
        const value = resolveSaveBonus(character, key)

        return (
          <g key={key}>
            {save.proficient
              ? <circle cx="12" cy={cy} r="3.0" fill="#1a1208" />
              : <circle cx="12" cy={cy} r="3.0" fill="none" stroke="#1a1208" strokeWidth="0.8" />
            }
            <text x="29" y={cy} textAnchor="end" dominantBaseline="middle"
              fontSize="7" fontWeight="600"
              fontFamily="Georgia, 'Times New Roman', serif" fill="#1a1208"
            >{fmt(value)}</text>
            <text x="32" y={cy} textAnchor="start" dominantBaseline="middle"
              fontSize="7" fontWeight="400"
              fontFamily="Georgia, 'Times New Roman', serif" fill="#1a1208"
            >{SAVE_LABELS[key]}</text>
          </g>
        )
      })}

      {/* Divider + bottom label */}
      <line x1="5.5" y1="63" x2="82.5" y2="63" stroke="#1a1208" strokeWidth="0.5" />
      <text x="44" y="68" textAnchor="middle" dominantBaseline="middle"
        fontSize="5.5" fontWeight="700"
        fontFamily="Georgia, 'Times New Roman', serif"
        letterSpacing="0.5" fill="#1a1208"
      >
        SAVING THROWS
      </text>
    </svg>
  )
}
