"use client";

import { DndFrame } from "./dnd-frame";

// viewBox 90×90 — matches w=4, h=4 grid cells (square)
export function TempHpWidget() {
  const ff = "Georgia, 'Times New Roman', serif";

  return (
    <svg
      viewBox="0 0 90 90"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "100%" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <DndFrame x={3} y={3} w={84} h={84} cornerOff={9} />
      <line x1="6" y1="71" x2="84" y2="71" stroke="#1a1208" strokeWidth="0.5" />
      <text
        x="45"
        y="80"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="6"
        fontWeight="700"
        fontFamily={ff}
        letterSpacing="0.3"
        fill="#1a1208"
      >
        TEMP HP
      </text>
    </svg>
  );
}
