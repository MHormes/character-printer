"use server"

import { DeleteObjectCommand } from "@aws-sdk/client-s3"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { sqliteCharacters } from "@/lib/db/schema"
import {
  characterImageKey,
  deleteLocalObject,
  getStorageClient,
  getStorageConfig,
  getStorageDriver,
} from "@/lib/storage"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])
const maxImageBytes = 5 * 1024 * 1024

type CharacterImageUploadInput = {
  filename: string
  contentType: string
  size: number
}

export type CharacterImageUpload = {
  key: string
  uploadUrl: string
  previewUrl: string
}

function characterImagePrefix(characterId: string) {
  return `characters/${characterId}/`
}

function assertValidCharacterImageInput(input: CharacterImageUploadInput) {
  if (!input.filename.trim()) throw new Error("Image filename is required")
  if (!allowedImageTypes.has(input.contentType)) throw new Error("Unsupported image type")
  if (!Number.isFinite(input.size) || input.size <= 0) throw new Error("Image file is empty")
  if (input.size > maxImageBytes) throw new Error("Image must be 5 MB or smaller")
}

function assertCharacterImageKey(characterId: string, key: string) {
  if (!key.startsWith(characterImagePrefix(characterId))) {
    throw new Error("Image key does not belong to this character")
  }
}

async function assertCharacterExists(characterId: string) {
  const rows = await anyDb
    .select({ id: sqliteCharacters.id })
    .from(sqliteCharacters)
    .where(eq(sqliteCharacters.id, characterId))
    .limit(1)

  if (!rows[0]) throw new Error("Character not found")
}

function characterImageUrl(characterId: string, key: string) {
  return `/api/character-images/${encodeURIComponent(characterId)}?key=${encodeURIComponent(key)}`
}

export async function createCharacterImageUpload(
  characterId: string,
  input: CharacterImageUploadInput,
): Promise<CharacterImageUpload> {
  assertValidCharacterImageInput(input)
  await assertCharacterExists(characterId)

  const key = characterImageKey({
    characterId,
    filename: input.filename,
  })
  const imageUrl = characterImageUrl(characterId, key)

  return { key, uploadUrl: imageUrl, previewUrl: imageUrl }
}

export async function getCharacterImagePreviewUrl(characterId: string, key: string): Promise<string> {
  assertCharacterImageKey(characterId, key)
  await assertCharacterExists(characterId)

  return characterImageUrl(characterId, key)
}

export async function deleteCharacterImage(characterId: string, key: string): Promise<void> {
  assertCharacterImageKey(characterId, key)
  await assertCharacterExists(characterId)

  if (getStorageDriver() === "local") {
    await deleteLocalObject(key)
    return
  }

  const config = getStorageConfig()
  await getStorageClient().send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key,
    }),
  )
}
