"use client";

import { useCharacterStore } from "@/lib/store/character-store";
import type { Characteristics } from "@/lib/types/character";
import { DndFrame } from "./dnd-frame";

const SVG_W = 96;
const MARGIN = 3;
const HEADER_H = 12;
const BOX_GAP = 4;
const TEXT_SIZE = 4.5;
const LINE_H = 5.5;
const BOX_TEXT_PAD_TOP = 8;
const LABEL_H = 8;
const MIN_BOX_H = 20;

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

function sectionBoxH(text: string): number {
  const lines = wrapText(text || "", SVG_W - MARGIN * 4, TEXT_SIZE);
  return Math.max(MIN_BOX_H, BOX_TEXT_PAD_TOP + lines.length * LINE_H + LABEL_H);
}

export function characteristicsSvgH(c?: Characteristics): number {
  if (!c) return MARGIN * 2 + HEADER_H + 4 * 30 + 3 * BOX_GAP + 5;
  const total =
    sectionBoxH(c.personalityTraits) +
    sectionBoxH(c.ideals) +
    sectionBoxH(c.bonds) +
    sectionBoxH(c.flaws);
  return MARGIN * 2 + HEADER_H + total + 3 * BOX_GAP + 5;
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

  const svgH = characteristicsSvgH(c);

  let curY = MARGIN + HEADER_H;

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
        const boxH = sectionBoxH(sec.text);
        const y = curY;
        curY += boxH + (i < sections.length - 1 ? BOX_GAP : 0);
        const textLines = wrapText(sec.text, SVG_W - MARGIN * 4, TEXT_SIZE);

        return (
          <g key={sec.label}>
            <DndFrame
              x={MARGIN}
              y={y}
              w={SVG_W - MARGIN * 2}
              h={boxH}
              cornerOff={6}
            />

            {textLines.map((line, li) => (
              <text
                key={li}
                x={MARGIN + 6}
                y={y + BOX_TEXT_PAD_TOP + li * LINE_H}
                fontSize={TEXT_SIZE}
                fontFamily={ff}
                fill="#1a1208"
              >
                {line}
              </text>
            ))}

            <text
              x={SVG_W / 2}
              y={y + boxH - 3}
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
