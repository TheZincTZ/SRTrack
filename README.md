# SRTrack - Self-Regulated Training Tracking System

A production-ready, secure system for tracking Self-Regulated Training (SRT) compliance via Telegram bot and web dashboard.

## Features

- **Telegram Bot**: SRT participants can register, clock in, and clock out
- **Web Dashboard**: Commanders and admins can monitor SRT status for their company
- **Compliance Monitoring**: Automatic 10 PM SGT check for violations
- **Company-Scoped Access**: Data isolation by company using Row Level Security
- **Secure Authentication**: Supabase Auth with role-based access control

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Hosting**: Vercel
- **Bot Platform**: Telegram Bot API

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- Telegram Bot Token
- Vercel account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (see `.env.example`)

4. Run database migrations:
   - Open Supabase SQL Editor
   - Run `supabase/schema.sql`

5. Start development server:
   ```bash
   npm run dev
   ```

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── telegram/          # Telegram bot webhook
│   │   ├── auth/              # Authentication endpoints
│   │   └── cron/              # Scheduled jobs
│   ├── dashboard/             # Commander dashboard
│   ├── login/                 # Login page
│   └── layout.tsx
├── components/                # React components
├── lib/
│   ├── supabase/             # Supabase clients
│   ├── types.ts              # TypeScript types
│   └── utils.ts              # Utility functions
├── supabase/
│   └── schema.sql            # Database schema
└── vercel.json               # Vercel configuration
```

## Environment Variables

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete environment variable setup.

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_URL`
- `TELEGRAM_WEBHOOK_SECRET`
- `CRON_SECRET`

## User Roles

### SRT User (Telegram)
- Register via Telegram bot
- Clock in/out
- View own status

### Commander/Admin (Web)
- Login to web dashboard
- View SRT status for their company only
- Receive violation alerts

## Compliance Rules

- Users must clock out before 10:00 PM SGT
- Violations are automatically marked as RED status
- Commanders receive alerts for violations in their company

## Security

- Row Level Security (RLS) enforced in Supabase
- Company-based data isolation
- Secure authentication with Supabase Auth
- Environment variables for secrets
- Input validation on all endpoints

## License

ISC

## Support

For deployment help, see [DEPLOYMENT.md](./DEPLOYMENT.md)
