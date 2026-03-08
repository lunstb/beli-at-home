import { Router, Request, Response } from 'express';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { searchUsers } from '../services/friendService.js';
import { getDb } from '../database/connection.js';
import { uploadAvatar } from '../middleware/upload.js';
import { uploadFile } from '../services/storageService.js';
import type { User } from '../types/index.js';

const router = Router();

router.get('/search', authMiddleware, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const query = req.query.q as string;

  if (!query || query.trim().length === 0) {
    res.json({ users: [] });
    return;
  }

  const users = searchUsers(query.trim(), authReq.user!.id);
  res.json({ users });
});

router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  const db = getDb();
  const userId = parseInt(req.params.id as string, 10);

  if (isNaN(userId)) {
    res.status(400).json({ error: 'Invalid user ID' });
    return;
  }

  const user = db.prepare(
    'SELECT id, username, avatar_url, bio, created_at FROM users WHERE id = ?'
  ).get(userId) as Partial<User> | undefined;

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Get dish count
  const stats = db.prepare(
    'SELECT COUNT(*) as dish_count FROM dishes WHERE user_id = ? AND is_public = 1'
  ).get(userId) as { dish_count: number };

  res.json({ user: { ...user, dish_count: stats.dish_count } });
});

router.put('/me', authMiddleware, uploadAvatar.single('avatar'), async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const db = getDb();
  const { username, bio } = req.body;

  const updates: string[] = [];
  const values: any[] = [];

  if (username !== undefined) {
    updates.push('username = ?');
    values.push(username);
  }
  if (bio !== undefined) {
    updates.push('bio = ?');
    values.push(bio);
  }
  if (req.file) {
    const ext = path.extname(req.file.originalname) || '.jpg';
    const key = `avatars/${uuidv4()}${ext}`;
    const avatarUrl = await uploadFile(req.file.buffer, key, req.file.mimetype);
    updates.push('avatar_url = ?');
    values.push(avatarUrl);
  }

  if (updates.length === 0) {
    res.json({ user: authReq.user });
    return;
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(authReq.user!.id);

  db.prepare(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
  ).run(...values);

  const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(authReq.user!.id) as User;
  res.json({ user: updatedUser });
});

export default router;
