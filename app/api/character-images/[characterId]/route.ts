import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  getStorageClient,
  getStorageConfig,
  getStorageDriver,
  readLocalObject,
  writeLocalObject,
} from "@/lib/storage";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const maxImageBytes = 5 * 1024 * 1024;

function characterImagePrefix(characterId: string) {
  return `characters/${characterId}/`;
}

function assertCharacterImageKey(characterId: string, key: string) {
  if (!key.startsWith(characterImagePrefix(characterId))) {
    throw new Error("Image key does not belong to this character");
  }
}

function contentTypeFromKey(key: string) {
  const lower = key.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ characterId: string }> },
) {
  try {
    const { characterId } = await params;
    const key = request.nextUrl.searchParams.get("key") ?? "";
    const contentType = request.headers.get("content-type") ?? "";

    assertCharacterImageKey(characterId, key);
    if (!allowedImageTypes.has(contentType)) {
      return NextResponse.json({ error: "Unsupported image type" }, { status: 415 });
    }

    const bytes = Buffer.from(await request.arrayBuffer());
    if (bytes.length === 0) {
      return NextResponse.json({ error: "Image file is empty" }, { status: 400 });
    }
    if (bytes.length > maxImageBytes) {
      return NextResponse.json({ error: "Image must be 5 MB or smaller" }, { status: 413 });
    }

    if (getStorageDriver() === "local") {
      await writeLocalObject(key, bytes);
    } else {
      const config = getStorageConfig();
      await getStorageClient().send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          Body: bytes,
          ContentType: contentType,
        }),
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ characterId: string }> },
) {
  try {
    const { characterId } = await params;
    const key = request.nextUrl.searchParams.get("key") ?? "";
    assertCharacterImageKey(characterId, key);

    if (getStorageDriver() === "local") {
      const bytes = await readLocalObject(key);
      return new NextResponse(new Uint8Array(bytes), {
        headers: {
          "Content-Type": contentTypeFromKey(key),
          "Cache-Control": "private, max-age=60",
        },
      });
    }

    const config = getStorageConfig();
    const object = await getStorageClient().send(
      new GetObjectCommand({
        Bucket: config.bucket,
        Key: key,
      }),
    );
    const body = object.Body as { transformToByteArray: () => Promise<Uint8Array> } | undefined;
    if (!body) throw new Error("Image not found");
    const bytes = await body.transformToByteArray();

    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": object.ContentType || contentTypeFromKey(key),
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
}
