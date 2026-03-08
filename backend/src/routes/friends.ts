import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import {
  sendRequest,
  acceptRequest,
  declineRequest,
  removeFriend,
  getFriends,
  getPendingRequests,
} from '../services/friendService.js';

const router = Router();

router.get('/', authMiddleware, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const friends = getFriends(authReq.user!.id);
  res.json({ friends });
});

router.post('/request', authMiddleware, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { userId } = req.body;

  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  try {
    const friendship = sendRequest(authReq.user!.id, userId);
    res.status(201).json({ friendship });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id/accept', authMiddleware, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const friendshipId = parseInt(req.params.id as string, 10);

  if (isNaN(friendshipId)) {
    res.status(400).json({ error: 'Invalid friendship ID' });
    return;
  }

  try {
    const friendship = acceptRequest(friendshipId, authReq.user!.id);
    res.json({ friendship });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id/decline', authMiddleware, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const friendshipId = parseInt(req.params.id as string, 10);

  if (isNaN(friendshipId)) {
    res.status(400).json({ error: 'Invalid friendship ID' });
    return;
  }

  try {
    const friendship = declineRequest(friendshipId, authReq.user!.id);
    res.json({ friendship });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const friendshipId = parseInt(req.params.id as string, 10);

  if (isNaN(friendshipId)) {
    res.status(400).json({ error: 'Invalid friendship ID' });
    return;
  }

  try {
    removeFriend(friendshipId, authReq.user!.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/requests', authMiddleware, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const requests = getPendingRequests(authReq.user!.id);
  res.json({ requests });
});

export default router;
