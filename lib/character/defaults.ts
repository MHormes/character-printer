import type { CharacterData, AttributeKey, AttributeData, SaveData } from "@/lib/types/character"

const ATTRIBUTE_KEYS: AttributeKey[] = ["str", "dex", "con", "int", "wis", "cha"]

const DEFAULT_SKILLS: Record<string, { state: "None"; stack: []; override: null }> = {
  acrobatics:     { state: "None", stack: [], override: null },
  animalHandling: { state: "None", stack: [], override: null },
  arcana:         { state: "None", stack: [], override: null },
  athletics:      { state: "None", stack: [], override: null },
  deception:      { state: "None", stack: [], override: null },
  history:        { state: "None", stack: [], override: null },
  insight:        { state: "None", stack: [], override: null },
  intimidation:   { state: "None", stack: [], override: null },
  investigation:  { state: "None", stack: [], override: null },
  medicine:       { state: "None", stack: [], override: null },
  nature:         { state: "None", stack: [], override: null },
  perception:     { state: "None", stack: [], override: null },
  performance:    { state: "None", stack: [], override: null },
  persuasion:     { state: "None", stack: [], override: null },
  religion:       { state: "None", stack: [], override: null },
  sleightOfHand:  { state: "None", stack: [], override: null },
  stealth:        { state: "None", stack: [], override: null },
  survival:       { state: "None", stack: [], override: null },
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
    profBonusStack: [],
    identity: {
      name: "",
      race: "",
      classLabels: "",
      background: "",
      alignment: "",
      deity: "",
      age: "",
      gender: "",
      height: "",
      weight: "",
      eyes: "",
      hair: "",
      skin: "",
      level: 1,
      classes: [{ name: "", level: 1, hitDie: "d8" }],
    },
    attributes: Object.fromEntries(
      ATTRIBUTE_KEYS.map((k): [AttributeKey, AttributeData] => [k, { base: 10, stack: [], override: null }])
    ) as CharacterData["attributes"],
    saves: Object.fromEntries(
      ATTRIBUTE_KEYS.map((k): [AttributeKey, SaveData] => [k, { proficient: false, stack: [], override: null }])
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
        stack: [],
        override: null,
      },
      initiative: { stack: [], override: null },
      speed: { base: 30, stack: [], override: null },
      hp: {
        max: null,
        stack: [],
      },
    },
    inventory: [],
    actions: [],
    features: [],
    trackers: [],
    spells: {
      globalCastingStat: null,
      attackStack: [],
      dcStack: [],
      slots: SPELL_SLOTS,
      list: [],
    },
    canvas: {
      pages: [{ id: `${id}-page-1`, widgets: [] }],
    },
  }
}
