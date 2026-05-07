"use client"

import type { FeatureEntry } from "@/lib/types/character"
import { useCharacterStore } from "@/lib/store/character-store"

const ff = "Georgia, 'Times New Roman', serif"

// CW calibrated for a 9-col card width (proportional to other slim widgets at ~16 units/col)
export const FEATURE_CARD_CW = 144
const PAD_LR = 6
const PAD_TOP = 5
const PAD_BOTTOM = 12
const NAME_SIZE = 7.5
const NAME_LINE_H = 11
const DESC_SIZE = 6
const DESC_LINE_H = 8.5

function wrapText(text: string, width: number, fontSize: number): string[] {
  const charsPerLine = Math.floor(width / (fontSize * 0.50))
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ""
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (test.length > charsPerLine && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

export function featureCardSvgH(description: string): number {
  const lines = wrapText(description, FEATURE_CARD_CW - PAD_LR * 2, DESC_SIZE)
  return PAD_TOP + NAME_LINE_H + 4 + Math.max(1, lines.length) * DESC_LINE_H + PAD_BOTTOM
}

/** Grid rows the card needs at the given card width in columns. */
export function featureCardGridH(description: string, cardW: number, cols: number, rows: number): number {
  return Math.max(2, Math.round(
    (featureCardSvgH(description) * cardW * rows * 210) / (cols * 297 * FEATURE_CARD_CW),
  ))
}

const PLACEHOLDER: FeatureEntry = {
  id: "placeholder-feature",
  name: "Battle Focus",
  source: "Sample Feature",
  description:
    "At the start of a fight, you can steady yourself and read the field. Use this card format for traits, class features, racial features, or magic item abilities that you want visible on the sheet.",
}

export function FeatureCardSvg({ feature }: { feature: FeatureEntry }) {
  const textW = FEATURE_CARD_CW - PAD_LR * 2
  const descLines = wrapText(feature.description, textW, DESC_SIZE)
  const CH = featureCardSvgH(feature.description)
  const divY = PAD_TOP + NAME_LINE_H + 2

  return (
    <svg
      viewBox={`0 0 ${FEATURE_CARD_CW} ${CH}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      {/* Name — bold small-caps matching FullPageFeaturesWidget h3 style */}
      <text
        x={PAD_LR}
        y={PAD_TOP + NAME_LINE_H * 0.75}
        fontSize={NAME_SIZE}
        fontWeight="700"
        fontFamily={ff}
        fill="#1a1208"
        style={{ fontVariant: "small-caps" }}
      >
        {feature.name}
      </text>

      {/* Thin rule under name */}
      <line
        x1={PAD_LR} y1={divY}
        x2={FEATURE_CARD_CW - PAD_LR} y2={divY}
        stroke="#1a1208" strokeWidth="0.4" opacity="0.45"
      />

      {/* Description — plain body text */}
      {descLines.map((line, i) => (
        <text
          key={i}
          x={PAD_LR}
          y={divY + 4 + DESC_SIZE + i * DESC_LINE_H}
          fontSize={DESC_SIZE}
          fontFamily={ff}
          fill="#1a1208"
        >
          {line}
        </text>
      ))}
    </svg>
  )
}

export function FeatureCardWidget({ featureId }: { featureId?: string }) {
  const character = useCharacterStore((s) => s.character)
  const feature = character?.features.find((f) => f.id === featureId) ?? PLACEHOLDER
  return <FeatureCardSvg feature={feature} />
}
