"use client"

import { useEffect, useState } from "react"
import { useCharacterStore } from "@/lib/store/character-store"

function portraitImageUrl(key: string): string {
  // key format: characters/{characterId}/images/{fileId}-{filename}
  const characterId = key.split("/")[1]
  return `/api/character-images/${encodeURIComponent(characterId)}?key=${encodeURIComponent(key)}`
}

// viewBox 200×260 — portrait frame with decorative corners
export function CharacterPortraitWidget() {
  const portraitImage = useCharacterStore((s) => s.character?.portraitImage)
  const characterName = useCharacterStore((s) => s.character?.identity.name ?? "")
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (portraitImage?.key) {
      setImageUrl(portraitImageUrl(portraitImage.key))
    } else {
      setImageUrl(null)
    }
  }, [portraitImage?.key])

  const ink = "#1a1208"
  const parchment = "#f5f0e8"
  const ff = "Georgia, 'Times New Roman', serif"

  return (
    <svg
      viewBox="0 0 200 260"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      style={{ display: "block", width: "100%", height: "100%" }}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* background */}
      <rect x="0" y="0" width="200" height="260" fill={parchment} />

      {/* outer frame */}
      <rect x="6" y="6" width="188" height="248" rx="2" fill="white" stroke={ink} strokeWidth="1.5" />
      {/* inner border */}
      <rect x="10" y="10" width="180" height="240" rx="1" fill="none" stroke={ink} strokeWidth="0.5" />

      {/* portrait area clip */}
      <clipPath id="portrait-clip">
        <rect x="12" y="12" width="176" height="220" rx="1" />
      </clipPath>

      {imageUrl ? (
        <image
          href={imageUrl}
          x="12"
          y="12"
          width="176"
          height="220"
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#portrait-clip)"
        />
      ) : (
        <g clipPath="url(#portrait-clip)">
          <rect x="12" y="12" width="176" height="220" fill="#e8e4dc" />
          {/* silhouette */}
          <ellipse cx="100" cy="90" rx="32" ry="36" fill="#c8c2b4" />
          <path d="M42 232 Q42 160 100 155 Q158 160 158 232 Z" fill="#c8c2b4" />
          <text
            x="100"
            y="248"
            fontSize="8"
            fontFamily={ff}
            fill={ink}
            textAnchor="middle"
            opacity="0.5"
          >
            No portrait
          </text>
        </g>
      )}

      {/* decorative corner flourishes */}
      {/* top-left */}
      <path d="M6 18 L6 6 L18 6" fill="none" stroke={ink} strokeWidth="1.5" />
      <path d="M6 18 L6 6 L18 6" fill="none" stroke={ink} strokeWidth="0.5" strokeDasharray="2 2" opacity="0.4" />
      {/* top-right */}
      <path d="M194 18 L194 6 L182 6" fill="none" stroke={ink} strokeWidth="1.5" />
      <path d="M194 18 L194 6 L182 6" fill="none" stroke={ink} strokeWidth="0.5" strokeDasharray="2 2" opacity="0.4" />
      {/* bottom-left */}
      <path d="M6 242 L6 254 L18 254" fill="none" stroke={ink} strokeWidth="1.5" />
      {/* bottom-right */}
      <path d="M194 242 L194 254 L182 254" fill="none" stroke={ink} strokeWidth="1.5" />

      {/* label area */}
      <rect x="12" y="234" width="176" height="20" fill="rgba(255,255,255,0.85)" />
      <text
        x="100"
        y="247"
        fontSize="7"
        fontWeight="700"
        fontFamily={ff}
        letterSpacing="1"
        fill={ink}
        textAnchor="middle"
      >
        {characterName || "—"}
      </text>
    </svg>
  )
}
