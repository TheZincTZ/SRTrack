export type CompanyType = 'A' | 'B' | 'C' | 'Support' | 'MSC' | 'HQ'
export type SessionStatus = 'CLOCKED_IN' | 'CLOCKED_OUT' | 'RED'

export interface SRTUser {
  id: string
  telegram_user_id: number
  rank: string
  name: string
  number: string
  company: CompanyType
  created_at: string
}

export interface Commander {
  id: string
  rank_name: string
  username: string
  company: CompanyType
  contact_number: string | null
  created_at: string
}

export interface SRTSession {
  id: string
  srt_user_id: string
  clock_in_time: string
  clock_out_time: string | null
  status: SessionStatus
  date: string
  created_at: string
  updated_at: string
}

export interface SRTSessionWithUser extends SRTSession {
  srt_user: SRTUser
}

