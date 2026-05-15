import "server-only";

import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";

function getLocalStorageRoot() {
  return path.join(process.cwd(), ".local-storage");
}

function objectKeyParts(key: string): string[] {
  if (!key || key.includes("\\") || path.isAbsolute(key)) {
    throw new Error("Invalid storage key");
  }

  const parts = key.split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) {
    throw new Error("Invalid storage key");
  }
  return parts;
}

export function localObjectPath(key: string): string {
  const root = getLocalStorageRoot();
  const resolved = path.resolve(root, ...objectKeyParts(key));
  if (!resolved.startsWith(root + path.sep)) {
    throw new Error("Invalid storage key");
  }
  return resolved;
}

export async function writeLocalObject(key: string, bytes: Buffer): Promise<void> {
  const objectPath = localObjectPath(key);
  await mkdir(path.dirname(objectPath), { recursive: true });
  await writeFile(objectPath, bytes);
}

export async function readLocalObject(key: string): Promise<Buffer> {
  return readFile(localObjectPath(key));
}

export async function deleteLocalObject(key: string): Promise<void> {
  await rm(localObjectPath(key), { force: true });
}
