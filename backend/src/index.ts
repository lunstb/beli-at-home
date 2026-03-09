import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GOOGLE_CLIENT_ID, PORT, FRONTEND_URL, UPLOAD_DIR, STORAGE_MODE } from './config.js';
import { initDb } from './database/connection.js';
import { startBackupSchedule } from './services/backupService.js';
import { errorHandler } from './middleware/errors.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import dishRoutes, { recipeInfoRouter } from './routes/dishes.js';
import rankingRoutes from './routes/ranking.js';
import friendRoutes from './routes/friends.js';
import feedRoutes from './routes/feed.js';
import bookmarkRoutes from './routes/bookmarks.js';
import friendDishRoutes from './routes/friendDishes.js';
import notificationRoutes from './routes/notifications.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS - support comma-separated origins for multiple allowed frontends
app.use(cors({
  origin: FRONTEND_URL.split(',').map(u => u.trim()),
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads (used in local storage mode)
app.use('/uploads', express.static(UPLOAD_DIR));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/recipe-info', recipeInfoRouter);
app.use('/api/ranking', rankingRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/users', friendDishRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Initialize database and start server
initDb();

// Start periodic DB backup (only active in s3 mode)
startBackupSchedule();

app.listen(PORT, () => {
  console.log(`Beli at Home backend running on port ${PORT}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Google Client ID: ${GOOGLE_CLIENT_ID ? GOOGLE_CLIENT_ID.substring(0, 20) + '...' : 'NOT SET'}`);
  console.log(`Storage mode: ${STORAGE_MODE}`);
  if (STORAGE_MODE === 'local') {
    console.log(`Upload directory: ${UPLOAD_DIR}`);
  }
});

export default app;
