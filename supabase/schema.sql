-- SRTrack Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE company_type AS ENUM ('A', 'B', 'C', 'Support', 'MSC', 'HQ');
CREATE TYPE session_status AS ENUM ('CLOCKED_IN', 'CLOCKED_OUT', 'RED');

-- SRT Users table (Telegram users)
CREATE TABLE srt_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_user_id BIGINT UNIQUE NOT NULL,
    rank VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    number VARCHAR(50) NOT NULL,
    company company_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_telegram_user UNIQUE (telegram_user_id)
);

-- Commanders table
CREATE TABLE commanders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rank_name VARCHAR(100) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    company company_type NOT NULL,
    contact_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_username UNIQUE (username)
);

-- SRT Sessions table
CREATE TABLE srt_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    srt_user_id UUID NOT NULL REFERENCES srt_users(id) ON DELETE CASCADE,
    clock_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
    clock_out_time TIMESTAMP WITH TIME ZONE,
    status session_status NOT NULL DEFAULT 'CLOCKED_IN',
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_srt_users_company ON srt_users(company);
CREATE INDEX idx_srt_users_telegram_id ON srt_users(telegram_user_id);
CREATE INDEX idx_commanders_company ON commanders(company);
CREATE INDEX idx_commanders_username ON commanders(username);
CREATE INDEX idx_srt_sessions_user_id ON srt_sessions(srt_user_id);
CREATE INDEX idx_srt_sessions_date ON srt_sessions(date);
CREATE INDEX idx_srt_sessions_status ON srt_sessions(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_srt_sessions_updated_at BEFORE UPDATE
    ON srt_sessions FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE srt_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE commanders ENABLE ROW LEVEL SECURITY;
ALTER TABLE srt_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Commanders can only view SRT users from their company
CREATE POLICY "commanders_view_same_company_users"
    ON srt_users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM commanders
            WHERE commanders.id = auth.uid()::uuid
            AND commanders.company = srt_users.company
        )
    );

-- RLS Policy: Commanders can only view sessions from their company
CREATE POLICY "commanders_view_same_company_sessions"
    ON srt_sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM commanders
            JOIN srt_users ON srt_users.company = commanders.company
            WHERE commanders.id = auth.uid()::uuid
            AND srt_sessions.srt_user_id = srt_users.id
        )
    );

-- RLS Policy: Service role can do everything (for API routes)
CREATE POLICY "service_role_all_access"
    ON srt_users FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_access_commanders"
    ON commanders FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_access_sessions"
    ON srt_sessions FOR ALL
    USING (auth.role() = 'service_role');

-- RLS Policy: Users can view their own data (for Telegram bot)
-- Note: Telegram bot uses service role, but this is for future client-side access
CREATE POLICY "users_view_own_data"
    ON srt_users FOR SELECT
    USING (telegram_user_id::text = current_setting('app.telegram_user_id', true));

-- RLS Policy: Users can view their own sessions
CREATE POLICY "users_view_own_sessions"
    ON srt_sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM srt_users
            WHERE srt_users.id = srt_sessions.srt_user_id
            AND srt_users.telegram_user_id::text = current_setting('app.telegram_user_id', true)
        )
    );

