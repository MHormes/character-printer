"use client"

import { DndFrame } from "./dnd-frame"

// viewBox 130×172 — matches w=3, h=4 grid cell, same shell as StatBoxWidget
// Both the rounds-left number and the spell/effect name are blank on print — filled by hand during play.
export function ConcentrationTrackerWidget() {
  const ff = "Georgia, 'Times New Roman', serif"

  return (
    <svg
      viewBox="0 0 130 172"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "100%" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <DndFrame x={2} y={2} w={126} h={168} cornerOff={10} />

      {/* Rounds-left entry: blank underline + static label */}
      <line x1="30" y1="60" x2="60" y2="60" stroke="#1a1208" strokeWidth="0.6" />
      <text x="65" y="63" dominantBaseline="middle"
        fontSize="8" fontWeight="700" fontFamily={ff} letterSpacing="0.3" fill="#1a1208"
      >ROUNDS LEFT</text>

      <line x1="8" y1="128" x2="122" y2="128" stroke="#1a1208" strokeWidth="0.5" />

      {/* Spell/effect name: blank line to write on */}
      <line x1="18" y1="149" x2="112" y2="149" stroke="#1a1208" strokeWidth="0.6" />
      <text x="65" y="160" textAnchor="middle" dominantBaseline="middle"
        fontSize="6" fontFamily={ff} fontStyle="italic" letterSpacing="0.3" fill="#6a5a48"
      >Concentrating on...</text>
    </svg>
  )
}
