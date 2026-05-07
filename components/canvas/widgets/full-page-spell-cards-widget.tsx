"use client";

import { useCharacterStore } from "@/lib/store/character-store";

export function FullPageSpellCardWidget() {
  const character = useCharacterStore((s) => s.character);
  if (!character) return null;

  return (
    <div className="h-full w-full overflow-y-auto p-4 print:h-auto print:overflow-visible">
      <h2 className="mb-3 text-base font-bold tracking-wide">SPELLBOOK</h2>
      <div className="columns-3 gap-5 text-xs leading-snug">
        {character.spells.list.map((s) => (
          <div key={s.id} className="break-inside-avoid mb-2.5">
            <h3 className="font-bold">{s.name}</h3>
            <p className="text-[10px] italic text-muted-foreground">
              {s.level === 0 ? "Cantrip" : `Level ${s.level}`} | {s.school}
            </p>
            <p className="mt-0.5">{s.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
