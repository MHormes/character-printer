import { create } from "zustand"
import type { CanvasWidget, Rotation } from "@/lib/types/canvas"

const ROTATIONS: Rotation[] = [0, 90, 180, 270]

type CanvasStore = {
  cols: number
  widgets: CanvasWidget[]
  selectedId: string | null
  setCanvasData: (cols: number, widgets: CanvasWidget[]) => void
  setCols: (cols: number) => void
  addWidget: (w: Omit<CanvasWidget, "id">) => void
  moveWidget: (id: string, col: number, row: number) => void
  rotateWidget: (id: string) => void
  toggleLock: (id: string) => void
  removeWidget: (id: string) => void
  setSelected: (id: string | null) => void
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  cols: 20,
  widgets: [],
  selectedId: null,
  setCanvasData: (cols, widgets) => set({ cols, widgets }),
  setCols: (cols) => set({ cols }),
  addWidget: (w) =>
    set((s) => ({ widgets: [...s.widgets, { ...w, id: crypto.randomUUID() }] })),
  moveWidget: (id, col, row) =>
    set((s) => ({
      widgets: s.widgets.map((w) => (w.id === id ? { ...w, col, row } : w)),
    })),
  rotateWidget: (id) =>
    set((s) => {
      const rows = Math.ceil((s.cols * 297) / 210)
      return {
        widgets: s.widgets.map((w) => {
          if (w.id !== id) return w
          const newW = w.h
          const newH = w.w
          return {
            ...w,
            rotation: ROTATIONS[(ROTATIONS.indexOf(w.rotation) + 1) % 4],
            w: newW,
            h: newH,
            col: Math.min(w.col, s.cols - newW),
            row: Math.min(w.row, rows - newH),
          }
        }),
      }
    }),
  toggleLock: (id) =>
    set((s) => ({
      widgets: s.widgets.map((w) => (w.id === id ? { ...w, locked: !w.locked } : w)),
    })),
  removeWidget: (id) =>
    set((s) => ({
      widgets: s.widgets.filter((w) => w.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),
  setSelected: (selectedId) => set({ selectedId }),
}))
