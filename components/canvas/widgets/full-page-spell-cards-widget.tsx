"use client"

import { useCharacterStore } from "@/lib/store/character-store"
import { SpellCardSvg } from "./spell-card-widget"

export function FullPageSpellCardWidget({ startIndex, count }: { startIndex?: number; count?: number }) {
  const character = useCharacterStore((s) => s.character)
  if (!character) return null

  const sorted = [...character.spells.list].sort((a, b) =>
    a.level !== b.level ? a.level - b.level : a.name.localeCompare(b.name)
  )
  const spells = startIndex !== undefined && count !== undefined
    ? sorted.slice(startIndex, startIndex + count)
    : sorted

  if (spells.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground italic">No spells in list</p>
      </div>
    )
  }

  return (
    <div className="h-full w-full overflow-hidden">
      <div className="grid grid-cols-4 gap-x-0 gap-y-3">
        {spells.map((spell) => (
          <div key={spell.id} className="break-inside-avoid">
            <SpellCardSvg spell={spell} />
          </div>
        ))}
      </div>
    </div>
  )
}
