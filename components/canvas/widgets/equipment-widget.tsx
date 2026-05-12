"use client";

import { useCharacterStore } from "@/lib/store/character-store";
import {
  isOverCarryCapacity,
  resolveEquippedWeight,
} from "@/lib/character/calculations";
import { DndFrame } from "./dnd-frame";

// viewBox width 132 — matches w=9 palette columns
const COIN_CX = [20, 44, 68, 92, 116] as const;
const COIN_LABELS = ["CP", "SP", "EP", "GP", "PP"] as const;
const COIN_R = 9;
const COIN_Y = 26;

// Column x positions
const CHK_X = 11; // checkbox center
const QTY_X = 26; // qty box center
const NAME_X = 37; // name text start
const WT_CENTER = 119; // weight center
const C_CHK = 18; // divider after checkbox col
const C_QTY = 35; // divider after qty col
const C_WT = 110; // divider before weight col

const COIN_DIV_Y = 40;
const TBL_HDR_Y = 47;
const TBL_DIV_Y = 55;
const DATA_START = 55;
const ROW_H = 11;
const BTN_DIV_Y_OFFSET = 2; // margin after data
const WGT_H = 22; // divider + label + value + padding

// SVG height: 3 top + 37 currency/header + n×11 rows + 22 bottom
export function equipmentSvgH(n: number) {
  const rows = n + 3; // Always add 3 empty slots
  return DATA_START + rows * ROW_H + WGT_H + 3;
}

function hexPath(cx: number, cy: number, r: number) {
  const h = (r * Math.sqrt(3)) / 2;
  return `M${cx + r},${cy} L${cx + r / 2},${cy - h} L${cx - r / 2},${cy - h} L${cx - r},${cy} L${cx - r / 2},${cy + h} L${cx + r / 2},${cy + h} Z`;
}

