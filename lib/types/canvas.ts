export type WidgetType =
  | "Box"
  | "CoreStats" | "Inspiration" | "Proficiency" | "PassivePerception"
  | "SavingThrows" | "Skills"
  | "ToolProficiencies" | "OtherProficiencies" | "SlimToolProf" | "SlimOtherProf"
  | "ArmorClass" | "Initiative" | "Speed"
  | "CurrentHp" | "TempHp" | "HitDice" | "DeathSaves"
  | "Attacks" | "SlimAttacks" | "Equipment"
  | "Trackers" | "Features" | "FullPageFeatures" | "FullPageSpells"
  | "SpellcastingInfo"
  | "SpellLevel0" | "SpellLevel1" | "SpellLevel2" | "SpellLevel3" | "SpellLevel4"
  | "SpellLevel5" | "SpellLevel6" | "SpellLevel7" | "SpellLevel8" | "SpellLevel9"
  | "FullPageSpellSheet"
  | "CharacterName" | "CharacterInfoDetailed" | "CharacterInfoCompact" | "CharacterAppearance"
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
}
