# Troubleshooting: Bot Not Responding

## Quick Checklist

1. ✅ **Webhook is set** - Telegram knows where to send messages
2. ✅ **Environment variables set** - Bot token and secrets configured
3. ✅ **Bot code deployed** - Latest version on Vercel
4. ✅ **No errors in logs** - Check Vercel function logs

---

## Step 1: Verify Webhook is Set

### Check if webhook is configured:

```bash
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

Replace `<YOUR_BOT_TOKEN>` with your actual bot token.

**Expected response:**
```json
{
  "ok": true,
  "result": {
    "url": "https://your-app.vercel.app/api/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

**If webhook is NOT set:**
- The `url` field will be empty
- Set it using the steps below

### Set the webhook:

**Option A: Use your API endpoint (Recommended)**
```bash
curl -X POST https://your-app.vercel.app/api/telegram/set-webhook
```

**Option B: Use Telegram API directly**
```bash
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.vercel.app/api/telegram/webhook",
    "secret_token": "your_webhook_secret"
  }'
```

**Important:** Use the **exact same secret** as your `TELEGRAM_WEBHOOK_SECRET` environment variable!

---

## Step 2: Check Environment Variables

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**

Verify these are set:
- ✅ `TELEGRAM_BOT_TOKEN` - Your bot token from @BotFather
- ✅ `TELEGRAM_WEBHOOK_URL` - `https://your-app.vercel.app/api/telegram/webhook`
- ✅ `TELEGRAM_WEBHOOK_SECRET` - Your random secret string
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

**After adding/changing variables, you MUST redeploy!**

---

## Step 3: Check Vercel Function Logs

1. Go to **Vercel Dashboard → Your Project → Deployments**
2. Click on your latest deployment
3. Click **Functions** tab
4. Click on `api/telegram/webhook`
5. Check **Logs** for errors

**Common errors to look for:**
- `TELEGRAM_BOT_TOKEN is not set` - Missing environment variable
- `Unauthorized` - Webhook secret mismatch
- `Error: ...` - Other errors

---

## Step 4: Test Webhook Manually

Test if your webhook endpoint is working:

```bash
curl -X POST https://your-app.vercel.app/api/telegram/webhook \
  -H "Content-Type: application/json" \
  -H "x-telegram-bot-api-secret-token: your_webhook_secret" \
  -d '{
    "update_id": 123456789,
    "message": {
      "message_id": 1,
      "from": {
        "id": 123456789,
        "is_bot": false,
        "first_name": "Test",
        "username": "testuser"
      },
      "chat": {
        "id": 123456789,
        "first_name": "Test",
        "type": "private"
      },
      "date": 1234567890,
      "text": "/start"
    }
  }'
```

**Expected response:** `{"ok": true}`

If you get an error, check the logs!

---

## Step 5: Verify Bot Token

Make sure your bot token is correct:

```bash
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe
```

**Expected response:**
```json
{
  "ok": true,
  "result": {
    "id": 123456789,
    "is_bot": true,
    "first_name": "Your Bot Name",
    "username": "your_bot_username"
  }
}
```

If this fails, your bot token is wrong. Get a new one from @BotFather.

---

## Step 6: Check Middleware Configuration

The middleware should **NOT** intercept `/api/telegram` routes. Verify in `middleware.ts`:

```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/telegram|api/cron).*)',
  ],
}
```

The `api/telegram` exclusion is already there, so this should be fine.

---

## Step 7: Common Issues & Solutions

### Issue: Bot responds but then stops
**Solution:** Check Supabase connection. Verify environment variables are set correctly.

### Issue: "Unauthorized" error
**Solution:** Webhook secret mismatch. Make sure `TELEGRAM_WEBHOOK_SECRET` in Vercel matches the secret you used when setting the webhook.

### Issue: Bot doesn't respond at all
**Solution:** 
1. Webhook not set - Use Step 1 to set it
2. Environment variables missing - Check Step 2
3. Code errors - Check Step 3 logs

### Issue: Bot responds with errors
**Solution:** Check Vercel function logs (Step 3) for specific error messages.

---

## Step 8: Debug Mode

Add console.log to see what's happening:

The webhook route already logs errors. Check Vercel logs to see:
- If webhook is being called
- What errors are occurring
- If bot handlers are being triggered

---

## Still Not Working?

1. **Double-check webhook URL** - Must be exactly: `https://your-app.vercel.app/api/telegram/webhook`
2. **Verify HTTPS** - Telegram only works with HTTPS (Vercel provides this automatically)
3. **Check bot is active** - Make sure you didn't delete/disable the bot in @BotFather
4. **Wait a few seconds** - Sometimes Telegram takes a moment to deliver updates
5. **Try sending a message** - Not just `/start`, try typing any message

---

## Quick Test Commands

```bash
# 1. Check webhook info
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo

# 2. Set webhook
curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-app.vercel.app/api/telegram/webhook", "secret_token": "your_secret"}'

# 3. Test bot token
curl https://api.telegram.org/bot<TOKEN>/getMe

# 4. Delete webhook (if needed)
curl -X POST https://api.telegram.org/bot<TOKEN>/deleteWebhook
```

