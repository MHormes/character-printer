import "server-only";

import { S3Client } from "@aws-sdk/client-s3";
import { getStorageConfig } from "./config";

let storageClient: S3Client | undefined;
let publicStorageClient: S3Client | undefined;

export function getStorageClient(): S3Client {
  if (storageClient) return storageClient;

  const config = getStorageConfig();
  storageClient = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return storageClient;
}

export function getPublicStorageClient(): S3Client {
  if (publicStorageClient) return publicStorageClient;

  const config = getStorageConfig();
  publicStorageClient = new S3Client({
    endpoint: config.publicEndpoint,
    region: config.region,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return publicStorageClient;
}
