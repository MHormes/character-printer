"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { LanguageRow } from "@/lib/actions/5e-data"

type Props = {
  languages: LanguageRow[]
  alreadyChosen: string[]
  chooseCount: number
  sourceName: string
  choiceLabel: string
  onConfirm: (choices: { languageId: string; languageName: string }[]) => void
  onDismiss: () => void
}

export function LanguagePicker({
  languages,
  alreadyChosen,
  chooseCount,
  sourceName,
  choiceLabel,
  onConfirm,
  onDismiss,
}: Props) {
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<{ languageId: string; languageName: string }[]>([])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return languages.filter(
      (l) => !alreadyChosen.includes(l.id) && l.name.toLowerCase().includes(q),
    )
  }, [languages, alreadyChosen, search])

  function toggle(lang: LanguageRow) {
    const exists = selected.find((s) => s.languageId === lang.id)
    if (exists) {
      setSelected(selected.filter((s) => s.languageId !== lang.id))
    } else if (selected.length < chooseCount) {
      setSelected([...selected, { languageId: lang.id, languageName: lang.name }])
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {sourceName} · Languages — choose {choiceLabel}
      </p>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((s) => (
            <button
              key={s.languageId}
              type="button"
              onClick={() => setSelected(selected.filter((x) => x.languageId !== s.languageId))}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary hover:bg-primary/20"
            >
              {s.languageName} ×
            </button>
          ))}
        </div>
      )}

      <Input
        placeholder="Search languages…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-8 text-sm"
      />

      <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
        {filtered.map((lang) => {
          const checked = selected.some((s) => s.languageId === lang.id)
          const disabled = !checked && selected.length >= chooseCount
          return (
            <Button
              key={lang.id}
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              aria-pressed={checked}
              onClick={() => toggle(lang)}
              className={checked ? "border-primary bg-primary/10" : ""}
            >
              {lang.name}
            </Button>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground">No languages found.</p>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          size="sm"
          contrast
          disabled={selected.length !== chooseCount}
          onClick={() => onConfirm(selected)}
        >
          Confirm ({selected.length}/{chooseCount})
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  )
}
