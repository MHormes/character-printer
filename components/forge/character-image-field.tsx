"use client"

import { useEffect, useId, useRef, useState } from "react"
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  createCharacterImageUpload,
  deleteCharacterImage,
  getCharacterImagePreviewUrl,
} from "@/lib/actions/character-image"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { CharacterData } from "@/lib/types/character"

type CharacterImageFieldProps = {
  characterId: string
  image: CharacterData["portraitImage"]
  onChange: (image: CharacterData["portraitImage"]) => void
}

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])
const maxImageBytes = 5 * 1024 * 1024

function imageErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Image upload failed"
}

export function CharacterImageField({ characterId, image, onChange }: CharacterImageFieldProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!image?.key) {
      Promise.resolve().then(() => { if (!cancelled) setPreviewUrl(null) })
      return () => { cancelled = true }
    }
    setIsLoadingPreview(true)
    setError(null)
    getCharacterImagePreviewUrl(characterId, image.key)
      .then((url) => {
        if (!cancelled) setPreviewUrl(url)
      })
      .catch((err) => {
        if (!cancelled) {
          setPreviewUrl(null)
          setError(imageErrorMessage(err))
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingPreview(false)
      })

    return () => {
      cancelled = true
    }
  }, [characterId, image?.key])

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
    }
  }, [localPreviewUrl])

  async function handleFileSelected(file: File | undefined) {
    if (!file) return
    setError(null)

    if (!allowedImageTypes.has(file.type)) {
      setError("Use a PNG, JPG, WebP, or GIF image.")
      return
    }
    if (file.size > maxImageBytes) {
      setError("Image must be 5 MB or smaller.")
      return
    }

    const previousKey = image?.key ?? null
    const objectUrl = URL.createObjectURL(file)
    setLocalPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return objectUrl
    })
    setIsUploading(true)

    try {
      const upload = await createCharacterImageUpload(characterId, {
        filename: file.name,
        contentType: file.type,
        size: file.size,
      })
      const response = await fetch(upload.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      })

      if (!response.ok) throw new Error("Storage upload failed")

      onChange({
        key: upload.key,
        filename: file.name,
        contentType: file.type,
        size: file.size,
        updatedAt: new Date().toISOString(),
      })
      setPreviewUrl(upload.previewUrl)

      if (previousKey && previousKey !== upload.key) {
        deleteCharacterImage(characterId, previousKey).catch(() => undefined)
      }
    } catch (err) {
      setError(imageErrorMessage(err))
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ""
      setLocalPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current)
        return null
      })
    }
  }

  async function handleRemove() {
    if (!image?.key) return
    setError(null)
    setIsRemoving(true)

    try {
      await deleteCharacterImage(characterId, image.key)
      onChange(null)
      setPreviewUrl(null)
    } catch (err) {
      setError(imageErrorMessage(err))
    } finally {
      setIsRemoving(false)
    }
  }

  const visiblePreviewUrl = localPreviewUrl ?? previewUrl
  const isBusy = isLoadingPreview || isUploading || isRemoving

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Character Image
      </label>
      <div className="grid gap-3 md:grid-cols-[9rem_1fr]">
        <div className="relative aspect-square overflow-hidden rounded-md border border-border bg-muted">
          {visiblePreviewUrl ? (
            <img
              src={visiblePreviewUrl}
              alt={image?.filename || "Character image"}
              className={cn("h-full w-full object-cover", isBusy && "opacity-60")}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              {isLoadingPreview ? (
                <Loader2 className="size-6 animate-spin" />
              ) : (
                <ImageIcon className="size-7" />
              )}
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2 className="size-6 animate-spin text-foreground" />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-foreground">
              {image?.filename || "No image selected"}
            </div>
            {image && (
              <div className="text-xs text-muted-foreground">
                {(image.size / 1024 / 1024).toFixed(2)} MB
              </div>
            )}
            {error && <div className="mt-2 text-xs text-destructive">{error}</div>}
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              id={inputId}
              ref={inputRef}
              name="character-image"
              type="file"
              aria-label="Character image"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              onChange={(event) => handleFileSelected(event.target.files?.[0])}
            />
            <label
              htmlFor={isBusy ? undefined : inputId}
              aria-disabled={isBusy}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                isBusy && "pointer-events-none opacity-50",
              )}
            >
              {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {image ? "Replace" : "Upload"}
            </label>
            {image && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isBusy}
                onClick={handleRemove}
              >
                {isRemoving ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
