"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Cropper from "react-easy-crop"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

type PixelCrop = { x: number; y: number; width: number; height: number }

async function getCroppedImage(imageSrc: string, pixelCrop: PixelCrop): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = imageSrc
  })
  const canvas = document.createElement("canvas")
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height
  )
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas crop failed"))),
      "image/webp",
      0.92
    )
  })
}

type Props = {
  file: File
  onConfirm: (croppedBlob: Blob) => void
  onCancel: () => void
}

export function ImageCropperDialog({ file, onConfirm, onCancel }: Props) {
  const objectUrl = useMemo(() => URL.createObjectURL(file), [file])
  useEffect(() => () => URL.revokeObjectURL(objectUrl), [objectUrl])

  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [isCropping, setIsCropping] = useState(false)
  const pixelCropRef = useRef<PixelCrop>({ x: 0, y: 0, width: 0, height: 0 })

  const onCropComplete = useCallback((_: unknown, croppedAreaPixels: PixelCrop) => {
    pixelCropRef.current = croppedAreaPixels
  }, [])

  async function handleConfirm() {
    setIsCropping(true)
    try {
      const blob = await getCroppedImage(objectUrl, pixelCropRef.current)
      onConfirm(blob)
    } finally {
      setIsCropping(false)
    }
  }

  if (typeof document === "undefined") return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      <div className="relative z-10 bg-card border border-border rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-cinzel font-bold text-lg text-foreground">Crop Portrait</h2>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative w-full rounded-md overflow-hidden bg-muted" style={{ aspectRatio: "4/5" }}>
          <Cropper
            image={objectUrl}
            crop={crop}
            zoom={zoom}
            aspect={176 / 220}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              cropAreaStyle: {
                border: "2px solid var(--ring)",
                color: "rgba(0,0,0,0.6)",
              },
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Zoom
          </label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ accentColor: "var(--primary)" }}
            className="w-full cursor-pointer"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isCropping}>
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={handleConfirm} disabled={isCropping}>
            {isCropping ? "Cropping…" : "Crop & Upload"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
