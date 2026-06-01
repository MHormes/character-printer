"use client"

import { useCharacterStore } from "@/lib/store/character-store"
import type { TrackerEntry } from "@/lib/types/character"
import { TrackerCard, CARD_W, CARD_H, MARGIN } from "./tracker-widget"

const PLACEHOLDER: TrackerEntry = {
  id: "placeholder",
  name: "Tracker",
  base: 0,
  stack: [],
  reset: "Long Rest",
  override: null,
  valueLabel: "—",
}

const SVG_W = MARGIN * 2 + CARD_W
const SVG_H = MARGIN * 2 + CARD_H

export function SingleTrackerWidget({ trackerId }: { trackerId?: string }) {
  const character = useCharacterStore((s) => s.character)
  if (!character) return null
  const tracker = character.trackers.find((t) => t.id === trackerId) ?? PLACEHOLDER

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      <TrackerCard t={tracker} ox={MARGIN} oy={MARGIN} character={character} />
    </svg>
  )
}
