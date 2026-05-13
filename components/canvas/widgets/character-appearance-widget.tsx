"use client"

import { useCharacterStore } from "@/lib/store/character-store"

// viewBox 500×70 — 2-row physical appearance block (age/size/height/weight, eyes/skin/hair)
export function CharacterAppearanceWidget() {
  const character = useCharacterStore((s) => s.character)
  if (!character) return null

  const { age, height, weight, eyes, skin, hair, size } = character.identity

  const ff = "Georgia, 'Times New Roman', serif"
  const ink = "#1a1208"

  function ScrollEnd({ cx, cy }: { cx: number; cy: number }) {
    return (
      <>
        <ellipse cx={cx} cy={cy} rx={7} ry={25} fill="#e0dbd0" stroke={ink} strokeWidth="0.8" />
        <ellipse cx={cx} cy={cy} rx={4} ry={20} fill="none" stroke={ink} strokeWidth="0.4" opacity="0.5" />
        <line x1={cx} y1={cy - 16} x2={cx} y2={cy + 16} stroke={ink} strokeWidth="0.3" opacity="0.4" />
      </>
    )
  }

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

      {/* ── Row 1: AGE | SIZE | HEIGHT | WEIGHT ── */}
      {/* AGE */}
      <text x="20" y="24" fontSize="12" fontWeight="700" fontFamily={ff} fill={ink}>{age || "—"}</text>
      <text x="20" y="34" fontSize="5" fontWeight="700" fontFamily={ff} letterSpacing="0.8" fill={ink}>AGE</text>

      {/* SIZE */}
      <text x="145" y="24" fontSize="12" fontWeight="700" fontFamily={ff} fill={ink}>{size || "—"}</text>
      <text x="145" y="34" fontSize="5" fontWeight="700" fontFamily={ff} letterSpacing="0.8" fill={ink}>SIZE</text>

      {/* HEIGHT */}
      <text x="270" y="24" fontSize="12" fontWeight="700" fontFamily={ff} fill={ink}>{height || "—"}</text>
      <text x="270" y="34" fontSize="5" fontWeight="700" fontFamily={ff} letterSpacing="0.8" fill={ink}>HEIGHT</text>

      {/* WEIGHT */}
      <text x="460" y="24" fontSize="12" fontWeight="700" fontFamily={ff} fill={ink} textAnchor="end">{weight || "—"}</text>
      <text x="460" y="34" fontSize="5" fontWeight="700" fontFamily={ff} letterSpacing="0.8" fill={ink} textAnchor="end">WEIGHT</text>

      {/* divider */}
      <line x1="18" y1="39" x2="482" y2="39" stroke={ink} strokeWidth="0.5" />

      {/* ── Row 2: EYES | SKIN | HAIR ── */}
      {/* EYES */}
      <text x="20" y="52" fontSize="12" fontWeight="700" fontFamily={ff} fill={ink}>{eyes || "—"}</text>
      <text x="20" y="62" fontSize="5" fontWeight="700" fontFamily={ff} letterSpacing="0.8" fill={ink}>EYES</text>

      {/* SKIN */}
      <text x="250" y="52" fontSize="12" fontWeight="700" fontFamily={ff} fill={ink} textAnchor="middle">{skin || "—"}</text>
      <text x="250" y="62" fontSize="5" fontWeight="700" fontFamily={ff} letterSpacing="0.8" fill={ink} textAnchor="middle">SKIN</text>

      {/* HAIR */}
      <text x="460" y="52" fontSize="12" fontWeight="700" fontFamily={ff} fill={ink} textAnchor="end">{hair || "—"}</text>
      <text x="460" y="62" fontSize="5" fontWeight="700" fontFamily={ff} letterSpacing="0.8" fill={ink} textAnchor="end">HAIR</text>
    </svg>
  )
}
