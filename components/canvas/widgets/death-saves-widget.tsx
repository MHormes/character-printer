"use client"

import { DndFrame } from "./dnd-frame"

// viewBox 90×90 — matches w=4, h=4 grid cell (square)
// Circles are always blank on print — filled during play.
export function DeathSavesWidget() {
  const ff = "Georgia, 'Times New Roman', serif"
  const cx = [48, 62, 76]
  const r = 5.5

  return (
    <svg
      viewBox="0 0 90 90"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "100%" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <DndFrame x={3} y={3} w={84} h={84} cornerOff={9} />

      {/* SUCCESSES row */}
      <text x="9" y="28" dominantBaseline="middle"
        fontSize="5" fontWeight="700" fontFamily={ff} letterSpacing="0.1" fill="#1a1208"
      >SUCCESSES</text>
      {cx.map((x) => (
        <circle key={`s${x}`} cx={x} cy={28} r={r} fill="#f5f0e8" stroke="#1a1208" strokeWidth="1" />
      ))}

      {/* FAILURES row */}
      <text x="9" y="48" dominantBaseline="middle"
        fontSize="5" fontWeight="700" fontFamily={ff} letterSpacing="0.1" fill="#1a1208"
      >FAILURES</text>
      {cx.map((x) => (
        <circle key={`f${x}`} cx={x} cy={48} r={r} fill="#f5f0e8" stroke="#1a1208" strokeWidth="1" />
      ))}

      {/* Bottom divider + label */}
      <line x1="8" y1="71" x2="82" y2="71" stroke="#1a1208" strokeWidth="0.5" />
      <text x="45" y="80" textAnchor="middle" dominantBaseline="middle"
        fontSize="5.5" fontWeight="700" fontFamily={ff} letterSpacing="0.3" fill="#1a1208"
      >DEATH SAVES</text>
    </svg>
  )
}
