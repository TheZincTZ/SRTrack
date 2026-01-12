export interface Trainee {
  id: string;
  telegram_user_id: number;
  rank: string;
  full_name: string;
  identification_number: string;
  company: 'A' | 'B' | 'C' | 'Support' | 'MSC' | 'HQ';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AttendanceLog {
  id: string;
  trainee_id: string;
  clock_in_time: string;
  clock_out_time: string | null;
  status: 'IN' | 'OUT';
  date: string;
  is_overdue: boolean;
  telegram_update_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface Commander {
  id: string;
  rank: string;
  full_name: string;
  company: 'A' | 'B' | 'C' | 'Support' | 'MSC' | 'HQ';
  contact_number: string | null;
  username: string;
  role: 'commander' | 'admin';
  is_active: boolean;
}

