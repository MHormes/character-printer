"use client"

import { TextField } from "./text-field"
import type { Characteristics } from "@/lib/types/character"

type CharacteristicsBlockProps = {
  data: Characteristics
  onChange: (field: keyof Characteristics, value: string) => void
}

export function CharacteristicsBlock({ data, onChange }: CharacteristicsBlockProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <TextField
        label="Personality Traits"
        value={data.personalityTraits}
        onChange={(v) => onChange("personalityTraits", v)}
        multiline
        placeholder="Traits that define your character..."
      />
      <TextField
        label="Ideals"
        value={data.ideals}
        onChange={(v) => onChange("ideals", v)}
        multiline
        placeholder="What your character believes in..."
      />
      <TextField
        label="Bonds"
        value={data.bonds}
        onChange={(v) => onChange("bonds", v)}
        multiline
        placeholder="People, places, or items your character is tied to..."
      />
      <TextField
        label="Flaws"
        value={data.flaws}
        onChange={(v) => onChange("flaws", v)}
        multiline
        placeholder="Weaknesses or fears..."
      />
    </div>
  )
}
