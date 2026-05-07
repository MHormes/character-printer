"use client";

import { useCharacterStore } from "@/lib/store/character-store";
import { DndFrame } from "./dnd-frame";
import type { ActionEntry } from "@/lib/types/character";

const C1 = 82;
const C2 = 106;
const RIGHT = 173;
const ROW_H = 12;
const HEADER_Y = 20;

// SVG height: 3 + 17 header + n×12 rows + 1 padding
export function slimAttacksSvgH(n: number) {
  return 21 + ROW_H * Math.max(1, n);
}

export function SlimAttacksWidget() {
  const character = useCharacterStore((s) => s.character);
  if (!character) return null;

  const { actions, attributes, identity } = character;
  const pb = Math.ceil(identity.level / 4) + 1;

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
    if (a.mode === "DC") {
      const dc =
        a.fixedDC ?? 8 + pb + (a.attackStat ? attrMod(a.attackStat) : 0);
      return `DC ${dc}`;
    }
    const statMod = a.attackStat ? attrMod(a.attackStat) : 0;
    return fmtBonus(statMod + (a.attackProficient ? pb : 0) + a.attackBonus);
  }

  function dmgStr(a: ActionEntry) {
    const d = a.damageStack.find((e) => e.active);
    if (!d) return "—";
    const statMod = d.stat ? attrMod(d.stat) : 0;
    const bonus = d.flatBonus + statMod;
    const bStr = bonus > 0 ? `+${bonus}` : bonus < 0 ? `${bonus}` : "";
    return `${d.diceCount}${d.dieType}${bStr} ${d.type}`;
  }

  const n = Math.max(1, actions.length);
  const svgH = slimAttacksSvgH(actions.length);
  const frameH = svgH - 4; // 3 top margin + 1 padding
  const frameBot = 3 + frameH;
  const rowCY = (i: number) => HEADER_Y + ROW_H * i + ROW_H / 2;

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
      {actions.map((a, i) => (
        <g key={a.id}>
          <text
            x={7}
            y={rowCY(i)}
            textAnchor="start"
            {...df}
            fontSize="6"
            fontWeight="600"
          >
            {a.name}
          </text>
          <text
            x={(C1 + C2) / 2}
            y={rowCY(i)}
            textAnchor="middle"
            {...df}
            fontSize="6.5"
            fontWeight="700"
          >
            {atkStr(a)}
          </text>
          <text
            x={C2 + 2}
            y={rowCY(i)}
            textAnchor="start"
            {...df}
            fontSize="5.5"
            fontWeight="400"
          >
            {dmgStr(a)}
          </text>
          {i < actions.length - 1 && (
            <line
              x1={3}
              y1={HEADER_Y + ROW_H * (i + 1)}
              x2={RIGHT}
              y2={HEADER_Y + ROW_H * (i + 1)}
              stroke="#1a1208"
              strokeWidth="0.3"
              opacity="0.5"
            />
          )}
        </g>
      ))}

      {/* Final bottom divider */}
      <line
        x1={3}
        y1={HEADER_Y + ROW_H * n}
        x2={RIGHT}
        y2={HEADER_Y + ROW_H * n}
        stroke="#1a1208"
        strokeWidth="0.5"
      />
    </svg>
  );
}
