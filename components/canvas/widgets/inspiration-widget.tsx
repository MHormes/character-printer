"use client";

import { DndFrame } from "./dnd-frame";

// ViewBox 120×28. Horizontal banner with inspiration-token circle on left.
// Default canvas size: w=8, h=2 on 20-col A4 grid.
export function InspirationWidget() {
  return (
    <svg
      viewBox="0 0 120 28"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "100%" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <DndFrame x={4} y={3} w={112} h={22} cornerOff={9} />

      {/* Inspiration token circle */}
      <circle
        cx="17"
        cy="14"
        r="6.5"
        fill="white"
        stroke="#1a1208"
        strokeWidth="1.2"
      />

      <text
        x="70"
        y="14"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="5"
        fontWeight="700"
        fontFamily="Georgia, 'Times New Roman', serif"
        letterSpacing="0.8"
        fill="#1a1208"
      >
        INSPIRATION
      </text>
    </svg>
  );
}
