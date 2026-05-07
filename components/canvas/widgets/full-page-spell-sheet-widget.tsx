"use client"

import { useCharacterStore } from "@/lib/store/character-store"
import { sumStack } from "@/lib/character/calculations"
import { SpellcastingInfoWidget } from "./spellcasting-info-widget"
import { SpellLevelBlock } from "./spell-level-widget"

export function FullPageSpellSheetWidget() {
  const character = useCharacterStore((s) => s.character)
  if (!character) return null

  const slots = character.spells.slots
  const spells = character.spells.list

  const levelsToShow = Array.from({ length: 10 }, (_, i) => i).filter((level) => {
    if (level === 0) return spells.some((s) => s.level === 0)
    const slot = slots[String(level)]
    const total = slot ? (slot.override ?? slot.base + sumStack(slot.stack)) : 0
    return total > 0 || spells.some((s) => s.level === level)
  })

  return (
    <div className="h-full w-full flex flex-col p-4">
      {/* Spellcasting info bar */}
      <div className="mb-4 shrink-0" style={{ height: "52px" }}>
        <SpellcastingInfoWidget />
      </div>

      {/* Spell levels in 3 columns: 0-2 | 3-5 | 6-9 */}
      <div className="flex-1 min-h-0 grid grid-cols-3 gap-4 overflow-hidden">
        {[
          levelsToShow.filter((l) => l <= 2),
          levelsToShow.filter((l) => l >= 3 && l <= 5),
          levelsToShow.filter((l) => l >= 6),
        ].map((group, i) => (
          <div key={i} className="flex flex-col gap-2">
            {group.map((level) => (
              <SpellLevelBlock key={level} level={level} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
