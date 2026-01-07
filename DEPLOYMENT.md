# SRTrack Deployment Guide

This guide covers the complete setup and deployment process for the SRTrack system.

## Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- A Telegram Bot Token (from [@BotFather](https://t.me/botfather))
- A Vercel account (for hosting)

---

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and anon key from Settings > API

### 1.2 Run Database Schema

1. Open the SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `supabase/schema.sql`
3. Execute the SQL script
4. Verify that the following tables were created:
   - `srt_users`
   - `commanders`
   - `srt_sessions`

### 1.3 Get Service Role Key

1. Go to Settings > API in Supabase
2. Copy the `service_role` key (keep this secret!)
3. This will be used for server-side operations

### 1.4 Configure Authentication

1. Go to Authentication > Settings in Supabase
2. Ensure "Enable Email Signup" is enabled
3. The system uses email-based auth with format: `username@srtrack.local`

---

## Step 2: Telegram Bot Setup

### 2.1 Create Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` and follow the instructions
3. Save the bot token you receive

### 2.2 Configure Webhook (After Deployment)

After deploying to Vercel, set the webhook URL:

```bash
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.vercel.app/api/telegram/webhook",
    "secret_token": "your-webhook-secret"
  }'
```

Or use the API endpoint after deployment:
```
POST https://your-app.vercel.app/api/telegram/set-webhook
```

---

## Step 3: Local Development Setup

### 3.1 Install Dependencies

```bash
npm install
```

### 3.2 Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_WEBHOOK_URL=https://your-app.vercel.app/api/telegram/webhook
TELEGRAM_WEBHOOK_SECRET=your_webhook_secret_token

# Cron Job Security
CRON_SECRET=your_random_secret_string

# Node Environment
NODE_ENV=development
```

### 3.3 Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

---

## Step 4: Vercel Deployment

### 4.1 Install Vercel CLI

```bash
npm i -g vercel
```

### 4.2 Deploy to Vercel

```bash
vercel
```

Follow the prompts to link your project.

### 4.3 Configure Environment Variables in Vercel

1. Go to your project settings in Vercel dashboard
2. Navigate to Settings > Environment Variables
3. Add all the environment variables from Step 3.2

**Important:** Set the environment for each variable:
- `NEXT_PUBLIC_*` variables: All environments (Production, Preview, Development)
- `SUPABASE_SERVICE_ROLE_KEY`: All environments
- `TELEGRAM_BOT_TOKEN`: All environments
- `TELEGRAM_WEBHOOK_URL`: Production only (use your production URL)
- `TELEGRAM_WEBHOOK_SECRET`: All environments
- `CRON_SECRET`: All environments

### 4.4 Enable Vercel Cron

1. Vercel Cron is automatically configured via `vercel.json`
2. The compliance check runs daily at 14:00 UTC (22:00 SGT)
3. Ensure `CRON_SECRET` is set for security

### 4.5 Redeploy After Environment Variables

After setting environment variables, redeploy:

```bash
vercel --prod
```

---

## Step 5: Register Commanders

### 5.1 Using API Endpoint

After deployment, register commanders using the API:

```bash
curl -X POST https://your-app.vercel.app/api/auth/register-commander \
  -H "Content-Type: application/json" \
  -d '{
    "rank_name": "Captain",
    "username": "commander1",
    "password": "secure_password_123",
    "company": "A",
    "contact_number": "+65 1234 5678"
  }'
```

**Note:** In production, protect this endpoint or use it only during initial setup.

### 5.2 Valid Company Values

- `A`
- `B`
- `C`
- `Support`
- `MSC`
- `HQ`

---

## Step 6: Testing

### 6.1 Test Telegram Bot

1. Open Telegram and search for your bot
2. Send `/start` to begin
3. Use `/register` to register a test user
4. Test clock in/out functionality

### 6.2 Test Web Dashboard

1. Navigate to `https://your-app.vercel.app/login`
2. Log in with a commander account
3. Verify company-scoped data visibility
4. Check that only users from the same company are visible

### 6.3 Test Compliance Check

Manually trigger the compliance check:

```bash
curl -X GET https://your-app.vercel.app/api/cron/compliance-check \
  -H "Authorization: Bearer your_cron_secret"
```

---

## Security Checklist

- [ ] All environment variables are set in Vercel
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is kept secret
- [ ] `TELEGRAM_BOT_TOKEN` is kept secret
- [ ] `CRON_SECRET` is set and used
- [ ] `TELEGRAM_WEBHOOK_SECRET` is set
- [ ] Row Level Security (RLS) is enabled in Supabase
- [ ] Commander registration endpoint is protected or disabled after setup
- [ ] Webhook URL uses HTTPS
- [ ] All API routes validate inputs

---

## Troubleshooting

### Telegram Bot Not Responding

1. Verify webhook is set correctly
2. Check `TELEGRAM_BOT_TOKEN` is correct
3. Check webhook URL is accessible
4. Review Vercel function logs

### Authentication Issues

1. Verify Supabase credentials are correct
2. Check that commanders are registered in the database
3. Ensure email format is `username@srtrack.local`

### Compliance Check Not Running

1. Verify `vercel.json` cron configuration
2. Check `CRON_SECRET` is set
3. Review Vercel cron logs in dashboard
4. Manually trigger the endpoint to test

### Data Not Visible in Dashboard

1. Verify RLS policies are active
2. Check commander's company matches user's company
3. Ensure user is logged in correctly
4. Check browser console for errors

---

## Maintenance

### Daily

- Monitor compliance check logs
- Review violation alerts

### Weekly

- Review system logs for errors
- Check database performance

### Monthly

- Audit user registrations
- Review security settings
- Update dependencies

---

## Support

For issues or questions:
1. Check Vercel function logs
2. Review Supabase logs
3. Check Telegram Bot API status
4. Review this documentation

---

## Production Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Database schema deployed
- [ ] RLS policies active
- [ ] Telegram webhook configured
- [ ] Commander accounts created
- [ ] Compliance check tested
- [ ] Security review completed
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Documentation reviewed

