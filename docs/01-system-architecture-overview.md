# System Architecture Overview

## SRTrack — Secure Self-Regulated Training Attendance System

### Purpose

SRTrack is a tamper-resistant, role-based attendance tracking system designed for military training environments. It consists of two primary interfaces:

1. **Telegram Bot** — Used by trainees to clock in/out
2. **Web Application** — Used by commanders and admins to monitor attendance

---

## High-Level Architecture

```
┌─────────────────┐         ┌──────────────────┐
│  Telegram Bot   │────────▶│   Bot Backend    │
│  (Trainees)     │         │   (Hosted)       │
└─────────────────┘         └────────┬─────────┘
                                      │
                                      ▼
                              ┌───────────────┐
                              │   Supabase    │
                              │  (PostgreSQL) │
                              └───────┬───────┘
                                      │
┌─────────────────┐         ┌────────┴─────────┐
│   Web App       │────────▶│  Next.js API    │
│ (Commanders)    │         │  (Vercel)        │
└─────────────────┘         └──────────────────┘
```

---

## Component Breakdown

### 1. Telegram Bot

**Purpose**: Trainee-facing interface for attendance operations

**Key Characteristics**:
- Stateless interaction model
- Inline keyboard buttons (Clock In / Clock Out)
- Webhook-based message handling
- Server-side validation of all actions

**Hosting Requirements**:
- Must support HTTPS (for webhook security)
- Must have persistent uptime
- Cannot be hosted on Vercel (webhook limitations)
- Recommended: Railway, Render, Fly.io, or VPS

**Security Model**:
- All logic validated server-side
- Telegram User ID bound to registration
- No client-side trust
- Rate limiting enforced

---

### 2. Web Application

**Purpose**: Command and administrative interface for monitoring

**Technology**: Next.js 14+ (App Router)

**Key Features**:
- Role-based access control (Commander vs Admin)
- Real-time attendance dashboard
- Overdue user highlighting
- Company-based filtering
- Server-side rendering for security

**Hosting**: Vercel (optimized for Next.js)

**Security Model**:
- Supabase Row Level Security (RLS)
- Server-side access enforcement
- No client-side data mutations
- Session-based authentication

---

### 3. Database Layer

**Technology**: Supabase (PostgreSQL)

**Key Tables**:
- `trainees` — Trainee registration data
- `commanders` — Commander/admin accounts
- `attendance_logs` — Clock in/out records
- `sessions` — Web app authentication sessions

**Security Features**:
- Row Level Security (RLS) policies
- Encrypted connections
- Audit logging capability
- Foreign key constraints
- Unique constraints to prevent duplicates

---

## Data Flow

### Clock-In Flow

```
1. Trainee clicks "Clock In" in Telegram
2. Telegram sends webhook to Bot Backend
3. Bot Backend validates:
   - User is registered
   - User is not already clocked in
   - Current time is valid
4. Bot Backend inserts record into attendance_logs
5. Bot sends confirmation message to trainee
6. If applicable, alert sent to commanders
```

### Clock-Out Flow

```
1. Trainee clicks "Clock Out" in Telegram
2. Telegram sends webhook to Bot Backend
3. Bot Backend validates:
   - User is currently clocked in
   - Clock-out time is valid
4. Bot Backend updates attendance_logs record
5. Bot sends confirmation message to trainee
```

### Dashboard View Flow

```
1. Commander/Admin logs into web app
2. Next.js API route checks authentication
3. API route queries Supabase with RLS enforcement
4. RLS policies filter by company (for commanders)
5. Data returned to frontend
6. Frontend displays dashboard
```

---

## Timezone Handling

**Critical Requirement**: All times must be in **Asia/Singapore (SGT)**

**Implementation Strategy**:
- Store all timestamps in UTC in database
- Convert to SGT for display
- Use consistent timezone library (e.g., `date-fns-tz`)
- Daily cutoff checks run at 22:00 SGT

---

## Security Principles

### 1. Zero Trust Model
- Never trust client input
- Validate all actions server-side
- Enforce authentication on every request

### 2. Defense in Depth
- Multiple layers of security (RLS, API validation, input sanitization)
- Fail-secure defaults
- Principle of least privilege

### 3. Auditability
- All actions logged
- Immutable attendance records
- Traceable user actions

### 4. Tamper Resistance
- No manual overrides
- Server-side validation only
- Cryptographic integrity where applicable

---

## Technology Stack Summary

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | Next.js 14+ (App Router) | Web dashboard |
| Backend API | Next.js API Routes | Web app backend |
| Bot Backend | Node.js/TypeScript | Telegram bot handler |
| Database | Supabase (PostgreSQL) | Data persistence |
| Authentication | Supabase Auth | Web app sessions |
| Hosting (Web) | Vercel | Next.js deployment |
| Hosting (Bot) | Railway/Render/Fly.io | Bot webhook handler |
| Timezone | date-fns-tz | SGT handling |

---

## Scalability Considerations

### Current Design Assumptions
- ~100-500 trainees
- ~10-20 commanders/admins
- Single training cohort

### Future Scalability Paths
- Database indexing on company and timestamp fields
- Caching layer for dashboard queries
- Batch processing for daily cutoff checks
- Horizontal scaling of bot backend if needed

---

## Integration Points

### Telegram Bot API
- Webhook endpoint for incoming messages
- Send message API for responses
- Inline keyboard API for buttons

### Supabase
- PostgreSQL database connection
- Row Level Security policies
- Authentication service
- Real-time subscriptions (optional, for live updates)

### Vercel
- Next.js deployment
- Environment variable management
- Serverless function execution

---

## Next Steps

1. **Telegram Bot Setup** → See `02-telegram-bot-setup.md`
2. **Web App Setup** → See `03-web-app-setup.md`
3. **Database Design** → See `04-database-security-design.md`
4. **Deployment** → See `05-deployment-guide.md`
5. **Operations** → See `06-operational-maintenance.md`
6. **Failure Scenarios** → See `07-failure-scenarios-safeguards.md`

