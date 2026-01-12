# Database & Security Design Guide

## Overview

This guide provides comprehensive database schema design, security policies, and data integrity requirements for SRTrack. All designs follow security best practices and enforce tamper resistance.

**Database**: Supabase (PostgreSQL)  
**Security Model**: Row Level Security (RLS)  
**Compliance**: OWASP Top 10 awareness

---

## Database Schema Design

### Table: `trainees`

**Purpose**: Store trainee registration information

**Schema**:
```sql
CREATE TABLE trainees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id BIGINT UNIQUE NOT NULL,
  rank VARCHAR(50) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  identification_number VARCHAR(50) UNIQUE NOT NULL,
  company VARCHAR(20) NOT NULL CHECK (company IN ('A', 'B', 'C', 'Support', 'MSC', 'HQ')),
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_trainees_telegram_user_id ON trainees(telegram_user_id);
CREATE INDEX idx_trainees_company ON trainees(company);
CREATE INDEX idx_trainees_identification_number ON trainees(identification_number);
```

**Constraints**:
- `telegram_user_id`: Unique, prevents duplicate registrations
- `identification_number`: Unique, prevents duplicate IDs
- `company`: Check constraint ensures valid values
- Indexes on frequently queried columns

**Security Considerations**:
- `telegram_user_id` is immutable after creation
- `identification_number` should be encrypted at rest (if PII)
- `is_active` flag allows soft deletion

---

### Table: `commanders`

**Purpose**: Store commander and admin accounts

**Schema**:
```sql
CREATE TABLE commanders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rank VARCHAR(50) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  company VARCHAR(20) NOT NULL CHECK (company IN ('A', 'B', 'C', 'Support', 'MSC', 'HQ')),
  contact_number VARCHAR(20),
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,  -- Hashed by Supabase Auth
  role VARCHAR(20) NOT NULL CHECK (role IN ('commander', 'admin')) DEFAULT 'commander',
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_login_at TIMESTAMPTZ
);

CREATE INDEX idx_commanders_username ON commanders(username);
CREATE INDEX idx_commanders_company ON commanders(company);
CREATE INDEX idx_commanders_role ON commanders(role);
```

**Constraints**:
- `username`: Unique, used for login
- `password_hash`: Stored by Supabase Auth (bcrypt)
- `role`: Check constraint ensures valid roles
- `company`: Required even for admins (for audit purposes)

**Security Considerations**:
- Password never stored in plaintext
- Use Supabase Auth for password hashing
- `last_login_at` for audit trail
- `is_active` for account management

---

### Table: `attendance_logs`

**Purpose**: Store all clock in/out records (immutable audit trail)

**Schema**:
```sql
CREATE TABLE attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id UUID NOT NULL REFERENCES trainees(id) ON DELETE RESTRICT,
  clock_in_time TIMESTAMPTZ NOT NULL,
  clock_out_time TIMESTAMPTZ,
  status VARCHAR(10) NOT NULL CHECK (status IN ('IN', 'OUT')) DEFAULT 'IN',
  date DATE NOT NULL GENERATED ALWAYS AS (DATE(clock_in_time AT TIME ZONE 'Asia/Singapore')) STORED,
  is_overdue BOOLEAN DEFAULT false NOT NULL,
  telegram_update_id BIGINT UNIQUE,  -- For replay attack prevention
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_clock_times CHECK (
    clock_out_time IS NULL OR clock_out_time > clock_in_time
  ),
  CONSTRAINT single_active_log UNIQUE NULLS NOT DISTINCT (trainee_id, status) 
    WHERE status = 'IN'
);

CREATE INDEX idx_attendance_logs_trainee_id ON attendance_logs(trainee_id);
CREATE INDEX idx_attendance_logs_date ON attendance_logs(date);
CREATE INDEX idx_attendance_logs_status ON attendance_logs(status);
CREATE INDEX idx_attendance_logs_overdue ON attendance_logs(is_overdue) WHERE is_overdue = true;
CREATE INDEX idx_attendance_logs_telegram_update_id ON attendance_logs(telegram_update_id);
```

