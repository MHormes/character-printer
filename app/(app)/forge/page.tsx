"use client"

import { useState, useEffect } from "react"
import { useCharacterStore } from "@/lib/store/character-store"
import { createDefaultCharacter } from "@/lib/character/defaults"
import { StringField } from "@/components/forge/string-field"
import { ClassesField } from "@/components/forge/classes-field"
import { StatBlock } from "@/components/forge/stat-block"
import { SaveBlock } from "@/components/forge/save-block"
import { SkillsBlock } from "@/components/forge/skills-block"
import { OtherProficienciesBlock } from "@/components/forge/other-proficiencies-block"
import { ChevronDown, ChevronRight, CircleDot, Circle, X, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { AttributeKey, ModifierEntry } from "@/lib/types/character"

const ATTRIBUTE_KEYS: AttributeKey[] = ["str", "dex", "con", "int", "wis", "cha"]
const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  str: "Strength",  dex: "Dexterity", con: "Constitution",
  int: "Intelligence", wis: "Wisdom", cha: "Charisma",
}
const SAVE_LABELS: Record<AttributeKey, string> = {
  str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA",
}

function resolvedAttrMod(attr: ReturnType<typeof useCharacterStore.getState>["character"] extends null ? never : ReturnType<typeof useCharacterStore.getState>["character"]["attributes"][AttributeKey], ) {
  const sum = attr.stack.filter((m) => m.isActive).reduce((s, m) => s + m.value, 0)
  const total = attr.override ?? (attr.base + sum)
  return Math.floor((total - 10) / 2)
}

