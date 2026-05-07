"use client";

import { useCharacterStore } from "@/lib/store/character-store";

export function FullPageSpellsWidget() {
  const character = useCharacterStore((s) => s.character);
  if (!character) return null;

  return (
    <div className="h-full w-full overflow-y-auto p-6">
      <h2 className="mb-6 text-2xl font-bold">SPELLBOOK</h2>
      <div className="grid grid-cols-3 gap-x-8 gap-y-4 text-xs leading-relaxed">
        {character.spells.list.map((s) => (
          <div key={s.id} className="break-inside-avoid">
            <h3 className="font-bold">{s.name}</h3>
            <p className="text-muted-foreground italic">
              {s.level === 0 ? "Cantrip" : `Level ${s.level}`} | {s.school}
            </p>
            <p className="mt-1">{s.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
