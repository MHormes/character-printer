"use client";

import { useCharacterStore } from "@/lib/store/character-store";

export function FullPageFeaturesWidget() {
  const character = useCharacterStore((s) => s.character);
  if (!character) return null;

  return (
    <div className="h-full w-full overflow-y-auto p-6">
      <h2 className="mb-6 text-2xl font-bold">FEATURES & TRAITS</h2>
      <div className="grid grid-cols-3 gap-x-8 gap-y-4 text-xs leading-relaxed">
        {character.features.map((f) => (
          <div key={f.id} className="break-inside-avoid">
            <h3 className="font-bold">{f.name}</h3>
            <p className="italic text-muted-foreground">{f.source}</p>
            <p className="mt-1">{f.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
