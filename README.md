# SRTrack — Secure Self-Regulated Training Attendance System

## Overview

SRTrack is a **tamper-resistant, role-based attendance tracking system** designed for military training environments. The system consists of:

1. **Telegram Bot** — Used by trainees to clock in and out
2. **Web Application** — Used by commanders and admins to monitor attendance

## Project Structure

```
SRTrack/
├── bot/                 # Telegram bot implementation
│   ├── src/
│   │   ├── config/     # Configuration files
│   │   ├── handlers/   # Bot command handlers
│   │   ├── services/   # Business logic services
│   │   ├── middleware/ # Express middleware
│   │   ├── types/      # TypeScript types
│   │   ├── utils/      # Utility functions
│   │   ├── bot.ts      # Bot initialization
│   │   └── server.ts   # Express server
│   └── package.json
│
├── web/                 # Next.js web application
│   ├── app/            # Next.js App Router pages
│   ├── components/     # React components
│   ├── lib/            # Utility libraries
│   └── package.json
│
├── database/            # Database migrations
│   └── migrations/
│
└── docs/                # Documentation guides
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Telegram Bot Token (from BotFather)

### 1. Database Setup

1. Create a Supabase project
2. Run migrations in order:
   ```bash
   # In Supabase SQL Editor, run:
   # database/migrations/001_initial_schema.sql
   # database/migrations/002_rls_policies.sql
   ```

### 2. Telegram Bot Setup

1. Navigate to bot directory:
   ```bash
   cd bot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. Build and start:
   ```bash
   npm run build
   npm start
   ```

5. Set webhook (after deployment):
   ```bash
   curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
     -d "url=https://your-domain.com/webhook" \
     -d "secret_token=<SECRET>"
   ```

### 3. Web App Setup

1. Navigate to web directory:
   ```bash
   cd web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_TIMEZONE=Asia/Singapore
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   npm start
   ```

## Documentation

Comprehensive guides are available in the `docs/` directory:

1. **[System Architecture Overview](docs/01-system-architecture-overview.md)**
2. **[Telegram Bot Setup Guide](docs/02-telegram-bot-setup.md)**
3. **[Web App Setup Guide](docs/03-web-app-setup.md)**
4. **[Database & Security Design](docs/04-database-security-design.md)**
5. **[Deployment Guide](docs/05-deployment-guide.md)**
6. **[Operational & Maintenance](docs/06-operational-maintenance.md)**
7. **[Failure Scenarios & Safeguards](docs/07-failure-scenarios-safeguards.md)**

## Technology Stack

- **Bot**: Node.js/TypeScript, Express, node-telegram-bot-api
- **Web**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Hosting**: Vercel (web), Railway/Render/Fly.io (bot)

## Security

- Server-side validation only
- Row Level Security (RLS) policies
- Environment variables for secrets
- Webhook secret token validation
- Replay attack prevention
- Input validation with Zod

## License

ISC
