# Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying both the Telegram bot and web application to production. Follow these instructions carefully to ensure secure, reliable deployment.

---

## Prerequisites

Before deployment, ensure you have:

- All code implemented and tested locally
- GitHub repository set up
- Vercel account (for web app)
- Bot hosting account (Railway/Render/Fly.io/VPS)
- Supabase project created
- All environment variables documented
- Domain names (optional, for custom domains)

---

## Part 1: Web App Deployment (Vercel)

### Step 1: GitHub Repository Setup

#### 1.1 Initialize Git Repository

**If not already initialized**:
```bash
cd srtrack-web
git init
git add .
git commit -m "Initial commit"
```

#### 1.2 Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click "New repository"
3. Name: `srtrack-web`
4. Description: "SRTrack Web Application"
5. Choose visibility (private recommended)
6. **Do NOT** initialize with README (if you have existing code)
7. Click "Create repository"

#### 1.3 Push to GitHub

```bash
git remote add origin https://github.com/yourusername/srtrack-web.git
git branch -M main
git push -u origin main
```

#### 1.4 Repository Security

**Configure**:
- Enable branch protection on `main`
- Require pull request reviews
- Require status checks
- Add `.env.local` to `.gitignore`
- Never commit secrets

---

### Step 2: Vercel Project Creation

#### 2.1 Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub (recommended)
3. Authorize Vercel to access your repositories

#### 2.2 Import Project

1. Click "Add New Project"
2. Select `srtrack-web` repository
3. Configure project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

#### 2.3 Environment Variables Configuration

**Before deploying, add all environment variables**:

1. Go to Project → Settings → Environment Variables
2. Add each variable:

**Required Variables**:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_TIMEZONE=Asia/Singapore
NODE_ENV=production
```

**Optional Variables**:
```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

3. **Important**: Set environment for each variable:
   - Production: ✅
   - Preview: ✅ (if using preview deployments)
   - Development: ❌ (not needed)

4. Click "Save"

#### 2.4 Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Review build logs for errors
4. Access your app at `https://your-project.vercel.app`

---

### Step 3: Vercel Configuration

#### 3.1 Custom Domain (Optional)

**If you have a custom domain**:

1. Go to Project → Settings → Domains
2. Add your domain (e.g., `srtrack.example.com`)
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic)

#### 3.2 Build Settings

**Verify Build Settings**:
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

#### 3.3 Environment Variables Verification

**Check**:
- All variables are set for Production
- No sensitive variables exposed to browser (except `NEXT_PUBLIC_*`)
- Service role key is NOT in `NEXT_PUBLIC_*` variables

---

### Step 4: Supabase Integration

#### 4.1 Verify Supabase Connection

**Test Connection**:
1. Visit your deployed app
2. Check browser console for errors
3. Test login functionality
4. Verify database queries work

#### 4.2 Configure Supabase URLs

**In Supabase Dashboard**:
1. Go to Settings → API
2. Add Vercel URL to allowed origins (if CORS required)
3. Verify RLS policies are active
4. Test authentication flow

---

### Step 5: Post-Deployment Verification

#### 5.1 Functionality Checklist

- [ ] App loads without errors
- [ ] Login page accessible
- [ ] Registration works
- [ ] Dashboard loads data
- [ ] Filters work correctly
- [ ] Role-based access enforced
- [ ] Overdue highlighting works
- [ ] Logout works
- [ ] Session persists

#### 5.2 Security Checklist

- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Environment variables not exposed
- [ ] RLS policies enforced
- [ ] Authentication required for protected routes
- [ ] No console errors
- [ ] No sensitive data in client-side code

#### 5.3 Performance Checklist

- [ ] Page load time < 3 seconds
- [ ] Dashboard loads data quickly
- [ ] No unnecessary API calls
- [ ] Images optimized
- [ ] Bundle size reasonable

---

## Part 2: Telegram Bot Deployment

### Step 1: Choose Hosting Platform

**Select one**:
- **Railway** (Recommended for simplicity)
- **Render** (Good free tier)
- **Fly.io** (Global edge)
- **VPS** (Full control)

**This guide covers Railway as primary example**

---

### Step 2: Railway Deployment

#### 2.1 Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Authorize Railway access

#### 2.2 Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your bot repository
4. Railway will auto-detect Node.js

#### 2.3 Configure Environment Variables

**Go to Project → Variables**:

**Required Variables**:
```
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_WEBHOOK_SECRET=your-random-secret-token
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=production
PORT=3000
TIMEZONE=Asia/Singapore
```

**Generate Webhook Secret**:
```bash
# Use a strong random string (32+ characters)
openssl rand -hex 32
```

#### 2.4 Configure Service Settings

**Settings to Configure**:
- **Start Command**: `npm start` or `node server.js` (adjust based on your setup)
- **Health Check Path**: `/health` (if implemented)
- **Port**: `3000` (or your chosen port)

#### 2.5 Deploy

1. Railway will automatically deploy on push to main branch
2. Or click "Deploy" manually
3. Wait for deployment to complete
4. Note the generated domain (e.g., `your-app.up.railway.app`)

