export type WidgetType =
  | "Box"
  | "CoreStats" | "Inspiration" | "Proficiency" | "PassivePerception"
  | "SavingThrows" | "Skills"
  | "ToolProficiencies" | "OtherProficiencies" | "SlimToolProf" | "SlimOtherProf"
  | "ArmorClass" | "Initiative" | "Speed"
  | "CurrentHp" | "TempHp" | "HitDice" | "DeathSaves"
  | "Attacks" | "SlimAttacks" | "Equipment"
  | "Trackers" | "Features"
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
