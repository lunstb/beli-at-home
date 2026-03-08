import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import {
  DB_PATH,
  DB_BACKUP_BUCKET,
  DB_BACKUP_INTERVAL_HOURS,
  STORAGE_MODE,
  S3_ENDPOINT,
  S3_REGION,
  S3_ACCESS_KEY,
  S3_SECRET_KEY,
  S3_FORCE_PATH_STYLE,
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
 * Start the periodic database backup schedule.
 * Only runs when STORAGE_MODE is 's3'.
 */
export function startBackupSchedule(): void {
  if (STORAGE_MODE !== 's3') {
    console.log('DB backup disabled (STORAGE_MODE is not s3)');
    return;
  }

  const intervalMs = (DB_BACKUP_INTERVAL_HOURS || 6) * 60 * 60 * 1000;

  console.log(`DB backup scheduled every ${DB_BACKUP_INTERVAL_HOURS} hours to bucket: ${DB_BACKUP_BUCKET}`);

  // Run first backup after 1 minute
  setTimeout(() => {
    backupDatabase().catch(err => console.error('DB backup failed:', err));
  }, 60 * 1000);

  // Then on interval
  setInterval(() => {
    backupDatabase().catch(err => console.error('DB backup failed:', err));
  }, intervalMs);
}

async function backupDatabase(): Promise<void> {
  if (!fs.existsSync(DB_PATH)) {
    console.warn('DB file not found, skipping backup:', DB_PATH);
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const key = `backups/beli-${timestamp}.db`;
  const dbBuffer = fs.readFileSync(DB_PATH);

  const client = getS3Client();
  await client.send(new PutObjectCommand({
    Bucket: DB_BACKUP_BUCKET,
    Key: key,
    Body: dbBuffer,
    ContentType: 'application/x-sqlite3',
  }));

  console.log(`Database backed up to S3: ${key} (${(dbBuffer.length / 1024).toFixed(1)} KB)`);
}
