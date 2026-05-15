import "server-only";

const unsafeFilenameChars = /[^a-zA-Z0-9._-]+/g;

export function safeStorageFilename(filename: string): string {
  const sanitized = filename.trim().replace(unsafeFilenameChars, "-").replace(/-+/g, "-");
  return sanitized || "image";
}

export function characterImageKey(params: {
  characterId: string;
  fileId: string;
  filename: string;
}): string {
  return [
    "characters",
    params.characterId,
    "images",
    `${params.fileId}-${safeStorageFilename(params.filename)}`,
  ].join("/");
}
