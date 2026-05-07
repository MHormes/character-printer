"use client"

import { useCharacterStore } from "@/lib/store/character-store"
import { resolveInitiative, resolveAttributeScore } from "@/lib/character/calculations"
import { DndFrame } from "./dnd-frame"

// viewBox 130×101 — matches w=5, h=4 palette cell (aspect ~1.28)
export function InitiativeWidget() {
  const character = useCharacterStore((s) => s.character)
  if (!character) return null

  const initValue = resolveInitiative(character)
  const dexScore = resolveAttributeScore(character.attributes.dex)

  // Tiebreaker is always added if it's a whole number, unless it's already a float
  const displayValue = Number.isInteger(initValue)
    ? `${initValue >= 0 ? "+" : ""}${initValue}.${dexScore}`
    : `${initValue >= 0 ? "+" : ""}${initValue}`

  const ff = "Georgia, 'Times New Roman', serif"

  return (
    <svg
      viewBox="0 0 130 101"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "100%" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <DndFrame x={3} y={3} w={124} h={95} cornerOff={9} />
      <text x="65" y="44" textAnchor="middle" dominantBaseline="middle"
        fontSize="28" fontWeight="700" fontFamily={ff} fill="#1a1208"
      >{displayValue}</text>
      <line x1="8" y1="74" x2="122" y2="74" stroke="#1a1208" strokeWidth="0.5" />
      <text x="65" y="86" textAnchor="middle" dominantBaseline="middle"
        fontSize="5.5" fontWeight="700" fontFamily={ff} letterSpacing="0.3" fill="#1a1208"
      >INITIATIVE</text>
    </svg>
  )
}
