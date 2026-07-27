// Root character data shape — mirrors the JSON schema in ideation.md

export type ModifierEntry = {
  id: string;
  source: string;
  value: number;
  valueSource?: TrackerBaseSource; // if set, value is materialized from this source at save time
  valueMultiplier?: number; // multiplied against resolved valueSource; default 1
  valueOffset?: number;     // added after multiplier; default 0
  isActive: boolean;
  sourceId?: string; // namespaced: "item:<uuid>", "race:<id>", "class:<id>", etc. — set means system-managed, read-only in UI
  type?: "Bonus" | "Set To"; // undefined = Bonus (backward compat)
};

export type AttributeKey = "str" | "dex" | "con" | "int" | "wis" | "cha";
export type SpellSlotProgression = "none" | "full" | "half";

export type AttributeData = {
  base: number;
  stack: ModifierEntry[];
  override: number | null;
};

export type SaveData = {
  proficient: boolean;
  stack: ModifierEntry[];
  override: number | null;
};

export type SkillState = "None" | "Proficient" | "Expertise";

export type SkillData = {
  state: SkillState;
  stack: ModifierEntry[];
  override: number | null;
};

export type DerivedValueData = {
  stack: ModifierEntry[];
  override: number | null;
};

export type OtherProficiency = {
  id: string;
  name: string;
  category: "Tool" | "Language" | "Vehicle" | "Weapon" | "Armor";
  training: "Proficient" | "Expertise";
  stat: AttributeKey | null;
  override: number | null;
  sourceId?: string; // "class:<classId>:prof" = system-managed, read-only in UI
};

export type AcMode = "Standard" | "Formula";

export type CombatData = {
  ac: {
    mode: AcMode;
    base: number;
    statA: AttributeKey | null;
    statB: AttributeKey | null;
    stack: ModifierEntry[];
    override: number | null;
    armorSourceId?: string | null;   // item.id of the inventory armor driving the formula
    armorSourceName?: string | null; // display label
    acMaxDex?: number | null;        // DEX cap for medium armor
  };
  initiative: { stack: ModifierEntry[]; override: number | null };
  speed: { base: number; stack: ModifierEntry[]; override: number | null };
  hp: {
    max: number | null;
    stack: ModifierEntry[];
  };
};

export type ModifierTarget =
  | "attr.str" | "attr.dex" | "attr.con" | "attr.int" | "attr.wis" | "attr.cha"
  | "save.str" | "save.dex" | "save.con" | "save.int" | "save.wis" | "save.cha" | "save.all"
  | "skill.acrobatics" | "skill.animalHandling" | "skill.arcana" | "skill.athletics"
  | "skill.deception" | "skill.history" | "skill.insight" | "skill.intimidation"
  | "skill.investigation" | "skill.medicine" | "skill.nature" | "skill.perception"
  | "skill.performance" | "skill.persuasion" | "skill.religion" | "skill.sleightOfHand"
  | "skill.stealth" | "skill.survival" | "skill.all"
  | "sense.passivePerception"
  | "combat.ac" | "combat.hp" | "combat.initiative" | "combat.speed"
  | "spell.slots.1" | "spell.slots.2" | "spell.slots.3" | "spell.slots.4" | "spell.slots.5"
  | "spell.slots.6" | "spell.slots.7" | "spell.slots.8" | "spell.slots.9"
  | "spell.attack" | "spell.dc"
  | "prof_bonus";

export type InventoryItem = {
  id: string;
  name: string;
  quantity?: number;
  weight: number;
  category: "Weapon" | "Armor" | "Tool" | "Consumable" | "Wondrous" | "Mundane";
  equipped: boolean;
  attuned?: boolean;
  modifiers: { id: string; target: ModifierTarget; value: number; type: "Bonus" | "Set To" }[];
  // Armor data — populated when item is imported from SRD
  acSetsFormula?: boolean | null;   // true = drives AC formula; false = bonus-only (shield); undefined = legacy (treated as true)
  acBase?: number | null;           // armor AC base (e.g. 12 for studded leather); drives formula when equipped
  acDexBonus?: boolean | null;      // true = light/medium (add DEX), false = heavy
  acMaxDex?: number | null;         // DEX cap for medium armor
  stealthDisadvantage?: boolean | null;
  strMinimum?: number | null;
  // System-managed: "class-start:{classId}" — do not edit in UI
  sourceId?: string;
};

