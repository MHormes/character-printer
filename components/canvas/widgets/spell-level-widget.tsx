"use client"

import { useCharacterStore } from "@/lib/store/character-store"
import { sumStack } from "@/lib/character/calculations"
import type { SpellEntry } from "@/lib/types/character"

const SVG_W = 120
const MARGIN = 3
const HEADER_H = 14
const BADGE_W = 20
const ROW_H = 11
const BOTTOM_PAD = 3
const ROW_RIGHT = SVG_W - MARGIN - 1   // 116 — right content edge
const TAG_SIZE = 4                      // square/circle badge size
const TAG_RADIUS = 2                    // circle radius
const NAME_MAX_X = ROW_RIGHT - 13      // 103 — name clipped before badge column

const ff = "Georgia, 'Times New Roman', serif"

function componentStr(c: SpellEntry["components"]): string {
  const parts: string[] = []
  if (c.verbal) parts.push("V")
  if (c.somatic) parts.push("S")
  if (c.material) parts.push("M")
  return parts.join("")
}

export function spellLevelSvgH(n: number): number {
  return MARGIN + HEADER_H + Math.max(1, n) * ROW_H + BOTTOM_PAD
}

export function SpellLevelBlock({ level }: { level: number }) {
  const character = useCharacterStore((s) => s.character)
  if (!character) return null

  const isCantrip = level === 0
  const spells = character.spells.list.filter((s) => s.level === level)
  const n = spells.length
  const slotRaw = isCantrip ? null : (character.spells.slots[String(level)] ?? null)
  const slotsTotal = slotRaw
    ? (slotRaw.override ?? slotRaw.base + sumStack(slotRaw.stack))
    : 0

  const svgH = spellLevelSvgH(n)
  const hdrY = MARGIN
  const listStart = MARGIN + HEADER_H
  const clipId = `spell-level-clip-${level}`

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${svgH}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={MARGIN} y={hdrY} width={SVG_W - MARGIN * 2} height={HEADER_H} rx={7} />
        </clipPath>
        <clipPath id={`${clipId}-name`}>
          <rect x={14} y={listStart} width={NAME_MAX_X - 14} height={svgH} />
        </clipPath>
      </defs>

      {/* Header pill */}
      <rect x={MARGIN} y={hdrY} width={SVG_W - MARGIN * 2} height={HEADER_H}
        rx={7} fill="#f5f0e8" />
      <rect x={MARGIN} y={hdrY} width={BADGE_W} height={HEADER_H}
        fill="#e0d8c8" clipPath={`url(#${clipId})`} />
      <rect x={MARGIN} y={hdrY} width={SVG_W - MARGIN * 2} height={HEADER_H}
        rx={7} fill="none" stroke="#1a1208" strokeWidth="0.8" />
      <line
        x1={MARGIN + BADGE_W} y1={hdrY + 2}
        x2={MARGIN + BADGE_W} y2={hdrY + HEADER_H - 2}
        stroke="#1a1208" strokeWidth="0.5" opacity="0.4"
      />
      <text
        x={MARGIN + BADGE_W / 2} y={hdrY + HEADER_H / 2 + 0.5}
        textAnchor="middle" dominantBaseline="middle"
        fontSize="8" fontWeight="700" fontFamily={ff} fill="#1a1208"
      >
        {level}
      </text>

      {isCantrip ? (
        <text
          x={MARGIN + BADGE_W + (SVG_W - MARGIN * 2 - BADGE_W) / 2}
          y={hdrY + HEADER_H / 2 + 0.5}
          textAnchor="middle" dominantBaseline="middle"
          fontSize="5.5" fontWeight="700" fontFamily={ff} letterSpacing="0.5" fill="#1a1208"
        >
          CANTRIPS
        </text>
      ) : (
        <>
          <text
            x={MARGIN + BADGE_W + 3} y={hdrY + HEADER_H / 2 + 0.5}
            dominantBaseline="middle"
            fontSize="4.5" fontFamily={ff} fill="#6a5a48"
          >
            SLOTS TOTAL:
          </text>
          <text
            x={MARGIN + BADGE_W + 38} y={hdrY + HEADER_H / 2 + 0.5}
            dominantBaseline="middle"
            fontSize="8" fontWeight="700" fontFamily={ff} fill="#1a1208"
          >
            {slotsTotal}
          </text>
        </>
      )}

      {/* Spell list */}
      {n === 0 ? (
        <text
          x={SVG_W / 2} y={listStart + ROW_H / 2}
          textAnchor="middle" dominantBaseline="middle"
          fontSize="5.5" fontStyle="italic" fontFamily={ff} fill="#6a5a48" opacity="0.5"
        >
          —
        </text>
      ) : (
        spells.map((spell, i) => {
          const rowY = listStart + ROW_H * i
          const rowCY = rowY + ROW_H / 2

          const hasC = spell.tags.concentration
          const hasR = spell.tags.ritual
          const comp = componentStr(spell.components)
          const hasTags = hasC || hasR

          // R badge: always rightmost. C badge: left of R if both, else rightmost.
          const rX1 = ROW_RIGHT - TAG_SIZE          // 112
          const cCX = hasR
            ? rX1 - 1 - TAG_RADIUS                  // 109  (left of R with 1-unit gap)
            : ROW_RIGHT - TAG_RADIUS                 // 114  (rightmost if no R)
          const tagCY = rowY + 1 + TAG_RADIUS        // rowY + 3

          // VSM y: bottom of row when tags present, centered otherwise
          const vsmY = hasTags && comp ? rowY + ROW_H - 2 : rowCY

          return (
            <g key={spell.id}>
              {i > 0 && (
                <line
                  x1={MARGIN} y1={rowY}
                  x2={SVG_W - MARGIN} y2={rowY}
                  stroke="#1a1208" strokeWidth="0.2" opacity="0.3"
                />
              )}

              {/* Bullet */}
              <text
                x={8} y={rowCY} textAnchor="middle" dominantBaseline="middle"
                fontSize="5" fontFamily={ff} fill="#1a1208" opacity="0.35"
              >
                ○
              </text>

              {/* Spell name — clipped to leave room for badge column */}
              <text
                x={14} y={rowCY} dominantBaseline="middle"
                fontSize="6" fontFamily={ff} fill="#1a1208"
                clipPath={`url(#${clipId}-name)`}
              >
                {spell.name}
              </text>

              {/* R badge — filled square, white letter */}
              {hasR && (
                <g>
                  <rect x={rX1} y={rowY + 1} width={TAG_SIZE} height={TAG_SIZE} fill="#1a1208" />
                  <text
                    x={rX1 + TAG_SIZE / 2} y={tagCY + 0.5}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize="3.5" fontWeight="700" fontFamily={ff} fill="#f5f0e8"
                  >
                    R
                  </text>
                </g>
              )}

              {/* C badge — filled circle, white letter */}
              {hasC && (
                <g>
                  <circle cx={cCX} cy={tagCY} r={TAG_RADIUS} fill="#1a1208" />
                  <text
                    x={cCX} y={tagCY + 0.5}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize="3.5" fontWeight="700" fontFamily={ff} fill="#f5f0e8"
                  >
                    C
                  </text>
                </g>
              )}

              {/* Component letters — below tags, or vertically centered if no tags */}
              {comp && (
                <text
                  x={ROW_RIGHT} y={vsmY} textAnchor="end" dominantBaseline="middle"
                  fontSize="4.5" fontFamily={ff} fill="#6a5a48"
                >
                  {comp}
                </text>
              )}
            </g>
          )
        })
      )}
    </svg>
  )
}

export function SpellLevel0Widget() { return <SpellLevelBlock level={0} /> }
export function SpellLevel1Widget() { return <SpellLevelBlock level={1} /> }
export function SpellLevel2Widget() { return <SpellLevelBlock level={2} /> }
export function SpellLevel3Widget() { return <SpellLevelBlock level={3} /> }
export function SpellLevel4Widget() { return <SpellLevelBlock level={4} /> }
export function SpellLevel5Widget() { return <SpellLevelBlock level={5} /> }
export function SpellLevel6Widget() { return <SpellLevelBlock level={6} /> }
export function SpellLevel7Widget() { return <SpellLevelBlock level={7} /> }
export function SpellLevel8Widget() { return <SpellLevelBlock level={8} /> }
export function SpellLevel9Widget() { return <SpellLevelBlock level={9} /> }
