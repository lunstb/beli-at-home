import { Router, Request, Response } from 'express';
import { verifyGoogleToken, findOrCreateUser, generateJwt } from '../services/authService.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

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

export default router;
