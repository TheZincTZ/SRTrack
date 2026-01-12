# Web App Setup Guide

## Overview

This guide covers the setup and implementation of the SRTrack web application. The web app serves commanders and admins with a dashboard to monitor trainee attendance.

**Technology**: Next.js 14+ (App Router)  
**Hosting**: Vercel  
**Authentication**: Supabase Auth  
**Database**: Supabase (PostgreSQL)

---

## Prerequisites

Before starting, ensure you have:

- Node.js 18+ installed
- npm or yarn package manager
- GitHub account
- Vercel account
- Supabase account
- Basic understanding of React and Next.js

---

## Step 1: Next.js Project Initialization

### 1.1 Create Next.js Project

**Using create-next-app**:

```bash
npx create-next-app@latest srtrack-web --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

**Options Explained**:
- `--typescript`: Use TypeScript
- `--tailwind`: Include Tailwind CSS for styling
- `--app`: Use App Router (required)
- `--no-src-dir`: Keep files in root directory
- `--import-alias "@/*"`: Enable path aliases

### 1.2 Project Structure Overview

**Recommended Structure**:
```
srtrack-web/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   └── layout.tsx
│   ├── api/
│   │   └── attendance/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   └── dashboard/
├── lib/
│   ├── supabase/
│   └── utils/
├── types/
└── .env.local
```

### 1.3 Install Required Dependencies

**Core Dependencies**:
```bash
npm install @supabase/supabase-js @supabase/ssr
npm install date-fns date-fns-tz
npm install zod  # For validation
```

**UI Dependencies** (Optional, but recommended):
```bash
npm install @radix-ui/react-dialog @radix-ui/react-select
npm install class-variance-authority clsx tailwind-merge
```

---

## Step 2: Supabase Integration Setup

### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note down:
   - Project URL
   - Anon/public key
   - Service role key (keep secret!)

### 2.2 Configure Supabase Client

**Concept**: Create separate clients for different contexts

**Server-Side Client** (for API routes):
- Uses service role key
- Bypasses RLS (use with caution)
- For admin operations only

**Client-Side Client** (for components):
- Uses anon key
- Respects RLS policies
- For user-facing operations

**Implementation Guidance**:

1. Create `lib/supabase/server.ts`:
   - Export server-side client factory
   - Use cookies for session management
   - Handle authentication state

2. Create `lib/supabase/client.ts`:
   - Export browser client
   - Initialize once, reuse instance
   - Handle reconnection logic

### 2.3 Environment Variables

**Create `.env.local`**:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_TIMEZONE=Asia/Singapore
```

**Important**:
- `NEXT_PUBLIC_*` variables are exposed to browser
- Never expose service role key to browser
- Add `.env.local` to `.gitignore`

---

## Step 3: Authentication System Design

### 3.1 Authentication Flow Overview

**Concept**: Use Supabase Auth for session management

**Flow**:
1. User visits login page
2. Enters username/password
3. Next.js API route validates credentials
4. Creates Supabase session
5. Sets HTTP-only cookie
6. Redirects to dashboard

### 3.2 Commander/Admin Registration

**Registration Requirements**:
- Rank
- Full Name
- Company (A, B, C, Support, MSC, HQ)
- Contact Number
- Username (unique)
- Password (secure, hashed)

**Implementation Guidance**:

**Step 1: Create Registration API Route**
- Path: `app/api/auth/register/route.ts`
- Method: POST
- Validate input (use Zod)
- Check username uniqueness
- Hash password (Supabase handles this)
- Insert into `commanders` table
- Return success/error

**Step 2: Password Security**
- Minimum 8 characters
- Require complexity (uppercase, lowercase, number)
- Use Supabase Auth password hashing (bcrypt)
- Never store plaintext passwords

**Step 3: Username Uniqueness**
- Database unique constraint on `username`
- Check before insertion
- Return clear error if duplicate

### 3.3 Login Implementation

**Login Flow Design**:

1. **Login Page** (`app/(auth)/login/page.tsx`)
   - Form with username and password fields
   - Client-side validation
   - Submit to API route

2. **Login API Route** (`app/api/auth/login/route.ts`)
   - Validate credentials against `commanders` table
   - Verify password hash
   - Create Supabase session
   - Set secure HTTP-only cookie
   - Return success or error

3. **Session Management**
   - Use Supabase SSR helpers
   - Middleware to check authentication
   - Redirect unauthenticated users

### 3.4 Role-Based Access Control

**Roles**:
- **Commander**: Can view only their company
- **Admin**: Can view all companies

**Implementation Strategy**:

