-- Rollback script for 001_initial_schema.sql
-- Run this to completely remove all tables, functions, triggers, and indexes created by 001_initial_schema.sql
-- WARNING: This will delete all data in these tables!

-- Drop RLS Policies first (if they exist)
DROP POLICY IF EXISTS "commanders_view_company_trainees" ON trainees;
DROP POLICY IF EXISTS "admins_view_all_trainees" ON trainees;
DROP POLICY IF EXISTS "service_role_insert_trainees" ON trainees;
DROP POLICY IF EXISTS "service_role_update_trainees" ON trainees;

DROP POLICY IF EXISTS "commanders_view_company_attendance" ON attendance_logs;
DROP POLICY IF EXISTS "admins_view_all_attendance" ON attendance_logs;
DROP POLICY IF EXISTS "service_role_insert_attendance" ON attendance_logs;
DROP POLICY IF EXISTS "service_role_update_attendance" ON attendance_logs;

DROP POLICY IF EXISTS "commanders_view_self" ON commanders;
DROP POLICY IF EXISTS "admins_view_all_commanders" ON commanders;
DROP POLICY IF EXISTS "service_role_insert_commanders" ON commanders;
DROP POLICY IF EXISTS "commanders_update_self" ON commanders;

DROP POLICY IF EXISTS "commanders_view_own_notifications" ON notifications;
DROP POLICY IF EXISTS "service_role_insert_notifications" ON notifications;

-- Disable RLS
ALTER TABLE IF EXISTS trainees DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS commanders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendance_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;

-- Drop triggers
DROP TRIGGER IF EXISTS update_trainees_updated_at ON trainees;
DROP TRIGGER IF EXISTS update_commanders_updated_at ON commanders;
DROP TRIGGER IF EXISTS update_attendance_logs_updated_at ON attendance_logs;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS attendance_logs CASCADE;
DROP TABLE IF EXISTS commanders CASCADE;
DROP TABLE IF EXISTS trainees CASCADE;

-- Note: We don't drop the uuid-ossp extension as it might be used by other tables
-- If you want to drop it: DROP EXTENSION IF EXISTS "uuid-ossp";

