import { Request, Response, NextFunction } from 'express';
import env from '../config/env';

/**
 * Middleware to validate Telegram webhook secret token
 */
export function validateWebhookSecret(req: Request, res: Response, next: NextFunction): void {
  const secretToken = req.headers['x-telegram-bot-api-secret-token'] as string;
  const expectedSecret = env.TELEGRAM_WEBHOOK_SECRET;

  if (!secretToken || secretToken !== expectedSecret) {
    res.status(401).json({ error: 'Unauthorized: Invalid webhook secret' });
    return;
  }

  next();
}

