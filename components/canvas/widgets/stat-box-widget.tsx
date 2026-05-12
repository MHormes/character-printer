"use client"

import { useCharacterStore } from "@/lib/store/character-store"
import type { StatBox } from "@/lib/types/character"
import { DndFrame } from "./dnd-frame"

const PLACEHOLDER: StatBox = {
  id: "placeholder-stat-box",
  title: "Bardic Inspiration",
  value: "d8",
}

function wrap(text: string, max: number): string[] {
  if (text.length <= max) return [text]
  const words = text.split(" ")
  if (words.length === 1) return [text]
  const lines: string[] = []
  let current = ""
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (current && test.length > max) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines.slice(0, 2)
}

function wrapTitle(title: string): string[] {
  if (!title) return ["STAT"]
  return wrap(title.toUpperCase(), 20)
}

export function StatBoxWidget({ statId }: { statId?: string }) {
  const statBoxes = useCharacterStore((s) => s.character?.statBoxes ?? [])
  const stat = statBoxes.find((s) => s.id === statId) ?? PLACEHOLDER

  const ff = "Georgia, 'Times New Roman', serif"
  const valueLines = wrap(stat.value || "-", 8)
  const titleLines = wrapTitle(stat.title)

  const longest = valueLines.reduce((a, b) => (a.length > b.length ? a : b), "")
  const fontSize = longest.length > 7 ? 18 : longest.length > 5 ? 22 : longest.length > 3 ? 28 : 36
  const valueYs = valueLines.length === 1 ? [76] : [60, 92]
  const labelYs = titleLines.length === 1 ? [149] : [140, 152]

  return (
    <svg
      viewBox="0 0 130 172"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "100%" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <DndFrame x={2} y={2} w={126} h={168} cornerOff={10} />
      {valueLines.map((line, i) => (
        <text
          key={i}
          x="65" y={valueYs[i]}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={fontSize} fontWeight="700" fontFamily={ff} fill="#1a1208"
        >{line}</text>
      ))}
      <line x1="8" y1="128" x2="122" y2="128" stroke="#1a1208" strokeWidth="0.5" />
      {titleLines.map((line, i) => (
        <text
          key={i}
          x="65" y={labelYs[i]}
          textAnchor="middle" dominantBaseline="middle"
          fontSize="7" fontWeight="700" fontFamily={ff} letterSpacing="0.5" fill="#1a1208"
        >{line}</text>
      ))}
    </svg>
  )
}
