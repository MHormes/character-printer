import { create } from "zustand"
import { arrayMove } from "@dnd-kit/sortable"
import { instantiateTemplateWidgets, normalizeCanvasPages } from "@/lib/canvas/page-utils"
import {
  DEFAULT_CANVAS_COLS,
  type CanvasPage,
  type CanvasTemplateWidget,
  type CanvasWidget,
  type Rotation,
} from "@/lib/types/canvas"

const ROTATIONS: Rotation[] = [0, 90, 180, 270]
const MAX_HISTORY = 20

type HistoryEntry = { pages: CanvasPage[]; currentPageIndex: number }

type CanvasStore = {
  cols: number
  pages: CanvasPage[]
  currentPageIndex: number
  widgets: CanvasWidget[]
  selectedIds: Set<string>
  lastSelectedId: string | null
  history: HistoryEntry[]
  future: HistoryEntry[]
  setCanvasData: (pages: CanvasPage[]) => void
  setCols: (cols: number) => void
  addPage: () => void
  deletePage: (index: number) => void
  setPage: (index: number) => void
  addWidget: (w: Omit<CanvasWidget, "id">) => void
  addWidgets: (ws: Omit<CanvasWidget, "id">[]) => void
  addWidgetsMultiPage: (pageWidgets: { cols?: number; widgets: Omit<CanvasWidget, "id">[] }[]) => void
  moveWidget: (id: string, col: number, row: number) => void
  moveWidgets: (moves: { id: string; col: number; row: number }[]) => void
  rotateWidget: (id: string) => void
  toggleLock: (id: string) => void
  removeWidget: (id: string) => void
  setSelected: (id: string | null) => void
  toggleSelected: (id: string) => void
  clearSelected: () => void
  removeSelected: () => void
  toggleLockSelected: () => void
  undo: () => void
  redo: () => void
  updateWidgetData: (
    id: string,
    data: Partial<Pick<CanvasWidget, "spellId" | "featureId" | "statId" | "trackerId" | "textSource" | "w" | "h">>,
  ) => void
  replaceCurrentPage: (cols: number, widgets: CanvasTemplateWidget[]) => void
  reorderPages: (fromIndex: number, toIndex: number) => void
  insertPageAt: (index: number) => void
}

function patchPage(
  pages: CanvasPage[],
  index: number,
  fn: (page: CanvasPage) => CanvasPage,
): { pages: CanvasPage[]; cols: number; widgets: CanvasWidget[] } {
  const next = pages.map((page, i) => (i === index ? fn(page) : page))
  return { pages: next, cols: next[index].cols, widgets: next[index].widgets }
}

function snapshot(s: CanvasStore): HistoryEntry {
  return { pages: s.pages, currentPageIndex: s.currentPageIndex }
}

