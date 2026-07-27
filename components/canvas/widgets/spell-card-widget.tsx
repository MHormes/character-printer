"use client";

import { useState, useEffect } from "react";
import type { SpellEntry, DamageEntry } from "@/lib/types/character";
import type { AttributeKey } from "@/lib/types/character";
import { useCharacterStore } from "@/lib/store/character-store";
import { resolveAttributeMod } from "@/lib/character/calculations";
import { formatDamageStack } from "@/lib/character/damage";
import { getSpell } from "@/lib/actions/5e-data";
import type { SpellRow } from "@/lib/actions/5e-data";

export const SPELL_CARD_GRID_W = 7;
export const SPELL_CARD_GRID_H = 13;

const CARD_TEXT_W = 164; // CW(180) - PAD(8)*2
const DMG_LINE_H = 7.5;

// Wrapped damage/effect line(s) for the card's fixed-width text column — empty when the spell has no damage.
export function spellCardDmgLines(
  damageStack: DamageEntry[] | undefined,
  attrMod: (key: AttributeKey) => number,
): string[] {
  const label = formatDamageStack(damageStack, attrMod);
  return label ? wrapText(label, CARD_TEXT_W, 6.5) : [];
}

function dmgBlockH(dmgLineCount: number): number {
  return dmgLineCount > 0 ? dmgLineCount * DMG_LINE_H + 4 : 0;
}

export function spellCardDescCap(hasMaterial: boolean, dmgLineCount = 0): number {
  const LINE_H = 6.5 * 1.45;
  const charsPerLine = Math.floor(CARD_TEXT_W / (6.5 * 0.5));
  const CH = 330;
  const DESC_Y = 87 + dmgBlockH(dmgLineCount);
  const COMP_H = hasMaterial ? 7.5 + 10 : 0;
  const COMP_Y = hasMaterial ? CH - COMP_H - 8 : CH;
  const DESC_H = COMP_Y - DESC_Y - (hasMaterial ? 3 : 6);
  return Math.floor(DESC_H / LINE_H) * charsPerLine;
}

export function spellDescEffectiveLength(desc: string): number {
  const PARA_GAP = 6.5 * 0.65;
  const LINE_H = 6.5 * 1.45;
  const charsPerLine = Math.floor(CARD_TEXT_W / (6.5 * 0.5));
  const extraParas = Math.max(0, desc.split(/\n\n+/).length - 1);
  return desc.length + extraParas * Math.round((PARA_GAP / LINE_H) * charsPerLine);
}

export function spellDescFitsCard(desc: string, hasMaterial: boolean, dmgLineCount = 0): boolean {
  const FONT_SIZE = 6.5;
  const LINE_H = FONT_SIZE * 1.45;
  const PARA_GAP = FONT_SIZE * 0.65;
  const CH = 330;
  const DESC_Y = 87 + dmgBlockH(dmgLineCount);
  const COMP_H = hasMaterial ? 7.5 + 10 : 0;
  const COMP_Y = hasMaterial ? CH - COMP_H - 8 : CH;
  const DESC_H = COMP_Y - DESC_Y - (hasMaterial ? 3 : 6);
  let curY = DESC_Y + FONT_SIZE;
  for (let pi = 0, paras = desc.split(/\n\n+/); pi < paras.length; pi++) {
    if (curY > DESC_Y + DESC_H) return false;
    if (pi > 0) curY += PARA_GAP;
    for (const _ of wrapText(paras[pi].replace(/\n/g, " ").trim(), CARD_TEXT_W, FONT_SIZE)) {
      if (curY > DESC_Y + DESC_H) return false;
      curY += LINE_H;
    }
  }
  return true;
}

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

export function SpellCardSvg({
  spell,
  attrMod = () => 0,
}: {
  spell: SpellEntry;
  attrMod?: (key: AttributeKey) => number;
}) {
  const CW = 180,
    CH = 330,
    PAD = 8,
    MX = 90;
  const TITLE_H = 36;
  const STAT_H = 24;
  const STAT1_Y = TITLE_H;
  const STAT2_Y = TITLE_H + STAT_H;
  const DIV2_Y = TITLE_H + STAT_H * 2;

  const hasMatDesc = !!(
    spell.components.material && spell.components.materialDesc.trim()
  );

  const matLines = hasMatDesc
    ? wrapText(
        `Material Component: ${spell.components.materialDesc}`,
        CW - PAD * 2 - 11,
        5.5,
      )
    : [];

  const dmgLines = spellCardDmgLines(spell.damageStack, attrMod);

  const COMP_H = hasMatDesc ? matLines.length * 7.5 + 10 : 0;
  const COMP_Y = hasMatDesc ? CH - COMP_H - 8 : CH;
  const DESC_Y = DIV2_Y + 3 + dmgBlockH(dmgLines.length);
  const DESC_H = COMP_Y - DESC_Y - (hasMatDesc ? 3 : 6);

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
        {spell.tags.ritual && (
          <tspan fontSize="4" fill="#7a4a18">
            {" "}
            ◉ R
          </tspan>
        )}
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

      {/* ── Damage / effect ── */}
      {dmgLines.length > 0 && (
        <>
          {dmgLines.map((line, i) => (
            <text
              key={i}
              x={PAD}
              y={DIV2_Y + 3 + FONT_SIZE + i * DMG_LINE_H}
              fontSize={FONT_SIZE}
              fontWeight="700"
              fontFamily={ff}
              fill="#7a4a18"
            >
              {i === 0 && <tspan fontSize="4.5" fontWeight="700" fill="#6a5a48" letterSpacing="0.4">DAMAGE  </tspan>}
              {line}
            </text>
          ))}
        </>
      )}

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
  tags: { ritual: false, concentration: false, alwaysPrepared: false },
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
    description: row.description ?? "",
    upcastDescription: row.upcastDesc ?? "",
    components: {
      verbal: row.verbal,
      somatic: row.somatic,
      material: row.material,
      materialDesc: row.materialDesc ?? "",
    },
    tags: { ritual: row.ritual, concentration: row.concentration, alwaysPrepared: false },
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
  const attrMod = character
    ? (key: AttributeKey) => resolveAttributeMod(character.attributes[key])
    : undefined;
  return <SpellCardSvg spell={spell} attrMod={attrMod} />;
}