#### 2.6 Get HTTPS URL

**Railway provides HTTPS automatically**:
- Your app URL: `https://your-app.up.railway.app`
- Use this for webhook configuration

---

### Step 3: Render Deployment (Alternative)

#### 3.1 Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Authorize Render access

#### 3.2 Create Web Service

1. Click "New +" → "Web Service"
2. Connect your bot repository
3. Configure:
   - **Name**: `srtrack-bot`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid)

#### 3.3 Environment Variables

**Add all required variables** (same as Railway)

#### 3.4 Deploy

1. Click "Create Web Service"
2. Render will build and deploy
3. Note the URL: `https://your-app.onrender.com`

---

### Step 4: Fly.io Deployment (Alternative)

#### 4.1 Install Fly CLI

```bash
# macOS
brew install flyctl

# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# Linux
curl -L https://fly.io/install.sh | sh
```

#### 4.2 Login

```bash
fly auth login
```

#### 4.3 Launch App

```bash
fly launch
```

Follow prompts:
- App name
- Region
- Postgres (not needed, using Supabase)
- Deploy now? Yes

#### 4.4 Set Secrets

```bash
fly secrets set TELEGRAM_BOT_TOKEN=your-token
fly secrets set TELEGRAM_WEBHOOK_SECRET=your-secret
fly secrets set SUPABASE_URL=your-url
fly secrets set SUPABASE_SERVICE_ROLE_KEY=your-key
```

#### 4.5 Deploy

```bash
fly deploy
```

---

### Step 5: VPS Deployment (Alternative)

#### 5.1 Provision VPS

**Choose provider**:
- DigitalOcean
- AWS EC2
- Linode
- Hetzner

**Recommended Specs**:
- 1 CPU core
- 512MB RAM (minimum)
- Ubuntu 22.04 LTS

#### 5.2 Initial Server Setup

**SSH into server**:
```bash
ssh root@your-server-ip
```

**Update system**:
```bash
apt update && apt upgrade -y
```

**Install Node.js**:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
```

**Install PM2** (process manager):
```bash
npm install -g pm2
```

#### 5.3 Deploy Application

**Clone repository**:
```bash
cd /opt
git clone https://github.com/yourusername/srtrack-bot.git
cd srtrack-bot
npm install
```

**Create `.env` file**:
```bash
nano .env
# Add all environment variables
```

**Set permissions**:
```bash
chmod 600 .env
```

#### 5.4 Configure Nginx (Reverse Proxy)

**Install Nginx**:
```bash
apt install -y nginx
```

**Create Nginx config**:
```bash
nano /etc/nginx/sites-available/srtrack-bot
```

**Configuration**:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable site**:
```bash
ln -s /etc/nginx/sites-available/srtrack-bot /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### 5.5 SSL Certificate (Let's Encrypt)

**Install Certbot**:
```bash
apt install -y certbot python3-certbot-nginx
```

**Obtain certificate**:
```bash
certbot --nginx -d your-domain.com
```

**Auto-renewal** (automatic):
```bash
certbot renew --dry-run
```

#### 5.6 Start Application with PM2

**Start app**:
```bash
cd /opt/srtrack-bot
pm2 start server.js --name srtrack-bot
pm2 save
pm2 startup
```

**PM2 Commands**:
```bash
pm2 status          # Check status
pm2 logs srtrack-bot # View logs
pm2 restart srtrack-bot # Restart
pm2 stop srtrack-bot    # Stop
```

---

### Step 6: Configure Telegram Webhook

#### 6.1 Set Webhook URL

**Using curl**:
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -d "url=https://your-bot-domain.com/webhook" \
  -d "secret_token=<YOUR_WEBHOOK_SECRET>"
```

**Using browser**:
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-bot-domain.com/webhook&secret_token=<YOUR_WEBHOOK_SECRET>
```

#### 6.2 Verify Webhook

**Check webhook info**:
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

