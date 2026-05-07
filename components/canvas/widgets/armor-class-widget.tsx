"use client"

import { useCharacterStore } from "@/lib/store/character-store"
import { resolveAc } from "@/lib/character/calculations"

// viewBox 85×100 — matches w=5, h=6 palette cell (aspect ~0.85)
export function ArmorClassWidget() {
  const character = useCharacterStore((s) => s.character)
  if (!character) return null

  const ac = resolveAc(character)

  const ff = "Georgia, 'Times New Roman', serif"
  // Heater-shield outer and inner paths
  const so = "M 8 28 Q 8 7, 42.5 7 Q 77 7, 77 28 L 77 56 Q 66 79, 42.5 85 Q 19 79, 8 56 Z"
  const si = "M 13 30 Q 13 13, 42.5 13 Q 72 13, 72 30 L 72 54 Q 62 74, 42.5 79 Q 23 74, 13 54 Z"

  return (
    <svg
      viewBox="0 0 85 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "100%" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <path d={so} fill="#f5f0e8" stroke="#1a1208" strokeWidth="1.5" />
      <path d={si} fill="none" stroke="#1a1208" strokeWidth="0.7" />
      <text x="42.5" y="48" textAnchor="middle" dominantBaseline="middle"
        fontSize="26" fontWeight="700" fontFamily={ff} fill="#1a1208"
      >{ac}</text>
      <line x1="10" y1="88" x2="75" y2="88" stroke="#1a1208" strokeWidth="0.5" />
      <text x="42.5" y="94" textAnchor="middle" dominantBaseline="middle"
        fontSize="5.5" fontWeight="700" fontFamily={ff} letterSpacing="0.3" fill="#1a1208"
      >ARMOR CLASS</text>
    </svg>
  )
}
