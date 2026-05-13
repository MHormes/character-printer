"use client"

import { TextField } from "./text-field"
import type { Bio, CharacterData } from "@/lib/types/character"

type BioBlockProps = {
  bio: Bio
  identity: CharacterData["identity"]
  onBioChange: (field: keyof Bio, value: string) => void
  onIdentityChange: (field: keyof CharacterData["identity"], value: string) => void
}

export function BioBlock({ bio, identity, onBioChange, onIdentityChange }: BioBlockProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
        <TextField
          label="Age"
          value={identity.age}
          onChange={(v) => onIdentityChange("age", v)}
          placeholder="e.g. 25"
        />
        <TextField
          label="Gender"
          value={identity.gender}
          onChange={(v) => onIdentityChange("gender", v)}
          placeholder="e.g. Male"
        />
        <TextField
          label="Height"
          value={identity.height}
          onChange={(v) => onIdentityChange("height", v)}
          placeholder="e.g. 5'10&quot;"
        />
        <TextField
          label="Weight"
          value={identity.weight}
          onChange={(v) => onIdentityChange("weight", v)}
          placeholder="e.g. 160 lbs"
        />
        <TextField
          label="Eyes"
          value={identity.eyes}
          onChange={(v) => onIdentityChange("eyes", v)}
          placeholder="e.g. Blue"
        />
        <TextField
          label="Hair"
          value={identity.hair}
          onChange={(v) => onIdentityChange("hair", v)}
          placeholder="e.g. Brown"
        />
        <TextField
          label="Skin"
          value={identity.skin}
          onChange={(v) => onIdentityChange("skin", v)}
          placeholder="e.g. Tanned"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField
          label="Appearance"
          value={bio.appearance}
          onChange={(v) => onBioChange("appearance", v)}
          multiline
          placeholder="Physical description..."
        />
        <TextField
          label="Backstory"
          value={bio.backstory}
          onChange={(v) => onBioChange("backstory", v)}
          multiline
          placeholder="Your character's history..."
        />
        <TextField
          label="Allies & Organizations"
          value={bio.allies}
          onChange={(v) => onBioChange("allies", v)}
          multiline
          placeholder="Important people or groups..."
        />
        <TextField
          label="Additional Notes"
          value={bio.organizations}
          onChange={(v) => onBioChange("organizations", v)}
          multiline
          placeholder="Other details..."
        />
      </div>
    </div>
  )
}