**Expected Response**:
```json
{
  "ok": true,
  "result": {
    "url": "https://your-bot-domain.com/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

#### 6.3 Test Bot

1. Open Telegram
2. Find your bot (`@your_bot`)
3. Send `/start`
4. Verify bot responds
5. Test registration flow
6. Test clock in/out

---

### Step 7: Bot Post-Deployment Verification

#### 7.1 Functionality Checklist

- [ ] Bot responds to `/start`
- [ ] Registration flow works
- [ ] Clock in prevents duplicates
- [ ] Clock out works correctly
- [ ] Buttons update correctly
- [ ] Error messages are clear
- [ ] Database operations work
- [ ] Notifications sent (if implemented)

#### 7.2 Security Checklist

- [ ] Webhook secret token validated
- [ ] HTTPS enabled
- [ ] Environment variables secure
- [ ] No secrets in logs
- [ ] Rate limiting active
- [ ] Input validation working

#### 7.3 Monitoring Checklist

- [ ] Health check endpoint works
- [ ] Logs are accessible
- [ ] Error tracking configured
- [ ] Uptime monitoring active

---

## Part 3: Database Deployment

### Step 1: Supabase Production Setup

#### 1.1 Create Production Project

**If using separate project for production**:

1. Go to Supabase dashboard
2. Create new project
3. Choose region closest to users
4. Set strong database password
5. Wait for provisioning

#### 1.2 Run Migrations

**Using Supabase CLI** (recommended):
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

**Or using SQL Editor**:
1. Go to SQL Editor in Supabase dashboard
2. Paste migration SQL
3. Run migration
4. Verify tables created

#### 1.3 Configure RLS Policies

**Apply all RLS policies** (from Database Design Guide):
1. Enable RLS on all tables
2. Create policies for each table
3. Test policies with different users
4. Verify access restrictions

#### 1.4 Set Up Backups

**In Supabase Dashboard**:
1. Go to Settings → Database
2. Configure backup schedule
3. Set retention period
4. Test restore procedure

---

## Part 4: Monitoring and Alerts

### Step 1: Application Monitoring

#### 1.1 Vercel Monitoring

**Built-in**:
- Deployment logs
- Function logs
- Analytics (if enabled)
- Error tracking

**Access**:
- Project → Deployments → View logs
- Project → Analytics (if enabled)

#### 1.2 Bot Monitoring

**Railway**:
- Deployment logs
- Metrics dashboard
- Logs viewer

**Render**:
- Logs tab
- Metrics dashboard

**Fly.io**:
```bash
fly logs
fly status
```

**VPS (PM2)**:
```bash
pm2 logs
pm2 monit
```

#### 1.3 External Monitoring

**Consider**:
- **Sentry**: Error tracking
- **UptimeRobot**: Uptime monitoring
- **Logtail**: Log aggregation
- **Datadog**: Full observability

---

### Step 2: Alert Configuration

#### 2.1 Uptime Monitoring

**Set up UptimeRobot**:

1. Create account at [uptimerobot.com](https://uptimerobot.com)
2. Add monitor:
   - **Type**: HTTPS
   - **URL**: Your web app URL
   - **Interval**: 5 minutes
   - **Alert contacts**: Your email/SMS
3. Repeat for bot health check endpoint

#### 2.2 Error Alerts

**Configure Sentry** (if using):

1. Create Sentry project
2. Install SDK in applications
3. Configure alert rules
4. Set up notification channels

---

## Part 5: Production Checklist

### Pre-Launch Checklist

**Web App**:
- [ ] All environment variables set
- [ ] Supabase connection working
- [ ] Authentication tested
- [ ] Dashboard loads data
- [ ] RLS policies enforced
- [ ] HTTPS enabled
- [ ] Custom domain configured (if applicable)
- [ ] Error tracking configured

**Bot**:
- [ ] Environment variables set
- [ ] Webhook configured
- [ ] HTTPS enabled
- [ ] Registration flow tested
- [ ] Clock in/out tested
- [ ] Database operations tested
- [ ] Notifications tested
- [ ] Health check working

**Database**:
- [ ] All tables created
- [ ] RLS policies applied
- [ ] Indexes created
- [ ] Triggers working
- [ ] Backups configured
- [ ] Migration tested

**Security**:
- [ ] No secrets in code
- [ ] Environment variables secure
- [ ] RLS policies tested
- [ ] Input validation working
- [ ] Rate limiting active
- [ ] HTTPS everywhere

**Monitoring**:
- [ ] Logging configured
- [ ] Error tracking active
- [ ] Uptime monitoring set up
- [ ] Alert channels configured

---

## Part 6: Rollback Procedures

### Web App Rollback (Vercel)

**If deployment fails**:

1. Go to Project → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"
4. Investigate failed deployment
5. Fix issues
6. Redeploy

### Bot Rollback

**Railway/Render**:
- Revert to previous deployment
- Or rollback via Git (revert commit and redeploy)

**Fly.io**:
```bash
fly releases
fly releases rollback <release-id>
```

**VPS**:
```bash
cd /opt/srtrack-bot
git checkout <previous-commit>
pm2 restart srtrack-bot
```

### Database Rollback

**If migration fails**:

1. **DO NOT** delete data manually
2. Create rollback migration
3. Test rollback in staging first
4. Apply rollback migration
5. Verify data integrity

---

## Part 7: Post-Deployment Tasks

### Immediate Tasks (First 24 Hours)

1. **Monitor Logs**
   - Check for errors
   - Monitor performance
   - Watch for unusual activity

2. **Test All Flows**
   - Registration
   - Login
   - Clock in/out
   - Dashboard viewing
   - Notifications

3. **Verify Security**
   - Test unauthorized access attempts
   - Verify RLS policies
   - Check for exposed secrets

4. **Performance Check**
   - Page load times
   - API response times
   - Database query performance

### First Week Tasks

1. **User Onboarding**
   - Register test users
   - Train commanders
   - Document user guides

2. **Monitor Usage**
   - Track user activity
   - Monitor error rates
   - Check database growth

3. **Optimize**
   - Identify slow queries
   - Add indexes if needed
   - Optimize API routes

---

## Next Steps

After deployment:

1. **Operations** → See `06-operational-maintenance.md`
2. **Failure Scenarios** → See `07-failure-scenarios-safeguards.md`

