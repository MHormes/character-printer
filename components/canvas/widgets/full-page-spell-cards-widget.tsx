"use client"

import { useCharacterStore } from "@/lib/store/character-store"
import { SpellCardSvg } from "./spell-card-widget"

export function FullPageSpellCardWidget() {
  const character = useCharacterStore((s) => s.character)
  if (!character) return null

  const spells = character.spells.list
  if (spells.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground italic">No spells in list</p>
      </div>
    )
  }

  return (
    <div className="h-full w-full overflow-y-auto p-4 print:h-auto print:overflow-visible">
      <div className="grid grid-cols-4 gap-3">
        {spells.map((spell) => (
          <SpellCardSvg key={spell.id} spell={spell} />
        ))}
      </div>
    </div>
  )
}
