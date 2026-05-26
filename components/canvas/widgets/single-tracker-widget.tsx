"use client"

import { useCharacterStore } from "@/lib/store/character-store"
import { sumStack, resolveTrackerBase, resolvePb } from "@/lib/character/calculations"
import type { TrackerEntry, CharacterData } from "@/lib/types/character"
import { DndFrame } from "./dnd-frame"

const RESET_BADGE: Record<TrackerEntry["reset"], string> = {
  "Short Rest": "S",
  "Long Rest": "L",
  Dawn: "D",
  Special: "C",
}

const PLACEHOLDER: TrackerEntry = {
  id: "placeholder",
  name: "Tracker",
  base: 0,
  stack: [],
  reset: "Long Rest",
  override: null,
  valueLabel: "—",
}

function resolveDisplay(t: TrackerEntry, character: CharacterData): string {
  if (t.valueLabel) return t.valueLabel
  if (t.override !== null) return String(t.override)
  const pb = resolvePb(character)
  const base = resolveTrackerBase(t, character.attributes, character.identity.level, pb)
  return String(base + sumStack(t.stack))
}

export function SingleTrackerWidget({ trackerId }: { trackerId?: string }) {
  const character = useCharacterStore((s) => s.character)
  const tracker = character?.trackers.find((t) => t.id === trackerId) ?? PLACEHOLDER
  const ff = "Georgia, 'Times New Roman', serif"
  const value = character ? resolveDisplay(tracker, character) : (tracker.valueLabel ?? "—")
  const resetLetter = RESET_BADGE[tracker.reset]

  return (
    <svg
      viewBox="0 0 86 96"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "100%" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <DndFrame x={3} y={3} w={80} h={90} cornerOff={8} />

      {/* Reset badge */}
      <circle cx={13} cy={13} r={4.5} fill="#1a1208" />
      <text
        x={13} y={13}
        textAnchor="middle" dominantBaseline="middle"
        fontSize="4.5" fontWeight="700" fontFamily={ff} fill="#ffffff"
      >
        {resetLetter}
      </text>

      {/* "Total:" label */}
      <text
        x={38} y={13}
        dominantBaseline="middle"
        fontSize="5" fontStyle="italic" fontFamily={ff} fill="#6a5a48"
      >
        Total:
      </text>

      {/* Value */}
      <text
        x={73} y={13}
        textAnchor="end" dominantBaseline="middle"
        fontSize="11" fontWeight="700" fontFamily={ff} fill="#1a1208"
      >
        {value}
      </text>

      {/* Divider */}
      <line x1={6} y1={78} x2={80} y2={78} stroke="#1a1208" strokeWidth="0.5" />

      {/* Name */}
      <text
        x={43} y={86}
        textAnchor="middle" dominantBaseline="middle"
        fontSize="5" fontWeight="700" fontFamily={ff} letterSpacing="0.3" fill="#1a1208"
      >
        {tracker.name.toUpperCase()}
      </text>
    </svg>
  )
}
