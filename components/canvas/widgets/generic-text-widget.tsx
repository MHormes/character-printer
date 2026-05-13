"use client";

import { useCharacterStore } from "@/lib/store/character-store";
import { DndFrame } from "./dnd-frame";

const SVG_W = 96;
const MARGIN = 3;
const HEADER_H = 10;
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

const SOURCE_LABELS: Record<string, string> = {
  personalityTraits: "Personality Traits",
  ideals: "Ideals",
  bonds: "Bonds",
  flaws: "Flaws",
  appearance: "Appearance",
  backstory: "Backstory",
  allies: "Allies & Organizations",
  organizations: "Organizations",
};

export function genericTextSvgH(text: string): number {
  const lines = wrapText(text, SVG_W - 12, 5.5);
  const textH = lines.length * 7;
  return Math.max(30, MARGIN * 2 + HEADER_H + textH + 8);
}

export function GenericTextWidget({ source = "backstory" }: { source?: string }) {
  const character = useCharacterStore((s) => s.character);
  if (!character) return null;

  let text = "";
  if (source in (character.characteristics || {})) {
    text = (character.characteristics as any)[source];
  } else if (source in (character.bio || {})) {
    text = (character.bio as any)[source];
  }

  const label = SOURCE_LABELS[source] || source.charAt(0).toUpperCase() + source.slice(1);
  const lines = wrapText(text, SVG_W - 12, 5.5);
  const svgH = genericTextSvgH(text);
  const frameH = svgH - MARGIN * 2;

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
        h={frameH}
        cornerOff={10}
      />

      <text
        x={SVG_W / 2}
        y={MARGIN + HEADER_H / 2 + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="6"
        fontWeight="700"
        fontFamily={ff}
        fill="#1a1208"
        style={{ fontVariant: "small-caps" }}
      >
        {label}
      </text>

      <line
        x1={MARGIN + 4}
        y1={MARGIN + HEADER_H}
        x2={SVG_W - MARGIN - 4}
        y2={MARGIN + HEADER_H}
        stroke="#1a1208"
        strokeWidth="0.5"
        opacity="0.3"
      />

      {lines.map((line, i) => (
        <text
          key={i}
          x={MARGIN + 6}
          y={MARGIN + HEADER_H + 8 + i * 7}
          fontSize="5.5"
          fontFamily={ff}
          fill="#1a1208"
        >
          {line}
        </text>
      ))}

      {lines.length === 0 && (
        <text
          x={SVG_W / 2}
          y={MARGIN + HEADER_H + 12}
          textAnchor="middle"
          fontSize="5"
          fontStyle="italic"
          fontFamily={ff}
          fill="#6a5a48"
        >
          No text provided
        </text>
      )}
    </svg>
  );
}
