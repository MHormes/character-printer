"use client"

import { TextField } from "./text-field"
import { Select } from "@/components/ui/select"
import { CharacterImageField } from "./character-image-field"
import type { Bio, CharacterData } from "@/lib/types/character"

type BioBlockProps = {
  characterId: string
  bio: Bio
  identity: CharacterData["identity"]
  portraitImage: CharacterData["portraitImage"]
  onBioChange: (field: keyof Bio, value: string) => void
  onIdentityChange: (field: keyof CharacterData["identity"], value: string) => void
  onPortraitImageChange: (image: CharacterData["portraitImage"]) => void
}

export function BioBlock({
  characterId,
  bio,
  identity,
  portraitImage,
  onBioChange,
  onIdentityChange,
  onPortraitImageChange,
}: BioBlockProps) {
  return (
    <div className="space-y-6">
      <CharacterImageField
        characterId={characterId}
        image={portraitImage}
        onChange={onPortraitImageChange}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
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
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Size
          </label>
          <Select
            className="w-full"
            value={identity.size ?? ""}
            onChange={(e) => onIdentityChange("size", e.target.value)}
          >
            <option value="">—</option>
            <option value="Tiny">Tiny</option>
            <option value="Small">Small</option>
            <option value="Medium">Medium</option>
            <option value="Large">Large</option>
            <option value="Huge">Huge</option>
            <option value="Gargantuan">Gargantuan</option>
          </Select>
        </div>
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
