import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import {
  STORAGE_MODE,
  S3_ENDPOINT,
  S3_REGION,
  S3_BUCKET,
  S3_ACCESS_KEY,
  S3_SECRET_KEY,
  S3_FORCE_PATH_STYLE,
  UPLOAD_DIR,
} from '../config.js';

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: S3_ENDPOINT,
      region: S3_REGION,
      credentials: {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY,
      },
      forcePathStyle: S3_FORCE_PATH_STYLE,
    });
  }
  return s3Client;
}

/**
 * Upload a file buffer to storage.
 * @param buffer - The file data
 * @param key - Storage key, e.g. "dishes/uuid.jpg" or "recipes/uuid.jpg"
 * @param contentType - MIME type of the file
 * @returns The public URL or path to access the file
 */
export async function uploadFile(buffer: Buffer, key: string, contentType: string): Promise<string> {
  if (STORAGE_MODE === 's3') {
    const client = getS3Client();
    await client.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }));
    return getPublicUrl(key);
  }

  // Local mode: write to filesystem
  const filePath = path.join(UPLOAD_DIR, key);
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, buffer);
  return `/uploads/${key}`;
}

/**
 * Delete a file from storage.
 * @param key - Storage key, e.g. "dishes/uuid.jpg"
 */
export async function deleteFile(key: string): Promise<void> {
  if (STORAGE_MODE === 's3') {
    const client = getS3Client();
    await client.send(new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    }));
    return;
  }

  // Local mode: delete from filesystem
  const filePath = path.join(UPLOAD_DIR, key);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

/**
 * Get the public URL for a stored file.
 * @param key - Storage key, e.g. "dishes/uuid.jpg"
 * @returns The public URL or local path
 */
export function getPublicUrl(key: string): string {
  if (STORAGE_MODE === 's3') {
    if (S3_FORCE_PATH_STYLE) {
      // MinIO / path-style: endpoint/bucket/key
      return `${S3_ENDPOINT}/${S3_BUCKET}/${key}`;
    }
    // AWS S3 virtual-hosted style: bucket.s3.region.amazonaws.com/key
    return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
  }
  return `/uploads/${key}`;
}

/**
 * Upload a buffer to storage (alias for uploadFile, used for sharp-processed images).
 */
export async function uploadBuffer(buffer: Buffer, key: string, contentType: string): Promise<string> {
  return uploadFile(buffer, key, contentType);
}
