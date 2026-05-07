export type WidgetType = "Box" | "CoreStats" | "Inspiration" | "Proficiency" | "SavingThrows" | "Skills" | "PassivePerception" | "ToolProficiencies" | "OtherProficiencies" | "SlimToolProf" | "SlimOtherProf"
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