function pushHistory(s: CanvasStore): Pick<CanvasStore, "history" | "future"> {
  return {
    history: [...s.history.slice(-(MAX_HISTORY - 1)), snapshot(s)],
    future: [],
  }
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  cols: DEFAULT_CANVAS_COLS,
  pages: [{ id: crypto.randomUUID(), cols: DEFAULT_CANVAS_COLS, widgets: [] }],
  currentPageIndex: 0,
  widgets: [],
  selectedIds: new Set<string>(),
  lastSelectedId: null,
  history: [],
  future: [],

  setCanvasData: (pages) => {
    const safe = normalizeCanvasPages(pages, DEFAULT_CANVAS_COLS)
    set({
      cols: safe[0].cols,
      pages: safe,
      currentPageIndex: 0,
      widgets: safe[0].widgets,
      selectedIds: new Set(),
      lastSelectedId: null,
      history: [],
      future: [],
    })
  },

  setCols: (cols) => set((s) => ({
    ...pushHistory(s),
    ...patchPage(s.pages, s.currentPageIndex, (page) => ({ ...page, cols })),
  })),

  addPage: () => set((s) => {
    const newPage: CanvasPage = { id: crypto.randomUUID(), cols: DEFAULT_CANVAS_COLS, widgets: [] }
    const next = [...s.pages, newPage]
    return {
      ...pushHistory(s),
      cols: newPage.cols,
      pages: next,
      currentPageIndex: next.length - 1,
      widgets: [],
      selectedIds: new Set(),
      lastSelectedId: null,
    }
  }),

  deletePage: (index) => set((s) => {
    if (s.pages.length <= 1) return s
    const next = s.pages.filter((_, i) => i !== index)
    const newIndex = Math.min(s.currentPageIndex, next.length - 1)
    return {
      ...pushHistory(s),
      cols: next[newIndex].cols,
      pages: next,
      currentPageIndex: newIndex,
      widgets: next[newIndex].widgets,
      selectedIds: new Set(),
      lastSelectedId: null,
    }
  }),

  setPage: (index) => set((s) => {
    const i = Math.max(0, Math.min(index, s.pages.length - 1))
    return {
      cols: s.pages[i].cols,
      currentPageIndex: i,
      widgets: s.pages[i].widgets,
      selectedIds: new Set(),
      lastSelectedId: null,
    }
  }),

  addWidget: (w) => set((s) => ({
    ...pushHistory(s),
    ...patchPage(s.pages, s.currentPageIndex, (page) => ({
      ...page,
      widgets: [...page.widgets, { ...w, id: crypto.randomUUID() }],
    })),
  })),

  addWidgets: (newWidgets) => set((s) => ({
    ...pushHistory(s),
    ...patchPage(s.pages, s.currentPageIndex, (page) => ({
      ...page,
      widgets: [
        ...page.widgets,
        ...newWidgets.map((widget) => ({ ...widget, id: crypto.randomUUID() })),
      ],
    })),
  })),

  addWidgetsMultiPage: (pageWidgets) => set((s) => {
    if (pageWidgets.length === 0) return s
    const [first, ...rest] = pageWidgets
    const patched = patchPage(s.pages, s.currentPageIndex, (page) => ({
      ...page,
      cols: first.cols ?? page.cols,
      widgets: [
        ...page.widgets,
        ...first.widgets.map((widget) => ({ ...widget, id: crypto.randomUUID() })),
      ],
    }))
    if (rest.length === 0) return { ...pushHistory(s), ...patched }

    const insertAt = s.currentPageIndex + 1
    const newPages = rest.map((chunk) => ({
      id: crypto.randomUUID(),
      cols: chunk.cols ?? DEFAULT_CANVAS_COLS,
      widgets: chunk.widgets.map((widget) => ({ ...widget, id: crypto.randomUUID() })),
    }))
    const pages = [
      ...patched.pages.slice(0, insertAt),
      ...newPages,
      ...patched.pages.slice(insertAt),
    ]

    return {
      ...pushHistory(s),
      cols: pages[s.currentPageIndex].cols,
      pages,
      widgets: pages[s.currentPageIndex].widgets,
    }
  }),

  moveWidget: (id, col, row) => set((s) => ({
    ...pushHistory(s),
    ...patchPage(s.pages, s.currentPageIndex, (page) => ({
      ...page,
      widgets: page.widgets.map((widget) => (widget.id === id ? { ...widget, col, row } : widget)),
    })),
  })),

  moveWidgets: (moves) => set((s) => {
    const moveMap = new Map(moves.map(m => [m.id, m]))
    return {
      ...pushHistory(s),
      ...patchPage(s.pages, s.currentPageIndex, (page) => ({
        ...page,
        widgets: page.widgets.map(w => {
          const m = moveMap.get(w.id)
          return m ? { ...w, col: m.col, row: m.row } : w
        }),
      })),
    }
  }),

  rotateWidget: (id) => set((s) => {
    const rows = Math.ceil((s.cols * 297) / 210)
    return {
      ...pushHistory(s),
      ...patchPage(s.pages, s.currentPageIndex, (page) => ({
        ...page,
        widgets: page.widgets.map((widget) => {
          if (widget.id !== id) return widget
          const newW = widget.h
          const newH = widget.w
          return {
            ...widget,
            rotation: ROTATIONS[(ROTATIONS.indexOf(widget.rotation) + 1) % 4],
            w: newW,
            h: newH,
            col: Math.min(widget.col, s.cols - newW),
            row: Math.min(widget.row, rows - newH),
          }
        }),
      })),
    }
  }),

  toggleLock: (id) => set((s) => ({
    ...pushHistory(s),
    ...patchPage(s.pages, s.currentPageIndex, (page) => ({
      ...page,
      widgets: page.widgets.map((widget) =>
        widget.id === id ? { ...widget, locked: !widget.locked } : widget,
      ),
    })),
  })),

  removeWidget: (id) => set((s) => {
    const nextIds = new Set(s.selectedIds)
    nextIds.delete(id)
    return {
      ...pushHistory(s),
      ...patchPage(s.pages, s.currentPageIndex, (page) => ({
        ...page,
        widgets: page.widgets.filter((widget) => widget.id !== id),
      })),
      selectedIds: nextIds,
      lastSelectedId: s.lastSelectedId === id ? (nextIds.size > 0 ? [...nextIds][0] : null) : s.lastSelectedId,
    }
  }),

  setSelected: (id) => set(id === null
    ? { selectedIds: new Set(), lastSelectedId: null }
    : { selectedIds: new Set([id]), lastSelectedId: id }
  ),

  toggleSelected: (id) => set((s) => {
    const next = new Set(s.selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    return { selectedIds: next, lastSelectedId: next.size > 0 ? id : null }
  }),

  clearSelected: () => set({ selectedIds: new Set(), lastSelectedId: null }),

  removeSelected: () => set((s) => {
    const toRemove = new Set(
      s.widgets.filter(w => s.selectedIds.has(w.id) && !w.locked).map(w => w.id)
    )
    return {
      ...pushHistory(s),
      ...patchPage(s.pages, s.currentPageIndex, (page) => ({
        ...page,
        widgets: page.widgets.filter(w => !toRemove.has(w.id)),
      })),
      selectedIds: new Set(),
      lastSelectedId: null,
    }
  }),

  toggleLockSelected: () => set((s) => ({
    ...pushHistory(s),
    ...patchPage(s.pages, s.currentPageIndex, (page) => ({
      ...page,
      widgets: page.widgets.map(w =>
        s.selectedIds.has(w.id) ? { ...w, locked: !w.locked } : w
      ),
    })),
  })),

  undo: () => set((s) => {
    if (s.history.length === 0) return s
    const prev = s.history[s.history.length - 1]
    return {
      history: s.history.slice(0, -1),
      future: [snapshot(s), ...s.future].slice(0, MAX_HISTORY),
      pages: prev.pages,
      currentPageIndex: prev.currentPageIndex,
      cols: prev.pages[prev.currentPageIndex].cols,
      widgets: prev.pages[prev.currentPageIndex].widgets,
      selectedIds: new Set(),
      lastSelectedId: null,
    }
  }),

  redo: () => set((s) => {
    if (s.future.length === 0) return s
    const next = s.future[0]
    return {
      history: [...s.history, snapshot(s)].slice(-MAX_HISTORY),
      future: s.future.slice(1),
      pages: next.pages,
      currentPageIndex: next.currentPageIndex,
      cols: next.pages[next.currentPageIndex].cols,
      widgets: next.pages[next.currentPageIndex].widgets,
      selectedIds: new Set(),
      lastSelectedId: null,
    }
  }),

  updateWidgetData: (id, data) => set((s) => ({
    ...pushHistory(s),
    ...patchPage(s.pages, s.currentPageIndex, (page) => ({
      ...page,
      widgets: page.widgets.map((widget) => (widget.id === id ? { ...widget, ...data } : widget)),
    })),
  })),

  replaceCurrentPage: (cols, widgets) => set((s) => ({
    ...pushHistory(s),
    ...patchPage(s.pages, s.currentPageIndex, (page) => ({
      ...page,
      cols,
      widgets: instantiateTemplateWidgets(widgets),
    })),
  })),

  reorderPages: (fromIndex, toIndex) => set((s) => {
    const pages = arrayMove(s.pages, fromIndex, toIndex)
    const movedId = s.pages[s.currentPageIndex].id
    const newCurrentIndex = pages.findIndex((p) => p.id === movedId)
    return {
      ...pushHistory(s),
      pages,
      currentPageIndex: newCurrentIndex,
      cols: pages[newCurrentIndex].cols,
      widgets: pages[newCurrentIndex].widgets,
    }
  }),

  insertPageAt: (index) => set((s) => {
    const newPage: CanvasPage = { id: crypto.randomUUID(), cols: DEFAULT_CANVAS_COLS, widgets: [] }
    const pages = [...s.pages.slice(0, index), newPage, ...s.pages.slice(index)]
    return {
      ...pushHistory(s),
      pages,
      currentPageIndex: index,
      cols: DEFAULT_CANVAS_COLS,
      widgets: [],
      selectedIds: new Set(),
      lastSelectedId: null,
    }
  }),
}))
