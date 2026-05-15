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

type CanvasStore = {
  cols: number
  pages: CanvasPage[]
  currentPageIndex: number
  widgets: CanvasWidget[]
  selectedId: string | null
  setCanvasData: (pages: CanvasPage[]) => void
  setCols: (cols: number) => void
  addPage: () => void
  deletePage: (index: number) => void
  setPage: (index: number) => void
  addWidget: (w: Omit<CanvasWidget, "id">) => void
  addWidgets: (ws: Omit<CanvasWidget, "id">[]) => void
  addWidgetsMultiPage: (pageWidgets: { cols?: number; widgets: Omit<CanvasWidget, "id">[] }[]) => void
  moveWidget: (id: string, col: number, row: number) => void
  rotateWidget: (id: string) => void
  toggleLock: (id: string) => void
  removeWidget: (id: string) => void
  setSelected: (id: string | null) => void
  updateWidgetData: (
    id: string,
    data: Partial<Pick<CanvasWidget, "spellId" | "featureId" | "statId" | "textSource" | "w" | "h">>,
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

export const useCanvasStore = create<CanvasStore>((set) => ({
  cols: DEFAULT_CANVAS_COLS,
  pages: [{ id: crypto.randomUUID(), cols: DEFAULT_CANVAS_COLS, widgets: [] }],
  currentPageIndex: 0,
  widgets: [],
  selectedId: null,

  setCanvasData: (pages) => {
    const safe = normalizeCanvasPages(pages, DEFAULT_CANVAS_COLS)
    set({
      cols: safe[0].cols,
      pages: safe,
      currentPageIndex: 0,
      widgets: safe[0].widgets,
      selectedId: null,
    })
  },

  setCols: (cols) => set((s) =>
    patchPage(s.pages, s.currentPageIndex, (page) => ({ ...page, cols }))
  ),

  addPage: () => set((s) => {
    const newPage: CanvasPage = { id: crypto.randomUUID(), cols: DEFAULT_CANVAS_COLS, widgets: [] }
    const next = [...s.pages, newPage]
    return {
      cols: newPage.cols,
      pages: next,
      currentPageIndex: next.length - 1,
      widgets: [],
      selectedId: null,
    }
  }),

  deletePage: (index) => set((s) => {
    if (s.pages.length <= 1) return s
    const next = s.pages.filter((_, i) => i !== index)
    const newIndex = Math.min(s.currentPageIndex, next.length - 1)
    return {
      cols: next[newIndex].cols,
      pages: next,
      currentPageIndex: newIndex,
      widgets: next[newIndex].widgets,
      selectedId: null,
    }
  }),

  setPage: (index) => set((s) => {
    const i = Math.max(0, Math.min(index, s.pages.length - 1))
    return {
      cols: s.pages[i].cols,
      currentPageIndex: i,
      widgets: s.pages[i].widgets,
      selectedId: null,
    }
  }),

  addWidget: (w) => set((s) =>
    patchPage(s.pages, s.currentPageIndex, (page) => ({
      ...page,
      widgets: [...page.widgets, { ...w, id: crypto.randomUUID() }],
    }))
  ),

  addWidgets: (newWidgets) => set((s) =>
    patchPage(s.pages, s.currentPageIndex, (page) => ({
      ...page,
      widgets: [
        ...page.widgets,
        ...newWidgets.map((widget) => ({ ...widget, id: crypto.randomUUID() })),
      ],
    }))
  ),

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
    if (rest.length === 0) return patched

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
      cols: pages[s.currentPageIndex].cols,
      pages,
      widgets: pages[s.currentPageIndex].widgets,
    }
  }),

  moveWidget: (id, col, row) => set((s) =>
    patchPage(s.pages, s.currentPageIndex, (page) => ({
      ...page,
      widgets: page.widgets.map((widget) => (widget.id === id ? { ...widget, col, row } : widget)),
    }))
  ),

  rotateWidget: (id) => set((s) => {
    const rows = Math.ceil((s.cols * 297) / 210)
    return patchPage(s.pages, s.currentPageIndex, (page) => ({
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
    }))
  }),

  toggleLock: (id) => set((s) =>
    patchPage(s.pages, s.currentPageIndex, (page) => ({
      ...page,
      widgets: page.widgets.map((widget) =>
        widget.id === id ? { ...widget, locked: !widget.locked } : widget,
      ),
    }))
  ),

  removeWidget: (id) => set((s) => ({
    ...patchPage(s.pages, s.currentPageIndex, (page) => ({
      ...page,
      widgets: page.widgets.filter((widget) => widget.id !== id),
    })),
    selectedId: s.selectedId === id ? null : s.selectedId,
  })),

  setSelected: (selectedId) => set({ selectedId }),

  updateWidgetData: (id, data) => set((s) =>
    patchPage(s.pages, s.currentPageIndex, (page) => ({
      ...page,
      widgets: page.widgets.map((widget) => (widget.id === id ? { ...widget, ...data } : widget)),
    }))
  ),

  replaceCurrentPage: (cols, widgets) => set((s) =>
    patchPage(s.pages, s.currentPageIndex, (page) => ({
      ...page,
      cols,
      widgets: instantiateTemplateWidgets(widgets),
    }))
  ),

  reorderPages: (fromIndex, toIndex) => set((s) => {
    const pages = arrayMove(s.pages, fromIndex, toIndex)
    // Follow the active page to its new position
    const movedId = s.pages[s.currentPageIndex].id
    const newCurrentIndex = pages.findIndex((p) => p.id === movedId)
    return {
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
      pages,
      currentPageIndex: index,
      cols: DEFAULT_CANVAS_COLS,
      widgets: [],
      selectedId: null,
    }
  }),
}))
