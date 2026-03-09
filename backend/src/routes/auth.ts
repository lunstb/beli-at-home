import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { verifyGoogleToken, findOrCreateUser, generateJwt } from '../services/authService.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { getDb } from '../database/connection.js';
import { JWT_SECRET } from '../config.js';

const router = Router();

router.post('/google', async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;
    console.log('[AUTH] Received credential:', credential ? `${credential.substring(0, 20)}... (${credential.length} chars)` : 'MISSING');

    if (!credential) {
      res.status(400).json({ error: 'Missing credential' });
      return;
    }

    const googleUser = await verifyGoogleToken(credential);
    console.log('[AUTH] Verified user:', googleUser.email);
    const user = findOrCreateUser(googleUser);
    const token = generateJwt(user);

    res.json({ token, user });
  } catch (err: any) {
    console.error('[AUTH] Google auth error:', err.message);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

router.get('/me', authMiddleware, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  res.json({ user: authReq.user });
});

// Test-only login bypass - creates or gets a test user and returns JWT
if (process.env.NODE_ENV === 'test') {
  router.post('/test-reset', (_req: Request, res: Response) => {
    const db = getDb();
    // Delete all data from all tables (order matters for FK constraints)
    const tables = [
      'notifications', 'dish_tagged_users', 'comparisons',
      'bookmarks', 'activity_feed', 'recipe_info', 'dish_photos', 'dish_tags', 'dishes',
      'friendships', 'users',
    ];
    for (const table of tables) {
      try { db.prepare(`DELETE FROM ${table}`).run(); } catch {}
    }
    res.json({ success: true });
  });

  router.post('/test-login', (req: Request, res: Response) => {
    const { username } = req.body;
    if (!username) {
      res.status(400).json({ error: 'username is required' });
      return;
    }

    const db = getDb();
    let user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;

    if (!user) {
      const result = db.prepare(
        'INSERT INTO users (google_id, email, username, avatar_url) VALUES (?, ?, ?, ?)'
      ).run(`test_${username}`, `${username}@test.com`, username, null);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user });
  });
}

export default router;
