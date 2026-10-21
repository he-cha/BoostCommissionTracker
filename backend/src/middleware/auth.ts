import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length < 32 || /^(changeme|replace_|your_)/i.test(secret)) {
    throw new Error('JWT_SECRET must be configured with at least 32 non-placeholder characters');
  }
  return secret;
}

// This application is one shared staff workspace, not a multi-tenant service.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  let secret: string;
  try { secret = getJWTSecret(); }
  catch { return res.status(503).json({ error: 'Authentication is not configured' }); }
  const match = /^Bearer ([^\s]+)$/i.exec(req.get('Authorization') || '');
  if (!match) return res.status(401).json({ error: 'Sign in required' });
  try {
    const payload = jwt.verify(match[1], secret, { algorithms: ['HS256'] });
    if (typeof payload === 'string' || typeof payload.userId !== 'string' ||
        !/^[a-f\d]{24}$/i.test(payload.userId) || typeof payload.exp !== 'number') {
      return res.status(401).json({ error: 'Invalid session' });
    }
    res.locals.userId = payload.userId;
    return next();
  } catch { return res.status(401).json({ error: 'Invalid or expired session' }); }
}
