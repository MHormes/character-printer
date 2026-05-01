import type { CharacterData, AttributeKey } from "@/lib/types/character"

const ATTRIBUTE_KEYS: AttributeKey[] = ["str", "dex", "con", "int", "wis", "cha"]

const DEFAULT_SKILLS: Record<string, { state: "None"; override: null }> = {
  acrobatics:     { state: "None", override: null },
  animalHandling: { state: "None", override: null },
  arcana:         { state: "None", override: null },
  athletics:      { state: "None", override: null },
  deception:      { state: "None", override: null },
  history:        { state: "None", override: null },
  insight:        { state: "None", override: null },
  intimidation:   { state: "None", override: null },
  investigation:  { state: "None", override: null },
  medicine:       { state: "None", override: null },
  nature:         { state: "None", override: null },
  perception:     { state: "None", override: null },
  performance:    { state: "None", override: null },
  persuasion:     { state: "None", override: null },
  religion:       { state: "None", override: null },
  sleightOfHand:  { state: "None", override: null },
  stealth:        { state: "None", override: null },
  survival:       { state: "None", override: null },
}

const SPELL_SLOTS = Object.fromEntries(
  Array.from({ length: 9 }, (_, i) => [
    String(i + 1),
    { base: 0, stack: [], override: null },
  ])
)

export function createDefaultCharacter(id: string): CharacterData {
  return {
    version: "1.0.0",
    identity: {
      name: "",
      race: "",
      classLabels: "",
      background: "",
      alignment: "",
      deity: "",
      level: 1,
      classes: [],
    },
    attributes: Object.fromEntries(
      ATTRIBUTE_KEYS.map((k) => [k, { base: 10, stack: [], override: null }])
    ) as CharacterData["attributes"],
    saves: Object.fromEntries(
      ATTRIBUTE_KEYS.map((k) => [k, { proficient: false, stack: [], override: null }])
    ) as CharacterData["saves"],
    skills: DEFAULT_SKILLS,
    saveGlobalStack: [],
    skillGlobalStack: [],
    jackOfAllTrades: false,
    otherProficiencies: [],
    combat: {
      ac: {
        mode: "Standard",
        base: 10,
        statA: null,
        statB: null,
        override: null,
      },
      initiative: { stack: [], override: null },
      speed: { base: 30, stack: [], override: null },
      hp: {
        max: 0,
        misc: 0,
        hitDice: [],
      },
    },
    inventory: [],
    actions: [],
    features: [],
    trackers: [],
    spells: {
      globalCastingStat: null,
      slots: SPELL_SLOTS,
      list: [],
    },
    canvas: {
      pages: [{ id: `${id}-page-1`, widgets: [] }],
    },
  }
}