1. **Store Role in Session**
   - Add `role` field to `commanders` table
   - Include role in session data
   - Check role in middleware/API routes

2. **Middleware Protection**
   - Create `middleware.ts` in root
   - Check authentication status
   - Check role for protected routes
   - Redirect based on permissions

3. **API Route Protection**
   - Verify session in each API route
   - Extract user role from session
   - Filter data based on role
   - Return 403 if unauthorized

---

## Step 4: Dashboard Implementation Guide

### 4.1 Dashboard Layout Structure

**Page Structure**:
```
app/(dashboard)/
├── layout.tsx          # Dashboard layout wrapper
├── dashboard/
│   ├── page.tsx        # Main dashboard page
│   └── loading.tsx     # Loading state
```

**Layout Components**:
- Header with user info and logout
- Navigation (if multiple pages)
- Main content area
- Footer (optional)

### 4.2 Attendance Data Fetching

**API Route Design** (`app/api/attendance/route.ts`):

**Query Parameters**:
- `company` (optional): Filter by company
- `status` (optional): Filter by IN/OUT
- `date` (optional): Filter by date

**Implementation Steps**:

1. **Authentication Check**
   - Verify user is logged in
   - Extract user role and company

2. **Data Filtering**
   - If Commander: Filter by their company only
   - If Admin: Allow all companies (or filter if provided)
   - Apply RLS policies (enforced by Supabase)

3. **Query Construction**
   - Join `attendance_logs` with `trainees`
   - Filter by date (today by default)
   - Order by clock-in time
   - Include status calculation

4. **Response Format**:
   ```json
   {
     "data": [
       {
         "id": 1,
         "rank": "PVT",
         "name": "John Doe",
         "number": "12345",
         "company": "A",
         "clockInTime": "2024-01-15T08:00:00+08:00",
         "clockOutTime": null,
         "status": "IN",
         "isOverdue": false
       }
     ],
     "total": 10
   }
   ```

### 4.3 Overdue User Detection

**Logic**:
- Current time > 22:00 SGT
- User status is "IN"
- Clock-in date is today
- Clock-out time is NULL

**Implementation**:
- Calculate in API route (server-side)
- Add `isOverdue` flag to each record
- Use for highlighting in UI

**Timezone Handling**:
- Always use `date-fns-tz` for SGT conversion
- Store UTC in database
- Convert to SGT for display and comparison

### 4.4 Dashboard UI Components

**Component Structure**:

1. **AttendanceTable Component**
   - Displays list of trainees
   - Columns: Rank, Name, Number, Company, Clock In, Clock Out, Status
   - Highlights overdue rows in red
   - Responsive design

2. **FilterBar Component**
   - Company filter (dropdown)
   - Status filter (IN/OUT/All)
   - Date picker (optional)
   - Apply filters button

3. **StatsCards Component**
   - Total clocked in
   - Total clocked out
   - Overdue count
   - Company breakdown (if admin)

**Styling Guidance**:
- Use Tailwind CSS for styling
- Ensure mobile responsiveness
- Use consistent color scheme
- Red highlight for overdue: `bg-red-100` or `text-red-600`

---

## Step 5: Server-Side Rendering and Security

### 5.1 Server Components vs Client Components

**Server Components** (Default):
- Run on server only
- No JavaScript sent to browser
- Direct database access
- Use for data fetching

**Client Components** (`"use client"`):
- Run in browser
- For interactivity (forms, buttons)
- Cannot directly access database
- Must use API routes

**Best Practice**:
- Use Server Components by default
- Only use Client Components when needed
- Fetch data in Server Components
- Pass data as props to Client Components

### 5.2 API Route Security

**Security Checklist for API Routes**:

✅ **Authentication**
- Verify session exists
- Extract user from session
- Reject unauthenticated requests

✅ **Authorization**
- Check user role
- Verify company access (for commanders)
- Enforce least privilege

✅ **Input Validation**
- Validate all query parameters
- Validate request body (if POST/PUT)
- Use Zod for schema validation
- Reject invalid input

✅ **SQL Injection Prevention**
- Use Supabase client methods (parameterized)
- Never use string concatenation
- Validate all inputs

✅ **Rate Limiting**
- Implement rate limiting per user
- Prevent abuse
- Use middleware or external service

### 5.3 Row Level Security (RLS) Integration

**Concept**: Supabase RLS policies enforce access at database level

**Policy Design**:

1. **Commanders Policy**:
   - Can SELECT from `attendance_logs`
   - Only for trainees in their company
   - Cannot UPDATE or DELETE

