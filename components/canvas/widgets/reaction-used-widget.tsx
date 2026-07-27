"use client"

import { DndFrame } from "./dnd-frame"

// viewBox 68×45 — matches w=3, h=2 grid cell
// Checkbox is always blank on print — checked off by hand when the reaction is spent.
export function ReactionUsedWidget() {
  const ff = "Georgia, 'Times New Roman', serif"

  return (
    <svg
      viewBox="0 0 68 45"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "100%" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <DndFrame x={3} y={3} w={62} h={39} cornerOff={9} />

      <rect x="8" y="16" width="13" height="13" fill="#f5f0e8" stroke="#1a1208" strokeWidth="1" />

      <text x="26" y="23" dominantBaseline="middle"
        fontSize="5.5" fontWeight="700" fontFamily={ff} letterSpacing="0.1" fill="#1a1208"
      >REACTION</text>
      <text x="26" y="31" dominantBaseline="middle"
        fontSize="5.5" fontWeight="700" fontFamily={ff} letterSpacing="0.1" fill="#1a1208"
      >USED</text>
    </svg>
  )
}
