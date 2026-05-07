// Shared decorative SVG frame elements for D&D-style widgets.
// Returns raw SVG elements — must be used inside an <svg>.

type Props = {
  x: number
  y: number
  w: number
  h: number
  cornerOff?: number
}

export function DndFrame({ x, y, w, h, cornerOff = 10 }: Props) {
  const r = x + w
  const b = y + h
  const co = cornerOff
  const midY = y + h / 2

  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx="2" fill="white" stroke="#1a1208" strokeWidth="1.3" />
      <rect x={x + 2.5} y={y + 2.5} width={w - 5} height={h - 5} rx="1.5" fill="none" stroke="#1a1208" strokeWidth="0.4" />

      {/* Corner flourishes — arc hugging each corner from outside */}
      <path d={`M${x},${y + co} Q${x - 1},${y} ${x + co},${y}`} stroke="#1a1208" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d={`M${r},${y + co} Q${r + 1},${y} ${r - co},${y}`} stroke="#1a1208" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d={`M${x},${b - co} Q${x - 1},${b} ${x + co},${b}`} stroke="#1a1208" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d={`M${r},${b - co} Q${r + 1},${b} ${r - co},${b}`} stroke="#1a1208" strokeWidth="1" fill="none" strokeLinecap="round" />

      {/* Side flourishes — only for boxes tall enough to warrant them */}
      {h >= 30 && (
        <>
          <path d={`M${x},${midY - 4} Q${x - 2.5},${midY} ${x},${midY + 4}`} stroke="#1a1208" strokeWidth="0.8" fill="none" strokeLinecap="round" />
          <path d={`M${r},${midY - 4} Q${r + 2.5},${midY} ${r},${midY + 4}`} stroke="#1a1208" strokeWidth="0.8" fill="none" strokeLinecap="round" />
        </>
      )}
    </>
  )
}
