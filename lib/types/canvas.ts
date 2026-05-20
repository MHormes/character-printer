export const DEFAULT_CANVAS_COLS = 28

export type WidgetType =
  | "Box"
  | "CoreStats" | "Inspiration" | "Proficiency" | "PassivePerception"
  | "SavingThrows" | "Skills"
  | "ToolProficiencies" | "OtherProficiencies" | "SlimToolProf" | "SlimOtherProf"
  | "ArmorClass" | "Initiative" | "Speed"
  | "CurrentHp" | "TempHp" | "HitDice" | "DeathSaves"
  | "Attacks" | "SlimAttacks" | "Equipment"
  | "Trackers" | "Features" | "FeatureCard"
  | "FullPageFeatures" | "FullPageSpells" | "FullPageMain"
  | "SpellcastingInfo"
  | "SpellLevel0" | "SpellLevel1" | "SpellLevel2" | "SpellLevel3" | "SpellLevel4"
  | "SpellLevel5" | "SpellLevel6" | "SpellLevel7" | "SpellLevel8" | "SpellLevel9"
  | "FullPageSpellSheet"
  | "CharacterName" | "CharacterInfoDetailed" | "CharacterInfoCompact" | "CharacterAppearance" | "CharacterPortrait"
  | "SpellCard"
  | "StatBox"
  | "TemplatePage1"
  | "TemplatePage2"
  | "TemplateSpellCards"
  | "TemplateFeatures"
  | "Characteristics" | "CharacteristicCard"
  | "BioText" | "FullPageBio" | "TemplateBio"
export type Rotation = 0 | 90 | 180 | 270
export type PrintState = "Calculated" | "Blank"

export type CanvasWidget = {
  id: string
  type: WidgetType
  col: number
  row: number
  w: number
  h: number
  rotation: Rotation
  locked: boolean
  printState: PrintState
  spellId?: string
  featureId?: string
  statId?: string
  textSource?: string // for GenericText: traits, ideals, bonds, flaws, appearance, backstory, allies, organizations
}

export type CanvasTemplateWidget = Omit<CanvasWidget, "id">

export type CanvasPage = {
  id: string
  cols: number
  widgets: CanvasWidget[]
}

export type CanvasTemplate = {
  id: string
  userId: string
  name: string
  cols: number
  widgets: CanvasTemplateWidget[]
  createdAt: Date | null
  updatedAt: Date | null
}
