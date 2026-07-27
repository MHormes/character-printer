"use client"

import { DndFrame } from "./dnd-frame"

// viewBox 135×45 — matches w=6, h=2 grid cell (wide strip)
// Boxes are always blank on print — checked off by hand as exhaustion levels are gained.
export function ExhaustionTrackerWidget() {
  const ff = "Georgia, 'Times New Roman', serif"
  const boxSize = 12
  const gap = 4
  const startX = 58
  const boxY = 16

  return (
    <svg
      viewBox="0 0 135 45"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "100%" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <DndFrame x={3} y={3} w={129} h={39} cornerOff={9} />

      <text x="9" y="24" dominantBaseline="middle"
        fontSize="6" fontWeight="700" fontFamily={ff} letterSpacing="0.2" fill="#1a1208"
      >EXHAUSTION</text>

      {[1, 2, 3, 4, 5, 6].map((level, i) => {
        const x = startX + i * (boxSize + gap)
        return (
          <g key={level}>
            <rect x={x} y={boxY} width={boxSize} height={boxSize} fill="#f5f0e8" stroke="#1a1208" strokeWidth="1" />
            <text
              x={x + boxSize / 2} y={boxY + boxSize + 7}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="5" fontWeight="700" fontFamily={ff} fill="#1a1208"
            >{level}</text>
          </g>
        )
      })}
    </svg>
  )
}
