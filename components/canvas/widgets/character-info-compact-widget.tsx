"use client"

import { useCharacterStore } from "@/lib/store/character-store"

const INK = "#1a1208"

function ScrollEnd({ cx, cy }: { cx: number; cy: number }) {
  return (
    <>
      <ellipse cx={cx} cy={cy} rx={7} ry={25} fill="#e0dbd0" stroke={INK} strokeWidth="0.8" />
      <ellipse cx={cx} cy={cy} rx={4} ry={20} fill="none" stroke={INK} strokeWidth="0.4" opacity="0.5" />
      <line x1={cx} y1={cy - 16} x2={cx} y2={cy + 16} stroke={INK} strokeWidth="0.3" opacity="0.4" />
    </>
  )
}

// viewBox 500×70 — 2-row compact identity block (class+level, background, race, alignment)
export function CharacterInfoCompactWidget() {
  const character = useCharacterStore((s) => s.character)
  if (!character) return null

  const { background, alignment } = character.identity
  const classes = character.identity.classes
  const classDisplay = classes.length > 0
    ? classes.map((c) => `${c.name} ${c.level}`).join(" & ")
    : "—"
  const raceDisplay = character.identity.race
    ? `${character.identity.race}${character.identity.subrace ? ` (${character.identity.subrace})` : ""}`
    : "—"

  const ff = "Georgia, 'Times New Roman', serif"
  const ink = INK

  return (
    <svg
      viewBox="0 0 500 70"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "100%" }}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* outer frame */}
      <rect x="10" y="4" width="480" height="62" rx="2" fill="white" stroke={ink} strokeWidth="1.2" />
      {/* inner border */}
      <rect x="14" y="8" width="472" height="54" rx="1" fill="none" stroke={ink} strokeWidth="0.4" />

      {/* scroll ends */}
      <ScrollEnd cx={4} cy={35} />
      <ScrollEnd cx={496} cy={35} />

      {/* ── Row 1 ── */}
      {/* CLASS & LEVEL — big value */}
      <text x="20" y="24" fontSize="12" fontWeight="700" fontFamily={ff} fill={ink}>{classDisplay}</text>
      <text x="20" y="34" fontSize="5" fontWeight="700" fontFamily={ff} letterSpacing="0.8" fill={ink}>CLASS &amp; LEVEL</text>

      {/* BACKGROUND — right-aligned */}
      <text x="460" y="24" fontSize="12" fontWeight="700" fontFamily={ff} fill={ink} textAnchor="end">{background || "—"}</text>
      <text x="460" y="34" fontSize="5" fontWeight="700" fontFamily={ff} letterSpacing="0.8" fill={ink} textAnchor="end">BACKGROUND</text>

      {/* divider */}
      <line x1="18" y1="39" x2="482" y2="39" stroke={ink} strokeWidth="0.5" />

      {/* ── Row 2 ── */}
      {/* RACE */}
      <text x="20" y="52" fontSize="12" fontWeight="700" fontFamily={ff} fill={ink}>{raceDisplay}</text>
      <text x="20" y="62" fontSize="5" fontWeight="700" fontFamily={ff} letterSpacing="0.8" fill={ink}>RACE</text>

      {/* ALIGNMENT — center */}
      <text x="250" y="52" fontSize="12" fontWeight="700" fontFamily={ff} fill={ink} textAnchor="middle">{alignment || "—"}</text>
      <text x="250" y="62" fontSize="5" fontWeight="700" fontFamily={ff} letterSpacing="0.8" fill={ink} textAnchor="middle">ALIGNMENT</text>

      {/* EXPERIENCE POINTS — right, pencil-fillable */}
      <text x="460" y="62" fontSize="5" fontWeight="700" fontFamily={ff} letterSpacing="0.8" fill={ink} textAnchor="end">EXPERIENCE POINTS</text>
    </svg>
  )
}
