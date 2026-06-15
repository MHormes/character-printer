"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { useTourStore } from "@/lib/store/tour-store"
import { TOUR_STEPS } from "@/lib/tour/tour-steps"
import { TourTooltip } from "@/components/tour/tour-tooltip"

function waitForElement(selector: string, timeout = 600): Promise<Element | null> {
  return new Promise((resolve) => {
    const el = document.querySelector(selector)
    if (el) { resolve(el); return }
    const start = Date.now()
    function check() {
      const found = document.querySelector(selector)
      if (found) { resolve(found); return }
      if (Date.now() - start > timeout) { resolve(null); return }
      requestAnimationFrame(check)
    }
    requestAnimationFrame(check)
  })
}

export function TourOverlay() {
  const [mounted, setMounted] = useState(false)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  const active = useTourStore((s) => s.active)
  const step = useTourStore((s) => s.step)
  const nextStep = useTourStore((s) => s.nextStep)
  const prevStep = useTourStore((s) => s.prevStep)
  const skipTour = useTourStore((s) => s.skipTour)

  useEffect(() => {
    useTourStore.persist.rehydrate()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const updateRect = useCallback((el: Element) => {
    setTargetRect(el.getBoundingClientRect())
  }, [])

  useEffect(() => {
    if (!active) return
    const currentStep = TOUR_STEPS[step]
    if (!currentStep?.targetSelector) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTargetRect(null)
      return
    }

    let ro: ResizeObserver | null = null
    let clickEl: Element | null = null
    let clickHandler: (() => void) | null = null
    let cancelled = false

    waitForElement(currentStep.targetSelector).then((el) => {
      if (cancelled || !el) { setTargetRect(null); return }

      updateRect(el)

      ro = new ResizeObserver(() => updateRect(el))
      ro.observe(el)

      if (currentStep.actionAdvances) {
        clickHandler = () => nextStep(TOUR_STEPS.length)
        el.addEventListener("click", clickHandler)
        clickEl = el
      }

      const onScroll = () => updateRect(el)
      window.addEventListener("scroll", onScroll, { passive: true })
      window.addEventListener("resize", onScroll, { passive: true })
    })

    return () => {
      cancelled = true
      ro?.disconnect()
      if (clickEl && clickHandler) {
        clickEl.removeEventListener("click", clickHandler)
      }
    }
  }, [active, step, updateRect, nextStep])

  useEffect(() => {
    if (!active) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") skipTour()
      else if (e.key === "ArrowRight" || e.key === "Enter") nextStep(TOUR_STEPS.length)
      else if (e.key === "ArrowLeft") prevStep()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [active, nextStep, prevStep, skipTour])

  if (!mounted || !active) return null

  const currentStep = TOUR_STEPS[step]
  if (!currentStep) return null

  const PAD = 8

  const content = (
    <>
      {/* Dark overlay with spotlight cutout */}
      {targetRect ? (
        <svg
          className="fixed inset-0 w-full h-full z-[200] pointer-events-none"
          style={{ width: "100vw", height: "100vh" }}
        >
          <defs>
            <mask id="tour-spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={targetRect.left - PAD}
                y={targetRect.top - PAD}
                width={targetRect.width + PAD * 2}
                height={targetRect.height + PAD * 2}
                rx="8"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.65)"
            mask="url(#tour-spotlight-mask)"
          />
        </svg>
      ) : (
        <div className="fixed inset-0 z-[200] bg-black/65 pointer-events-none" />
      )}

      <TourTooltip
        step={currentStep}
        stepIndex={step}
        totalSteps={TOUR_STEPS.length}
        targetRect={targetRect}
        onNext={() => nextStep(TOUR_STEPS.length)}
        onPrev={prevStep}
        onSkip={skipTour}
      />
    </>
  )

  return createPortal(content, document.body)
}
