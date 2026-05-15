import "server-only";

export type StorageConfig = {
  endpoint: string;
  publicEndpoint: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
};

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required storage env var: ${name}`);
  return value;
}

function booleanEnv(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export function getStorageConfig(): StorageConfig {
  const endpoint = requiredEnv("S3_ENDPOINT");

  return {
    endpoint,
    publicEndpoint: process.env.S3_PUBLIC_ENDPOINT || endpoint,
    bucket: requiredEnv("S3_BUCKET"),
    region: process.env.S3_REGION || "us-east-1",
    accessKeyId: requiredEnv("S3_ACCESS_KEY_ID"),
    secretAccessKey: requiredEnv("S3_SECRET_ACCESS_KEY"),
    forcePathStyle: booleanEnv("S3_FORCE_PATH_STYLE", true),
  };
}
