import "server-only";

import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getPublicStorageClient } from "./client";
import { getStorageConfig } from "./config";

const defaultExpirySeconds = 60 * 5;

export async function createPresignedPutUrl(params: {
  key: string;
  contentType: string;
  expiresIn?: number;
}): Promise<string> {
  const config = getStorageConfig();
  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: params.key,
    ContentType: params.contentType,
  });

  return getSignedUrl(getPublicStorageClient(), command, {
    expiresIn: params.expiresIn ?? defaultExpirySeconds,
  });
}

export async function createPresignedGetUrl(params: {
  key: string;
  expiresIn?: number;
}): Promise<string> {
  const config = getStorageConfig();
  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: params.key,
  });

  return getSignedUrl(getPublicStorageClient(), command, {
    expiresIn: params.expiresIn ?? defaultExpirySeconds,
  });
}
