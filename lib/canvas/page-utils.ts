import type { CanvasPage, CanvasTemplateWidget, CanvasWidget } from "@/lib/types/canvas"
import { DEFAULT_CANVAS_COLS } from "@/lib/types/canvas"

type LegacyCanvasPage = {
  id: string
  widgets: CanvasWidget[]
}

type CanvasPageLike = CanvasPage | LegacyCanvasPage

export function rowsForCols(cols: number) {
  return Math.ceil((cols * 297) / 210)
}

export function normalizeCanvasPages(
  pages: CanvasPageLike[] | undefined,
  fallbackCols = DEFAULT_CANVAS_COLS,
): CanvasPage[] {
  if (!pages || pages.length === 0) {
    return [{ id: crypto.randomUUID(), cols: fallbackCols, widgets: [] }]
  }

  return pages.map((page) => ({
    id: page.id,
    cols: "cols" in page && typeof page.cols === "number" ? page.cols : fallbackCols,
    widgets: page.widgets ?? [],
  }))
}

export function stripWidgetIds(widgets: CanvasWidget[]): CanvasTemplateWidget[] {
  return widgets.map((widget) => {
    const { id, ...rest } = widget
    void id
    return rest
  })
}

export function instantiateTemplateWidgets(widgets: CanvasTemplateWidget[]): CanvasWidget[] {
  return widgets.map((widget) => ({ ...widget, id: crypto.randomUUID() }))
}

export function sanitizeTemplateWidgets(
  widgets: CanvasTemplateWidget[],
  validSpellIds: Set<string>,
  validFeatureIds: Set<string>,
  validStatIds: Set<string>,
): CanvasTemplateWidget[] {
  return widgets.map((widget) => ({
    ...widget,
    spellId: widget.spellId && validSpellIds.has(widget.spellId) ? widget.spellId : undefined,
    featureId:
      widget.featureId && validFeatureIds.has(widget.featureId) ? widget.featureId : undefined,
    statId: widget.statId && validStatIds.has(widget.statId) ? widget.statId : undefined,
  }))
}
