"use client"

import { DndFrame } from "./dnd-frame"

// viewBox 90×90 — matches w=4, h=4 grid cell (square), same shell as DeathSavesWidget
// Circles are always blank on print — checked off by hand as exhaustion levels are gained.
export function ExhaustionTrackerWidget() {
  const ff = "Georgia, 'Times New Roman', serif"
  const r = 5.5
  const cx = [29, 45, 61]
  const rows = [
    { cy: 26, levels: [1, 2, 3] },
    { cy: 48, levels: [4, 5, 6] },
  ]

  return (
    <svg
      viewBox="0 0 90 90"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "100%" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <DndFrame x={3} y={3} w={84} h={84} cornerOff={9} />

      {rows.map((row) => (
        <g key={row.cy}>
          {row.levels.map((level, i) => (
            <g key={level}>
              <circle cx={cx[i]} cy={row.cy} r={r} fill="#f5f0e8" stroke="#1a1208" strokeWidth="1" />
              <text
                x={cx[i]} y={row.cy + r + 6}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="5" fontWeight="700" fontFamily={ff} fill="#1a1208"
              >{level}</text>
            </g>
          ))}
        </g>
      ))}

      {/* Bottom divider + label */}
      <line x1="8" y1="71" x2="82" y2="71" stroke="#1a1208" strokeWidth="0.5" />
      <text x="45" y="80" textAnchor="middle" dominantBaseline="middle"
        fontSize="5.5" fontWeight="700" fontFamily={ff} letterSpacing="0.3" fill="#1a1208"
      >EXHAUSTION</text>
    </svg>
  )
}
