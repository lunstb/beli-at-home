import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { getFriendsFeed, getDiscoverFeed } from '../services/feedService.js';

const router = Router();

router.get('/', authMiddleware, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
  const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

  const feed = getFriendsFeed(authReq.user!.id, limit, offset);
  res.json({ feed });
});

router.get('/discover', authMiddleware, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
  const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

  const dishes = getDiscoverFeed(authReq.user!.id, limit, offset);
  res.json({ dishes });
});

export default router;
