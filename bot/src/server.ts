import express, { Request, Response } from 'express';
import TelegramBot from 'node-telegram-bot-api';
import env from './config/env';
import { bot, initializeBot } from './bot';
import { validateWebhookSecret } from './middleware/webhook-auth';

const app = express();

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Webhook endpoint
app.post('/webhook', validateWebhookSecret, async (req: Request, res: Response) => {
  try {
    const update = req.body;

    // Process update
    await bot.processUpdate(update);

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Initialize bot handlers
initializeBot();

// Start server
const PORT = env.PORT;
app.listen(PORT, () => {
  console.log(`🚀 Bot server running on port ${PORT}`);
  console.log(`📡 Webhook endpoint: /webhook`);
  console.log(`🏥 Health check: /health`);
});

