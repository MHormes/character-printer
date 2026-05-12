"use client"

import { useCharacterStore } from "@/lib/store/character-store"
import { resolveSpeed } from "@/lib/character/calculations"
import { DndFrame } from "./dnd-frame"

// viewBox 130×101 — matches w=3, h=4 palette cell (aspect ~1.28)
export function SpeedWidget() {
  const character = useCharacterStore((s) => s.character)
  if (!character) return null

  const speed = resolveSpeed(character)

  const ff = "Georgia, 'Times New Roman', serif"

  return (
    <svg
      viewBox="0 0 130 172"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "100%" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <DndFrame x={2} y={2} w={126} h={168} cornerOff={10} />
      <text x="65" y="76" textAnchor="middle" dominantBaseline="middle"
        fontSize="36" fontWeight="700" fontFamily={ff} fill="#1a1208"
      >{speed}</text>
      <line x1="8" y1="128" x2="122" y2="128" stroke="#1a1208" strokeWidth="0.5" />
      <text x="65" y="149" textAnchor="middle" dominantBaseline="middle"
        fontSize="7" fontWeight="700" fontFamily={ff} letterSpacing="0.5" fill="#1a1208"
      >SPEED</text>
    </svg>
  )
}