**Constraints**:
- `trainee_id`: Foreign key to trainees (RESTRICT prevents deletion)
- `clock_out_time`: Must be after `clock_in_time`
- `single_active_log`: Unique partial index ensures only one active "IN" status per trainee
- `telegram_update_id`: Unique, prevents replay attacks
- `date`: Computed column for efficient date-based queries

**Security Considerations**:
- Records are immutable (no UPDATE allowed except for clock_out_time)
- `telegram_update_id` prevents replay attacks
- `is_overdue` flag for daily cutoff tracking
- Indexes optimize common queries

---

### Table: `notifications`

**Purpose**: Track sent notifications (idempotency)

**Schema**:
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commander_id UUID NOT NULL REFERENCES commanders(id) ON DELETE CASCADE,
  trainee_id UUID NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('clock_in', 'clock_out', 'overdue')),
  sent_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  date DATE NOT NULL,
  message_text TEXT,
  
  CONSTRAINT unique_notification UNIQUE (commander_id, trainee_id, notification_type, date)
);

CREATE INDEX idx_notifications_commander_id ON notifications(commander_id);
CREATE INDEX idx_notifications_date ON notifications(date);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
```

**Constraints**:
- `unique_notification`: Prevents duplicate notifications per day
- Foreign keys with CASCADE for cleanup

**Purpose**:
- Prevents spam notifications
- Audit trail of all notifications
- Idempotent notification system

---

### Table: `audit_logs` (Optional but Recommended)

**Purpose**: Comprehensive audit trail of all system actions

**Schema**:
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('trainee', 'commander', 'admin', 'system')),
  user_id UUID,  -- Can reference trainees or commanders
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
```

**Use Cases**:
- Log all login attempts
- Log all clock in/out actions
- Log all data access
- Log all configuration changes
- Security incident investigation

---

## Row Level Security (RLS) Policies

### RLS Enablement

**Enable RLS on all tables**:
```sql
ALTER TABLE trainees ENABLE ROW LEVEL SECURITY;
ALTER TABLE commanders ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
```

---

### Policy: `trainees` Table

**Policy 1: Commanders can view their company's trainees**
```sql
CREATE POLICY "commanders_view_company_trainees"
ON trainees
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM commanders
    WHERE commanders.id = auth.uid()
    AND commanders.company = trainees.company
    AND commanders.is_active = true
  )
);
```

**Policy 2: Admins can view all trainees**
```sql
CREATE POLICY "admins_view_all_trainees"
ON trainees
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM commanders
    WHERE commanders.id = auth.uid()
    AND commanders.role = 'admin'
    AND commanders.is_active = true
  )
);
```

**Policy 3: Service role can insert (for bot registration)**
```sql
CREATE POLICY "service_role_insert_trainees"
ON trainees
FOR INSERT
TO service_role
WITH CHECK (true);
```

**Policy 4: Service role can update (for bot operations)**
```sql
CREATE POLICY "service_role_update_trainees"
ON trainees
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);
```

---

### Policy: `attendance_logs` Table

**Policy 1: Commanders can view their company's attendance**
```sql
CREATE POLICY "commanders_view_company_attendance"
ON attendance_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM commanders
    JOIN trainees ON trainees.company = commanders.company
    WHERE commanders.id = auth.uid()
    AND attendance_logs.trainee_id = trainees.id
    AND commanders.is_active = true
  )
);
```

**Policy 2: Admins can view all attendance**
```sql
CREATE POLICY "admins_view_all_attendance"
ON attendance_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM commanders
    WHERE commanders.id = auth.uid()
    AND commanders.role = 'admin'
    AND commanders.is_active = true
  )
);
```

**Policy 3: Service role can insert (for bot clock in)**
```sql
CREATE POLICY "service_role_insert_attendance"
ON attendance_logs
FOR INSERT
TO service_role
WITH CHECK (true);
```

**Policy 4: Service role can update (for bot clock out)**
```sql
CREATE POLICY "service_role_update_attendance"
ON attendance_logs
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (
  -- Only allow updating clock_out_time and status
  OLD.clock_in_time = NEW.clock_in_time
  AND OLD.trainee_id = NEW.trainee_id
  AND OLD.date = NEW.date
);
```

