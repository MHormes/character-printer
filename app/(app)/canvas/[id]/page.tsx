"use client"

import { use, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Hammer, Grid3x3, Printer } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function CanvasPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [cols, setCols] = useState(20)
  const [rows, setRows] = useState(15)
  const [showGridConfig, setShowGridConfig] = useState(false)

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/characters"
            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Characters
          </Link>
          <h1 className="text-lg font-semibold">Canvas</h1>
          <Link
            href={`/forge/${id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Hammer />
            Open Forge
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGridConfig((v) => !v)}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Grid3x3 />
            Grid
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Printer />
            Print
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <aside className="w-1/4 shrink-0 overflow-y-auto border-r border-border bg-section p-4" />

        <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-muted/30 p-8">
          {showGridConfig && (
            <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-lg border border-border bg-card p-3 shadow-sm">
              <span className="text-xs text-muted-foreground">Columns</span>
              <Input
                type="number"
                min={1}
                value={cols}
                onChange={(e) => setCols(Math.max(1, parseInt(e.target.value) || 1))}
                className="h-7 w-16 text-xs"
              />
              <span className="text-xs text-muted-foreground">Rows</span>
              <Input
                type="number"
                min={1}
                value={rows}
                onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
                className="h-7 w-16 text-xs"
              />
            </div>
          )}
          <div
            id="print-canvas"
            className="aspect-[210/297] h-full max-w-full bg-card shadow-lg"
            style={{
              backgroundImage: [
                "linear-gradient(to right, var(--color-border) 1px, transparent 1px)",
                "linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)",
              ].join(", "),
              backgroundSize: `${100 / cols}% ${100 / rows}%`,
            }}
          />
        </div>
      </div>
    </div>
  )
}
