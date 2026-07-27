"use client";

import { useCharacterStore } from "@/lib/store/character-store";
import { sumStack } from "@/lib/character/calculations";
import type { SpellEntry } from "@/lib/types/character";

const SVG_W = 120;
const MARGIN = 3;
const HEADER_H = 14;
const BADGE_W = 20;
const ROW_H = 11;
const BOTTOM_PAD = 3;
const ROW_RIGHT = SVG_W - MARGIN - 1; // 116 — right content edge
const TAG_SIZE = 4; // square/circle badge size
const TAG_RADIUS = 2; // circle radius
const NAME_MAX_X = ROW_RIGHT - 20; // 96 — name clipped before badge column (up to 4 badges)

const ff = "Georgia, 'Times New Roman', serif";

function componentStr(c: SpellEntry["components"]): string {
  const parts: string[] = [];
  if (c.verbal) parts.push("V");
  if (c.somatic) parts.push("S");
  if (c.material) parts.push("M");
  return parts.join("");
}

function isBonusAction(castingTime: string): boolean {
  return /bonus/i.test(castingTime);
}

function isReaction(castingTime: string): boolean {
  return /reaction/i.test(castingTime);
}

type BadgeKind = "square" | "circle";
type BadgeDef = { kind: BadgeKind; label: string };

export function spellLevelSvgH(n: number): number {
  return MARGIN + HEADER_H + (n > 0 ? n * ROW_H : 0) + BOTTOM_PAD;
}

