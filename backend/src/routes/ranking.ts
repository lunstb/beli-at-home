import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import {
  startSession,
  submitComparison,
  skipComparison,
  getSessionResults,
} from '../services/rankingService.js';

const router = Router();

router.post('/session', authMiddleware, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { dishId } = req.body;

  if (!dishId) {
    res.status(400).json({ error: 'dishId is required' });
    return;
  }

  try {
    const result = startSession(authReq.user!.id, dishId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/compare', authMiddleware, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { sessionId, winnerDishId, loserDishId, isDraw } = req.body;

  if (!sessionId || !winnerDishId || !loserDishId) {
    res.status(400).json({ error: 'sessionId, winnerDishId, and loserDishId are required' });
    return;
  }

  try {
    const result = submitComparison(
      authReq.user!.id,
      sessionId,
      winnerDishId,
      loserDishId,
      isDraw || false
    );
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/skip', authMiddleware, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { sessionId, skippedDishId } = req.body;

  if (!sessionId || !skippedDishId) {
    res.status(400).json({ error: 'sessionId and skippedDishId are required' });
    return;
  }

  try {
    const result = skipComparison(authReq.user!.id, sessionId, skippedDishId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/results/:sessionId', authMiddleware, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const sessionId = req.params.sessionId as string;

  try {
    const result = getSessionResults(authReq.user!.id, sessionId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
