"use client";

import { useState, useEffect } from "react";
import type { SpellEntry } from "@/lib/types/character";
import type { AttributeKey } from "@/lib/types/character";
import { useCharacterStore } from "@/lib/store/character-store";
import { getSpell } from "@/lib/actions/5e-data";
import type { SpellRow } from "@/lib/actions/5e-data";

export const SPELL_CARD_GRID_W = 7;
export const SPELL_CARD_GRID_H = 10;

const ff = "Georgia, 'Times New Roman', serif";

function componentStr(c: SpellEntry["components"]): string {
  return [c.verbal && "V", c.somatic && "S", c.material && "M"]
    .filter(Boolean)
    .join(", ");
}

function levelLabel(level: number, school: string): string {
  if (level === 0) return `${school} Cantrip`;
  const ord = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"];
  return `${ord[level - 1] ?? `${level}th`}-Level ${school}`;
}

function wrapText(text: string, width: number, fontSize: number): string[] {
  const charsPerLine = Math.floor(width / (fontSize * 0.5));
  const words = text.split(/\s+/).filter(Boolean);
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

export function SpellCardSvg({ spell }: { spell: SpellEntry }) {
  const CW = 180,
    CH = 252,
    PAD = 8,
    MX = 90;
  const TITLE_H = 36;
  const STAT_H = 24;
  const STAT1_Y = TITLE_H;
  const STAT2_Y = TITLE_H + STAT_H;
  const DIV2_Y = TITLE_H + STAT_H * 2;
  const FOOTER_H = 16;
  const FOOTER_Y = CH - FOOTER_H;

  const hasMatDesc = !!(
    spell.components.material && spell.components.materialDesc.trim()
  );
  const COMP_H = hasMatDesc ? 24 : 0;
  const COMP_Y = hasMatDesc ? FOOTER_Y - COMP_H - 4 : FOOTER_Y;

  const DESC_Y = DIV2_Y + 3;
  const DESC_H = COMP_Y - DESC_Y - (hasMatDesc ? 3 : 2);

  const FONT_SIZE = 6.5;
  const LINE_H = FONT_SIZE * 1.45;
  const PARA_GAP = FONT_SIZE * 0.65;

  const textLines: { y: number; text: string }[] = [];
  let curY = DESC_Y + FONT_SIZE;

  const paragraphs = spell.description.split(/\n\n+/);
  for (let pi = 0; pi < paragraphs.length; pi++) {
    if (curY > DESC_Y + DESC_H) break;
    if (pi > 0) curY += PARA_GAP;
    const para = paragraphs[pi].replace(/\n/g, " ").trim();
    for (const lineText of wrapText(para, CW - PAD * 2, FONT_SIZE)) {
      if (curY > DESC_Y + DESC_H) break;
      textLines.push({ y: curY, text: lineText });
      curY += LINE_H;
    }
  }

  if (spell.upcastDescription) {
    curY += PARA_GAP;
    for (const lineText of wrapText(
      `At Higher Levels. ${spell.upcastDescription}`,
      CW - PAD * 2,
      FONT_SIZE,
    )) {
      if (curY > DESC_Y + DESC_H) break;
      textLines.push({ y: curY, text: lineText });
      curY += LINE_H;
    }
  }

  const matLines = hasMatDesc
    ? wrapText(
        `Material Component: ${spell.components.materialDesc}`,
        CW - PAD * 2 - 11,
        5.5,
      ).slice(0, 3)
    : [];

  const footerText = [
    spell.school,
    spell.tags.ritual ? "Ritual" : null,
    spell.tags.concentration ? "Concentration" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <svg
      viewBox={`0 0 ${CW} ${CH}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      {/* Background */}
      <rect width={CW} height={CH} fill="white" />

      {/* Outer border */}
      <rect
        x="1.5"
        y="1.5"
        width={CW - 3}
        height={CH - 3}
        fill="none"
        stroke="#1a1208"
        strokeWidth="3"
        rx="1"
      />

      {/* Inner thin border */}
      <rect
        x="5"
        y="5"
        width={CW - 10}
        height={CH - 10}
        fill="none"
        stroke="#1a1208"
        strokeWidth="0.5"
      />

      {/* Title block */}
      <rect
        x="1.5"
        y="1.5"
        width={CW - 3}
        height={TITLE_H}
        fill="#1a1208"
        rx="1"
      />
      {/* Flatten rounded bottom corners of title */}
      <rect x="1.5" y={TITLE_H - 2} width={CW - 3} height="2" fill="#1a1208" />

      {/* Spell name */}
      <text
        x={MX}
        y={TITLE_H * 0.4}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="11.5"
        fontWeight="700"
        fontFamily={ff}
        fill="white"
      >
        {spell.name}
      </text>

      {/* Level / school subtitle */}
      <text
        x={MX}
        y={TITLE_H * 0.79}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="6.5"
        fontStyle="italic"
        fontFamily={ff}
        fill="#c4bbb0"
      >
        {levelLabel(spell.level, spell.school)}
      </text>

      {/* ── Stat row 1: Casting Time | Range ── */}
      <text
        x={PAD}
        y={STAT1_Y + 6}
        dominantBaseline="hanging"
        fontSize="4.5"
        fontWeight="700"
        fontFamily={ff}
        fill="#6a5a48"
        letterSpacing="0.4"
      >
        CASTING TIME
      </text>
      <text
        x={PAD}
        y={STAT1_Y + 14}
        dominantBaseline="hanging"
        fontSize="8"
        fontFamily={ff}
        fill="#1a1208"
      >
        {spell.castingTime}
      </text>

      <line
        x1={MX}
        y1={STAT1_Y + 3}
        x2={MX}
        y2={STAT1_Y + STAT_H - 3}
        stroke="#1a1208"
        strokeWidth="0.5"
        opacity="0.35"
      />

      <text
        x={MX + 4}
        y={STAT1_Y + 6}
        dominantBaseline="hanging"
        fontSize="4.5"
        fontWeight="700"
        fontFamily={ff}
        fill="#6a5a48"
        letterSpacing="0.4"
      >
        RANGE
      </text>
      <text
        x={MX + 4}
        y={STAT1_Y + 14}
        dominantBaseline="hanging"
        fontSize="8"
        fontFamily={ff}
        fill="#1a1208"
      >
        {spell.range}
      </text>

      <line
        x1={PAD}
        y1={STAT1_Y + STAT_H}
        x2={CW - PAD}
        y2={STAT1_Y + STAT_H}
        stroke="#1a1208"
        strokeWidth="0.5"
        opacity="0.35"
      />

      {/* ── Stat row 2: Components | Duration ── */}
      <text
        x={PAD}
        y={STAT2_Y + 6}
        dominantBaseline="hanging"
        fontSize="4.5"
        fontWeight="700"
        fontFamily={ff}
        fill="#6a5a48"
        letterSpacing="0.4"
      >
        COMPONENTS
      </text>
      <text
        x={PAD}
        y={STAT2_Y + 14}
        dominantBaseline="hanging"
        fontSize="8"
        fontFamily={ff}
        fill="#1a1208"
      >
        {componentStr(spell.components)}
      </text>

      <line
        x1={MX}
        y1={STAT2_Y + 3}
        x2={MX}
        y2={STAT2_Y + STAT_H - 3}
        stroke="#1a1208"
        strokeWidth="0.5"
        opacity="0.35"
      />

      <text
        x={MX + 4}
        y={STAT2_Y + 6}
        dominantBaseline="hanging"
        fontSize="4.5"
        fontWeight="700"
        fontFamily={ff}
        fill="#6a5a48"
        letterSpacing="0.4"
      >
        DURATION
        {spell.tags.concentration && (
          <tspan fontSize="4" fill="#7a4a18">
            {" "}
            ◉ C
          </tspan>
        )}
      </text>
      <text
        x={MX + 4}
        y={STAT2_Y + 14}
        dominantBaseline="hanging"
        fontSize="8"
        fontFamily={ff}
        fill="#1a1208"
      >
        {spell.duration}
      </text>

      <line
        x1={PAD}
        y1={DIV2_Y}
        x2={CW - PAD}
        y2={DIV2_Y}
        stroke="#1a1208"
        strokeWidth="0.5"
        opacity="0.35"
      />

      {/* ── Description text ── */}
      {textLines.map((line, i) => (
        <text
          key={i}
          x={PAD}
          y={line.y}
          fontSize={FONT_SIZE}
          fontFamily={ff}
          fill="#1a1208"
        >
          {line.text}
        </text>
      ))}

      {/* ── Material component section ── */}
      {hasMatDesc && (
        <>
          <line
            x1={PAD}
            y1={COMP_Y - 3}
            x2={CW - PAD}
            y2={COMP_Y - 3}
            stroke="#1a1208"
            strokeWidth="0.5"
            opacity="0.35"
          />
          {/* Diamond icon */}
          <polygon
            points={`${PAD + 3.5},${COMP_Y + 1} ${PAD + 7},${COMP_Y + 5} ${PAD + 3.5},${COMP_Y + 9} ${PAD},${COMP_Y + 5}`}
            fill="#1a1208"
          />
          {matLines.map((line, i) => (
            <text
              key={i}
              x={PAD + 11}
              y={COMP_Y + 5.5 + i * 7.5}
              fontSize="5.5"
              fontFamily={ff}
              fill="#1a1208"
            >
              {line}
            </text>
          ))}
        </>
      )}

      {/* ── Footer ── */}
      <line
        x1={PAD}
        y1={FOOTER_Y}
        x2={CW - PAD}
        y2={FOOTER_Y}
        stroke="#1a1208"
        strokeWidth="0.5"
        opacity="0.35"
      />

      <text
        x={MX}
        y={FOOTER_Y + FOOTER_H / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="5"
        fontFamily={ff}
        fill="#6a5a48"
        fontStyle="italic"
      >
        {footerText}
      </text>
    </svg>
  );
}

const DANCING_LIGHTS: SpellEntry = {
  id: "hardcoded-dancing-lights",
  name: "Dancing Lights",
  level: 0,
  school: "Evocation",
  castingTime: "1 action",
  range: "120 ft",
  duration: "Up to 1 minute",
  mode: "Spell",
  castingStat: null,
  fixedDC: null,
  saveStat: null,
  damageStack: [],
  description:
    "You create up to four torch-sized lights within range, making them appear as torches, lanterns, or glowing orbs that hover in the air for the duration. You can also combine the four lights into one glowing humanoid form of Medium size. Whichever form you choose, each light sheds dim light in a 10-foot radius.\n\nAs a bonus action on your turn, you can move the lights up to 60 feet to a new spot within range. A light must be within 20 feet of another light created by this spell, and a light winks out if it exceeds the spell's range.",
  upcastDescription: "",
  components: {
    verbal: true,
    somatic: true,
    material: true,
    materialDesc: "a bit of phosphorus or wychwood, or a glowworm",
  },
  tags: { ritual: false, concentration: false, prepared: true },
};

function spellRowToEntry(row: SpellRow): SpellEntry {
  return {
    id: row.id,
    name: row.name,
    level: row.level,
    school: row.school ?? "",
    castingTime: row.castingTime ?? "",
    range: row.range ?? "",
    duration: row.duration ?? "",
    mode: "Spell",
    castingStat: null,
    fixedDC: null,
    saveStat: row.dcSaveStat as AttributeKey | null,
    damageStack: [],
    description: row.description,
    upcastDescription: row.upcastDesc ?? "",
    components: {
      verbal: row.verbal,
      somatic: row.somatic,
      material: row.material,
      materialDesc: row.materialDesc ?? "",
    },
    tags: { ritual: row.ritual, concentration: row.concentration, prepared: false },
  };
}

export function SpellCardWidget({ spellId }: { spellId?: string }) {
  const character = useCharacterStore((s) => s.character);
  const charSpell = character?.spells.list.find((s) => s.id === spellId);
  const [dbSpell, setDbSpell] = useState<SpellEntry | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!spellId || charSpell) {
      Promise.resolve().then(() => { if (!cancelled) setDbSpell(null); });
    } else {
      getSpell(spellId).then((row) => {
        if (!cancelled) setDbSpell(row ? spellRowToEntry(row) : null);
      });
    }
    return () => { cancelled = true; };
  }, [spellId, charSpell]);

  const spell = charSpell ?? dbSpell ?? DANCING_LIGHTS;
  return <SpellCardSvg spell={spell} />;
}