export type ActionMode = "Spell" | "DC" | "Attack" | "Heal" | "Plain";

export type DieType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20" | "d100";

export type DamageEntry = {
  diceCount: number;
  dieType: DieType;
  stat: AttributeKey | null;
  flatBonus: number;
  type: string;
  active: boolean;
};

export type ActionEntry = {
  id: string;
  name: string;
  mode: ActionMode;
  // Attack mode: which stat + proficiency toggle + flat bonus (e.g. +1 magic weapon)
  attackStat: AttributeKey | null;
  attackProficient: boolean;
  attackBonus: number;
  // DC mode: optional fixed override (for item-based DCs like "DC 13 Spider Staff")
  fixedDC: number | null;
  damageStack: DamageEntry[];
  notes: string;
  sourceId?: string; // inventory item id or spell entry id — set means system-managed, read-only in UI unless manual mode
};

export type FeatureEntry = {
  id: string;
  name: string;
  source: string;
  sourceId?: string; // namespaced: "race:<id>", "subrace:<id>", "class:<id>" — set means system-managed
  description: string;
};

export type TrackerBaseSource =
  | { kind: "fixed" }
  | { kind: "attr_mod"; attr: AttributeKey }
  | { kind: "level" }
  | { kind: "half_level_up" }
  | { kind: "half_level_down" }
  | { kind: "prof_bonus" };

export type TrackerEntry = {
  id: string;
  name: string;
  base: number;
  baseSource?: TrackerBaseSource;
  baseMultiplier?: number; // multiplied against resolved baseSource value; default 1
  baseOffset?: number;     // added after multiplier; default 0
  stack: ModifierEntry[];
  reset: "Short Rest" | "Long Rest" | "Dawn" | "Special";
  override: number | null;
  valueLabel?: string;
};

export type StatBox = {
  id: string;
  title: string;
  value: string;
};

export type SpellEntry = {
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  duration: string;
  mode: ActionMode;
  castingStat: AttributeKey | null;
  fixedDC: number | null;
  saveStat: AttributeKey | null;
  damageStack: DamageEntry[];
  description: string;
  upcastDescription: string;
  components: { verbal: boolean; somatic: boolean; material: boolean; materialDesc: string };
  tags: { ritual: boolean; concentration: boolean; alwaysPrepared: boolean };
  sourceId?: string;
};

import type { CanvasPage } from "./canvas";

export type Currency = { cp: number; sp: number; ep: number; gp: number; pp: number };
export type CharacterClassEntry = {
  classId: string | null;
  name: string;
  subclass: string;
  subclassId: string | null;
  level: number;
  hitDie: string;
  ignoreAutomation?: boolean;
};

export type SelectionIgnores = {
  race: boolean;
  background: boolean;
};

export type ClassChoiceMade = {
  id: string;
  classId: string;
  atLevel: number;
  type: "asi" | "skill" | "feat";
  // ASI: up to two improvements (+2 one OR +1/+1 two)
  improvements?: { attr: AttributeKey; bonus: number }[];
  // Skill
  skillKey?: string;
  // Feat
  featId?: string;
  featName?: string;
  featDescription?: string;
};

export type RaceChoiceMade = {
  id: string;
  raceId: string;
  type: "asi" | "skill";
  abilityScore?: AttributeKey;
  bonus?: number;
  skillKey?: string;
};

export type EquipmentChoiceMade = {
  id: string;
  classId: string;
  choiceIndex: number;
};

export type BackgroundChoiceMade = {
  id: string;
  backgroundId: string;
  type: "asi";
  improvements: { attr: AttributeKey; bonus: number }[];
};

export type LanguageChoiceMade = {
  id: string;
  sourceId: string;  // "background:<bgId>" | "race:<raceId>" | "subrace:<subraceId>"
  languageId: string;
  languageName: string;
};

export type ToolChoiceMade = {
  id: string;
  backgroundId: string;
  choiceIndex: number;
  toolName: string;
};