export default function ForgePage() {
  const [globalSaveExpanded, setGlobalSaveExpanded] = useState(false)

  const setCharacter = useCharacterStore((s) => s.setCharacter)
  const character = useCharacterStore((s) => s.character)
  const updateIdentityField = useCharacterStore((s) => s.updateIdentityField)
  const updateAttributeBase = useCharacterStore((s) => s.updateAttributeBase)
  const setAttributeStack = useCharacterStore((s) => s.setAttributeStack)
  const setAttributeOverride = useCharacterStore((s) => s.setAttributeOverride)
  const setSaveProficiency = useCharacterStore((s) => s.setSaveProficiency)
  const setSaveStack = useCharacterStore((s) => s.setSaveStack)
  const setSaveOverride = useCharacterStore((s) => s.setSaveOverride)
  const setGlobalSaveStack = useCharacterStore((s) => s.setGlobalSaveStack)
  const setSkillState = useCharacterStore((s) => s.setSkillState)
  const setSkillOverride = useCharacterStore((s) => s.setSkillOverride)
  const setClasses = useCharacterStore((s) => s.setClasses)
  const setOtherProficiencies = useCharacterStore((s) => s.setOtherProficiencies)
  const setGlobalSkillStack = useCharacterStore((s) => s.setGlobalSkillStack)
  const setJackOfAllTrades = useCharacterStore((s) => s.setJackOfAllTrades)

  useEffect(() => {
    setCharacter(createDefaultCharacter("stub"))
  }, [setCharacter])

  if (!character) return null

  const { identity, attributes, saves, saveGlobalStack, skills, skillGlobalStack, jackOfAllTrades, otherProficiencies } = character
  const pb = Math.ceil(identity.level / 4) + 1

  return (
    <main className="space-y-10 p-6">
      <h1 className="text-lg font-semibold">Forge</h1>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Identity</h2>
        <div className="grid grid-cols-4 gap-4">
          <StringField label="Name" value={identity.name}
            onChange={(v) => updateIdentityField("name", v)} placeholder="Character name" className="col-span-2" />
          <StringField label="Alignment" value={identity.alignment}
            onChange={(v) => updateIdentityField("alignment", v)} placeholder="e.g. Neutral Good" />
          <StringField label="Deity" value={identity.deity}
            onChange={(v) => updateIdentityField("deity", v)} placeholder="e.g. Tyr" />
          <StringField label="Race" value={identity.race}
            onChange={(v) => updateIdentityField("race", v)} placeholder="e.g. Human" />
          <StringField label="Background" value={identity.background}
            onChange={(v) => updateIdentityField("background", v)} placeholder="e.g. Soldier" />
          <div className="col-span-2">
            <ClassesField classes={identity.classes} onChange={setClasses} proficiencyBonus={pb} />
          </div>
        </div>
      </section>

      <div className="flex gap-6">
        {/* Core stats + saves stacked */}
        <section className="w-1/4 space-y-6">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Core Stats</h2>
            <div className="grid grid-cols-3 gap-3">
              {ATTRIBUTE_KEYS.map((attr) => (
                <StatBlock
                  key={attr}
                  label={ATTRIBUTE_LABELS[attr]}
                  data={attributes[attr]}
                  onBaseChange={(v) => updateAttributeBase(attr, v)}
                  onStackChange={(stack: ModifierEntry[]) => setAttributeStack(attr, stack)}
                  onOverrideChange={(override) => setAttributeOverride(attr, override)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Saving Throws</h2>
            <div className="grid grid-cols-3 gap-3">
              {ATTRIBUTE_KEYS.map((attr) => (
                <SaveBlock
                  key={attr}
                  label={SAVE_LABELS[attr]}
                  data={saves[attr]}
                  attrMod={resolvedAttrMod(attributes[attr])}
                  proficiencyBonus={pb}
                  onProficiencyChange={(p) => setSaveProficiency(attr, p)}
                  onStackChange={(stack) => setSaveStack(attr, stack)}
                  onOverrideChange={(override) => setSaveOverride(attr, override)}
                />
              ))}
            </div>

            {/* Global save modifier */}
            <button
              type="button"
              onClick={() => setGlobalSaveExpanded((v) => !v)}
              className="flex h-5 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {globalSaveExpanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
              Global modifier
              {!globalSaveExpanded && saveGlobalStack.length > 0 && (
                <span className="ml-auto tabular-nums">
                  {saveGlobalStack.filter(m => m.isActive).reduce((s, m) => s + m.value, 0) >= 0
                    ? `+${saveGlobalStack.filter(m => m.isActive).reduce((s, m) => s + m.value, 0)}`
                    : saveGlobalStack.filter(m => m.isActive).reduce((s, m) => s + m.value, 0)}
                </span>
              )}
            </button>
            {globalSaveExpanded && (
              <div className="flex flex-col gap-1.5">
                {saveGlobalStack.map((mod) => (
                  <div key={mod.id} className="flex items-start gap-1">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <Input type="text" value={mod.source} placeholder="Source" className="h-6 text-xs"
                        onChange={(e) => setGlobalSaveStack(saveGlobalStack.map(m => m.id === mod.id ? { ...m, source: e.target.value } : m))} />
                      <div className="flex h-6 items-center rounded-md border border-input bg-background focus-within:border-ring">
                        <span className="select-none pl-2 text-xs text-muted-foreground">+</span>
                        <input type="text" inputMode="numeric"
                          value={mod.value === 0 ? "" : String(mod.value)} placeholder="0"
                          onChange={(e) => {
                            const raw = e.target.value
                            if (raw === "") { setGlobalSaveStack(saveGlobalStack.map(m => m.id === mod.id ? { ...m, value: 0 } : m)); return }
                            if (raw === "-") return
                            const n = parseInt(raw, 10)
                            if (!isNaN(n)) setGlobalSaveStack(saveGlobalStack.map(m => m.id === mod.id ? { ...m, value: n } : m))
                          }}
                          className="h-full min-w-0 flex-1 bg-transparent px-1.5 text-xs placeholder:text-foreground/30 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="mt-0.5 flex flex-col gap-0.5">
                      <button type="button" onClick={() => setGlobalSaveStack(saveGlobalStack.filter(m => m.id !== mod.id))}
                        className="flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                        <X className="size-2.5" />
                      </button>
                      <button type="button" onClick={() => setGlobalSaveStack(saveGlobalStack.map(m => m.id === mod.id ? { ...m, isActive: !m.isActive } : m))}
                        className="flex size-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground">
                        {mod.isActive ? <CircleDot className="size-2.5" /> : <Circle className="size-2.5" />}
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button"
                  onClick={() => setGlobalSaveStack([...saveGlobalStack, { id: crypto.randomUUID(), source: "", value: 0, isActive: true }])}
                  className="flex h-6 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
                  <Plus className="size-3" />
                  Add modifier
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Skills */}
        <section className="w-48 shrink-0 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Skills</h2>
          <SkillsBlock
            skills={skills}
            attributes={attributes}
            proficiencyBonus={pb}
            jackOfAllTrades={jackOfAllTrades}
            globalStack={skillGlobalStack}
            onStateChange={setSkillState}
            onOverrideChange={setSkillOverride}
            onJackOfAllTradesChange={setJackOfAllTrades}
            onGlobalStackChange={setGlobalSkillStack}
          />
        </section>

        {/* Other Proficiencies */}
        <section className="min-w-0 max-w-1/4 flex-1 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Other Proficiencies</h2>
          <OtherProficienciesBlock
            proficiencies={otherProficiencies}
            attributes={attributes}
            proficiencyBonus={pb}
            onChange={setOtherProficiencies}
          />
        </section>
      </div>
    </main>
  )
}
