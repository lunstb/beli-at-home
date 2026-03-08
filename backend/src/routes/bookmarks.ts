import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { addBookmark, removeBookmark, getBookmarks } from '../services/bookmarkService.js';

const router = Router();

router.get('/', authMiddleware, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

  const bookmarks = getBookmarks(authReq.user!.id, limit, offset);
  res.json({ bookmarks });
});

router.post('/', authMiddleware, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { dishId } = req.body;

  if (!dishId) {
    res.status(400).json({ error: 'dishId is required' });
    return;
  }

  try {
    addBookmark(authReq.user!.id, dishId);
    res.status(201).json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:dishId', authMiddleware, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const dishId = parseInt(req.params.dishId as string, 10);

  if (isNaN(dishId)) {
    res.status(400).json({ error: 'Invalid dish ID' });
    return;
  }

  removeBookmark(authReq.user!.id, dishId);
  res.json({ success: true });
});

export default router;