export function SpellLevelBlock({ level }: { level: number }) {
  const character = useCharacterStore((s) => s.character);
  if (!character) return null;

  const isCantrip = level === 0;
  const spells = character.spells.list.filter((s) => s.level === level);
  const n = spells.length;
  const slotRaw = isCantrip
    ? null
    : (character.spells.slots[String(level)] ?? null);
  const slotsTotal = slotRaw
    ? (slotRaw.override ?? slotRaw.base + sumStack(slotRaw.stack))
    : 0;

  const svgH = spellLevelSvgH(n);
  const hdrY = MARGIN;
  const listStart = MARGIN + HEADER_H;
  const clipId = `spell-level-clip-${level}`;

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${svgH}`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMin meet"
      style={{ display: "block", width: "100%" }}
    >
      <defs>
        <clipPath id={`${clipId}-name`}>
          <rect x={14} y={listStart} width={NAME_MAX_X - 14} height={svgH} />
        </clipPath>
      </defs>

      {/* Header pill */}
      <rect
        x={MARGIN}
        y={hdrY}
        width={SVG_W - MARGIN * 2}
        height={HEADER_H}
        rx={7}
        fill="#f5f0e8"
      />
      <path
        d={`M ${MARGIN + 7},${hdrY} L ${MARGIN + BADGE_W},${hdrY} L ${MARGIN + BADGE_W},${hdrY + HEADER_H} L ${MARGIN + 7},${hdrY + HEADER_H} A 7,7 0 0 1 ${MARGIN},${hdrY + HEADER_H / 2} A 7,7 0 0 1 ${MARGIN + 7},${hdrY} Z`}
        fill="#e0d8c8"
      />
      <rect
        x={MARGIN}
        y={hdrY}
        width={SVG_W - MARGIN * 2}
        height={HEADER_H}
        rx={7}
        fill="none"
        stroke="#1a1208"
        strokeWidth="0.8"
      />
      <line
        x1={MARGIN + BADGE_W}
        y1={hdrY + 2}
        x2={MARGIN + BADGE_W}
        y2={hdrY + HEADER_H - 2}
        stroke="#1a1208"
        strokeWidth="0.5"
        opacity="0.4"
      />
      <text
        x={MARGIN + BADGE_W / 2}
        y={hdrY + HEADER_H / 2 + 0.5}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="8"
        fontWeight="700"
        fontFamily={ff}
        fill="#1a1208"
      >
        {level}
      </text>

      {isCantrip ? (
        <text
          x={MARGIN + BADGE_W + (SVG_W - MARGIN * 2 - BADGE_W) / 2}
          y={hdrY + HEADER_H / 2 + 0.5}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="5.5"
          fontWeight="700"
          fontFamily={ff}
          letterSpacing="0.5"
          fill="#1a1208"
        >
          CANTRIPS
        </text>
      ) : (
        <>
          <text
            x={MARGIN + BADGE_W + 3}
            y={hdrY + HEADER_H / 2 + 0.5}
            dominantBaseline="middle"
            fontSize="4.5"
            fontFamily={ff}
            fill="#6a5a48"
          >
            SLOTS TOTAL:
          </text>
          <text
            x={MARGIN + BADGE_W + 38}
            y={hdrY + HEADER_H / 2 + 0.5}
            dominantBaseline="middle"
            fontSize="7"
            fontWeight="700"
            fontFamily={ff}
            fill="#1a1208"
          >
            {slotsTotal}
          </text>
          <line
            x1={MARGIN + BADGE_W + 50}
            y1={hdrY + 2}
            x2={MARGIN + BADGE_W + 50}
            y2={hdrY + HEADER_H - 2}
            stroke="#1a1208"
            strokeWidth="0.5"
            opacity="0.4"
          />
        </>
      )}

      {/* Spell list */}
      {n > 0 &&
        spells.map((spell, i) => {
          const rowY = listStart + ROW_H * i;
          const rowCY = rowY + ROW_H / 2;

          const hasC = spell.tags.concentration;
          const hasR = spell.tags.ritual;
          const hasBonus = isBonusAction(spell.castingTime);
          const hasReaction = isReaction(spell.castingTime);
          const comp = componentStr(spell.components);
          const hasTags = hasC || hasR || hasBonus || hasReaction;

          // Active badges, left-to-right display order: Ritual, Concentration, Bonus Action, Reaction.
          const badgeDefs: BadgeDef[] = [
            hasR && { kind: "square" as const, label: "R" },
            hasC && { kind: "circle" as const, label: "C" },
            hasBonus && { kind: "circle" as const, label: "B" },
            hasReaction && { kind: "circle" as const, label: "R" },
          ].filter((b): b is BadgeDef => Boolean(b));

          // Pack right-to-left so the last item in display order sits rightmost.
          let xRight = ROW_RIGHT;
          const badges = [...badgeDefs].reverse().map((b) => {
            const x1 = xRight - TAG_SIZE;
            const cx = xRight - TAG_RADIUS;
            xRight = x1 - 1;
            return { ...b, x1, cx };
          }).reverse();

          const tagY1 = rowY + 1; // top edge of badge shapes
          const tagCY = tagY1 + TAG_RADIUS; // vertical center for square/circle labels

          // VSM y: bottom of row when tags present, centered otherwise
          const vsmY = hasTags && comp ? rowY + ROW_H - 2 : rowCY;

          return (
            <g key={spell.id}>
              {i > 0 && (
                <line
                  x1={MARGIN}
                  y1={rowY}
                  x2={SVG_W - MARGIN}
                  y2={rowY}
                  stroke="#1a1208"
                  strokeWidth="0.2"
                  opacity="0.3"
                />
              )}

              {/* Bullet — solid diamond for always-prepared spells, faint hollow circle otherwise */}
              <text
                x={8}
                y={rowCY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={spell.tags.alwaysPrepared ? "4.5" : "7"}
                fontFamily={ff}
                fill="#1a1208"
                opacity={spell.tags.alwaysPrepared ? 1 : 0.35}
              >
                {spell.tags.alwaysPrepared ? "◆" : "○"}
              </text>

              {/* Spell name — clipped to leave room for badge column */}
              <text
                x={14}
                y={rowCY}
                dominantBaseline="middle"
                fontSize="6"
                fontFamily={ff}
                fill="#1a1208"
                clipPath={`url(#${clipId}-name)`}
              >
                {spell.name}
              </text>

              {/* Tag badges — square (Ritual), circle (Concentration / Bonus Action / Reaction) */}
              {badges.map((b, bi) => (
                <g key={bi}>
                  {b.kind === "square" ? (
                    <rect
                      x={b.x1}
                      y={tagY1}
                      width={TAG_SIZE}
                      height={TAG_SIZE}
                      fill="#1a1208"
                    />
                  ) : (
                    <circle cx={b.cx} cy={tagCY} r={TAG_RADIUS} fill="#1a1208" />
                  )}
                  <text
                    x={b.kind === "circle" ? b.cx : b.x1 + TAG_SIZE / 2}
                    y={tagCY + 0.5}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="3.5"
                    fontWeight="700"
                    fontFamily={ff}
                    fill="#f5f0e8"
                  >
                    {b.label}
                  </text>
                </g>
              ))}

              {/* Component letters — below tags, or vertically centered if no tags */}
              {comp && (
                <text
                  x={ROW_RIGHT}
                  y={vsmY}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize="4.5"
                  fontFamily={ff}
                  fill="#6a5a48"
                >
                  {comp}
                </text>
              )}
            </g>
          );
        })}
    </svg>
  );
}

export function SpellLevel0Widget() {
  return <SpellLevelBlock level={0} />;
}
export function SpellLevel1Widget() {
  return <SpellLevelBlock level={1} />;
}
export function SpellLevel2Widget() {
  return <SpellLevelBlock level={2} />;
}
export function SpellLevel3Widget() {
  return <SpellLevelBlock level={3} />;
}
export function SpellLevel4Widget() {
  return <SpellLevelBlock level={4} />;
}
export function SpellLevel5Widget() {
  return <SpellLevelBlock level={5} />;
}
export function SpellLevel6Widget() {
  return <SpellLevelBlock level={6} />;
}
export function SpellLevel7Widget() {
  return <SpellLevelBlock level={7} />;
}
export function SpellLevel8Widget() {
  return <SpellLevelBlock level={8} />;
}
export function SpellLevel9Widget() {
  return <SpellLevelBlock level={9} />;
}
