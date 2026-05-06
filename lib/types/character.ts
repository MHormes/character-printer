// Root character data shape — mirrors the JSON schema in ideation.md

export type ModifierEntry = {
  id: string;
  source: string;
  value: number;
  isActive: boolean;
  sourceId?: string; // namespaced: "item:<uuid>", "race:<id>", "class:<id>", etc. — set means system-managed, read-only in UI
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
  | "combat.ac" | "combat.hp" | "combat.initiative" | "combat.speed"
  | "spell.slots.1" | "spell.slots.2" | "spell.slots.3" | "spell.slots.4" | "spell.slots.5"
  | "spell.slots.6" | "spell.slots.7" | "spell.slots.8" | "spell.slots.9"
  | "spell.attack" | "spell.dc"
  | "prof_bonus";

export type InventoryItem = {
  id: string;
  name: string;
  weight: number;
  category: "Weapon" | "Armor" | "Tool" | "Consumable" | "Wondrous" | "Mundane";
  equipped: boolean;
  modifiers: { id: string; target: ModifierTarget; value: number; type: "Bonus" | "Set To" }[];
};

export type ActionMode = "Spell" | "DC" | "Attack" | "Heal";

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
  mode: ActionMode;
  attackStat: AttributeKey | null;
  attackProficient: boolean;
  attackBonus: number;
  fixedDC: number | null;
  damageStack: DamageEntry[];
  description: string;
  upcastDescription: string;
  components: { verbal: boolean; somatic: boolean; material: boolean; materialDesc: string };
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
  profBonusStack: ModifierEntry[];
  identity: {
    name: string;
    race: string;
    classLabels: string;
    background: string;
    alignment: string;
    deity: string;
    level: number;
    classes: { name: string; level: number; hitDie: string }[];
  };
  attributes: Record<AttributeKey, AttributeData>;
  saves: Record<AttributeKey, SaveData>;
  saveGlobalStack: ModifierEntry[];
  skills: Record<string, SkillData>;
  skillGlobalStack: ModifierEntry[];
  jackOfAllTrades: boolean;
  otherProficiencies: OtherProficiency[];
  combat: CombatData;
  inventory: InventoryItem[];
  actions: ActionEntry[];
  features: FeatureEntry[];
  trackers: TrackerEntry[];
  spells: {
    globalCastingStat: AttributeKey | null;
    attackStack: ModifierEntry[];
    dcStack: ModifierEntry[];
    slots: Record<string, { base: number; stack: ModifierEntry[]; override: number | null }>;
    list: SpellEntry[];
  };
  canvas: {
    pages: { id: string; widgets: CanvasWidget[] }[];
  };
};
