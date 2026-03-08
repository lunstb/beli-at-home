import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { getUserDishes } from '../services/dishService.js';

const router = Router();

// GET /api/users/:id/dishes - List a friend's public dishes
router.get('/:id/dishes', authMiddleware, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = parseInt(req.params.id as string, 10);

  if (isNaN(userId)) {
    res.status(400).json({ error: 'Invalid user ID' });
    return;
  }

  const { sort, tag, search, limit, offset } = req.query;

  const result = getUserDishes(
    userId,
    authReq.user!.id,
    sort as string,
    tag as string,
    search as string,
    limit ? parseInt(limit as string, 10) : 50,
    offset ? parseInt(offset as string, 10) : 0
  );

  res.json(result);
});

export default router;
