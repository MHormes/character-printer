"use client"

import { useCharacterStore } from "@/lib/store/character-store"
import { resolveSpellDc, resolveSpellAttack } from "@/lib/character/calculations"

const ATTR_NAMES: Record<string, string> = {
  str: "STRENGTH", dex: "DEXTERITY", con: "CONSTITUTION",
  int: "INTELLIGENCE", wis: "WISDOM", cha: "CHARISMA",
}

const ff = "Georgia, 'Times New Roman', serif"

// Chamfered rectangle box: outer border + inset inner border
function ChamferedBox({ bx, value, label, bw = 184, bh = 54, c = 10, i = 3 }: {
  bx: number; value: string; label: string;
  bw?: number; bh?: number; c?: number; i?: number
}) {
  const by = 0
  const outerD = `M${bx+c},${by} H${bx+bw-c} L${bx+bw},${by+c} V${by+bh-c} L${bx+bw-c},${by+bh} H${bx+c} L${bx},${by+bh-c} V${by+c} Z`
  const innerD = `M${bx+c},${by+i} H${bx+bw-c} L${bx+bw-i},${by+c} V${by+bh-c} L${bx+bw-c},${by+bh-i} H${bx+c} L${bx+i},${by+bh-c} V${by+c} Z`
  const cx = bx + bw / 2
  const cy = bh / 2

  const isNumeric = !isNaN(Number(value)) || value.startsWith("+") || value.startsWith("-")
  const fs = isNumeric ? 22 : value.length <= 7 ? 14 : value.length <= 10 ? 12 : 10

  return (
    <g>
      <path d={outerD} fill="#f5f0e8" stroke="#1a1208" strokeWidth="1.5" />
      <path d={innerD} fill="none" stroke="#1a1208" strokeWidth="0.8" />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
        fontSize={fs} fontWeight="700" fontFamily={ff} fill="#1a1208">
        {value}
      </text>
      <text x={cx} y={bh + 13} textAnchor="middle" dominantBaseline="middle"
        fontSize="11" fontWeight="600" fontFamily={ff} letterSpacing="0.4" fill="#1a1208">
        {label}
      </text>
    </g>
  )
}

// ViewBox 600×74: 3 boxes (184×54) with 24px gaps, labels below at y≈67
export function SpellcastingInfoWidget() {
  const character = useCharacterStore((s) => s.character)
  if (!character) return null

  const stat = character.spells.globalCastingStat
  const abilityName = stat ? ATTR_NAMES[stat] : "—"
  const dc = resolveSpellDc(character)
  const attack = resolveSpellAttack(character)
  const attackStr = attack >= 0 ? `+${attack}` : `${attack}`

  return (
    <svg
      viewBox="0 0 600 74"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "100%" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <ChamferedBox bx={0}   value={abilityName} label="SPELLCASTING ABILITY" />
      <ChamferedBox bx={208} value={String(dc)}  label="SPELL SAVE DC" />
      <ChamferedBox bx={416} value={attackStr}   label="SPELL ATTACK BONUS" />
    </svg>
  )
}
