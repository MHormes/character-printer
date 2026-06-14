"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react"

export type GainedBenefit = { key: string; label: string }
export type DismissedBenefit = { key: string; label: string }

export function GainedBenefitsSection({
  autoGrants,
  madeChoices,
  dismissedBenefits,
  isOpen,
  onToggle,
  onRevert,
  forceShowDismissed = false,
}: {
  autoGrants: GainedBenefit[]
  madeChoices: GainedBenefit[]
  dismissedBenefits: DismissedBenefit[]
  isOpen: boolean
  onToggle: () => void
  onRevert: (key: string) => void
  forceShowDismissed?: boolean
}) {
  const [dismissedOpen, setDismissedOpen] = useState(false)

  const totalGained = autoGrants.length + madeChoices.length
  if (totalGained === 0 && dismissedBenefits.length === 0) return null

  return (
    <div className="space-y-2" data-tour-id="gained-benefits">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1.5 rounded-md border border-emerald-500/50 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-500/20"
      >
        Gained benefits ({totalGained})
        {isOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
      </button>

      {isOpen && (
        <div className="mt-1 rounded-lg border border-border bg-muted/30 p-3">
          <div className="space-y-1">
            {autoGrants.map((b) => (
              <p key={b.key} className="text-xs text-muted-foreground">
                {b.label}
              </p>
            ))}
            {madeChoices.map((b) => (
              <p key={b.key} className="text-xs text-foreground">
                {b.label}
              </p>
            ))}
          </div>

          {dismissedBenefits.length > 0 && (
            <div className="mt-3 space-y-1.5 border-t border-border pt-3">
              <button
                type="button"
                data-tour-id="revert-button"
                onClick={() => setDismissedOpen((v) => !v)}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Dismissed ({dismissedBenefits.length})
                {dismissedOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              </button>
              {(dismissedOpen || forceShowDismissed) && (
                <div className="space-y-1.5">
                  {dismissedBenefits.map((d) => (
                    <div key={d.key} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground line-through">{d.label}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-5 gap-1 px-2 text-xs"
                        onClick={() => onRevert(d.key)}
                      >
                        <RotateCcw className="size-2.5" />
                        <span className="hidden md:inline">Revert</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
