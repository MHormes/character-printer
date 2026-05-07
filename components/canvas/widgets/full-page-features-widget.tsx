"use client";

import { useCharacterStore } from "@/lib/store/character-store";

export function FullPageFeaturesWidget() {
  const character = useCharacterStore((s) => s.character);
  if (!character) return null;

  return (
    <div className="h-full w-full overflow-y-auto p-4 print:h-auto print:overflow-visible">
      <h2 className="mb-3 text-base font-bold tracking-wide text-center ">
        FEATURES & TRAITS
      </h2>
      <div className="columns-3 gap-5 text-xs leading-snug">
        {character.features.map((f) => (
          <div key={f.id} className="break-inside-avoid mb-2.5">
            <h3 className="font-bold">{f.name}</h3>
            <p className="mt-0.5">{f.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
