import "server-only";

const unsafeFilenameChars = /[^a-zA-Z0-9._-]+/g;

export function safeStorageFilename(filename: string): string {
  const sanitized = filename.trim().replace(unsafeFilenameChars, "-").replace(/-+/g, "-");
  return sanitized || "image";
}

export function characterImageKey(params: {
  characterId: string;
  filename: string;
}): string {
  return ["characters", params.characterId, safeStorageFilename(params.filename)].join("/");
}
