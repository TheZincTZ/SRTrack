# Telegram Bot Setup Guide

## Overview

This guide covers the complete setup process for the SRTrack Telegram bot. The bot serves as the primary interface for trainees to clock in and out of training sessions.

**Important**: This guide provides **step-by-step instructions and conceptual guidance only**. It does not include application code.

---

## Prerequisites

Before starting, ensure you have:

- A Telegram account
- Access to a hosting platform (Railway, Render, Fly.io, or VPS)
- Basic understanding of webhooks and HTTPS
- Environment variable management knowledge

---

## Step 1: Create Bot via BotFather

### 1.1 Open Telegram and Find BotFather

1. Open Telegram app (mobile or desktop)
2. Search for `@BotFather` in Telegram
3. Start a conversation with BotFather

### 1.2 Create New Bot

1. Send `/newbot` command to BotFather
2. Follow prompts:
   - **Bot name**: `SRTrack Attendance Bot` (or your preferred name)
   - **Bot username**: Must end with `bot` (e.g., `srtrack_bot`)
3. BotFather will provide:
   - **Bot Token**: Save this securely (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
   - **Bot Username**: Your bot's handle (e.g., `@srtrack_bot`)

### 1.3 Configure Bot Settings

Run these commands with BotFather:

- `/setdescription` — Set bot description (e.g., "Secure training attendance tracking")
- `/setabouttext` — Set about text
- `/setcommands` — Set command list:
  ```
  start - Start the bot
  register - Register as a trainee
  status - Check your current status
  ```

### 1.4 Security: Protect Your Bot Token

**CRITICAL**: Never commit the bot token to version control.

- Store token in environment variables only
- Use `.env` files locally (add to `.gitignore`)
- Use hosting platform's environment variable system for production
- Rotate token if exposed: `/revoke` command with BotFather

---

## Step 2: Choose Bot Hosting Platform

The bot backend **cannot** be hosted on Vercel due to webhook limitations. 

**Recommended**: **Render** (Free tier available, easy setup)

### Option A: Render (Recommended)

**Pros**:
- Free tier available
- Easy webhook setup
- Automatic HTTPS
- Good documentation
- GitHub integration
- Environment variable management

**Setup Steps**:

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub (recommended for easy repository connection)
   - Authorize Render to access your repositories

2. **Create New Web Service**
   - Click "New +" button in the dashboard
   - Select "Web Service"
   - Connect your GitHub repository containing the bot code
   - Select the repository and branch (usually `main` or `master`)

3. **Configure Service Settings**
   
   **Basic Settings**:
   - **Name**: `srtrack-bot` (or your preferred name)
   - **Region**: Choose closest to your users (e.g., Singapore for SGT timezone)
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `bot` ⚠️ **IMPORTANT**: Set this to `bot` since your bot code is in the `bot/` folder
   
   **Runtime Settings**:
   - **Runtime**: Select **Node** (this is critical - do not select Go, Python, etc.)
   - **Build Command**: `NODE_ENV=development npm install && npm run build`
     - Setting `NODE_ENV=development` ensures devDependencies (TypeScript types) are installed
     - This installs all dependencies and compiles TypeScript to JavaScript
     - The build creates the `dist/` folder with compiled JavaScript
   - **Start Command**: `npm start`
     - This runs `node dist/server.js` as defined in package.json
     - Make sure `dist/server.js` exists after build completes
   
   **Plan**:
   - **Free**: Suitable for development and low traffic
   - **Starter** ($7/month): Better performance, no sleep on free tier

4. **Configure Environment Variables**
   - Scroll down to "Environment Variables" section
   - Click "Add Environment Variable"
   - Add each variable:
     ```
     TELEGRAM_BOT_TOKEN=your-bot-token-from-botfather
     TELEGRAM_WEBHOOK_SECRET=your-random-secret-token-32-chars-min
     SUPABASE_URL=https://your-project.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     NODE_ENV=production
     PORT=3000
     TIMEZONE=Asia/Singapore
     ```
   - **Important**: Generate a strong webhook secret:
     ```bash
     # On Linux/Mac
     openssl rand -hex 32
     
     # Or use an online generator (32+ characters)
     ```

5. **Deploy**
   - Click "Create Web Service"
   - Render will automatically:
     - Clone your repository
     - Run the build command
     - Start your service
   - Wait for deployment to complete (usually 2-5 minutes)
   - Note the service URL (e.g., `https://srtrack-bot.onrender.com`)

6. **Verify Deployment**
   - Check the "Logs" tab for any errors
   - Visit `https://your-service-url.onrender.com/health` in your browser
   - You should see: `{"status":"ok","timestamp":"..."}`

**Important Notes for Render**:
- Free tier services **sleep after 15 minutes of inactivity**
- First request after sleep may take 30-60 seconds (cold start)
- Consider upgrading to Starter plan for production use
- Render provides HTTPS automatically - no SSL configuration needed
- Service URL format: `https://your-service-name.onrender.com`

### Option B: Railway (Alternative)

**Pros**:
- Easy deployment from GitHub
- Built-in environment variable management
- Automatic HTTPS
- No sleep on free tier (with usage limits)

**Setup Steps**:
1. Create account at [railway.app](https://railway.app)
2. Create new project
3. Connect GitHub repository
4. Railway will auto-detect Node.js
5. Add environment variables
6. Railway provides HTTPS URL automatically

### Option C: Fly.io

**Pros**:
- Global edge deployment
- Good performance
- Docker-based

**Setup Steps**:
1. Install Fly CLI
2. Run `fly launch`
3. Configure `fly.toml`
4. Deploy with `fly deploy`

### Option D: VPS (DigitalOcean, AWS EC2, etc.)

**Pros**:
- Full control
- No platform limitations

**Cons**:
- Requires manual SSL certificate setup (Let's Encrypt)
- More maintenance overhead

**Setup Steps**:
1. Provision VPS instance
2. Install Node.js runtime
3. Set up reverse proxy (Nginx)
4. Configure SSL certificate (Certbot)
5. Set up process manager (PM2)

---

## Step 3: Webhook Configuration

### 3.1 Understanding Webhooks

**Concept**: Instead of polling Telegram for updates, Telegram sends HTTP POST requests to your server when users interact with the bot.

**Requirements**:
- Your server must have HTTPS (not HTTP)
- Your server must be publicly accessible
- Your webhook endpoint must accept POST requests

### 3.2 Webhook Endpoint Structure

Your bot backend should expose an endpoint like:
```
POST https://your-bot-domain.com/webhook
```

**Request Format** (from Telegram):
```json
{
  "update_id": 123456789,
  "message": {
    "message_id": 1,
    "from": {
      "id": 123456789,
      "is_bot": false,
      "first_name": "John",
      "username": "johndoe"
    },
    "chat": {
      "id": 123456789,
      "type": "private"
    },
    "date": 1234567890,
    "text": "/start"
  }
}
```

### 3.3 Setting Webhook URL

**Method**: Use Telegram Bot API directly

**Endpoint**: `https://api.telegram.org/bot<BOT_TOKEN>/setWebhook`

**For Render Deployment**:
- Your webhook URL will be: `https://your-service-name.onrender.com/webhook`
- Example: `https://srtrack-bot.onrender.com/webhook`

**Parameters**:
- `url`: Your HTTPS webhook URL (from Render)
- `secret_token`: Your webhook secret token (from environment variables)

**Example** (using curl):
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -d "url=https://srtrack-bot.onrender.com/webhook" \
  -d "secret_token=<YOUR_WEBHOOK_SECRET>"
```

**Or using browser** (replace values):
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://srtrack-bot.onrender.com/webhook&secret_token=<YOUR_WEBHOOK_SECRET>
```

**Verification**:
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

**Expected Response**:
```json
{
  "ok": true,
  "result": {
    "url": "https://srtrack-bot.onrender.com/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

**Render-Specific Notes**:
- If your Render service is sleeping (free tier), the first webhook test may fail
- Wake up the service by visiting the health endpoint first: `https://your-service.onrender.com/health`
- Then set the webhook immediately after

### 3.4 Webhook Security: Secret Token Validation

**Concept**: Telegram can send a `X-Telegram-Bot-Api-Secret-Token` header with each webhook request.

**Implementation Guidance**:
1. Generate a strong random secret token (32+ characters)
2. Store in environment variable: `TELEGRAM_WEBHOOK_SECRET`
3. Set this token when configuring webhook
4. In your webhook handler, verify the header matches your stored secret
5. Reject requests without valid secret token

**Why This Matters**: Prevents unauthorized parties from sending fake webhook requests to your endpoint.

---

## Step 4: Handling Inline Buttons (Conceptual)

### 4.1 Button Structure

Telegram supports inline keyboards (buttons that appear below messages).

**Conceptual Structure**:
- Create keyboard with `reply_markup` parameter
- Each button has `text` and `callback_data`
- When user clicks button, Telegram sends `callback_query` update

### 4.2 Clock In/Out Button Design

**Recommended Layout**:
```
┌──────────┐  ┌───────────┐
│ Clock In │  │ Clock Out │
└──────────┘  └───────────┘
```

**Button States**:
- If user is clocked in: Disable "Clock In", enable "Clock Out"
- If user is clocked out: Enable "Clock In", disable "Clock Out"

### 4.3 Callback Query Handling

**Flow**:
1. User clicks button
2. Telegram sends `callback_query` update
3. Your backend processes the action
4. Send `answerCallbackQuery` to acknowledge
5. Optionally update message or send new message

**Important**: Always acknowledge callback queries to remove loading state.

---

## Step 5: Registration Flow Implementation Guide

### 5.1 Registration Requirements

Collect from trainee:
- Rank
- Full Name
- Identification Number
- Company (A, B, C, Support, MSC, HQ)

### 5.2 Registration Flow Design

**Step-by-Step Process**:

1. **Initial Contact** (`/start` command)
   - Check if user already registered
   - If yes: Show status and buttons
   - If no: Initiate registration

2. **Registration Initiation** (`/register` command)
   - Send message: "Please provide your details"
   - Use sequential prompts or form-like interface

3. **Data Collection**
   - Option A: Sequential prompts (one field at a time)
   - Option B: Single message parsing (structured format)
   - Validate each input before proceeding

4. **Validation**
   - Check for duplicate identification numbers
   - Verify company is valid
   - Ensure Telegram User ID not already registered

5. **Storage**
   - Insert into `trainees` table
   - Bind `telegram_user_id` to record
   - Set `is_active` flag to `true`

6. **Confirmation**
   - Send success message
   - Show clock in/out buttons

### 5.3 Preventing Duplicate Registrations

**Database Constraint**:
- Unique constraint on `telegram_user_id` column
- Unique constraint on `identification_number` column

**Application Logic**:
- Before inserting, query for existing `telegram_user_id`
- If found, reject registration and inform user
- Log attempt for audit purposes

---

## Step 6: Clock In/Out Logic Implementation Guide

### 6.1 State Management

**Concept**: Track current state per user

**Database Design**:
- `attendance_logs` table stores all clock events
- Each log entry has: `user_id`, `clock_in_time`, `clock_out_time`, `status`
- Query latest log for user to determine current state

### 6.2 Clock In Validation Rules

**Check Before Clocking In**:
1. User is registered
2. User is not currently clocked in (no open log entry)
3. Current time is valid (not past daily cutoff)
4. Rate limiting: Prevent rapid successive clicks

**On Success**:
1. Insert new record in `attendance_logs`
2. Set `clock_in_time` to current SGT time
3. Set `status` to `'IN'`
4. Send confirmation message
5. Update inline keyboard (disable Clock In, enable Clock Out)

### 6.3 Clock Out Validation Rules

**Check Before Clocking Out**:
1. User is registered
2. User has an active clock-in (open log entry exists)
3. Clock-out time is after clock-in time
4. Rate limiting: Prevent rapid successive clicks

**On Success**:
1. Update existing `attendance_logs` record
2. Set `clock_out_time` to current SGT time
3. Set `status` to `'OUT'`
4. Send confirmation message
5. Update inline keyboard (enable Clock In, disable Clock Out)

### 6.4 Error Handling

**Invalid Actions**:
- Clock in when already in → "You are already clocked in"
- Clock out when not in → "You are not currently clocked in"
- Not registered → "Please register first using /register"

**User Feedback**:
- Always provide clear, actionable error messages
- Use `answerCallbackQuery` with error text for button clicks
- Log all errors for debugging

---

## Step 7: Server-Side Validation (Critical)

### 7.1 Why Server-Side Validation Matters

**Principle**: Never trust the Telegram client. All validation must happen on your server.

**Attack Scenarios Prevented**:
- User modifies Telegram app to send fake data
- User replays old messages
- User sends malformed requests

### 7.2 Validation Checklist

For every webhook request, validate:

1. **Request Authenticity**
   - Verify `X-Telegram-Bot-Api-Secret-Token` header
   - Verify request comes from Telegram IP ranges (optional, advanced)

2. **User Identity**
   - Extract `telegram_user_id` from request
   - Verify user exists in database
   - Check user is active

3. **Action Validity**
   - Verify action is allowed in current state
   - Check business rules (e.g., cannot clock in twice)
   - Validate timestamps

4. **Rate Limiting**
   - Track requests per user per time window
   - Reject excessive requests
   - Prevent spam/abuse

### 7.3 Replay Attack Prevention

**Concept**: Prevent users from replaying old messages/actions

**Implementation Guidance**:
- Store `update_id` from Telegram (incremental)
- Reject duplicate `update_id` values
- Use database unique constraint on `update_id` if storing
- Include timestamp validation (reject actions too far in past/future)

---

## Step 8: Commander Notification System

### 8.1 Notification Trigger

**When to Notify**:
- Trainee clocks in (optional, if required)
- Trainee clocks out (optional, if required)
- **Daily cutoff check**: Trainee failed to clock out by 22:00 SGT

### 8.2 Notification Flow Design

**Conceptual Process**:

1. **Identify Recipients**
   - Query `commanders` table
   - Filter by trainee's company
   - Filter by `is_active = true`

2. **Compose Message**
   - Include trainee details (rank, name, number)
   - Include relevant timestamp
   - Include action taken (clock in/out/overdue)

3. **Send Notification**
   - Use Telegram Bot API `sendMessage`
   - Target commander's Telegram User ID (if stored)
   - Or use alternative channel (email, SMS) if preferred

4. **Idempotency**
   - Prevent duplicate notifications
   - Track sent notifications in database
   - Use unique constraint on (commander_id, trainee_id, date, type)

### 8.3 Daily Cutoff Check Implementation

**Scheduled Job Concept**:

1. **Trigger**: Run daily at 22:05 SGT (5 minutes after cutoff)

2. **Process**:
   - Query all `attendance_logs` where:
     - `status = 'IN'`
     - `clock_in_time` is from today
     - `clock_out_time` is NULL
   - For each overdue trainee:
     - Mark record (add flag or update status)
     - Send notification to commanders
     - Log action

3. **Hosting Considerations**:
   - **Render**: Use Render Cron Jobs (available on paid plans) or external cron service
   - **External Cron**: Use cron-job.org or similar to call your endpoint daily
   - **Supabase Edge Functions**: Use Supabase scheduled functions (if available)
   - **Recommended**: External cron service calling `/api/overdue-check` endpoint

---

## Step 9: Environment Variables Management

### 9.1 Required Variables

**Bot Configuration**:
- `TELEGRAM_BOT_TOKEN` — Bot token from BotFather
- `TELEGRAM_WEBHOOK_SECRET` — Secret token for webhook validation
- `TELEGRAM_WEBHOOK_URL` — Your webhook URL (for reference)

**Database**:
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (for server-side operations)
- `SUPABASE_ANON_KEY` — Anon key (if needed)

**Application**:
- `NODE_ENV` — `production` or `development`
- `PORT` — Server port (if applicable)
- `TIMEZONE` — `Asia/Singapore`

### 9.2 Local Development Setup

1. Create `.env` file in project root
2. Add all required variables
3. Add `.env` to `.gitignore`
4. Never commit `.env` file

### 9.3 Production Setup

**Render** (Recommended):
1. Go to your Render dashboard
2. Select your web service (`srtrack-bot`)
3. Click on "Environment" tab
4. Click "Add Environment Variable"
5. Add each variable one by one:
   - Key: `TELEGRAM_BOT_TOKEN`
   - Value: `your-actual-bot-token`
   - Click "Save Changes"
6. Repeat for all variables
7. Render will automatically redeploy after saving
8. Check deployment logs to verify variables are loaded

**Important Render Notes**:
- Variables are encrypted at rest
- Changes trigger automatic redeployment
- You can update variables without redeploying code
- Use "Manual Deploy" if you want to deploy without variable changes

**Railway** (Alternative):
- Go to project → Variables tab
- Add each variable
- Redeploy after adding variables

**Fly.io** (Alternative):
- Use `fly secrets set KEY=value`
- Or use `fly.toml` for non-sensitive config

**VPS** (Alternative):
- Use systemd environment files
- Or use `.env` file with restricted permissions
- Consider using secrets management tool

---

## Step 10: Common Mistakes and Security Pitfalls

### 10.1 Mistakes to Avoid

❌ **Storing bot token in code**
- ✅ Use environment variables only

❌ **Trusting client-side data**
- ✅ Validate everything server-side

❌ **Not handling webhook errors**
- ✅ Implement retry logic and error logging

❌ **Ignoring rate limits**
- ✅ Implement rate limiting per user

❌ **Not validating user registration**
- ✅ Check user exists before processing actions

❌ **Hardcoding company values**
- ✅ Store in database, validate against enum

❌ **Not handling timezone correctly**
- ✅ Always convert to SGT for display and validation

### 10.2 Security Best Practices

✅ **Webhook Secret Token**: Always validate secret token header

✅ **Input Sanitization**: Sanitize all user inputs before database operations

✅ **SQL Injection Prevention**: Use parameterized queries, never string concatenation

✅ **Error Messages**: Don't expose internal errors to users

✅ **Logging**: Log all actions for audit trail

✅ **HTTPS Only**: Never use HTTP in production

✅ **Token Rotation**: Rotate bot token periodically or if compromised

---

## Step 11: Testing Your Bot

### 11.1 Local Testing

1. Use `ngrok` or similar tool to expose local server
2. Set webhook URL to ngrok URL
3. Test registration flow
4. Test clock in/out flow
5. Test error scenarios

### 11.2 Production Testing Checklist

**Before Testing**:
- [ ] Render service is deployed and running
- [ ] Health endpoint responds: `https://your-service.onrender.com/health`
- [ ] Webhook is configured correctly
- [ ] All environment variables are set in Render

**Functionality Tests**:
- [ ] Bot responds to `/start`
- [ ] Registration flow works end-to-end
- [ ] Clock in prevents duplicate clock ins
- [ ] Clock out prevents clock out when not clocked in
- [ ] Buttons update correctly after actions
- [ ] Error messages are clear
- [ ] Webhook secret token validation works
- [ ] Database constraints prevent duplicates
- [ ] Timezone conversion is correct (SGT)

**Render-Specific Tests**:
- [ ] Service wakes up from sleep (free tier) - first request may be slow
- [ ] Logs are accessible in Render dashboard
- [ ] Environment variables are loaded correctly
- [ ] Automatic redeployment works on git push
- [ ] HTTPS is working (check certificate)

**Testing Tips for Render**:
- If service is sleeping, visit health endpoint first to wake it up
- Check Render logs for any errors during webhook processing
- Monitor service metrics in Render dashboard
- Test during active hours to avoid cold starts

---

## Step 12: Monitoring and Maintenance

### 12.1 Health Checks

**Implement**:
- Health check endpoint (`/health`)
- Returns 200 OK if bot is operational
- Check database connectivity
- Monitor webhook delivery status

### 12.2 Logging Strategy

**Log Events**:
- All webhook requests (with sanitized data)
- All clock in/out actions
- All registration attempts
- All errors and exceptions
- All notification sends

**Log Format**: Structured JSON recommended

### 12.3 Monitoring Tools

**Render Built-in Monitoring**:
- **Logs**: Accessible in Render dashboard → Logs tab
- **Metrics**: View CPU, memory, and request metrics in dashboard
- **Events**: Deployment events and service status
- **Alerts**: Configure email alerts for service failures

**External Monitoring** (Recommended):
- **Uptime Monitoring**: UptimeRobot or Pingdom to monitor health endpoint
  - URL: `https://your-service.onrender.com/health`
  - Interval: 5 minutes
  - Alert on downtime
- **Application Monitoring**: Sentry or Rollbar for error tracking
- **Log Aggregation**: Consider external service for long-term log storage

**Render-Specific Monitoring Tips**:
- Monitor service sleep/wake cycles (free tier)
- Track cold start times (first request after sleep)
- Set up alerts for deployment failures
- Monitor environment variable changes
- Track service resource usage (upgrade if needed)

---

## Next Steps

After completing bot setup:

1. **Web App Setup** → See `03-web-app-setup.md`
2. **Database Design** → See `04-database-security-design.md`
3. **Deployment** → See `05-deployment-guide.md`

