"use client"

import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TourStep } from "@/lib/tour/tour-steps"

const TOOLTIP_WIDTH = 288
const TOOLTIP_GAP = 12

type Props = {
  step: TourStep
  stepIndex: number
  totalSteps: number
  targetRect: DOMRect | null
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function computePosition(rect: DOMRect, position: TourStep["position"]) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const MARGIN = 8

  let top: number | undefined
  let left: number | undefined
  let right: number | undefined
  let bottom: number | undefined

  if (position === "right") {
    left = clamp(rect.right + TOOLTIP_GAP, MARGIN, vw - TOOLTIP_WIDTH - MARGIN)
    top = clamp(rect.top + rect.height / 2 - 80, MARGIN, vh - MARGIN)
  } else if (position === "left") {
    right = clamp(vw - rect.left + TOOLTIP_GAP, MARGIN, vw - TOOLTIP_WIDTH - MARGIN)
    top = clamp(rect.top + rect.height / 2 - 80, MARGIN, vh - MARGIN)
  } else if (position === "bottom") {
    top = clamp(rect.bottom + TOOLTIP_GAP, MARGIN, vh - MARGIN)
    left = clamp(rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2, MARGIN, vw - TOOLTIP_WIDTH - MARGIN)
  } else if (position === "top") {
    bottom = clamp(vh - rect.top + TOOLTIP_GAP, MARGIN, vh - MARGIN)
    left = clamp(rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2, MARGIN, vw - TOOLTIP_WIDTH - MARGIN)
  }

  return { top, left, right, bottom }
}

export function TourTooltip({ step, stepIndex, totalSteps, targetRect, onNext, onPrev, onSkip }: Props) {
  const isCentered = step.position === "center" || !targetRect
  const isFirst = stepIndex === 0
  const isLast = stepIndex === totalSteps - 1
  const actionAdvances = step.actionAdvances ?? false

  if (isCentered) {
    return (
      <div className="fixed inset-0 z-[201] flex items-center justify-center pointer-events-none">
        <div
          className="pointer-events-auto relative bg-card border border-border rounded-xl shadow-2xl p-6 w-80 max-w-[90vw]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onSkip}
            className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-3.5" />
          </button>

          <div className="space-y-3 mb-5">
            <p className="font-cinzel font-bold text-base text-foreground pr-6">{step.title}</p>
            <p className="font-garamond italic text-sm text-muted-foreground leading-relaxed">{step.description}</p>
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onPrev}
              disabled={isFirst}
              className={cn(
                "flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors",
                isFirst && "opacity-0 pointer-events-none",
              )}
            >
              <ChevronLeft className="size-3.5" />
              Back
            </button>

            <span className="text-xs text-muted-foreground tabular-nums">
              {stepIndex + 1} / {totalSteps}
            </span>

            <button
              type="button"
              onClick={onNext}
              className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {isLast ? "Finish" : "Next"}
              {!isLast && <ChevronRight className="size-3.5" />}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const pos = computePosition(targetRect!, step.position)

  return (
    <div
      className="fixed z-[201] pointer-events-auto bg-card border border-border rounded-xl shadow-2xl p-4"
      style={{ width: TOOLTIP_WIDTH, ...pos }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onSkip}
        className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <X className="size-3" />
      </button>

      <div className="space-y-2 mb-4 pr-5">
        <p className="font-cinzel font-bold text-sm text-foreground">{step.title}</p>
        <p className="font-garamond italic text-xs text-muted-foreground leading-relaxed">{step.description}</p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={isFirst}
          className={cn(
            "flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors",
            isFirst && "opacity-0 pointer-events-none",
          )}
        >
          <ChevronLeft className="size-3.5" />
          Back
        </button>

        <span className="text-xs text-muted-foreground tabular-nums">
          {stepIndex + 1} / {totalSteps}
        </span>

        {actionAdvances ? (
          <span className="text-xs text-muted-foreground italic">click to continue</span>
        ) : (
          <button
            type="button"
            onClick={onNext}
            className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {isLast ? "Finish" : "Next"}
            {!isLast && <ChevronRight className="size-3.5" />}
          </button>
        )}
      </div>
    </div>
  )
}