export type RaceToolChoiceMade = {
  id: string;
  sourceId: string; // "race:<raceId>" | "subrace:<subraceId>"
  choiceIndex: number;
  toolName: string;
};

export type RaceCantripChoiceMade = {
  id: string;
  sourceId: string; // "race:<raceId>" | "subrace:<subraceId>"
  spellId: string;
  spellName: string;
  spellLevel: number;
  spellSchool: string;
  spellCastingTime: string;
  spellRange: string;
  spellDuration: string;
  spellDescription: string;
  spellComponents: { verbal: boolean; somatic: boolean; material: boolean; materialDesc: string };
  spellTags: { ritual: boolean; concentration: boolean };
};

export type SrdGrants = {
  saveProficiencies: string[];
  skillProficiencies: string[];
  raceSkillProficiencies?: string[];
  raceAsiBonuses?: { abilityScore: AttributeKey; bonus: number; sourceId: string }[];
  backgroundAsiBonuses?: { abilityScore: AttributeKey; bonus: number; sourceId: string }[];
};

export type Characteristics = {
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
};

export type Bio = {
  appearance: string;
  backstory: string;
  allies: string;
  organizations: string;
};

export type CharacterImage = {
  key: string;
  filename: string;
  contentType: string;
  size: number;
  updatedAt: string;
};

export type Edition = "2014" | "2024";

export type CharacterMode = "player" | "npc";

export type AbilityScoreMode = "manual" | "standardArray" | "pointBuy";

export type CharacterData = {
  version: string;
  edition: Edition;
  mode?: CharacterMode;
  abilityScoreMode?: AbilityScoreMode;
  profBonusStack: ModifierEntry[];
  selectionIgnores?: SelectionIgnores;
  dismissedClassChoiceKeys?: string[];
  dismissedRaceChoiceKeys?: string[];
  dismissedMulticlassWarningKeys?: string[];
  dismissedEquipmentChoiceKeys?: string[];
  dismissedBackgroundChoiceKeys?: string[];
  identity: {
    name: string;
    race: string;
    subrace: string;
    classLabels: string;
    background: string;
    alignment: string;
    deity: string;
    age: string;
    gender: string;
    height: string;
    weight: string;
    eyes: string;
    hair: string;
    skin: string;
    size: string;
    creatureType: string;
    level: number;
    classes: CharacterClassEntry[];
  };
  characteristics?: Characteristics;
  bio?: Bio;
  portraitImage?: CharacterImage | null;
  attributes: Record<AttributeKey, AttributeData>;
  saves: Record<AttributeKey, SaveData>;
  saveGlobalStack: ModifierEntry[];
  skills: Record<string, SkillData>;
  skillGlobalStack: ModifierEntry[];
  passivePerception: DerivedValueData;
  jackOfAllTrades: boolean;
  jackOfAllTradesSaves?: boolean;
  otherProficiencies: OtherProficiency[];
  combat: CombatData;
  currency?: Currency;
  inventory: InventoryItem[];
  actions: ActionEntry[];
  features: FeatureEntry[];
  trackers: TrackerEntry[];
  statBoxes?: StatBox[];
  spells: {
    globalCastingStat: AttributeKey | null;
    attackStack: ModifierEntry[];
    dcStack: ModifierEntry[];
    slots: Record<string, { base: number; stack: ModifierEntry[]; override: number | null }>;
    list: SpellEntry[];
  };
  canvas: {
    pages: CanvasPage[];
  };
  automationKeys?: {
    srdClassKey?: string;
    srdSubclassKey?: string; // "classId|subclassId:level,..." — updated by applyClasses
    srdRaceKey?: string;
    srdBackgroundKey?: string;
  };
  srdGrants?: SrdGrants;
  classChoices?: ClassChoiceMade[];
  raceChoices?: RaceChoiceMade[];
  backgroundChoices?: BackgroundChoiceMade[];
  languageChoices?: LanguageChoiceMade[];
  toolChoices?: ToolChoiceMade[];
  raceToolChoices?: RaceToolChoiceMade[];
  raceCantripChoices?: RaceCantripChoiceMade[];
  equipmentChoicesMade?: EquipmentChoiceMade[];
};