2. **Admins Policy**:
   - Can SELECT from all `attendance_logs`
   - Cannot UPDATE or DELETE

3. **Trainees Table**:
   - Commanders can SELECT their company's trainees
   - Admins can SELECT all trainees

**Implementation**:
- Define policies in Supabase dashboard
- Test policies with different users
- Ensure policies match application logic

---

## Step 6: Real-Time Updates (Optional)

### 6.1 Supabase Realtime

**Concept**: Subscribe to database changes for live updates

**Use Case**: Dashboard updates automatically when trainee clocks in/out

**Implementation Guidance**:

1. **Enable Realtime**:
   - Go to Supabase dashboard
   - Enable Realtime for `attendance_logs` table
   - Configure publication settings

2. **Client Subscription**:
   - Use Supabase client in Client Component
   - Subscribe to table changes
   - Update UI when changes occur
   - Handle reconnection logic

3. **Performance Considerations**:
   - Filter subscriptions (by company for commanders)
   - Debounce updates if needed
   - Clean up subscriptions on unmount

---

## Step 7: Error Handling and User Feedback

### 7.1 Error Handling Strategy

**Error Types**:
- Authentication errors (401)
- Authorization errors (403)
- Validation errors (400)
- Server errors (500)
- Network errors

**Implementation**:

1. **API Routes**:
   - Try-catch blocks
   - Return appropriate status codes
   - Return structured error responses
   - Log errors server-side

2. **Client Components**:
   - Handle API errors gracefully
   - Show user-friendly messages
   - Don't expose internal errors

3. **Error Boundaries**:
   - Use React Error Boundaries
   - Catch unexpected errors
   - Show fallback UI

### 7.2 Loading States

**Loading Indicators**:
- Show loading spinner during data fetch
- Use Next.js `loading.tsx` for route-level loading
- Use Suspense for component-level loading
- Skeleton screens for better UX

### 7.3 User Feedback

**Success Messages**:
- Show toast notifications for actions
- Clear, concise messages
- Auto-dismiss after few seconds

**Error Messages**:
- User-friendly language
- Actionable guidance
- Don't blame the user

---

## Step 8: Styling and UI/UX

### 8.1 Design System

**Color Scheme**:
- Primary: Blue (for actions)
- Success: Green (for completed states)
- Warning: Yellow (for pending)
- Error: Red (for overdue/alerts)
- Neutral: Gray (for text/backgrounds)

**Typography**:
- Clear, readable fonts
- Consistent sizing hierarchy
- Sufficient contrast ratios

**Spacing**:
- Consistent padding/margins
- Use Tailwind spacing scale
- Responsive spacing

### 8.2 Responsive Design

**Breakpoints**:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Mobile Considerations**:
- Stack table columns vertically
- Collapsible filters
- Touch-friendly buttons
- Readable text sizes

### 8.3 Accessibility

**WCAG Compliance**:
- Keyboard navigation
- Screen reader support
- ARIA labels
- Focus indicators
- Color contrast

---

## Step 9: Testing Strategy

### 9.1 Testing Checklist

**Authentication**:
- [ ] Registration works
- [ ] Login works
- [ ] Logout works
- [ ] Session persists
- [ ] Unauthorized access blocked

**Dashboard**:
- [ ] Data loads correctly
- [ ] Filters work
- [ ] Overdue highlighting works
- [ ] Role-based filtering works
- [ ] Real-time updates work (if implemented)

**Security**:
- [ ] RLS policies enforced
- [ ] API routes protected
- [ ] Input validation works
- [ ] SQL injection prevented
- [ ] XSS prevented

### 9.2 Manual Testing

**Test Scenarios**:
1. Commander logs in → sees only their company
2. Admin logs in → sees all companies
3. Overdue users highlighted in red
4. Filters apply correctly
5. Unauthorized access redirected

---

## Step 10: Performance Optimization

### 10.1 Data Fetching Optimization

**Strategies**:
- Use Server Components for initial load
- Implement pagination for large datasets
- Cache API responses (Next.js caching)
- Use database indexes

### 10.2 Image and Asset Optimization

**Next.js Features**:
- Use `next/image` for images
- Automatic image optimization
- Lazy loading
- WebP format support

### 10.3 Bundle Size Optimization

**Strategies**:
- Code splitting
- Tree shaking
- Dynamic imports for heavy components
- Analyze bundle size regularly

---

## Next Steps

After completing web app setup:

1. **Database Design** → See `04-database-security-design.md`
2. **Deployment** → See `05-deployment-guide.md`
3. **Operations** → See `06-operational-maintenance.md`

