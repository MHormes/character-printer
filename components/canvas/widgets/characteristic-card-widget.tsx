"use client";

import { useCharacterStore } from "@/lib/store/character-store";
import { DndFrame } from "./dnd-frame";

// Identical to characteristics-widget so sections align when placed side-by-side
const SVG_W = 96;
const MARGIN = 3;
const TEXT_SIZE = 4.5;
const LINE_H = 5.5;
const BOX_TEXT_PAD_TOP = 8;
const LABEL_H = 8;
const MIN_BOX_H = 20;

const ff = "Georgia, 'Times New Roman', serif";

export const CHAR_CARD_SOURCES = [
  { id: "personalityTraits", label: "Personality Traits" },
  { id: "ideals",            label: "Ideals" },
  { id: "bonds",             label: "Bonds" },
  { id: "flaws",             label: "Flaws" },
] as const;

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

export function characteristicCardSvgH(text: string): number {
  return MARGIN * 2 + sectionBoxH(text);
}

export function CharacteristicCardSvg({ label, text }: { label: string; text: string }) {
  const boxH = sectionBoxH(text);
  const svgH = MARGIN * 2 + boxH;
  const textLines = wrapText(text || "", SVG_W - MARGIN * 4, TEXT_SIZE);

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${svgH}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      <DndFrame
        x={MARGIN}
        y={MARGIN}
        w={SVG_W - MARGIN * 2}
        h={boxH}
        cornerOff={6}
      />

      {textLines.map((line, i) => (
        <text
          key={i}
          x={MARGIN + 6}
          y={MARGIN + BOX_TEXT_PAD_TOP + i * LINE_H}
          fontSize={TEXT_SIZE}
          fontFamily={ff}
          fill="#1a1208"
        >
          {line}
        </text>
      ))}

      {textLines.length === 0 && (
        <text
          x={SVG_W / 2}
          y={MARGIN + BOX_TEXT_PAD_TOP + LINE_H}
          textAnchor="middle"
          fontSize={TEXT_SIZE}
          fontStyle="italic"
          fontFamily={ff}
          fill="#6a5a48"
        >
          No text provided
        </text>
      )}

      <text
        x={SVG_W / 2}
        y={MARGIN + boxH - 3}
        textAnchor="middle"
        fontSize="4"
        fontWeight="700"
        fontFamily={ff}
        fill="#1a1208"
        style={{ fontVariant: "small-caps", opacity: 0.8 }}
      >
        {label}
      </text>
    </svg>
  );
}

export function CharacteristicCardWidget({ source = "personalityTraits" }: { source?: string }) {
  const character = useCharacterStore((s) => s.character);
  const src = CHAR_CARD_SOURCES.find((s) => s.id === source) ?? CHAR_CARD_SOURCES[0];
  const text = (character?.characteristics as Record<string, string> | undefined)?.[src.id] ?? "";
  return <CharacteristicCardSvg label={src.label} text={text} />;
}
