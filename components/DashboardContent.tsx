'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Commander, SRTSessionWithUser, SessionStatus } from '@/lib/types'

interface DashboardContentProps {
  commander: Commander
}

export default function DashboardContent({ commander }: DashboardContentProps) {
  const [sessions, setSessions] = useState<SRTSessionWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadSessions()
    // Refresh every 30 seconds
    const interval = setInterval(loadSessions, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadSessions = async () => {
    try {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]

      // Get all SRT users from the same company
      const { data: users, error: usersError } = await supabase
        .from('srt_users')
        .select('*')
        .eq('company', commander.company)

      if (usersError) throw usersError

      if (!users || users.length === 0) {
        setSessions([])
        setLoading(false)
        return
      }

      const userIds = users.map(u => u.id)

      // Get today's sessions for these users
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('srt_sessions')
        .select('*')
        .in('srt_user_id', userIds)
        .eq('date', today)
        .order('clock_in_time', { ascending: false })

      if (sessionsError) throw sessionsError

      // Combine sessions with user data
      const sessionsWithUsers: SRTSessionWithUser[] = (sessionsData || []).map(session => {
        const user = users.find(u => u.id === session.srt_user_id)!
        return {
          ...session,
          srt_user: user,
        }
      })

      setSessions(sessionsWithUsers)
      setError('')
    } catch (err: any) {
      console.error('Error loading sessions:', err)
      setError('Failed to load data. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const getStatusBadge = (status: SessionStatus) => {
    const styles = {
      CLOCKED_IN: 'bg-green-100 text-green-800',
      CLOCKED_OUT: 'bg-blue-100 text-blue-800',
      RED: 'bg-red-100 text-red-800',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
        {status}
      </span>
    )
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString('en-SG', {
      timeZone: 'Asia/Singapore',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const redViolations = sessions.filter(s => s.status === 'RED')
  const clockedIn = sessions.filter(s => s.status === 'CLOCKED_IN')
  const clockedOut = sessions.filter(s => s.status === 'CLOCKED_OUT')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SRTrack Dashboard</h1>
              <p className="text-sm text-gray-600">
                {commander.rank_name} - Company {commander.company}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Clocked In</div>
            <div className="mt-2 text-3xl font-bold text-green-600">{clockedIn.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Clocked Out</div>
            <div className="mt-2 text-3xl font-bold text-blue-600">{clockedOut.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Violations (RED)</div>
            <div className="mt-2 text-3xl font-bold text-red-600">{redViolations.length}</div>
          </div>
        </div>

        {/* Alerts */}
        {redViolations.length > 0 && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  <strong>⚠️ Alert:</strong> {redViolations.length} user(s) did not clock out before 10:00 PM SGT today.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sessions Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Today's SRT Sessions</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No sessions found for today.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clock In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clock Out
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.map((session) => (
                    <tr key={session.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.srt_user.rank}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.srt_user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {session.srt_user.number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(session.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTime(session.clock_in_time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {session.clock_out_time ? formatTime(session.clock_out_time) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-4 text-right">
          <button
            onClick={loadSessions}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  )
}

