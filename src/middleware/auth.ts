import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../redis';

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).send('Unauthorized');
    return;
  }

  const providedToken = authHeader.split(' ')[1];

  try {
    const expectedToken = await redisClient.get('auth:token');

    if (!expectedToken || providedToken !== expectedToken) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    next();
  } catch (error) {
    console.error('Redis error during auth:', error);
    res.status(500).send('Internal Server Error');
    return;
  }
};
