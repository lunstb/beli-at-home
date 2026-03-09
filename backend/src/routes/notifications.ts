import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { getNotifications, getUnreadCount, markAllRead, markRead } from '../services/notificationService.js';

const router = Router();

router.get('/', authMiddleware, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const limit = parseInt(req.query.limit as string || '50', 10);
  const offset = parseInt(req.query.offset as string || '0', 10);
  const notifications = getNotifications(authReq.user!.id, limit, offset);
  res.json({ notifications });
});

router.get('/unread-count', authMiddleware, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const count = getUnreadCount(authReq.user!.id);
  res.json({ count });
});

router.post('/read-all', authMiddleware, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  markAllRead(authReq.user!.id);
  res.json({ success: true });
});

router.post('/:id/read', authMiddleware, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid notification ID' }); return; }
  markRead(id, authReq.user!.id);
  res.json({ success: true });
});

export default router;
