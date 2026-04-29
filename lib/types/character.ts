// Root character data shape — mirrors the JSON schema in ideation.md

export type ModifierEntry = {
  id: string;
  source: string;
  value: number;
  isActive: boolean;
};

export type AttributeKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

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
  override: number | null;
};

export type OtherProficiency = {
  id: string;
  name: string;
  category: "Tool" | "Language" | "Vehicle" | "Weapon" | "Armor";
  training: "Proficient" | "Expertise";
  stat: AttributeKey | null;
  override: number | null;
};

export type AcMode = "Standard" | "Formula" | "Override";

export type CombatData = {
  ac: {
    mode: AcMode;
    base: number;
    statA: AttributeKey | null;
    statB: AttributeKey | null;
    override: number | null;
  };
  initiative: { stack: ModifierEntry[]; override: number | null };
  speed: { base: number; stack: ModifierEntry[]; override: number | null };
  hp: {
    max: number;
    misc: number;
    hitDice: { count: number; dieType: string; class: string }[];
  };
};

export type InventoryItem = {
  id: string;
  name: string;
  weight: number;
  category: "Weapon" | "Armor" | "Tool" | "Consumable" | "Wondrous" | "Mundane";
  equipped: boolean;
  modifiers: { target: string; value: number; type: "Bonus" | "Set To" }[];
};

export type ActionEntry = {
  id: string;
  name: string;
  mode: "Standard" | "Fixed" | "Manual";
  fixedValue: number | null;
  damageStack: { formula: string; type: string; active: boolean }[];
  notes: string;
};

export type FeatureEntry = {
  id: string;
  name: string;
  source: string;
  description: string;
};

export type TrackerEntry = {
  id: string;
  name: string;
  base: number;
  stack: ModifierEntry[];
  reset: "Short Rest" | "Long Rest" | "Dawn" | "Special";
  override: number | null;
};

export type SpellEntry = {
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  duration: string;
  rollType: "Attack" | "Save" | "Utility";
  hitDCMode: "Standard" | "Fixed" | "Manual";
  damageStack: { formula: string; type: string; scaling: string; active: boolean }[];
  description: string;
  components: string;
  tags: { ritual: boolean; concentration: boolean; prepared: boolean };
};

export type WidgetPrintState = "Calculated" | "Blank";

export type CanvasWidget = {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  printState: WidgetPrintState;
};

export type CharacterData = {
  version: string;
  identity: {
    name: string;
    race: string;
    classLabels: string;
    background: string;
    alignment: string;
    deity: string;
    level: number;
    classes: { name: string; level: number }[];
  };
  attributes: Record<AttributeKey, AttributeData>;
  saves: Record<AttributeKey, SaveData>;
  skills: Record<string, SkillData>;
  otherProficiencies: OtherProficiency[];
  combat: CombatData;
  inventory: InventoryItem[];
  actions: ActionEntry[];
  features: FeatureEntry[];
  trackers: TrackerEntry[];
  spells: {
    globalCastingStat: AttributeKey | null;
    slots: Record<string, { base: number; stack: ModifierEntry[]; override: number | null }>;
    list: SpellEntry[];
  };
  canvas: {
    pages: { id: string; widgets: CanvasWidget[] }[];
  };
};
