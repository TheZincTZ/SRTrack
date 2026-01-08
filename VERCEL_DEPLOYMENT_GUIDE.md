# Vercel Deployment Guide - Step by Step

## What Gets Deployed to Vercel?

**You deploy the ENTIRE project folder** - Vercel will automatically:
- Build your Next.js application
- Deploy all API routes
- Set up serverless functions
- Configure the cron job (from `vercel.json`)

### What Vercel Deploys:
- ✅ All your code (app/, components/, lib/, etc.)
- ✅ Next.js configuration
- ✅ API routes (Telegram webhook, auth, cron)
- ✅ Web pages (login, dashboard)
- ✅ Static assets

### What Vercel Does NOT Deploy:
- ❌ `node_modules/` (installed automatically)
- ❌ `.env.local` files (use Vercel's environment variables instead)
- ❌ `.git/` folder

---

## Step-by-Step Deployment

### Step 1: Prepare Your Project

Make sure you have:
1. All code committed to Git (optional but recommended)
2. `package.json` with all dependencies
3. `vercel.json` for cron configuration

### Step 2: Deploy to Vercel

**Option A: Using Vercel CLI (Recommended)**

```bash
# Install Vercel CLI globally (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (first time - follow prompts)
vercel

# Deploy to production
vercel --prod
```

**Option B: Using Vercel Dashboard**

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your Git repository (GitHub/GitLab/Bitbucket)
4. Vercel will auto-detect Next.js and configure it

---

## Step 3: Set Environment Variables in Vercel

**CRITICAL:** You MUST set these in Vercel dashboard, NOT in code files!

### How to Add Environment Variables:

1. Go to your project in Vercel dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable one by one (see list below)
4. Select which environments to apply to:
   - **Production** = Live site
   - **Preview** = Pull request previews
   - **Development** = Local development (if using Vercel CLI)

### Required Environment Variables:

#### 1. Supabase Configuration

| Variable Name | Value | Where to Get It | Environment |
|--------------|-------|----------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase Dashboard → Settings → API → Project URL | **All** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` (long string) | Supabase Dashboard → Settings → API → anon/public key | **All** |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` (long string) | Supabase Dashboard → Settings → API → service_role key | **All** |

⚠️ **IMPORTANT:** The `SUPABASE_SERVICE_ROLE_KEY` is **SECRET** - never expose it in client-side code!

#### 2. Telegram Bot Configuration

| Variable Name | Value | Where to Get It | Environment |
|--------------|-------|----------------|-------------|
| `TELEGRAM_BOT_TOKEN` | `123456789:ABCdefGHIjklMNOpqrsTUVwxyz` | From [@BotFather](https://t.me/botfather) on Telegram | **All** |
| `TELEGRAM_WEBHOOK_URL` | `https://your-app.vercel.app/api/telegram/webhook` | Your Vercel deployment URL + `/api/telegram/webhook` | **Production only** |
| `TELEGRAM_WEBHOOK_SECRET` | Any random string (e.g., `my-secret-123`) | Generate a random secret string | **All** |

#### 3. Cron Job Security

| Variable Name | Value | Where to Get It | Environment |
|--------------|-------|----------------|-------------|
| `CRON_SECRET` | Any random string (e.g., `cron-secret-456`) | Generate a random secret string | **All** |

#### 4. Optional: Commander Registration Protection

| Variable Name | Value | Where to Get It | Environment |
|--------------|-------|----------------|-------------|
| `COMMANDER_REGISTRATION_API_KEY` | Any random string | Generate a random secret string | **All** (optional) |

---

## Example: Setting Variables in Vercel Dashboard

1. **Go to:** Your Project → Settings → Environment Variables

2. **Click "Add New"** and fill in:
   - **Key:** `NEXT_PUBLIC_SUPABASE_URL`
   - **Value:** `https://abcdefghijklmnop.supabase.co`
   - **Environment:** Select "Production", "Preview", and "Development"
   - Click "Save"

3. **Repeat for each variable** from the list above

---

## Step 4: Redeploy After Setting Variables

After adding environment variables, you MUST redeploy:

```bash
vercel --prod
```

Or click "Redeploy" in Vercel dashboard.

**Why?** Environment variables are only available to new deployments, not existing ones.

---

## Step 5: Verify Deployment

### Check Your Deployment:

1. **Visit your site:** `https://your-app.vercel.app`
2. **Check API routes:**
   - `https://your-app.vercel.app/api/telegram/webhook` (should return error without proper request)
   - `https://your-app.vercel.app/api/cron/compliance-check` (should require auth)

### Test Environment Variables:

You can verify variables are set by checking Vercel function logs:
1. Go to your project → **Deployments**
2. Click on a deployment
3. Click **Functions** tab
4. Check logs for any "environment variable not set" errors

---

## Quick Reference: All Environment Variables

Copy-paste this checklist:

```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ TELEGRAM_BOT_TOKEN
✅ TELEGRAM_WEBHOOK_URL (Production only)
✅ TELEGRAM_WEBHOOK_SECRET
✅ CRON_SECRET
✅ COMMANDER_REGISTRATION_API_KEY (Optional)
```

---

## Common Mistakes to Avoid

❌ **DON'T:** Commit `.env.local` files to Git
✅ **DO:** Use Vercel's Environment Variables dashboard

❌ **DON'T:** Hardcode secrets in your code
✅ **DO:** Always use `process.env.VARIABLE_NAME`

❌ **DON'T:** Forget to redeploy after adding variables
✅ **DO:** Always redeploy after changing environment variables

❌ **DON'T:** Share your `SUPABASE_SERVICE_ROLE_KEY` publicly
✅ **DO:** Keep it secret and only in Vercel dashboard

---

## Troubleshooting

### "Environment variable not found" error

1. Check variable name matches exactly (case-sensitive!)
2. Verify it's set in Vercel dashboard
3. Make sure you redeployed after adding it
4. Check which environment (Production/Preview) you're testing

### Variables not working in API routes

1. Ensure variable doesn't start with `NEXT_PUBLIC_` (those are client-side only)
2. Server-side variables (like `SUPABASE_SERVICE_ROLE_KEY`) work in API routes
3. Restart your local dev server if testing locally

---

## Security Best Practices

1. ✅ **Never commit secrets to Git**
2. ✅ **Use different secrets for Production vs Development**
3. ✅ **Rotate secrets periodically**
4. ✅ **Use Vercel's environment variable encryption**
5. ✅ **Limit who has access to Vercel project settings**

---

## Next Steps After Deployment

1. ✅ Set up Telegram webhook (see DEPLOYMENT.md Step 2.2)
2. ✅ Register commanders (see DEPLOYMENT.md Step 5)
3. ✅ Test the system end-to-end
4. ✅ Monitor Vercel function logs for errors

