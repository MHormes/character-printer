"use client"

import { useCharacterStore } from "@/lib/store/character-store"

const INK = "#1a1208"

function ScrollEnd({ cx, cy }: { cx: number; cy: number }) {
  return (
    <>
      <ellipse cx={cx} cy={cy} rx={7} ry={22} fill="#e0dbd0" stroke={INK} strokeWidth="0.8" />
      <ellipse cx={cx} cy={cy} rx={4} ry={18} fill="none" stroke={INK} strokeWidth="0.4" opacity="0.5" />
      <line x1={cx} y1={cy - 14} x2={cx} y2={cy + 14} stroke={INK} strokeWidth="0.3" opacity="0.4" />
    </>
  )
}

// viewBox 500×65 — wide, 2-row info block matching the detailed D&D sheet style
export function CharacterInfoDetailedWidget() {
  const character = useCharacterStore((s) => s.character)
  if (!character) return null

  const { level, race, subrace } = character.identity
  const classes = character.identity.classes
  const classNames = classes.length > 0 ? classes.map((c) => c.name).join(" & ") : "—"
  const subclasses = classes.length > 0 ? classes.map((c) => c.subclass || "—").join(" & ") : "—"

  const ff = "Georgia, 'Times New Roman', serif"
  const ink = INK

  return (
    <svg
      viewBox="0 0 500 65"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "100%" }}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* outer frame */}
      <rect x="6" y="4" width="480" height="57" rx="2" fill="white" stroke={ink} strokeWidth="1.2" />

      {/* scroll end — right */}
      <ScrollEnd cx={492} cy={32} />

      {/* ── Row 1: CLASS | SUBCLASS | LEVEL ── */}
      {/* CLASS */}
      <text x="18" y="18" fontSize="5" fontWeight="700" fontFamily={ff} letterSpacing="0.8" fill={ink}>CLASS:</text>
      <text x="45" y="18" fontSize="9" fontWeight="600" fontFamily={ff} fill={ink}>{classNames}</text>

      {/* SUBCLASS */}
      <text x="175" y="18" fontSize="5" fontWeight="700" fontFamily={ff} letterSpacing="0.8" fill={ink}>SUBCLASS:</text>
      <text x="220" y="18" fontSize="9" fontWeight="600" fontFamily={ff} fill={ink}>{subclasses}</text>

      {/* LEVEL */}
      <text x="370" y="18" fontSize="5" fontWeight="700" fontFamily={ff} letterSpacing="0.8" fill={ink}>LEVEL:</text>
      <text x="403" y="18" fontSize="9" fontWeight="600" fontFamily={ff} fill={ink}>{level}</text>

      {/* divider */}
      <line x1="14" y1="30" x2="476" y2="30" stroke={ink} strokeWidth="0.5" strokeDasharray="3,3" opacity="0.3" />

      {/* ── Row 2: RACE | SUBRACE | CREATURE TYPE ── */}
      <text x="18" y="43" fontSize="5" fontWeight="700" fontFamily={ff} letterSpacing="0.8" fill={ink}>RACE:</text>
      <text x="40" y="43" fontSize="9" fontWeight="600" fontFamily={ff} fill={ink}>{race || "—"}</text>

      <text x="175" y="43" fontSize="5" fontWeight="700" fontFamily={ff} letterSpacing="0.8" fill={ink}>SUBRACE:</text>
      <text x="220" y="43" fontSize="9" fontWeight="600" fontFamily={ff} fill={ink}>{subrace || "—"}</text>

      {/* bottom label area */}
      <line x1="6" y1="52" x2="486" y2="52" stroke={ink} strokeWidth="0.4" />
    </svg>
  )
}
