"use client";

import { useCharacterStore } from "@/lib/store/character-store";

const BIO_SECTIONS = [
  { key: "appearance",    label: "Appearance" },
  { key: "backstory",     label: "Backstory" },
  { key: "allies",        label: "Allies & Organizations" },
  { key: "organizations", label: "Organizations" },
] as const;

export function FullPageBioWidget() {
  const character = useCharacterStore((s) => s.character);
  if (!character) return null;

  const bio = character.bio as Record<string, string> | undefined;
  const filled = BIO_SECTIONS.filter((s) => bio?.[s.key]?.trim());

  return (
    <div className="h-full w-full overflow-y-auto p-4 print:h-auto print:overflow-visible">
      <h2 className="mb-3 text-base font-bold tracking-wide text-center">
        BIO
      </h2>
      <div className="columns-2 gap-5 text-xs leading-snug">
        {filled.map(({ key, label }) => (
          <div key={key} className="break-inside-avoid mb-3">
            <h3 className="font-bold uppercase tracking-wide text-[10px] mb-0.5">
              {label}
            </h3>
            <p className="whitespace-pre-wrap">{bio?.[key]}</p>
          </div>
        ))}
        {filled.length === 0 && (
          <p className="text-muted-foreground italic">No bio information added yet.</p>
        )}
      </div>
    </div>
  );
}
