import { create } from "zustand"
import type { CanvasWidget, Rotation } from "@/lib/types/canvas"

const ROTATIONS: Rotation[] = [0, 90, 180, 270]

export type CanvasPage = { id: string; widgets: CanvasWidget[] }

type CanvasStore = {
  cols: number
  pages: CanvasPage[]
  currentPageIndex: number
  widgets: CanvasWidget[]  // mirrors pages[currentPageIndex].widgets — kept for backward compat
  selectedId: string | null
  setCanvasData: (cols: number, pages: CanvasPage[]) => void
  setCols: (cols: number) => void
  addPage: () => void
  deletePage: (index: number) => void
  setPage: (index: number) => void
  addWidget: (w: Omit<CanvasWidget, "id">) => void
  addWidgets: (ws: Omit<CanvasWidget, "id">[]) => void
  moveWidget: (id: string, col: number, row: number) => void
  rotateWidget: (id: string) => void
  toggleLock: (id: string) => void
  removeWidget: (id: string) => void
  setSelected: (id: string | null) => void
}

function patchPage(
  pages: CanvasPage[],
  index: number,
  fn: (ws: CanvasWidget[]) => CanvasWidget[]
): { pages: CanvasPage[]; widgets: CanvasWidget[] } {
  const next = pages.map((p, i) => i === index ? { ...p, widgets: fn(p.widgets) } : p)
  return { pages: next, widgets: next[index].widgets }
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  cols: 28,
  pages: [{ id: crypto.randomUUID(), widgets: [] }],
  currentPageIndex: 0,
  widgets: [],
  selectedId: null,

  setCanvasData: (cols, pages) => {
    const safe = pages.length > 0 ? pages : [{ id: crypto.randomUUID(), widgets: [] }]
    set({ cols, pages: safe, currentPageIndex: 0, widgets: safe[0].widgets, selectedId: null })
  },

  setCols: (cols) => set({ cols }),

  addPage: () => set((s) => {
    const newPage: CanvasPage = { id: crypto.randomUUID(), widgets: [] }
    const next = [...s.pages, newPage]
    return { pages: next, currentPageIndex: next.length - 1, widgets: [], selectedId: null }
  }),

  deletePage: (index) => set((s) => {
    if (s.pages.length <= 1) return s
    const next = s.pages.filter((_, i) => i !== index)
    const newIndex = Math.min(s.currentPageIndex, next.length - 1)
    return { pages: next, currentPageIndex: newIndex, widgets: next[newIndex].widgets, selectedId: null }
  }),

  setPage: (index) => set((s) => {
    const i = Math.max(0, Math.min(index, s.pages.length - 1))
    return { currentPageIndex: i, widgets: s.pages[i].widgets, selectedId: null }
  }),

  addWidget: (w) => set((s) =>
    patchPage(s.pages, s.currentPageIndex, (ws) => [...ws, { ...w, id: crypto.randomUUID() }])
  ),

  addWidgets: (newWidgets) => set((s) =>
    patchPage(s.pages, s.currentPageIndex, (ws) => [
      ...ws,
      ...newWidgets.map((w) => ({ ...w, id: crypto.randomUUID() })),
    ])
  ),

  moveWidget: (id, col, row) => set((s) =>
    patchPage(s.pages, s.currentPageIndex, (ws) =>
      ws.map((w) => (w.id === id ? { ...w, col, row } : w))
    )
  ),

  rotateWidget: (id) => set((s) => {
    const rows = Math.ceil((s.cols * 297) / 210)
    return patchPage(s.pages, s.currentPageIndex, (ws) =>
      ws.map((w) => {
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
      })
    )
  }),

  toggleLock: (id) => set((s) =>
    patchPage(s.pages, s.currentPageIndex, (ws) =>
      ws.map((w) => (w.id === id ? { ...w, locked: !w.locked } : w))
    )
  ),

  removeWidget: (id) => set((s) => ({
    ...patchPage(s.pages, s.currentPageIndex, (ws) => ws.filter((w) => w.id !== id)),
    selectedId: s.selectedId === id ? null : s.selectedId,
  })),

  setSelected: (selectedId) => set({ selectedId }),
}))