export function EquipmentWidget() {
  const character = useCharacterStore((s) => s.character);
  if (!character) return null;

  const { inventory, currency } = character;
  const cur = currency ?? { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
  const coinValues = [cur.cp, cur.sp, cur.ep, cur.gp, cur.pp];

  const totalWeight = resolveEquippedWeight(character);
  const overCapacity = isOverCarryCapacity(character);
  const weightStr = Number.isInteger(totalWeight)
    ? String(totalWeight)
    : totalWeight.toFixed(2);

  const extraSlots = 3;
  const n = inventory.length + extraSlots;
  const svgH = equipmentSvgH(inventory.length);
  const frameH = svgH - 6;
  const dataBot = DATA_START + n * ROW_H;
  const wgtDivY = dataBot + BTN_DIV_Y_OFFSET;
  const wgtLblY = wgtDivY + 5;
  const wgtValY = wgtLblY + 8;

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
      viewBox={`0 0 132 ${svgH}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      <DndFrame x={3} y={3} w={126} h={frameH} cornerOff={10} />

      {/* ── Currency row ── */}
      {COIN_CX.map((cx, i) => (
        <g key={COIN_LABELS[i]}>
          <text x={cx} y={11} {...tf} fontSize="5">
            {COIN_LABELS[i]}
          </text>
          <path
            d={hexPath(cx, COIN_Y, COIN_R)}
            fill="#f5f0e8"
            stroke="#1a1208"
            strokeWidth="0.9"
          />
          <text
            x={cx}
            y={COIN_Y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="7"
            fontWeight="700"
            fontFamily={ff}
            fill="#1a1208"
          >
            {coinValues[i] || ""}
          </text>
        </g>
      ))}

      {/* Currency / table divider */}
      <line
        x1={3}
        y1={COIN_DIV_Y}
        x2={129}
        y2={COIN_DIV_Y}
        stroke="#1a1208"
        strokeWidth="0.5"
      />

      {/* Column dividers (full table height) */}
      <line
        x1={C_CHK}
        y1={COIN_DIV_Y}
        x2={C_CHK}
        y2={wgtDivY}
        stroke="#1a1208"
        strokeWidth="0.4"
        opacity="0.6"
      />
      <line
        x1={C_QTY}
        y1={COIN_DIV_Y}
        x2={C_QTY}
        y2={wgtDivY}
        stroke="#1a1208"
        strokeWidth="0.4"
        opacity="0.6"
      />
      <line
        x1={C_WT}
        y1={COIN_DIV_Y}
        x2={C_WT}
        y2={wgtDivY}
        stroke="#1a1208"
        strokeWidth="0.4"
        opacity="0.6"
      />

      {/* Table header row */}
      <text x={CHK_X} y={TBL_HDR_Y} {...tf} fontSize="5">
        EQ
      </text>
      <text x={QTY_X} y={TBL_HDR_Y} {...tf} fontSize="5">
        QTY
      </text>
      <text x={(C_QTY + C_WT) / 2} y={TBL_HDR_Y} {...tf} fontSize="5">
        ITEM
      </text>
      <text x={WT_CENTER} y={TBL_HDR_Y} {...tf} fontSize="5">
        WT
      </text>

      {/* Header divider */}
      <line
        x1={3}
        y1={TBL_DIV_Y}
        x2={129}
        y2={TBL_DIV_Y}
        stroke="#1a1208"
        strokeWidth="0.5"
      />

      {/* Data rows */}
      {inventory.map((item, i) => {
        const cy = DATA_START + ROW_H * i + ROW_H / 2;
        const qty = item.quantity ?? 1;
        return (
          <g key={item.id}>
            {/* Equipped checkbox box */}
            <rect
              x={CHK_X - 3}
              y={cy - 3}
              width={6}
              height={6}
              rx="1"
              fill={item.equipped ? "#1a1208" : "#f5f0e8"}
              stroke="#1a1208"
              strokeWidth="0.6"
            />
            {item.equipped && (
              <path
                d={`M${CHK_X - 2},${cy} L${CHK_X - 0.5},${cy + 1.5} L${CHK_X + 2},${cy - 1.5}`}
                stroke="white"
                strokeWidth="0.8"
                fill="none"
                strokeLinecap="round"
              />
            )}
            {/* Name */}
            <text
              x={NAME_X}
              y={cy}
              textAnchor="start"
              {...df}
              fontSize="5.5"
              fontWeight={item.equipped ? "700" : "400"}
              style={{
                textOverflow: "ellipsis",
                overflow: "hidden",
                whiteSpace: "nowrap",
                maxWidth: `${C_WT - NAME_X - 2}px`,
              }}
            >
              {item.name}
            </text>
            {/* Weight */}
            <text
              x={WT_CENTER}
              y={cy}
              textAnchor="middle"
              {...df}
              fontSize="5.5"
            >
              {item.weight * qty}
            </text>
            <line
              x1={3}
              y1={DATA_START + ROW_H * (i + 1)}
              x2={129}
              y2={DATA_START + ROW_H * (i + 1)}
              stroke="#1a1208"
              strokeWidth="0.3"
              opacity="0.4"
            />
          </g>
        );
      })}
      {/* 3 mandatory empty rows */}
      {Array.from({ length: extraSlots }).map((_, i) => {
        const rowIdx = inventory.length + i;
        const cy = DATA_START + ROW_H * rowIdx + ROW_H / 2;
        return (
          <g key={`empty-${i}`}>
            <rect
              x={CHK_X - 3}
              y={cy - 3}
              width={6}
              height={6}
              rx="1"
              fill="#f5f0e8"
              stroke="#1a1208"
              strokeWidth="0.6"
            />
            <line
              x1={3}
              y1={DATA_START + ROW_H * (rowIdx + 1)}
              x2={129}
              y2={DATA_START + ROW_H * (rowIdx + 1)}
              stroke="#1a1208"
              strokeWidth="0.3"
              opacity="0.4"
            />
          </g>
        );
      })}

      {/* Total weight */}
      <line
        x1={6}
        y1={wgtDivY}
        x2={126}
        y2={wgtDivY}
        stroke="#1a1208"
        strokeWidth="0.5"
      />
      <text x="66" y={wgtLblY} {...tf} fontSize="4" letterSpacing="0.5">
        TOTAL WEIGHT
      </text>
      <text
        x="66"
        y={wgtValY}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="6"
        fontWeight="700"
        fontFamily={ff}
        fill={overCapacity ? "#b42318" : "#1a1208"}
      >
        {weightStr}
      </text>
    </svg>
  );
}