**Policy 5: No one can delete attendance logs**
```sql
-- Explicitly deny DELETE (RLS default)
-- No policy needed, RLS blocks by default
```

---

### Policy: `commanders` Table

**Policy 1: Commanders can view their own record**
```sql
CREATE POLICY "commanders_view_self"
ON commanders
FOR SELECT
TO authenticated
USING (id = auth.uid());
```

**Policy 2: Admins can view all commanders**
```sql
CREATE POLICY "admins_view_all_commanders"
ON commanders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM commanders c
    WHERE c.id = auth.uid()
    AND c.role = 'admin'
    AND c.is_active = true
  )
);
```

**Policy 3: Service role can insert (for registration)**
```sql
CREATE POLICY "service_role_insert_commanders"
ON commanders
FOR INSERT
TO service_role
WITH CHECK (true);
```

**Policy 4: Commanders can update their own record (limited fields)**
```sql
CREATE POLICY "commanders_update_self"
ON commanders
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  -- Prevent role/company changes
  AND OLD.role = NEW.role
  AND OLD.company = NEW.company
);
```

---

### Policy: `notifications` Table

**Policy 1: Commanders can view their notifications**
```sql
CREATE POLICY "commanders_view_own_notifications"
ON notifications
FOR SELECT
TO authenticated
USING (commander_id = auth.uid());
```

**Policy 2: Service role can insert (for sending notifications)**
```sql
CREATE POLICY "service_role_insert_notifications"
ON notifications
FOR INSERT
TO service_role
WITH CHECK (true);
```

---

### Policy: `audit_logs` Table

**Policy 1: Admins can view all audit logs**
```sql
CREATE POLICY "admins_view_audit_logs"
ON audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM commanders
    WHERE commanders.id = auth.uid()
    AND commanders.role = 'admin'
    AND commanders.is_active = true
  )
);
```

**Policy 2: Service role can insert (for logging)**
```sql
CREATE POLICY "service_role_insert_audit_logs"
ON audit_logs
FOR INSERT
TO service_role
WITH CHECK (true);
```

---

## Database Functions and Triggers

### Function: Update `updated_at` Timestamp

**Trigger Function**:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Apply to Tables**:
```sql
CREATE TRIGGER update_trainees_updated_at
  BEFORE UPDATE ON trainees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commanders_updated_at
  BEFORE UPDATE ON commanders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_logs_updated_at
  BEFORE UPDATE ON attendance_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### Function: Mark Overdue Attendance

**Purpose**: Automatically mark overdue records at cutoff time

**Function**:
```sql
CREATE OR REPLACE FUNCTION mark_overdue_attendance()
RETURNS void AS $$
BEGIN
  UPDATE attendance_logs
  SET is_overdue = true,
      updated_at = NOW()
  WHERE status = 'IN'
    AND clock_out_time IS NULL
    AND date = CURRENT_DATE
    AND is_overdue = false
    AND EXTRACT(HOUR FROM (NOW() AT TIME ZONE 'Asia/Singapore')) >= 22;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Schedule**: Run via cron job or scheduled function

---

### Function: Prevent Duplicate Active Logs

**Purpose**: Enforce single active clock-in per trainee

**Trigger Function**:
```sql
CREATE OR REPLACE FUNCTION prevent_duplicate_active_logs()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'IN' THEN
    -- Check for existing active log
    IF EXISTS (
      SELECT 1 FROM attendance_logs
      WHERE trainee_id = NEW.trainee_id
      AND status = 'IN'
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      RAISE EXCEPTION 'Trainee already has an active clock-in record';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Trigger**:
```sql
CREATE TRIGGER check_duplicate_active_logs
  BEFORE INSERT OR UPDATE ON attendance_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_active_logs();
