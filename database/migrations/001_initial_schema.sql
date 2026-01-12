-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: trainees
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

-- Table: commanders
CREATE TABLE commanders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rank VARCHAR(50) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  company VARCHAR(20) NOT NULL CHECK (company IN ('A', 'B', 'C', 'Support', 'MSC', 'HQ')),
  contact_number VARCHAR(20),
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('commander', 'admin')) DEFAULT 'commander',
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_login_at TIMESTAMPTZ
);

CREATE INDEX idx_commanders_username ON commanders(username);
CREATE INDEX idx_commanders_company ON commanders(company);
CREATE INDEX idx_commanders_role ON commanders(role);

-- Table: attendance_logs
CREATE TABLE attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id UUID NOT NULL REFERENCES trainees(id) ON DELETE RESTRICT,
  clock_in_time TIMESTAMPTZ NOT NULL,
  clock_out_time TIMESTAMPTZ,
  status VARCHAR(10) NOT NULL CHECK (status IN ('IN', 'OUT')) DEFAULT 'IN',
  date DATE NOT NULL GENERATED ALWAYS AS (DATE(clock_in_time AT TIME ZONE 'Asia/Singapore')) STORED,
  is_overdue BOOLEAN DEFAULT false NOT NULL,
  telegram_update_id BIGINT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_clock_times CHECK (
    clock_out_time IS NULL OR clock_out_time > clock_in_time
  )
);

CREATE INDEX idx_attendance_logs_trainee_id ON attendance_logs(trainee_id);
CREATE INDEX idx_attendance_logs_date ON attendance_logs(date);
CREATE INDEX idx_attendance_logs_status ON attendance_logs(status);
CREATE INDEX idx_attendance_logs_overdue ON attendance_logs(is_overdue) WHERE is_overdue = true;
CREATE INDEX idx_attendance_logs_telegram_update_id ON attendance_logs(telegram_update_id);

-- Unique partial index for single active log per trainee
CREATE UNIQUE INDEX idx_attendance_logs_single_active 
ON attendance_logs(trainee_id) 
WHERE status = 'IN' AND clock_out_time IS NULL;

-- Table: notifications
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

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
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

-- Enable Row Level Security
ALTER TABLE trainees ENABLE ROW LEVEL SECURITY;
ALTER TABLE commanders ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

