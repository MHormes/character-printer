"use client";

import { useCharacterStore } from "@/lib/store/character-store";
import { DndFrame } from "./dnd-frame";

const SVG_W = 96;
const MARGIN = 3;
const HEADER_H = 12;
const BOX_GAP = 4;
const BOX_H = 42;

const ff = "Georgia, 'Times New Roman', serif";

function wrapText(text: string, width: number, fontSize: number): string[] {
  const charsPerLine = Math.floor(width / (fontSize * 0.5));
  const words = (text || "").split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (test.length > charsPerLine && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function characteristicsSvgH(): number {
  return MARGIN * 2 + HEADER_H + 4 * BOX_H + 3 * BOX_GAP + 5;
}

export function CharacteristicsWidget() {
  const character = useCharacterStore((s) => s.character);
  if (!character) return null;

  const c = character.characteristics || {
    personalityTraits: "",
    ideals: "",
    bonds: "",
    flaws: "",
  };

  const sections = [
    { label: "PERSONALITY TRAITS", text: c.personalityTraits },
    { label: "IDEALS", text: c.ideals },
    { label: "BONDS", text: c.bonds },
    { label: "FLAWS", text: c.flaws },
  ];

  const svgH = characteristicsSvgH();

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${svgH}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      <text
        x={SVG_W / 2}
        y={MARGIN + HEADER_H / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="7"
        fontWeight="700"
        fontFamily={ff}
        fill="#800000"
        style={{ fontVariant: "small-caps", letterSpacing: "1px" }}
      >
        Characteristics
      </text>

      {sections.map((sec, i) => {
        const y = MARGIN + HEADER_H + i * (BOX_H + BOX_GAP);
        const textLines = wrapText(sec.text, SVG_W - MARGIN * 4, 4.5).slice(0, 6);
        
        return (
          <g key={sec.label}>
            <DndFrame
              x={MARGIN}
              y={y}
              w={SVG_W - MARGIN * 2}
              h={BOX_H}
              cornerOff={6}
            />
            
            {textLines.map((line, li) => (
              <text
                key={li}
                x={MARGIN + 6}
                y={y + 8 + li * 5.5}
                fontSize="4.5"
                fontFamily={ff}
                fill="#1a1208"
              >
                {line}
              </text>
            ))}

            <text
              x={SVG_W / 2}
              y={y + BOX_H - 5}
              textAnchor="middle"
              fontSize="4"
              fontWeight="700"
              fontFamily={ff}
              fill="#1a1208"
              style={{ fontVariant: "small-caps", opacity: 0.8 }}
            >
              {sec.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