```

---

## Security Best Practices

### 1. Principle of Least Privilege

**Implementation**:
- Use service role key only for bot operations
- Use authenticated role for web app operations
- RLS policies enforce access at database level
- No direct database access for end users

### 2. Input Validation

**Database Level**:
- CHECK constraints on enum values
- NOT NULL constraints where required
- Foreign key constraints
- Unique constraints

**Application Level**:
- Validate all inputs before database operations
- Use parameterized queries (Supabase client handles this)
- Sanitize user inputs
- Reject malformed data

### 3. SQL Injection Prevention

**Supabase Client**:
- Always use Supabase client methods
- Never use raw SQL with user input
- Use parameterized queries
- Validate inputs before queries

**Example (What NOT to do)**:
```javascript
// ❌ NEVER DO THIS
const query = `SELECT * FROM trainees WHERE name = '${userInput}'`;
```

**Example (Correct)**:
```javascript
// ✅ CORRECT
const { data } = await supabase
  .from('trainees')
  .select('*')
  .eq('name', userInput);  // Parameterized
```

### 4. Password Security

**Requirements**:
- Minimum 8 characters
- Require complexity (uppercase, lowercase, number)
- Use Supabase Auth for hashing (bcrypt)
- Never store plaintext passwords
- Implement password reset flow securely

### 5. Audit Trail

**Logging Requirements**:
- Log all authentication attempts
- Log all data modifications
- Log all access to sensitive data
- Store IP addresses and user agents
- Retain logs for compliance period

### 6. Data Encryption

**At Rest**:
- Supabase encrypts data at rest (managed)
- Consider encrypting PII fields (identification_number)

**In Transit**:
- Always use HTTPS/TLS
- Supabase connections are encrypted
- No unencrypted connections

### 7. Backup and Recovery

**Backup Strategy**:
- Supabase provides automatic backups
- Configure backup retention period
- Test restore procedures regularly
- Document recovery process

**Recovery Testing**:
- Test database restore monthly
- Verify data integrity after restore
- Document recovery time objectives

---

## Database Indexes Strategy

### Indexes for Performance

**High-Traffic Queries**:
- `trainees.telegram_user_id` (bot lookups)
- `attendance_logs.trainee_id` (trainee history)
- `attendance_logs.date` (daily queries)
- `attendance_logs.status` (filtering)
- `attendance_logs.is_overdue` (overdue queries)

**Composite Indexes** (if needed):
```sql
CREATE INDEX idx_attendance_logs_trainee_date 
ON attendance_logs(trainee_id, date DESC);

CREATE INDEX idx_attendance_logs_company_date 
ON attendance_logs(trainee_id, date DESC) 
INCLUDE (status, is_overdue);
```

**Monitor Index Usage**:
- Use `pg_stat_user_indexes` to monitor
- Remove unused indexes
- Add indexes for slow queries

---

## Migration Strategy

### Version Control

**Approach**:
- Use Supabase migrations
- Version all schema changes
- Test migrations in staging first
- Document breaking changes

### Migration Files

**Structure**:
```
migrations/
├── 001_initial_schema.sql
├── 002_add_audit_logs.sql
├── 003_add_indexes.sql
└── ...
```

### Rollback Plan

**For Each Migration**:
- Document rollback SQL
- Test rollback in staging
- Have backup before migration
- Communicate changes to team

---

## Data Retention and Privacy

### Retention Policy

**Attendance Logs**:
- Retain indefinitely (audit requirement)
- Archive old data if needed
- Consider data retention laws

**Audit Logs**:
- Retain for compliance period
- Archive after retention period
- Secure deletion process

### Privacy Considerations

**PII Handling**:
- `identification_number`: Consider encryption
- `contact_number`: Encrypt if required
- `full_name`: May be considered PII

**GDPR/Privacy Compliance**:
- Right to access
- Right to deletion (if applicable)
- Data portability
- Consent management (if required)

---

## Testing Database Security

### Security Testing Checklist

- [ ] RLS policies prevent unauthorized access
- [ ] Service role can perform required operations
- [ ] Authenticated users cannot bypass RLS
- [ ] Constraints prevent invalid data
- [ ] Unique constraints prevent duplicates
- [ ] Foreign keys prevent orphaned records
- [ ] Triggers enforce business rules
- [ ] Indexes optimize query performance
- [ ] Backups are working
- [ ] Recovery procedures tested

---

## Next Steps

After completing database design:

1. **Deployment** → See `05-deployment-guide.md`
2. **Operations** → See `06-operational-maintenance.md`
3. **Failure Scenarios** → See `07-failure-scenarios-safeguards.md`

