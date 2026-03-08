import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Explicitly point to .env in the backend root
dotenv.config({ path: path.join(ROOT_DIR, '.env') });

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-in-production';
export const PORT = parseInt(process.env.PORT || '3001', 10);
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
export const UPLOAD_DIR = path.join(ROOT_DIR, 'uploads');
export const DB_PATH = path.join(ROOT_DIR, 'data', 'beli.db');

// Storage mode: "local" or "s3"
export const STORAGE_MODE = process.env.STORAGE_MODE || 'local';

// S3/MinIO configuration
export const S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://localhost:9000';
export const S3_REGION = process.env.S3_REGION || 'us-east-1';
export const S3_BUCKET = process.env.S3_BUCKET || 'beli-at-home';
export const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || '';
export const S3_SECRET_KEY = process.env.S3_SECRET_KEY || '';
export const S3_FORCE_PATH_STYLE = process.env.S3_FORCE_PATH_STYLE === 'true';

// DB backup
export const DB_BACKUP_BUCKET = process.env.DB_BACKUP_BUCKET || 'beli-at-home-backups';
export const DB_BACKUP_INTERVAL_HOURS = parseInt(process.env.DB_BACKUP_INTERVAL_HOURS || '6', 10);
