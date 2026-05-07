"use client"

import { useCharacterStore } from "@/lib/store/character-store"
import type { AttributeKey, AttributeData } from "@/lib/types/character"
import { DndFrame } from "./dnd-frame"

const ATTRIBUTE_KEYS: AttributeKey[] = [
  "str",
  "dex",
  "con",
  "int",
  "wis",
  "cha",
]

const SAVE_LABELS: Record<AttributeKey, string> = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
}

function calculateAttrMod(attr: AttributeData) {
  const sum = attr.stack
    .filter((m) => m.isActive)
    .reduce((s, m) => s + m.value, 0)
  const total = attr.override ?? attr.base + sum
  return Math.floor((total - 10) / 2)
}

function fmt(v: number) { return v >= 0 ? `+${v}` : `${v}` }

// ViewBox 88×76. 6 rows + bottom label.
// Default canvas size: w=5, h=6 on 20-col A4 grid.
export function SavingThrowsWidget() {
  const character = useCharacterStore((s) => s.character)
  const ROW_H = 8.5
  const ROW_START = 12

  if (!character) return null

  const pb = Math.ceil(character.identity.level / 4) + 1
  const globalMod = character.saveGlobalStack
    .filter((m) => m.isActive)
    .reduce((s, m) => s + m.value, 0)

  return (
    <svg
      viewBox="0 0 88 76"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "100%" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <DndFrame x={3} y={3} w={82} h={70} cornerOff={10} />

      {/* Rows */}
      {ATTRIBUTE_KEYS.map((key, i) => {
        const cy = ROW_START + i * ROW_H
        const save = character.saves[key]
        const attrMod = calculateAttrMod(character.attributes[key])
        
        let value = 0
        if (save.override !== null) {
          value = save.override
        } else {
          const stackSum = save.stack
            .filter((m) => m.isActive)
            .reduce((s, m) => s + m.value, 0)
          value = attrMod + stackSum + globalMod + (save.proficient ? pb : 0)
        }

        return (
          <g key={key}>
            {save.proficient
              ? <circle cx="10" cy={cy} r="2.5" fill="#1a1208" />
              : <circle cx="10" cy={cy} r="2.5" fill="none" stroke="#1a1208" strokeWidth="0.8" />
            }
            <text x="27" y={cy} textAnchor="end" dominantBaseline="middle"
              fontSize="7" fontWeight="600"
              fontFamily="Georgia, 'Times New Roman', serif" fill="#1a1208"
            >{fmt(value)}</text>
            <text x="30" y={cy} textAnchor="start" dominantBaseline="middle"
              fontSize="7" fontWeight="400"
              fontFamily="Georgia, 'Times New Roman', serif" fill="#1a1208"
            >{SAVE_LABELS[key]}</text>
          </g>
        )
      })}

      {/* Divider + bottom label */}
      <line x1="6" y1="63" x2="82" y2="63" stroke="#1a1208" strokeWidth="0.5" />
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
