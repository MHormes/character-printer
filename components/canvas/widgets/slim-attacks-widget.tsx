"use client";

import { useCharacterStore } from "@/lib/store/character-store";
import { resolveSpellDc, resolveSpellAttack, resolvePb } from "@/lib/character/calculations";
import { formatDamageLines } from "@/lib/character/damage";
import { DndFrame } from "./dnd-frame";
import type { ActionEntry, AttributeKey } from "@/lib/types/character";

const C1 = 82;
const C2 = 106;
const RIGHT = 173;
const ROW_H = 12;
const ROW_WRAP_EXTRA = 6; // extra height for a row whose damage needs a 2nd line (AND overflow)
const DMG_LINE_GAP = 6;
const HEADER_Y = 20;

function actionRowH(a: ActionEntry, attrMod: (key: AttributeKey) => number) {
  return ROW_H + (formatDamageLines(a.damageStack, attrMod).length > 1 ? ROW_WRAP_EXTRA : 0);
}

// Approximate height for external layout sizing (no character context available yet,
// so bonus numbers are ignored — this only needs to be close, not exact).
export function slimAttacksSvgH(actions: ActionEntry[]) {
  if (actions.length === 0) return 21 + ROW_H;
  const rowsH = actions.reduce((sum, a) => sum + actionRowH(a, () => 0), 0);
  return 21 + rowsH;
}

// Whether any row needs its 2nd (AND-overflow) line — external layout sizing rounds
// height up rather than to nearest when this is true, so a wrap reliably grows the widget.
export function slimAttacksHasWrap(actions: ActionEntry[]): boolean {
  return actions.some((a) => formatDamageLines(a.damageStack, () => 0).length > 1);
}

export function SlimAttacksWidget() {
  const character = useCharacterStore((s) => s.character);
  if (!character) return null;

  const { actions, attributes } = character;
  const pb = resolvePb(character);

  const stkSum = (stack: { value: number; isActive: boolean }[]) =>
    stack.filter((m) => m.isActive).reduce((s, m) => s + m.value, 0);
  const attrTotal = (key: keyof typeof attributes) => {
    const a = attributes[key];
    return a.override ?? a.base + stkSum(a.stack);
  };
  const attrMod = (key: keyof typeof attributes) =>
    Math.floor((attrTotal(key) - 10) / 2);
  const fmtBonus = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

  function atkStr(a: ActionEntry) {
    if (a.mode === "Heal" || a.mode === "Plain") return "—";
    if (a.mode === "Spell") return fmtBonus(resolveSpellAttack(character!) + a.attackBonus);
    if (a.mode === "DC") return `DC ${a.fixedDC ?? resolveSpellDc(character!)}`;
    const statMod = a.attackStat ? attrMod(a.attackStat) : 0;
    return fmtBonus(statMod + (a.attackProficient ? pb : 0) + a.attackBonus);
  }

  const rowHeights = actions.length > 0 ? actions.map((a) => actionRowH(a, attrMod)) : [ROW_H];
  const rowTops: number[] = [];
  {
    let y = HEADER_Y;
    for (const h of rowHeights) {
      rowTops.push(y);
      y += h;
    }
  }
  const rowsTotalH = rowHeights.reduce((s, h) => s + h, 0);
  const svgH = 21 + rowsTotalH;
  const frameH = svgH - 4; // 3 top margin + 1 padding
  const frameBot = 3 + frameH;
  const lastRowBottom = rowTops[rowTops.length - 1] + rowHeights[rowHeights.length - 1];

  const ff = "Georgia, 'Times New Roman', serif";
  const tf = {
    textAnchor: "middle" as const,
    dominantBaseline: "middle" as const,
    fontSize: "5.5",
    fontWeight: "700",
    fontFamily: ff,
    letterSpacing: "0.3",
    fill: "#1a1208",
  };
  const df = {
    dominantBaseline: "middle" as const,
    fontFamily: ff,
    fill: "#1a1208",
  };

  return (
    <svg
      viewBox={`0 0 176 ${svgH}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      <DndFrame x={3} y={3} w={170} h={frameH} cornerOff={10} />

      <line
        x1={C1}
        y1={3}
        x2={C1}
        y2={frameBot}
        stroke="#1a1208"
        strokeWidth="0.5"
      />
      <line
        x1={C2}
        y1={3}
        x2={C2}
        y2={frameBot}
        stroke="#1a1208"
        strokeWidth="0.5"
      />

      <text x={(3 + C1) / 2} y={12} {...tf}>
        NAME
      </text>
      <text x={(C1 + C2) / 2} y={12} {...tf}>
        ATK
      </text>
      <text x={(C2 + RIGHT) / 2} y={12} {...tf}>
        DMG
      </text>
      <line
        x1={3}
        y1={HEADER_Y}
        x2={RIGHT}
        y2={HEADER_Y}
        stroke="#1a1208"
        strokeWidth="0.5"
      />

      {actions.length === 0 && (
        <text
          x={7}
          y={HEADER_Y + ROW_H / 2}
          textAnchor="start"
          {...df}
          fontSize="6"
          fontStyle="italic"
          fill="#6a5a48"
        >
          —
        </text>
      )}
      {actions.map((a, i) => {
        const rowTop = rowTops[i];
        const rowCenter = rowTop + rowHeights[i] / 2;
        const dmgLines = formatDamageLines(a.damageStack, attrMod);
        return (
          <g key={a.id}>
            <text
              x={7}
              y={rowCenter}
              textAnchor="start"
              {...df}
              fontSize="6"
              fontWeight="600"
            >
              {a.name}
            </text>
            <text
              x={(C1 + C2) / 2}
              y={rowCenter}
              textAnchor="middle"
              {...df}
              fontSize="6.5"
              fontWeight="700"
            >
              {atkStr(a)}
            </text>
            {dmgLines.length > 1 ? (
              <>
                <text x={C2 + 2} y={rowCenter - DMG_LINE_GAP / 2} textAnchor="start" {...df} fontSize="5.5" fontWeight="400">
                  {dmgLines[0]}
                </text>
                <text x={C2 + 2} y={rowCenter + DMG_LINE_GAP / 2} textAnchor="start" {...df} fontSize="5.5" fontWeight="400">
                  {dmgLines[1]}
                </text>
              </>
            ) : (
              <text x={C2 + 2} y={rowCenter} textAnchor="start" {...df} fontSize="5.5" fontWeight="400">
                {dmgLines[0] ?? "—"}
              </text>
            )}
            {i < actions.length - 1 && (
              <line
                x1={3}
                y1={rowTops[i + 1]}
                x2={RIGHT}
                y2={rowTops[i + 1]}
                stroke="#1a1208"
                strokeWidth="0.3"
                opacity="0.5"
              />
            )}
          </g>
        );
      })}

      {/* Final bottom divider */}
      <line
        x1={3}
        y1={lastRowBottom}
        x2={RIGHT}
        y2={lastRowBottom}
        stroke="#1a1208"
        strokeWidth="0.5"
      />
    </svg>
  );
}
