"use client"

import { useCharacterStore } from "@/lib/store/character-store"
import type { AttributeKey } from "@/lib/types/character"
import { resolveSkillBonus } from "@/lib/character/calculations"
import { DndFrame } from "./dnd-frame"

const SKILL_CONFIG: { name: string; key: string; ability: AttributeKey; label: string }[] = [
  { name: "Acrobatics",      key: "acrobatics",     ability: "dex", label: "Dex" },
  { name: "Animal Handling", key: "animalHandling", ability: "wis", label: "Wis" },
  { name: "Arcana",          key: "arcana",         ability: "int", label: "Int" },
  { name: "Athletics",       key: "athletics",      ability: "str", label: "Str" },
  { name: "Deception",       key: "deception",      ability: "cha", label: "Cha" },
  { name: "History",         key: "history",        ability: "int", label: "Int" },
  { name: "Insight",         key: "insight",        ability: "wis", label: "Wis" },
  { name: "Intimidation",    key: "intimidation",   ability: "cha", label: "Cha" },
  { name: "Investigation",   key: "investigation",  ability: "int", label: "Int" },
  { name: "Medicine",        key: "medicine",       ability: "wis", label: "Wis" },
  { name: "Nature",          key: "nature",         ability: "int", label: "Int" },
  { name: "Perception",      key: "perception",     ability: "wis", label: "Wis" },
  { name: "Performance",     key: "performance",    ability: "cha", label: "Cha" },
  { name: "Persuasion",      key: "persuasion",     ability: "cha", label: "Cha" },
  { name: "Religion",        key: "religion",       ability: "int", label: "Int" },
  { name: "Sleight of Hand", key: "sleightOfHand",  ability: "dex", label: "Dex" },
  { name: "Stealth",         key: "stealth",        ability: "dex", label: "Dex" },
  { name: "Survival",        key: "survival",       ability: "wis", label: "Wis" },
]

function fmt(v: number) { return v >= 0 ? `+${v}` : `${v}` }

// ViewBox 105×196. 18 rows + bottom label.
// Default canvas size: w=7, h=16 on 20-col A4 grid.
export function SkillsWidget() {
  const character = useCharacterStore((s) => s.character)
  const ROW_H = 9
  const ROW_START = 11

  if (!character) return null

  return (
    <svg
      viewBox="0 0 105 196"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "100%" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <DndFrame x={3} y={3} w={99} h={187} cornerOff={10} />

      {/* Rows */}
      {SKILL_CONFIG.map((config, i) => {
        const cy = ROW_START + i * ROW_H
        const skill = character.skills[config.key]
        const value = resolveSkillBonus(character, config.key, config.ability)
        const isProficient = skill.state === "Proficient" || skill.state === "Expertise"

        return (
          <g key={config.key}>
            {isProficient
              ? (
                skill.state === "Expertise" 
                ? <circle cx="10" cy={cy} r="2.5" fill="#1a1208" stroke="#1a1208" strokeWidth="1" />
                : <circle cx="10" cy={cy} r="2.5" fill="#1a1208" />
              )
              : <circle cx="10" cy={cy} r="2.5" fill="none" stroke="#1a1208" strokeWidth="0.8" />
            }
            <text x="26" y={cy} textAnchor="end" dominantBaseline="middle"
              fontSize="6.5" fontWeight="600"
              fontFamily="Georgia, 'Times New Roman', serif" fill="#1a1208"
            >{fmt(value)}</text>
            <text x="29" y={cy} textAnchor="start" dominantBaseline="middle"
              fontFamily="Georgia, 'Times New Roman', serif" fill="#1a1208"
            >
              <tspan fontSize="6.5" fontWeight="400">{config.name}</tspan>
              <tspan fontSize="5.5" fontWeight="400" fill="#4a3a28"> ({config.label})</tspan>
            </text>
          </g>
        )
      })}

      {/* Divider + bottom label */}
      <line x1="6" y1="178" x2="99" y2="178" stroke="#1a1208" strokeWidth="0.5" />
      <text x="52" y="184" textAnchor="middle" dominantBaseline="middle"
        fontSize="5.5" fontWeight="700"
        fontFamily="Georgia, 'Times New Roman', serif"
        letterSpacing="0.5" fill="#1a1208"
      >
        SKILLS
      </text>
    </svg>
  )
}
