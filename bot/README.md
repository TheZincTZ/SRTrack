# SRTrack Telegram Bot

Telegram bot for trainee attendance tracking.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

3. Build TypeScript:
```bash
npm run build
```

4. Start server:
```bash
npm start
```

## Development

Run in development mode with hot reload:
```bash
npm run dev
```

## Environment Variables

See `.env.example` for required variables.

## Webhook Setup

After deployment, set webhook URL:
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -d "url=https://your-domain.com/webhook" \
  -d "secret_token=<YOUR_WEBHOOK_SECRET>"
```

